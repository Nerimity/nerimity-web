import { hasBit, USER_BADGES } from "@/chat-api/Bitwise";
import useStore from "@/chat-api/store/useStore";
import { createEffect, createResource, createSignal, For, on, onMount, Show } from "solid-js";
import { getOnlineUsers, getServers, getUsers } from '@/chat-api/services/ModerationService';
import Avatar from '../ui/Avatar';
import { formatTimestamp } from '@/common/date';
import { Link } from '@nerimity/solid-router';
import { RawServer, RawUser } from '@/chat-api/RawData';
import Button from '../ui/Button';
import { css, styled } from 'solid-styled-components';
import Text from '../ui/Text';
import { FlexRow } from '../ui/Flexbox';

const ModerationPaneContainer = styled("div")`
  display: flex;
  height: 100%;
  overflow-y: auto;
  gap: 5px;
  a {
  text-decoration: none;
  }
  padding: 5px;
`;

const PaneContainer = styled("div")`
  display: flex;
  flex-direction: column;
  background-color: rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  padding: 10px;
  width: 250px;
  flex-shrink: 0;
`;

const ListContainer = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 10px;
  overflow: auto;
`;

const itemStyles = css`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  padding: 5px;
  padding-left: 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: 0.2s;
  text-decoration: none;
  color: white;

  &:hover {
    background-color: rgb(66, 66, 66);
  }
`;

const avatarStyle = css`
  place-self: start;
`;

const linkStyle = css`
  &:hover {
    text-decoration: underline;
  }
`;

const ItemDetailContainer = styled("div")`
  margin-left: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

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
      <ModerationPaneContainer class="moderation-pane-container">
        <UsersPane />
        <OnlineUsersPane />
        <ServersPane />
      </ModerationPaneContainer>
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
    <PaneContainer class="pane users">
      <Text>Registered Users</Text>
      <ListContainer class="list">
        <For each={users()}>
          {user => <User user={user} />}
        </For>
        <Show when={!loadMoreClicked()}><Button iconName='refresh' label='Load More' onClick={onLoadMoreClick} /></Show>
      </ListContainer>
    </PaneContainer>
  )
}

function OnlineUsersPane() {

  const [users] = createResource(getOnlineUsers);
  return (
    <PaneContainer class="pane users">
      <Text>Online Users</Text>
      <ListContainer class="list">
        <For each={users()}>
          {user => <User user={user} />}
        </For>
      </ListContainer>
    </PaneContainer>
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
    <PaneContainer class="pane servers">
      <Text>Servers</Text>
      <ListContainer class="list">
        <For each={servers()}>
          {server => <Server server={server} />}
        </For>
        <Show when={!loadMoreClicked()}><Button iconName='refresh' label='Load More' onClick={onLoadMoreClick} /></Show>
      </ListContainer>
    </PaneContainer>
  )
}

function User(props: { user: any }) {
  const joined = formatTimestamp(props.user.joinedAt);

  return (
    <Link href={`/app/moderation/users/${props.user.id}`} class={itemStyles}>
      <Avatar class={avatarStyle} hexColor={props.user.hexColor} size={28} />
      <ItemDetailContainer class="details">
        <FlexRow>
          <Text>{props.user.username}</Text>
          <Text opacity={0.6}>:{props.user.tag}</Text>
        </FlexRow>
        <FlexRow gap={3}>
          <Text size={12} opacity={0.6}>Registered:</Text>
          <Text size={12}>{joined}</Text>
        </FlexRow>
      </ItemDetailContainer>
    </Link>
  )
}

function Server(props: { server: any }) {
  const created = formatTimestamp(props.server.createdAt);
  const createdBy = props.server.createdBy;

  return (
    <Link href={`/app/moderation/servers/${props.server.id}`} class={itemStyles}>
      <Avatar class={avatarStyle} hexColor={props.server.hexColor} size={28} />
      <ItemDetailContainer class="details">
        <Text>{props.server.name}</Text>
        <FlexRow gap={3}>
          <Text size={12} opacity={0.6}>Created:</Text>
          <Text size={12}>{created}</Text>
        </FlexRow>
        <FlexRow gap={3}>
          <Text size={12} opacity={0.6}>Created By:</Text>
          <Text size={12}><Link class={linkStyle} href={`/app/moderation/users/${createdBy.id}`}>{createdBy.username}:{createdBy.tag}</Link></Text>
        </FlexRow>
      </ItemDetailContainer>
    </Link>
  )
}