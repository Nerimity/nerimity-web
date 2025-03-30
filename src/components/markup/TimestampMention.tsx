import { formatTimestamp, timeSinceMentions } from "@/common/date";
import {
  createEffect,
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
import { t } from "i18next";

export enum TimestampType {
  RELATIVE = "tr",
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
      return setFormattedTime(timeSinceMentions(props.timestamp));
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
          <Modal.Header title={t("markupMessage.reminder")} />
          <Modal.Body>
            <div>Set A Reminder For</div>
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
              label={t("markupMessage.close")}
              iconName="close"
              alert
              onClick={close}
            />
            <Modal.Button
              primary
              label={requestSent() ? t("markupMessage.creating") : t("markupMessage.setReminder")}
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
      title={formatTimestamp(props.timestamp)}
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
