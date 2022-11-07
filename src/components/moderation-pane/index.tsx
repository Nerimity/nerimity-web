import styles from './styles.module.scss'
import { hasBit, USER_BADGES } from "@/chat-api/Bitwise";
import useStore from "@/chat-api/store/useStore";
import { createEffect, createResource, createSignal, For, on, onMount, Show } from "solid-js";
import { getOnlineUsers, getServers, getUsers } from '@/chat-api/services/ModerationService';
import { classNames } from '@/common/classNames';
import Avatar from '../ui/avatar';
import { formatTimestamp } from '@/common/date';
import { Link } from '@nerimity/solid-router';
import { RawServer, RawUser } from '@/chat-api/RawData';
import Button from '../ui/button';

export default function ModerationPane() {
  const { account, header } = useStore();

  const [load, setLoad] = createSignal(false);

  const hasModeratorPerm = () => hasBit(account.user()?.badges || 0, USER_BADGES.CREATOR.bit) || hasBit(account.user()?.badges || 0, USER_BADGES.ADMIN.bit)

  createEffect(() => {
    if (!account.isAuthenticated() || !hasModeratorPerm()) return;
    header.updateHeader({
      title: "Moderation",
      iconName: 'security',
    });
    setLoad(true);
  })

  return (
    <Show when={load()}>
      <div class={styles.moderationPane}>
        <UsersPane />
        <OnlineUsersPane />
        <ServersPane />
      </div>
    </Show>
  )
}

function UsersPane() {
  const LIMIT = 30;

  const [users, setUsers] = createSignal<RawUser[]>([]);
  const [afterId, setAfterId] = createSignal<string | undefined>(undefined);
  const [loadMoreClicked, setLoadMoreClicked] = createSignal(false);

  createEffect(on(afterId, async () => {
    setLoadMoreClicked(true);
    getUsers(LIMIT, afterId())
      .then(newUsers => {
        setUsers([...users(), ...newUsers])
        if (newUsers.length >= LIMIT) setLoadMoreClicked(false);
      })
      .catch(() => setLoadMoreClicked(false))
  }));

  const onLoadMoreClick = () => {
    const user = users()[users().length - 1];
    setAfterId(user.id);
  }


  return (
    <div class={classNames(styles.pane, styles.usersPane)}>
      <div class={styles.title}>Registered Users</div>
      <div class={styles.list}>
        <For each={users()}>
          {user => <User user={user} />}
        </For>
        <Show when={!loadMoreClicked()}><Button iconName='refresh' label='Load More' onClick={onLoadMoreClick} /></Show>
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
          {user => <User user={user} />}
        </For>
      </div>
    </div>
  )
}
function ServersPane() {
  const LIMIT = 30;

  const [servers, setServers] = createSignal<RawServer[]>([]);
  const [afterId, setAfterId] = createSignal<string | undefined>(undefined);
  const [loadMoreClicked, setLoadMoreClicked] = createSignal(false);



  createEffect(on(afterId, async () => {
    setLoadMoreClicked(true);
    getServers(LIMIT, afterId())
      .then(newServers => {
        setServers([...servers(), ...newServers])
        if (newServers.length >= LIMIT) setLoadMoreClicked(false);
      })
      .catch(() => setLoadMoreClicked(false))
  }));

  const onLoadMoreClick = () => {
    const server = servers()[servers().length - 1];
    setAfterId(server.id);
  }


  return (
    <div class={classNames(styles.pane, styles.serversPane)}>
      <div class={styles.title}>Servers</div>
      <div class={styles.list}>
        <For each={servers()}>
          {server => <Server server={server} />}
        </For>
        <Show when={!loadMoreClicked()}><Button iconName='refresh' label='Load More' onClick={onLoadMoreClick} /></Show>
      </div>
    </div>
  )
}

function User(props: { user: any }) {

  const joined = formatTimestamp(props.user.joinedAt);
  return (
    <Link href={`/app/moderation/users/${props.user.id}`} class={styles.user}>
      <Avatar hexColor={props.user.hexColor} size={28} />
      <div class={styles.details}>
        <div>
          {props.user.username}
          <span class={styles.tag}>:{props.user.tag}</span>
        </div>
        <div class={styles.date}><span>Registered</span> {joined}</div>
      </div>
    </Link>
  )
}
function Server(props: { server: any }) {
  const created = formatTimestamp(props.server.createdAt);
  const createdBy = props.server.createdBy;
  return (
    <Link href={`/app/moderation/servers/${props.server.id}`} class={styles.server}>
      <Avatar hexColor={props.server.hexColor} size={28} />
      <div class={styles.details}>
        <div>{props.server.name}</div>
        <div class={styles.date}><span>Created</span> {created}</div>
        <div class={styles.date}><span>Created By</span> <Link href={`/app/moderation/users/${createdBy.id}`}>{createdBy.username}:{createdBy.tag}</Link></div>
      </div>
    </Link>
  )
}