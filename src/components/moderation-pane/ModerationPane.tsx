import { addBit, hasBit, removeBit, USER_BADGES } from "@/chat-api/Bitwise";
import useStore from "@/chat-api/store/useStore";
import { createEffect, createMemo, createResource, createSignal, For, on, onMount, Show } from "solid-js";
import { getOnlineUsers, getServer, getServers, getStats, getUser, getUsers, ModerationStats, ModerationUser, updateServer, updateUser } from '@/chat-api/services/ModerationService';
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
import Icon from "../ui/icon/Icon";

const [stats, setStats] = createSignal<ModerationStats | null>(null);

const [selectedUsers, setSelectedUsers] = createSignal<any[]>([]);
const isUserSelected = (id: string) => selectedUsers().find(u => u.id === id);

const ModerationPaneContainer = styled("div")`
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 900px;
  align-self: center;
  margin-top: 10px;
  a {
    text-decoration: none;
  }
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
  flex-shrink: 0;
  margin: 5px;
  margin-left: 10px;
  margin-right: 10px;
  max-height: 500px;
`;

const UserPaneContainer = styled(PaneContainer)`
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
  .checkbox {
    margin-right: 10px;
  }

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


export default function ModerationPane() {
  const { account, header } = useStore();
  const [load, setLoad] = createSignal(false);
  const hasModeratorPerm = () => hasBit(account.user()?.badges || 0, USER_BADGES.FOUNDER.bit) || hasBit(account.user()?.badges || 0, USER_BADGES.ADMIN.bit)

  createEffect(() => {
    if (!account.isAuthenticated() || !hasModeratorPerm()) return;
    header.updateHeader({
      title: "Moderation",
      iconName: 'security',
    });
    setLoad(true);
    if (!stats()) {
      getStats().then(setStats);
    }
  })



  return (
    <Show when={load()}>
      <Routes>
        <Route path="/" element={<ModerationPage />} />
        <Route path="/servers/:serverId" element={<ServerPage />} />
        <Route path="/users/:userId" element={<UserPage />} />
      </Routes>

    </Show>
  )
}


const SelectedUserActionsContainer = styled(FlexRow)`
  position: sticky;
  right: 0px;
  bottom: 10px;
  left: 0px;
  flex-shrink: 0;
  align-items: center;
  height: 50px;
  margin: 10px;
  margin-top: 5px;
  border-radius: 8px;
  backdrop-filter: blur(20px);
  background-color: rgba(0,0,0,0.6);
  padding-left: 15px;
  padding-right: 10px;
  .suspendButton {
    margin-left: auto;
  }
`;

function SelectedUserActions () {
  const { createPortal } = useCustomPortal();

  const showSuspendModal = () => {
    createPortal?.(close => <SuspendUsersModal close={close} users={selectedUsers()} />)
  }
  return (
    <SelectedUserActionsContainer>
    <Text>{selectedUsers().length} User(s) Selected</Text>
    <Button class="suspendButton" onClick={showSuspendModal} label="Suspend Selected" primary color="var(--alert-color)" />

    </SelectedUserActionsContainer>
  )
}

function ModerationPage() {
  return (
    <>
    <ModerationPaneContainer class="moderation-pane-container">
      <StatsArea/>
      <UserColumn class="user-columns" gap={5} >
        <UsersPane />
        <OnlineUsersPane />
      </UserColumn>
      <ServersPane />
    </ModerationPaneContainer>
    <Show when={selectedUsers().length}>
      <SelectedUserActions />
    </Show>
    </>
  )
}

function UsersPane() {
  const LIMIT = 30;
  const [users, setUsers] = createSignal<RawUser[]>([]);
  const [afterId, setAfterId] = createSignal<string | undefined>(undefined);
  const [loadMoreClicked, setLoadMoreClicked] = createSignal(false);

  const [showAll, setShowAll] = createSignal(false);


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

  const firstFive = () => users().slice(0, 5);

  return (
    <UserPaneContainer class="pane users">
      <FlexRow gap={5} itemsCenter>
        <Button iconName='add' iconSize={14} padding={4} onClick={() => setShowAll(!showAll())} />
        <Text>Registered Users</Text>
      </FlexRow>
      <ListContainer class="list">
        <For each={!showAll() ? firstFive() : users()}>
          {user => <User user={user} />}
        </For>
        <Show when={showAll() && !loadMoreClicked()}><Button iconName='refresh' label='Load More' onClick={onLoadMoreClick} /></Show>
      </ListContainer>
    </UserPaneContainer>
  )
}

function OnlineUsersPane() {

  const [users] = createResource(getOnlineUsers);

  const [showAll, setShowAll] = createSignal(false);

  const firstFive = () => users()?.slice(0, 5);


  return (
    <UserPaneContainer class="pane users">
      <FlexRow gap={5} itemsCenter>
        <Button iconName='add' iconSize={14} padding={4} onClick={() => setShowAll(!showAll())} />
        <Text>Online Users</Text>
      </FlexRow>
      <ListContainer class="list">
        <For each={!showAll() ? firstFive() : users()}>
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

  const [showAll, setShowAll] = createSignal(false);


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

  const firstFive = () => servers().slice(0, 5);

  return (
    <PaneContainer class="pane servers">
      <FlexRow gap={5} itemsCenter>
        <Button iconName='add' iconSize={14} padding={4} onClick={() => setShowAll(!showAll())} />
        <Text>Servers</Text>
      </FlexRow>

      <ListContainer class="list">
        <For each={!showAll() ? firstFive() : servers()}>
          {server => <Server server={server} />}
        </For>
        <Show when={showAll() && !loadMoreClicked()}><Button iconName='refresh' label='Load More' onClick={onLoadMoreClick} /></Show>
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
        setServer(() => ({ ...server()!, ...values, password: '' }))
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
              {server && <Avatar animate server={server()!} size={width() <= 1100 ? 70 : 100} />}
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



const UserPageContainer = styled(FlexColumn)`
    height: 100%;
    width: 100%;
    max-width: 900px;
    align-self: center;
    margin-top: 10px;
`;
const UserPageInnerContainer = styled(FlexColumn)`
    margin: 10px;
`;
const UserBannerContainer = styled(FlexRow)`
  display: flex;
  align-items: center;
  margin-left: 30px;
  height: 100%;
  z-index: 11111;
`;
const UserBannerDetails = styled(FlexColumn)`
  margin-left: 20px;
  margin-right: 20px;
  font-size: 18px;
  z-index: 1111;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(20px);
  padding: 10px;
  border-radius: 8px;
`;

const BadgeItemStyles = css`
  && {
    margin: 0;
    &:not(:last-child) {
      border-radius: 0;
    }
    &:last-child {
      border-top-left-radius: 0;
      border-top-right-radius: 0;
    }
  }
`;


const ChangePasswordButton = styled("button")`
  color: var(--primary-color);
  background-color: transparent;
  border: none;
  align-self: flex-start;
  cursor: pointer;
  user-select: none;
  &:hover {
    text-decoration: underline;
  }
`

function UserPage() {
  const params = useParams<{ userId: string }>();
  const { width } = useWindowProperties();
  const [requestSent, setRequestSent] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  const [showChangePassword, setShowChangePassword] = createSignal(false);


  const [account, setAccount] = createSignal<ModerationUser | null>(null);

  const user = () => account()?.user;

  const defaultInput = () => ({
    email: account()?.email || '',
    username: user()?.username || '',
    tag: user()?.tag || '',
    badges: user()?.badges || 0,
    newPassword: '',
    password: ''
  })

  const [inputValues, updatedInputValues, setInputValue] = createUpdatedSignal(defaultInput);


  onMount(() => {
    getUser(params.userId).then(setAccount)
  })

  const requestStatus = () => requestSent() ? 'Saving...' : 'Save Changes';
  const onSaveButtonClicked = async () => {
    if (requestSent()) return;
    setRequestSent(true);
    setError(null);
    const values = updatedInputValues();
    await updateUser(params.userId, values)
      .then(() => {
        getUser(params.userId).then(setAccount)
        setInputValue("password", '');
      })
      .catch(err => {
        setInputValue("password", '');
        setError(err.message)
      })
      .finally(() => setRequestSent(false))
  }

  const onBadgeUpdate = (checked: boolean, bit: number) => {
    if (checked) {
      setInputValue('badges', addBit(inputValues().badges, bit))
      return;
    }
    setInputValue('badges', removeBit(inputValues().badges, bit))
  }

  const onChangePasswordClick = () => {
    setInputValue("newPassword", '')
    setShowChangePassword(!showChangePassword())
  }


  return (
    <Show when={user()}>
      <UserPageContainer>
        <UserPageInnerContainer>
          <Banner class={css`margin-bottom: 15px;`} margin={0} maxHeight={200} animate url={bannerUrl(user()!)} hexColor={user()!.hexColor}>
            <UserBannerContainer>
              {user() && <Avatar animate user={user()!} size={width() <= 1100 ? 70 : 100} />}
              <UserBannerDetails>
                <div>{user()!.username}</div>
              </UserBannerDetails>
            </UserBannerContainer>
          </Banner>
          <Breadcrumb>
            <BreadcrumbItem href={"../../"} icon='home' title="Moderation" />
            <BreadcrumbItem title={user()?.username} icon="person" />
          </Breadcrumb>
          <SettingsBlock label="Email" icon="email">
            <Input value={inputValues().email} onText={v => setInputValue('email', v)} />
          </SettingsBlock>
          <SettingsBlock label="Username" icon="face">
            <Input value={inputValues().username} onText={v => setInputValue('username', v)} />
          </SettingsBlock>
          <SettingsBlock label="Tag" icon="local_offer">
            <Input value={inputValues().tag} onText={v => setInputValue('tag', v)} />
          </SettingsBlock>
          <SettingsBlock icon="badge" label="Badges" header />
          <FlexColumn gap={1}>
            <For each={Object.values(USER_BADGES)} >
              {badge => (
                <SettingsBlock class={BadgeItemStyles} label={badge.name} description={badge.description}>
                  <Checkbox checked={hasBit(inputValues().badges, badge.bit)} onChange={checked => onBadgeUpdate(checked, badge.bit)} />
                </SettingsBlock>
              )
              }
            </For>
          </FlexColumn>
          <ChangePasswordButton onClick={onChangePasswordClick} style={{ "margin-bottom": "5px" }}>Change Password</ChangePasswordButton>

          <Show when={showChangePassword()}>
            <SettingsBlock icon='password' label='New Password' description='Changing the password will log them out everywhere.'>
              <Input type='password' value={inputValues().newPassword} onText={(v) => setInputValue('newPassword', v)} />
            </SettingsBlock>
          </Show>


          <Show when={Object.keys(updatedInputValues()).length}>
            <SettingsBlock label="Confirm Admin Password" icon="security" class={css`margin-top: 10px;`}>
              <Input type="password" value={inputValues().password} onText={v => setInputValue('password', v)} />
            </SettingsBlock>
            <Show when={error()}><Text color="var(--alert-color)">{error()}</Text></Show>

            <Button iconName='save' label={requestStatus()} class={css`align-self: flex-end;`} onClick={onSaveButtonClicked} />
          </Show>
        </UserPageInnerContainer>
      </UserPageContainer>
    </Show>
  )
}


const StatCardContainer = styled(FlexColumn)`
  padding-left: 10px;
  padding-right: 10px;
  justify-content: center;
  height: 50px;
  background-color: rgba(255,255,255,0.1);
  border-radius: 8px;
`

function StatCard(props: {loading?: boolean; title: string, description: string}) {
  return (
    <StatCardContainer>
      <Text size={12} color="rgba(255,255,255,0.6)">{props.title}</Text>
      <Text size={12}>{props.description}</Text>
    </StatCardContainer>
  )
}

const StatsAreaContainer = styled(FlexRow)`
  margin-left: 10px;
  margin-right: 10px;
`

function StatsArea() {
  return (
    <StatsAreaContainer gap={5} wrap>
      <StatCard title="Registered Users" description={stats()?.totalRegisteredUsers?.toLocaleString()} />
      <StatCard title="Messages" description={stats()?.totalCreatedMessages?.toLocaleString()} />
      <StatCard title="Servers" description={stats()?.totalCreatedServers?.toLocaleString()} />
      <StatCard title="Weekly Registered Users" description={stats()?.weeklyRegisteredUsers?.toLocaleString()} />
      <StatCard title="Weekly Messages" description={stats()?.weeklyCreatedMessages?.toLocaleString()} />
    </StatsAreaContainer>
  )
}