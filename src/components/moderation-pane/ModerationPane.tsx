import { hasBit, USER_BADGES } from "@/chat-api/Bitwise";
import useStore from "@/chat-api/store/useStore";
import { createEffect, createMemo, createResource, createSignal, For, on, onMount, Show } from "solid-js";
import { getOnlineUsers, getServer, getServers, getUsers, updateServer } from '@/chat-api/services/ModerationService';
import Avatar from '../ui/Avatar';
import { formatTimestamp } from '@/common/date';
import { Link, Route, Routes, useParams } from '@solidjs/router';
import { RawServer, RawUser } from '@/chat-api/RawData';
import Button from '../ui/Button';
import { css, styled } from 'solid-styled-components';
import Text from '../ui/Text';
import { FlexColumn, FlexRow } from '../ui/Flexbox';
import Checkbox from "../ui/Checkbox";
import { useCustomPortal } from "../ui/custom-portal/CustomPortal";
import SuspendUsersModal from "./SuspendUsersModal";
import { CustomLink } from "../ui/CustomLink";
import RouterEndpoints from "@/common/RouterEndpoints";
import { avatarUrl } from "@/chat-api/store/useUsers";
import { createUpdatedSignal } from "@/common/createUpdatedSignal";
import SettingsBlock from "../ui/settings-block/SettingsBlock";
import Input from "../ui/input/Input";
import { Banner } from "../ui/Banner";
import { bannerUrl } from "@/chat-api/store/useServers";
import { useWindowProperties } from "@/common/useWindowProperties";
import Breadcrumb, { BreadcrumbItem } from "../ui/Breadcrumb";

const [selectedUsers, setSelectedUsers] = createSignal<any[]>([]);
const isUserSelected = (id: string) => selectedUsers().find(u => u.id === id);

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

const UserColumn = styled(FlexColumn)`
  overflow: auto;
  flex-shrink: 0;
`;

const PaneContainer = styled("div")`
  display: flex;
  flex-direction: column;
  background-color: rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  padding: 10px;
  width: 260px;
  flex-shrink: 0;
`;

const UserPaneContainer = styled(PaneContainer)`
  min-height: 250px;
  flex: 1;
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
  gap: 5px;
  align-items: center;
  padding: 5px;
  padding-left: 10px;
  border-radius: 8px;
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
  margin-top: 3px;
`;

const linkStyle = css`
  &:hover {
    text-decoration: underline;
  }
`;

const ItemDetailContainer = styled("div")`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ActionButtons = styled(FlexRow)``;

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
      <Routes>
        <Route path="/" element={<ModerationPage />} />
        <Route path="/servers/:serverId" element={<ServerPage />} />
      </Routes>

    </Show>
  )
}


function ModerationPage() {
  const { createPortal } = useCustomPortal();

  const showSuspendModal = () => {
    createPortal?.(close => <SuspendUsersModal close={close} users={selectedUsers()} />)
  }
  return (
    <ModerationPaneContainer class="moderation-pane-container">
      <UserColumn class="user-columns" gap={5} >
        <UsersPane />
        <OnlineUsersPane />
        <ActionButtons>
          <Button onClick={showSuspendModal} label={`Suspend ${selectedUsers().length}`} primary color="var(--alert-color)" />
        </ActionButtons>
      </UserColumn>
      <ServersPane />
    </ModerationPaneContainer>
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
    <UserPaneContainer class="pane users">
      <Text>Registered Users</Text>
      <ListContainer class="list">
        <For each={users()}>
          {user => <User user={user} />}
        </For>
        <Show when={!loadMoreClicked()}><Button iconName='refresh' label='Load More' onClick={onLoadMoreClick} /></Show>
      </ListContainer>
    </UserPaneContainer>
  )
}

function OnlineUsersPane() {

  const [users] = createResource(getOnlineUsers);
  return (
    <UserPaneContainer class="pane users">
      <Text>Online Users</Text>
      <ListContainer class="list">
        <For each={users()}>
          {user => <User user={user} />}
        </For>
      </ListContainer>
    </UserPaneContainer>
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
  const [hovered, setHovered] = createSignal(false);

  const selected = createMemo(() => isUserSelected(props.user.id));

  const onCheckChanged = () => {
    if (selected()) {
      setSelectedUsers(selectedUsers().filter(u => u.id !== props.user.id))
      return;
    }
    setSelectedUsers([...selectedUsers(), props.user])
  }

  const onLinkClick = (event: any) => {
    if (event.target.closest(".checkbox")) event.preventDefault();
  }

  return (
    <Link
      onMouseOver={() => setHovered(true)} onMouseOut={() => setHovered(false)}
      href={`/app/moderation/users/${props.user.id}`}
      onclick={onLinkClick}
      class={itemStyles}>
      <Checkbox checked={selected()} onChange={onCheckChanged} />
      <CustomLink href={RouterEndpoints.PROFILE(props.user.id)}>
        <Avatar animate={hovered()} user={props.user} size={28} />
      </CustomLink>
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
  const [hovered, setHovered] = createSignal(false);


  return (
    <Link
      onMouseOver={() => setHovered(true)} onMouseOut={() => setHovered(false)}
      href={`/app/moderation/servers/${props.server.id}`}
      class={itemStyles}>
      <Avatar animate={hovered()} class={avatarStyle} server={props.server} size={28} />
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



const ServerPageContainer = styled(FlexColumn)`
    height: 100%;
    width: 100%;
    max-width: 900px;
    align-self: center;
    margin-top: 10px;
`;
const ServerPageInnerContainer = styled(FlexColumn)`
    margin: 10px;
`;
const ServerBannerContainer = styled(FlexRow)`
  display: flex;
  align-items: center;
  margin-left: 30px;
  height: 100%;
  z-index: 11111;
`;
const ServerBannerDetails = styled(FlexColumn)`
  margin-left: 20px;
  margin-right: 20px;
  font-size: 18px;
  z-index: 1111;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(20px);
  padding: 10px;
  border-radius: 8px;
`;

function ServerPage() {
  const params = useParams<{ serverId: string }>();
  const { width } = useWindowProperties();
  const [requestSent, setRequestSent] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);


  const [server, setServer] = createSignal<RawServer | null>(null);

  const defaultInput = () => ({
    name: server()?.name || '',
    verified: server()?.verified || false,
    password: ''
  })

  const [inputValues, updatedInputValues, setInputValue] = createUpdatedSignal(defaultInput);


  onMount(() => {
    getServer(params.serverId).then(setServer)
  })

  const requestStatus = () => requestSent() ? 'Saving...' : 'Save Changes';
  const onSaveButtonClicked = async () => {
    if (requestSent()) return;
    setRequestSent(true);
    setError(null);
    const values = updatedInputValues();
    await updateServer(params.serverId, values)
      .then(() => {
        setServer(() => ({...server()!, ...values, password: ''}))
      })
      .catch(err => {
        setError(err.message)
      })
      .finally(() => setRequestSent(false))
  }

  return (
    <Show when={server()}>
      <ServerPageContainer>
        <ServerPageInnerContainer>
          <Banner class={css`margin-bottom: 15px;`} margin={0} maxHeight={200} animate url={bannerUrl(server()!)} hexColor={server()!.hexColor}>
            <ServerBannerContainer>
              {server && <Avatar server={server()!} size={width() <= 1100 ? 70 : 100} />}
              <ServerBannerDetails>
                <div>{server()!.name}</div>
                <Text opacity={0.7} size={14}>{JSON.stringify(server()!._count.serverMembers)} members</Text>
              </ServerBannerDetails>
            </ServerBannerContainer>
          </Banner>
          <Breadcrumb>
            <BreadcrumbItem href={"../../"} icon='home' title="Moderation" />
            <BreadcrumbItem title={server()?.name} icon="dns" />
          </Breadcrumb>
          <SettingsBlock label="Server Name" icon="edit">
            <Input value={inputValues().name} onText={v => setInputValue('name', v)} />
          </SettingsBlock>
          <SettingsBlock label="Verified" icon="verified">
            <Checkbox checked={inputValues().verified} onChange={v => setInputValue('verified', v)} />
          </SettingsBlock>
          <Show when={Object.keys(updatedInputValues()).length}>
            <SettingsBlock label="Confirm Admin Password" icon="security" class={css`margin-top: 10px;`}>
              <Input type="password" value={inputValues().password} onText={v => setInputValue('password', v)} />
            </SettingsBlock>
            <Show when={error()}><Text color="var(--alert-color)">{error()}</Text></Show>

            <Button iconName='save' label={requestStatus()} class={css`align-self: flex-end;`} onClick={onSaveButtonClicked} />
          </Show>
        </ServerPageInnerContainer>
      </ServerPageContainer>
    </Show>
  )
}