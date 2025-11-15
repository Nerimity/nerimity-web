import style from "./InboxList.module.css";
import { createMemo, createSignal, For } from "solid-js";
import { Tooltip } from "../ui/Tooltip";
import Avatar from "../ui/Avatar";
import { A, useParams } from "solid-navigator";
import { SidebarItemContainer } from "./SidebarItemContainer";
import { User } from "@/chat-api/store/useUsers";
import useStore from "@/chat-api/store/useStore";
import { NotificationCountBadge } from "./NotificationCountBadge";
import { emitDrawerGoToMain } from "@/common/GlobalEvents";

function InboxItem(props: { user: User; size: number }) {
  const params = useParams<{ channelId?: string }>();
  const store = useStore();
  const [hovered, setHovered] = createSignal(false);

  const inboxItem = () => store.inbox.get(props.user.inboxChannelId!);

  const selected = () =>
    inboxItem() && params.channelId === inboxItem()?.channelId;

  const mentionCount = () => store.mentions.getDmCount(props.user!.id);
  const hasNotifications = () => mentionCount();

  const handleClick = async () => {
    props.user?.openDM();
    emitDrawerGoToMain();
  };

  return (
    <Tooltip tooltip={props.user.username}>
      <SidebarItemContainer
        onclick={handleClick}
        class={style.serverItem}
        alert={hasNotifications()}
        selected={selected()}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <NotificationCountBadge count={mentionCount()} top={5} right={10} />
        <Avatar
          resize={128}
          animate={hovered()}
          size={props.size - props.size * 0.4}
          user={props.user}
        />
      </SidebarItemContainer>
    </Tooltip>
  );
}

export const InboxList = (props: { size: number }) => {
  const store = useStore();

  const mentionUsers = createMemo(() => {
    return store.mentions
      .array()
      .filter((m) => {
        const channel = store.channels.get(m?.channelId!);
        return !channel?.serverId;
      })
      .map((m) => store.users.get(m?.userId!)!);
  });

  return (
    <div class={style.serverListContainer}>
      <div class={style.serverList}>
        <For each={mentionUsers()}>
          {(user) => <InboxItem user={user} size={props.size} />}
        </For>
        <For each={mentionUsers()}>
          {(user) => <InboxItem user={user} size={props.size} />}
        </For>
        <For each={mentionUsers()}>
          {(user) => <InboxItem user={user} size={props.size} />}
        </For>
        <For each={mentionUsers()}>
          {(user) => <InboxItem user={user} size={props.size} />}
        </For>
      </div>
    </div>
  );
};
