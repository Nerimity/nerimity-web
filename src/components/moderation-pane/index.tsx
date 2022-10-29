import styles from './styles.module.scss'
import { hasBit, USER_BADGES } from "@/chat-api/Bitwise";
import useStore from "@/chat-api/store/useStore";
import { createEffect, createResource, For, Show } from "solid-js";
import { getOnlineUsers, getServers, getUsers } from '@/chat-api/services/ModerationService';
import { classNames } from '@/common/classNames';
import Avatar from '../ui/avatar';
import { formatTimestamp } from '@/common/date';

export function ModerationPane() {
  const {account, header} = useStore();
  
  const hasModeratorPerm = () => hasBit(account.user()?.badges || 0, USER_BADGES.CREATOR.bit)

  createEffect(() => {
    if (!hasModeratorPerm()) return;
    header.updateHeader({
      title: "Moderation",
      iconName: 'security',
    });
  })

  return (
    <Show when={hasModeratorPerm()}>
      <div class={styles.moderationPane}>
        <UsersPane/>
        <OnlineUsersPane/>
        <ServersPane/>
      </div>
    </Show>
  )
}

function UsersPane() {
  
  const [users] = createResource(getUsers);
  return (
    <div class={classNames(styles.pane, styles.usersPane)}>
      <div class={styles.title}>Registered Users</div>
      <div class={styles.list}>
        <For each={users()}>
          {user => <User user={user}/>}
        </For>
      </div>
    </div>
  )
}
function OnlineUsersPane() {
  
  const [users] = createResource(getOnlineUsers);
  return (
    <div class={classNames(styles.pane, styles.usersPane)}>
      <div class={styles.title}>Online Users</div>
      <div class={styles.list}>
        <For each={users()}>
          {user => <User user={user}/>}
        </For>
      </div>
    </div>
  )
}
function ServersPane() {
  
  const [servers] = createResource(getServers);
  return (
    <div class={classNames(styles.pane, styles.serversPane)}>
      <div class={styles.title}>Servers</div>
      <div class={styles.list}>
        <For each={servers()}>
          {server => <Server server={server}/>}
        </For>
      </div>
    </div>
  )
}

function User (props: {user: any}) {

  const joined = formatTimestamp(props.user.joinedAt);
  return (
    <div class={styles.user}>
      <Avatar hexColor={props.user.hexColor} size={28} />
      <div class={styles.details}>
        <div>{props.user.username}</div>
        <div class={styles.date}><span>Registered</span> {joined}</div>
      </div>
    </div>
  )
}
function Server (props: {server: any}) {
  const created = formatTimestamp(props.server.createdAt);
  return (
    <div class={styles.server}>
      <Avatar hexColor={props.server.hexColor} size={28} />
      <div class={styles.details}>
        <div>{props.server.name}</div>
        <div class={styles.date}><span>Created</span> {created}</div>
      </div>
    </div>
  )
}