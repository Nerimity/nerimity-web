import { formatters as dateFormatters, formatTimestamp, formatTimestampRelative } from "@/common/date";
import { Temporal } from "temporal-polyfill";
import {
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import Icon from "../ui/icon/Icon";
import { useCustomPortal } from "../ui/custom-portal/CustomPortal";
import { Modal } from "../ui/modal";
import { addReminder } from "@/chat-api/services/ReminderService";
import { Message } from "@/chat-api/store/useMessages";
import Text from "../ui/Text";
import { t } from "@nerimity/i18lite";

export enum TimestampType {
  RELATIVE = "tr",
  OFFSET = "to",
}

export function TimestampMention(props: {
  type: TimestampType;
  timestamp: number;
  message?: Message;
  post?: Post;
}) {
  const { createPortal } = useCustomPortal();
  const [formattedTime, setFormattedTime] = createSignal("...");

  const updateTime = () => {
    if (props.type === TimestampType.RELATIVE) {
      return setFormattedTime(formatTimestampRelative(props.timestamp));
    }
    if (props.type === TimestampType.OFFSET) {
      const offset = props.timestamp as unknown as string;
      try {
        const datetime = Temporal.Now.zonedDateTimeISO(offset)
          .round({
            smallestUnit: "second",
            roundingMode: "floor",
          });
        const formatted = dateFormatters().datetime.seconds
          .format(datetime.toPlainTime());
        return setFormattedTime(formatted);
      } catch {
        return setFormattedTime(t("datetime.invalidTimezone"));
      }
    }
  };

  createEffect(
    on([() => props.timestamp, () => props.type], () => {
      updateTime();
      const timeoutId = setInterval(updateTime, 1000);

      onCleanup(() => {
        clearInterval(timeoutId);
      });
    })
  );
  const isInPast = () => Date.now() > props.timestamp;

  const onClick = () => {
    if (props.type !== TimestampType.RELATIVE) return;
    if (isInPast()) return;
    if (!props.message && !props.post) return;

    createPortal((close) => {
      const [error, setError] = createSignal<string | null>(null);
      const [requestSent, setRequestSent] = createSignal(false);
      createEffect(
        on(formattedTime, () => {
          if (isInPast()) close();
        })
      );

      const setReminder = async () => {
        if (requestSent()) return;
        setRequestSent(true);
        setError(null);

        const reminder = await addReminder({
          timestamp: props.timestamp,
          messageId: props.message?.id,
          postId: props.post?.id,
        }).catch((err) => {
          setError(err.message);
        });
        setRequestSent(false);

        if (reminder) close();
      };
      return (
        <Modal.Root close={close}>
          <Modal.Header title={t("addReminderModal.title")} />
          <Modal.Body>
            <div>{t("addReminderModal.message")}</div>
            <div
              style={{
                "font-weight": "bold",
                background: "rgba(0,0,0,0.4)",
                "text-align": "center",
                padding: "6px",
                "border-radius": "6px",
                "margin-top": "4px",
              }}
            >
              {formatTimestamp(props.timestamp)}
            </div>
            <Show when={error()}>
              <Text color="var(--alert-color)">{error()}</Text>
            </Show>
          </Modal.Body>
          <Modal.Footer>
            <Modal.Button
              label={t("general.closeButton")}
              iconName="close"
              alert
              onClick={close}
            />
            <Modal.Button
              primary
              label={requestSent() ? t("addReminderModal.adding") : t("addReminderModal.setReminderButton")}
              iconName="schedule"
              onClick={setReminder}
            />
          </Modal.Footer>
        </Modal.Root>
      );
    });
  };

  return (
    <div
      class="mention timestamp"
      title={
        props.type === TimestampType.OFFSET
          ? formattedTime()
          : formatTimestamp(props.timestamp)
      }
      onClick={onClick}
    >
      <Icon
        name="schedule"
        size={14}
        color="var(--primary-color)"
        class="icon"
      />
      {formattedTime()}
    </div>
  );
}
