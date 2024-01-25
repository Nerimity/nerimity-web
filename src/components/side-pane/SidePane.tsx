import styles from './styles.module.scss';
import Icon from '@/components/ui/icon/Icon';
import Avatar from '@/components/ui/Avatar';
import RouterEndpoints from '../../common/RouterEndpoints';
import { classNames, conditionalClass } from '@/common/classNames';
import ContextMenuServer from '@/components/servers/context-menu/ContextMenuServer';
import { createEffect, createMemo, createResource, createSignal, For, on, onCleanup, onMount, Show } from 'solid-js';
import useOldStore from '../../chat-api/store/useStore';
import { A, useLocation, useParams, useMatch } from 'solid-navigator';
import { FriendStatus, TicketStatus } from '../../chat-api/RawData';
import Modal from '@/components/ui/modal/Modal';
import AddServer from './add-server/AddServerModal';
import { UserStatuses, userStatusDetail } from '../../common/userStatus';
import { Server } from '../../chat-api/store/useServers';
import { useCustomPortal } from '../ui/custom-portal/CustomPortal';
import { hasBit, USER_BADGES } from '@/chat-api/Bitwise';
import { updateTitleAlert } from '@/common/BrowserTitle';
import { ConnectionErrorModal } from '../connection-error-modal/ConnectionErrorModal';
import ItemContainer from '../ui/Item';
import { css, styled } from 'solid-styled-components';
import { useAppVersion } from '@/common/useAppVersion';
import { useWindowProperties } from '@/common/useWindowProperties';
import { FlexColumn, FlexRow } from '../ui/Flexbox';
import Button from '../ui/Button';
import Text from '../ui/Text';
import Marked from '@/components/marked/Marked';
import { formatTimestamp } from '@/common/date';
import { Draggable } from '../ui/Draggable';
import { updateServerOrder } from '@/chat-api/services/ServerService';
import { Banner } from '../ui/Banner';
import { User, UserStatus, bannerUrl } from '@/chat-api/store/useUsers';
import UserPresence from '../user-presence/UserPresence';
import DropDown from '../ui/drop-down/DropDown';
import { updatePresence } from '@/chat-api/services/UserService';
import { CustomLink } from '../ui/CustomLink';
import { clearCache } from '@/common/localCache';
import { useDrawer } from '../ui/drawer/Drawer';
import { useRegisterSW } from 'virtual:pwa-register/solid'
import Input from '../ui/input/Input';
import { getLastSelectedChannelId } from '@/common/useLastSelectedServerChannel';
import { Skeleton } from '../ui/skeleton/Skeleton';
import { useStore } from '@/store';

const SidebarItemContainer = styled(ItemContainer)`
  align-items: center;
  justify-content: center;
  height: 50px;
  width: 60px;
`;

export default function SidePane() {
  const { createPortal } = useCustomPortal();

  const showAddServerModal = () => {
    createPortal?.(close => <AddServer close={close} />)
  }

  return <div class={styles.sidePane}>
    <InboxItem />
    <ExploreItem />
    <div class={styles.scrollable}>
      <ServerList />
      <SidebarItemContainer onClick={showAddServerModal} >
        <Icon name="add_box" size={40} />
      </SidebarItemContainer>
    </div>
    <UpdateItem />
    <ModerationItem />
    <SettingsItem />
    <UserItem />
  </div>
}

function ExploreItem() {
  const selected = useMatch(() => "/app/explore/*");

  return (
    <A href={RouterEndpoints.EXPLORE_SERVER("")} style={{ "text-decoration": "none" }}>
      <SidebarItemContainer selected={selected()}>
        <Icon name='explore' />
      </SidebarItemContainer>
    </A>
  )
}

function InboxItem() {
  const { inbox, friends, servers } = useOldStore();
  const location = useLocation();
  const isSelected = () => {
    if (location.pathname === '/app') return true;
    if (location.pathname.startsWith(RouterEndpoints.INBOX())) return true;
    if (location.pathname.startsWith('/app/posts')) return true;
    return false;
  };

  const notificationCount = () => inbox.notificationCount();
  const friendRequestCount = () => friends.array().filter(friend => friend.status === FriendStatus.PENDING).length;

  const count = () => (notificationCount() + friendRequestCount());

  createEffect(() => {
    updateTitleAlert(count() || servers.hasNotifications() ? true : false);
  })

  return (
    <A href='/app' style={{ "text-decoration": "none" }}>
      <SidebarItemContainer selected={isSelected()} alert={(count())}>
        <NotificationCountBadge count={count()} top={10} right={10} />
        <Icon name='all_inbox' />
      </SidebarItemContainer>
    </A>
  )
}


function NotificationCountBadge(props: { count: number | string, top: number, right: number }) {
  return <Show when={props.count}><div class={styles.notificationCount} style={{
    top: `${props.top}px`,
    right: `${props.right}px`,
  }}>{props.count}</div></Show>

}

function UpdateItem() {
  const checkAfterMS = 600000; // 10 minutes
  const { checkForUpdate, updateAvailable } = useAppVersion();
  const { createPortal } = useCustomPortal();
  const { hasFocus } = useWindowProperties()
  let lastChecked = 0;

  createEffect(on(hasFocus, async () => {
    if (updateAvailable()) return;
    const now = Date.now();
    if (now - lastChecked >= checkAfterMS) {
      lastChecked = now;
      checkForUpdate();
    }
  }))

  const showUpdateModal = () => createPortal?.(close => <UpdateModal close={close} />)

  return (
    <Show when={updateAvailable()}>
      <SidebarItemContainer onclick={showUpdateModal}>
        <Icon name='get_app' title='Update Available' color="var(--success-color)" />
      </SidebarItemContainer>
    </Show>
  )
}
function ModerationItem() {
  const { account, tickets } = useOldStore();
  const hasModeratorPerm = () => hasBit(account.user()?.badges || 0, USER_BADGES.FOUNDER.bit) || hasBit(account.user()?.badges || 0, USER_BADGES.ADMIN.bit)

  const selected = useMatch(() => "/app/moderation/*");

  createEffect(() => {
    tickets.updateModerationTicketNotification();
  })

  return (
    <Show when={hasModeratorPerm()}>
      <A href="/app/moderation" style={{ "text-decoration": "none" }} >
        <SidebarItemContainer selected={selected()}>
          <Show when={tickets.hasModerationTicketNotification()}><NotificationCountBadge count={"!"} top={5} right={10} /></Show>
          <Icon name='security' title='Moderation' />
        </SidebarItemContainer>
      </A>
    </Show>
  )
}

function SettingsItem() {
  const { tickets } = useOldStore();

  createEffect(() => {
    tickets.updateTicketNotification();
  })


  const selected = useMatch(() => "/app/settings/*");


  return (
    <A href="/app/settings/account" style={{ "text-decoration": "none" }} >
      <SidebarItemContainer selected={selected()}>
        <Show when={tickets.hasTicketNotification()}><NotificationCountBadge count={"!"} top={5} right={10} /></Show>
        <Icon name='settings' title='Settings' />
      </SidebarItemContainer>
    </A>
  )
}

const UserItem = () => {
  const { account, users } = useOldStore();
  const { createPortal } = useCustomPortal();
  const {currentPage} = useDrawer();
  const [hovered, setHovered] = createSignal(false)
  const [modalOpened, setModalOpened] = createSignal(false)
  const {isMobileWidth} = useWindowProperties();


  const userId = () => account.user()?.id;
  const user = () => users.get(userId()!)
  const presenceColor = () => user() && userStatusDetail(user().presence?.status || 0).color

  const isAuthenticated = account.isAuthenticated;
  const authErrorMessage = account.authenticationError;
  const isConnected = account.isConnected;

  const isAuthenticating = () => !isAuthenticated() && isConnected();
  const showConnecting = () => !authErrorMessage() && !isAuthenticated() && !isAuthenticating();

  const onClicked = () => {
    if (authErrorMessage()) {
      return createPortal?.(close => <ConnectionErrorModal close={close} />)
    }

    if (isMobileWidth()) {
      createPortal(close => <FloatingUserModal close={close} currentDrawerPage={currentPage()} />)
      return;
    }

    setModalOpened(!modalOpened())
  }

  return (
    <>
      <SidebarItemContainer class={classNames(styles.user, "sidePaneUser")} onclick={onClicked} selected={modalOpened()} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        {account.user() && <Avatar animate={hovered()} size={40} user={account.user()!} />}
        {!showConnecting() && <div class={styles.presence} style={{ background: presenceColor() }} />}
        {showConnecting() && <Icon name='autorenew' class={styles.connectingIcon} size={24} />}
        {isAuthenticating() && <Icon name='autorenew' class={classNames(styles.connectingIcon, styles.authenticatingIcon)} size={24} />}
        {authErrorMessage() && <Icon name='error' class={styles.errorIcon} size={24} />}
      </SidebarItemContainer>
      <Show when={user() && modalOpened()}><FloatingUserModal close={() => setModalOpened(false)} currentDrawerPage={currentPage()} /></Show>
    </>
  )
};




const FloatingUserModalContainer = styled(FlexColumn) <{ isMobile: boolean }>`
  position: absolute;
  left: 67px;
  bottom: 5px;
  max-width: 300px;
  width: 100%;
  z-index: 1111111111111;
  height: 380px;
  padding: 8px;
  border-radius: 8px;
  background-color: var(--pane-color);
  border: solid 1px rgba(255, 255, 255, 0.2);
  overflow: auto;

  ${props => props.isMobile ? `
    left: 0;
    right: 0;
    bottom: 0;
    max-width: initial;
    width: initial;
    height: initial;
    max-height: 60%;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  ` : ''}
  

  .button {
    background-color: transparent;
    border: none;
    justify-content: initial;
    &:hover {
      background-color: rgba(255,255,255, 0.1);
    }
    &:last-child {
      margin-top: auto;
    }
  }

`;


const BannerContainer = styled(FlexRow)`
  display: flex;
  height: 100%;
  align-items: center;
  padding: 10px;
  padding-left: 20px;
`;

const DetailsContainer = styled(FlexColumn)`
  z-index: 1;
  margin-left: 15px;
  background: rgba(0, 0, 0, 0.86);
  backdrop-filter: blur(24px);
  padding: 5px;
  border-radius: 8px;
  overflow: hidden;


`;


function FloatingUserModal(props: { close(): void, currentDrawerPage?: number }) {
  const { account, users } = useOldStore();
  const { isMobileWidth, width } = useWindowProperties();

  const userId = () => account.user()?.id;
  const user = () => users.get(userId()!);


  const onLogoutClick = async () => {
    await clearCache();
    localStorage.clear();
    location.href = "/"
  }

  onMount(() => {
    document.addEventListener("mousedown", onDocMouseDown, { capture: true })
    document.addEventListener("click", onDocClick, { capture: true })
    onCleanup(() => {
      document.removeEventListener("mousedown", onDocMouseDown)
      document.removeEventListener("click", onDocClick)
    })
  })

  const memoIsMobileWidth = createMemo(() => isMobileWidth())

  createEffect(on([() => props.currentDrawerPage, memoIsMobileWidth], () => {
    console.log("test")
    props.close();
  }, {defer: true}))

  let pos = {x: 0, y: 0};
  const onDocMouseDown = (event: MouseEvent) => {
    pos = {x: event.x, y: event.y};
  }

  const onDocClick = (event: any) => {
    if (pos.x !== event.x || pos.y !== event.y) return;
    const clickedInside = event.target.closest(".floatingUserModalContainer") || event.target.closest(`.sidePaneUser`);
    if (clickedInside) return;
    props.close();
  }

  return (
    <FloatingUserModalContainer class="floatingUserModalContainer" isMobile={isMobileWidth()} gap={5}>
      <Banner margin={0} brightness={50} animate hexColor={user()?.hexColor} url={bannerUrl(user())}>
        <BannerContainer>
          <Avatar animate size={60} user={user()} />
          <DetailsContainer>
            <FlexRow>
              <Text style={{ "white-space": "nowrap", "overflow": "hidden", "text-overflow": "ellipsis"}}>{user().username}</Text>
              <Text color='rgba(255,255,255,0.6)'>:{user().tag}</Text>
            </FlexRow>
            <UserPresence animate showOffline userId={userId()!} />
          </DetailsContainer>
        </BannerContainer>
      </Banner>
      <PresenceDropDown />
      <CustomStatus/>

      <CustomLink onclick={props.close} style={{ display: "flex", "flex-direction": "column" }} href={RouterEndpoints.PROFILE(userId()!)}>
        <Button iconSize={18} padding={8} iconName='person' label='View Profile' margin={0} />
      </CustomLink>
      <CustomLink onclick={props.close} style={{ display: "flex", "flex-direction": "column" }} href="/app/settings/account">
        <Button iconSize={18} padding={8} iconName='settings' label='Edit Profile' margin={0} />
      </CustomLink>
      <Button onClick={onLogoutClick} iconSize={18} padding={8} iconName='logout' color='var(--alert-color)' label='Logout' margin={0} />

    </FloatingUserModalContainer>
  )
}

function CustomStatus() {
  const {account, users} = useOldStore();
  const [customStatus, setCustomStatus] = createSignal("");

  createEffect(on(() => account.user()?.customStatus, (custom) => {
    setCustomStatus(custom || "");
  }))

  const onBlur = () => {
    updatePresence({
      custom: customStatus().trim() ? customStatus() : null
    })
  }

  return (
    <Input class={styles.customStatusInput} label='Custom Status' placeholder='' onBlur={onBlur} onText={setCustomStatus} value={customStatus()}  />
  )
}

function PresenceDropDown() {
  const { account, users } = useOldStore();
  const user = () => users.get(account.user()?.id!);

  const presenceStatus = () => userStatusDetail(user()?.presence?.status || 0)

  const DropDownItems = UserStatuses.map((item, i) => {
    return {
      circleColor: item.color,
      id: item.id,
      label: item.name === "Offline" ? 'Appear As Offline' : item.name,
      index: i,
      onClick: (item: { index: number }) => {
        updatePresence({
          status: item.index
        });
      }
    }
  })
  // move invisible to the bottom.
  DropDownItems.push(DropDownItems.shift()!);



  return (
    <DropDown title='Presence' class={styles.presenceDropdown} items={DropDownItems} selectedId={presenceStatus().id} />
  )
}


function ServerItem(props: { server: Server, onContextMenu?: (e: MouseEvent) => void }) {
  const { id, defaultChannelId } = props.server;
  const hasNotifications = () => props.server.hasNotifications;
  const selected = useMatch(() => RouterEndpoints.SERVER(id) + "/*");
  const [hovered, setHovered] = createSignal(false);


  return (
    <A
      href={RouterEndpoints.SERVER_MESSAGES(id, getLastSelectedChannelId(id, defaultChannelId))}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onContextMenu={props.onContextMenu}>
      <SidebarItemContainer alert={hasNotifications()} selected={selected()}>
        <NotificationCountBadge count={props.server.mentionCount} top={5} right={10} />
        <Avatar animate={hovered()} size={40} server={props.server} />
      </SidebarItemContainer>
    </A>
  )
}

const ServerList = () => {
  const store = useStore();
  const [contextPosition, setContextPosition] = createSignal<{ x: number, y: number } | undefined>();
  const [contextServerId, setContextServerId] = createSignal<string | undefined>();

  const onContextMenu = (event: MouseEvent, serverId: string) => {
    event.preventDefault();
    setContextServerId(serverId);
    setContextPosition({ x: event.clientX, y: event.clientY });
  }

  const onDrop = (servers: Server[]) => {
    const serverIds = servers.map(server => server.id);
    updateServerOrder(serverIds)
  }

  return <div class={styles.serverListContainer}>
    <ContextMenuServer position={contextPosition()} onClose={() => setContextPosition(undefined)} serverId={contextServerId()} />
    <Show when={store.socket.details.lastAuthenticatedAt} fallback={<ServerListSkeleton/>}>
      <Draggable onStart={() => setContextPosition(undefined)} class={styles.serverList} onDrop={onDrop} items={store.servers.orderedList()}>
        {server => <ServerItem
          server={server!}
          onContextMenu={e => onContextMenu(e, server!.id)}
          />}
      </Draggable>
    </Show>
  </div>
};


const ServerListSkeleton = () => {
 return (
  <Skeleton.List>
    <Skeleton.Item height="50px" width="60px" />
  </Skeleton.List>
 )
}


function UpdateModal(props: { close: () => void }) {
  const { latestRelease } = useAppVersion();

  const date = () => {
    const release = latestRelease();
    if (!release) return undefined;
    return formatTimestamp(new Date(release.published_at).getTime())
  }
  const { updateServiceWorker } = useRegisterSW()


  const onUpdateClick = async () => {
    await updateServiceWorker();
    location.reload();
  }


  const ActionButtons = (
    <FlexRow style={{ "justify-content": "flex-end", flex: 1, margin: "5px" }}>
      <Button iconName='close' onClick={props.close} label='Later' color='var(--alert-color)' />
      <Button iconName='get_app' label='Update Now' onClick={onUpdateClick} primary />
    </FlexRow>
  )
  return (
    <Modal title='Update Available' actionButtons={ActionButtons} close={props.close}>
      <FlexColumn gap={5}>
        <FlexColumn style={{ "max-height": "400px", "max-width": "600px", overflow: "auto", padding: "10px" }}>
          <Text size={24}>{latestRelease()?.name || ""}</Text>
          <Text opacity={0.7}>Released at {date() || ""}</Text>
          <Text opacity={0.7}>{latestRelease()?.tag_name}</Text>
          <Marked value={latestRelease()?.body!} />
        </FlexColumn>
      </FlexColumn>
    </Modal>
  )
}