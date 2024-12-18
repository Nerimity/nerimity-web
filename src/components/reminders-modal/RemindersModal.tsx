import useStore from "@/chat-api/store/useStore";
import { Modal } from "../ui/modal";
import style from "./RemindersModal.module.scss";
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  Match,
  on,
  onCleanup,
  onMount,
  Show,
  Switch,
} from "solid-js";
import { RawReminder } from "@/chat-api/RawData";
import MessageItem from "../message-pane/message-item/MessageItem";
import Button from "../ui/Button";
import { TimestampMention, TimestampType } from "../markup/TimestampMention";
import { cn } from "@/common/classNames";
import { useNavigate, useSearchParams } from "solid-navigator";
import RouterEndpoints from "@/common/RouterEndpoints";
import { deleteReminder } from "@/chat-api/services/ReminderService";
import { PostItem } from "../post-area/PostItem";

export default function RemindersModal(props: {
  channelId?: string;
  close: () => void;
}) {
  const [showAll, setShowAll] = createSignal(false);
  const [now, setNow] = createSignal(Date.now());

  onMount(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    onCleanup(() => clearInterval(interval));
  });

  const store = useStore();
  const reminders = () => {
    return store.account.reminders(showAll() ? undefined : props.channelId!);
  };

  const hasActiveReminders = createMemo(() =>
    store.account.reminders().find((r) => r.remindAt <= now())
  );

  createEffect(
    on(hasActiveReminders, () => {
      if (hasActiveReminders()) {
        setShowAll(true);
      }
    })
  );

  const closeNotice = () =>
    alert("You must dismiss all active reminders first.");

  const close = () => {
    if (hasActiveReminders()) {
      closeNotice();
    } else {
      props.close();
    }
  };
  return (
    <Modal.Root close={close} class={style.remindersModalRoot}>
      <Modal.Header title="Reminders" alert={!!hasActiveReminders()} />
      <Modal.Body class={style.remindersModalBody}>
        <div class={style.reminderList}>
          <For each={reminders()}>
            {(reminder) => (
              <ReminderItem reminder={reminder} close={props.close} />
            )}
          </For>
        </div>
      </Modal.Body>

      <Show when={props.channelId && !showAll()}>
        <Modal.Footer>
          <Modal.Button
            label="Show All Reminders"
            iconName="filter_alt_off"
            primary
            onClick={() => setShowAll(true)}
          />
        </Modal.Footer>
      </Show>
    </Modal.Root>
  );
}

const ReminderItem = (props: { reminder: RawReminder; close: () => void }) => {
  const navigate = useNavigate();
  const store = useStore();
  const channel = () => store.channels.get(props.reminder.channelId!);
  const serverId = () => channel()?.serverId!;
  const [deleteClicked, setDeleteClicked] = createSignal(false);
  const [now, setNow] = createSignal(Date.now());
  const [search, setSearchParams] = useSearchParams<{ postId: string }>();

  onMount(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    onCleanup(() => clearInterval(interval));
  });

  const isActive = () => props.reminder.remindAt <= now();

  const removeReminder = async () => {
    if (deleteClicked()) return;
    setDeleteClicked(true);
    await deleteReminder(props.reminder.id!).catch(() => {});
    setDeleteClicked(false);
  };

  const onViewClick = () => {
    if (props.reminder.post) {
      setSearchParams({ postId: props.reminder.post.id });
      return;
    }
    if (!channel()?.serverId) return;
    navigate(
      RouterEndpoints.SERVER_MESSAGES(serverId(), channel()?.id!) +
        "?messageId=" +
        props.reminder.message?.id
    );
    props.close();
  };
  return (
    <div class={cn(style.reminderItem, isActive() && style.active)}>
      <div class={cn("markup", style.reminderTimestamp)}>
        <TimestampMention
          timestamp={props.reminder.remindAt}
          type={TimestampType.RELATIVE}
        />
      </div>
      <Switch
        fallback={
          <div class={style.reminderDeleted}>Deleted Post Or Message</div>
        }
      >
        <Match when={props.reminder.message}>
          <MessageItem
            class={style.messageItem}
            message={props.reminder.message!}
            hideFloating
          />
        </Match>
        <Match when={props.reminder.post}>
          <PostItem class={style.messageItem} post={props.reminder.post!} />
        </Match>
      </Switch>

      <div class={style.reminderActions}>
        <Button
          iconName={isActive() ? "check" : "delete"}
          label={
            isActive()
              ? deleteClicked()
                ? "Dismissing"
                : "Dismiss"
              : deleteClicked()
              ? "Deleting..."
              : "Delete"
          }
          alert={!isActive()}
          color={isActive() ? "var(--success-color)" : undefined}
          onClick={removeReminder}
          iconSize={20}
          padding={4}
          margin={0}
          class={style.button}
        />
        <Button
          iconName="visibility"
          label="View"
          onClick={onViewClick}
          iconSize={20}
          padding={4}
          margin={0}
          class={style.button}
        />
      </div>
    </div>
  );
};
