import useStore from "@/chat-api/store/useStore";
import { Modal } from "../ui/modal";
import style from "./RemindersModal.module.scss";
import { createSignal, For, Match, Show, Switch } from "solid-js";
import { RawReminder } from "@/chat-api/RawData";
import MessageItem from "../message-pane/message-item/MessageItem";
import Button from "../ui/Button";
import { TimestampMention, TimestampType } from "../markup/TimestampMention";
import { cn } from "@/common/classNames";
import { useNavigate } from "solid-navigator";
import RouterEndpoints from "@/common/RouterEndpoints";
import { deleteReminder } from "@/chat-api/services/ReminderService";

export const RemindersModal = (props: {
  channelId?: string;
  close: () => void;
}) => {
  const [showAll, setShowAll] = createSignal(false);
  const store = useStore();
  const reminders = () => {
    return store.account.reminders(showAll() ? undefined : props.channelId!);
  };
  return (
    <Modal.Root close={props.close}>
      <Modal.Header title="Reminders" />
      <Modal.Body>
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
};

const ReminderItem = (props: { reminder: RawReminder; close: () => void }) => {
  const navigate = useNavigate();
  const store = useStore();
  const channel = () => store.channels.get(props.reminder.channelId!);
  const serverId = () => channel()?.serverId!;
  const [deleteClicked, setDeleteClicked] = createSignal(false);

  const removeReminder = async () => {
    if (deleteClicked()) return;
    setDeleteClicked(true);
    await deleteReminder(props.reminder.id!).catch(() => {});
    setDeleteClicked(false);
  };

  const onViewClick = () => {
    if (!channel()?.serverId) return;
    navigate(
      RouterEndpoints.SERVER_MESSAGES(serverId(), channel()?.id!) +
        "?messageId=" +
        props.reminder.message?.id
    );
    props.close();
  };
  return (
    <div class={style.reminderItem}>
      <div class={cn("markup", style.reminderTimestamp)}>
        <TimestampMention
          timestamp={props.reminder.remindAt}
          type={TimestampType.RELATIVE}
        />
      </div>
      <Switch
        fallback={<div class={style.reminderDeleted}>Deleted Message</div>}
      >
        <Match when={props.reminder.message}>
          <MessageItem
            class={style.messageItem}
            message={props.reminder.message!}
            hideFloating
          />
        </Match>
      </Switch>

      <div class={style.reminderActions}>
        <Button
          iconName="delete"
          label={deleteClicked() ? "Deleting..." : "Delete"}
          alert
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
          primary
          iconSize={20}
          padding={4}
          margin={0}
          class={style.button}
        />
      </div>
    </div>
  );
};
