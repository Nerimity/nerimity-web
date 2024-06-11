import styles from "./styles.module.scss";
import Icon from "@/components/ui/icon/Icon";
import Avatar from "@/components/ui/Avatar";
import RouterEndpoints from "../../common/RouterEndpoints";
import { classNames, conditionalClass } from "@/common/classNames";
import ContextMenuServer from "@/components/servers/context-menu/ContextMenuServer";
import { createEffect, createMemo, createSignal, For, Match, on, onCleanup, onMount, Show, Switch } from "solid-js";
import useStore from "../../chat-api/store/useStore";
import { A, useLocation, useMatch } from "solid-navigator";
import { FriendStatus, RawServerFolder } from "../../chat-api/RawData";
import Modal from "@/components/ui/modal/Modal";
import AddServer from "./add-server/AddServerModal";
import { UserStatuses, userStatusDetail } from "../../common/userStatus";
import { Server } from "../../chat-api/store/useServers";
import { useCustomPortal } from "../ui/custom-portal/CustomPortal";
import { hasBit, USER_BADGES } from "@/chat-api/Bitwise";
import { updateTitleAlert } from "@/common/BrowserTitle";
import { ConnectionErrorModal } from "../connection-error-modal/ConnectionErrorModal";
import ItemContainer from "../ui/Item";
import { css, styled } from "solid-styled-components";
import { useAppVersion } from "@/common/useAppVersion";
import { useWindowProperties } from "@/common/useWindowProperties";
import { FlexColumn, FlexRow } from "../ui/Flexbox";
import Button from "../ui/Button";
import Text from "../ui/Text";
import Marked from "@/components/marked/Marked";
import { formatTimestamp } from "@/common/date";
import { createServerFolder, updateServerFolder, updateServerOrder } from "@/chat-api/services/ServerService";
import { Banner } from "../ui/Banner";
import { bannerUrl } from "@/chat-api/store/useUsers";
import UserPresence from "../user-presence/UserPresence";
import DropDown from "../ui/drop-down/DropDown";
import { updatePresence } from "@/chat-api/services/UserService";
import { CustomLink } from "../ui/CustomLink";
import { clearCache } from "@/common/localCache";
import { useDrawer } from "../ui/drawer/Drawer";
import Input from "../ui/input/Input";
import { getLastSelectedChannelId } from "@/common/useLastSelectedServerChannel";
import { Skeleton } from "../ui/skeleton/Skeleton";
import { AdvancedMarkupOptions } from "../advanced-markup-options/AdvancedMarkupOptions";
import { formatMessage } from "../message-pane/MessagePane";
import { createTemporarySignal } from "@/common/createTemporarySignal";
import { SimpleSortable } from "../ui/simple-sortable/SimpleSortable";

const SidebarItemContainer = styled(ItemContainer)`
  align-items: center;
  justify-content: center;
  height: 50px;
  width: 60px;
  user-select: none;
  cursor: default;
`;
const SidebarFolderItemContainer = styled(ItemContainer)`

  height: 50px;
  width: 60px;
  user-select: none;
  cursor: default;
  background-color: rgba(255, 255, 255, 0.08);
  align-items: center;
  justify-content: center;

  .grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(2, 1fr);
    place-items: center;
    height: 96%;
    width: 80%;
  }

`;

export default function SidePane() {
  const { createPortal } = useCustomPortal();

  const showAddServerModal = () => {
    createPortal?.(close => <AddServer close={close} />);
  };

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
  </div>;
}

function ExploreItem() {
  const selected = useMatch(() => "/app/explore/*");

  return (
    <A href={RouterEndpoints.EXPLORE_SERVER("")} style={{ "text-decoration": "none" }}>
      <SidebarItemContainer selected={selected()}>
        <Icon name='explore' />
      </SidebarItemContainer>
    </A>
  );
}

function InboxItem() {
  const { inbox, friends, servers } = useStore();
  const location = useLocation();
  const isSelected = () => {
    if (location.pathname === "/app") return true;
    if (location.pathname.startsWith(RouterEndpoints.INBOX())) return true;
    if (location.pathname.startsWith("/app/posts")) return true;
    return false;
  };

  const notificationCount = () => inbox.notificationCount();
  const friendRequestCount = () => friends.array().filter(friend => friend.status === FriendStatus.PENDING).length;

  const count = () => (notificationCount() + friendRequestCount());

  createEffect(() => {
    updateTitleAlert(count() || servers.hasNotifications() ? true : false);
  });

  return (
    <A href='/app' style={{ "text-decoration": "none" }}>
      <SidebarItemContainer selected={isSelected()} alert={(count())}>
        <NotificationCountBadge count={count()} top={10} right={10} />
        <Icon name='all_inbox' />
      </SidebarItemContainer>
    </A>
  );
}


function NotificationCountBadge(props: { count: number | string, top: number, right: number }) {
  return <Show when={props.count}><div class={styles.notificationCount} style={{
    top: `${props.top}px`,
    right: `${props.right}px`
  }}>{props.count}</div></Show>;

}

function UpdateItem() {
  const checkAfterMS = 600000; // 10 minutes
  const { checkForUpdate, updateAvailable } = useAppVersion();
  const { createPortal } = useCustomPortal();
  const { hasFocus } = useWindowProperties();
  let lastChecked = 0;

  createEffect(on(hasFocus, async () => {
    if (updateAvailable()) return;
    const now = Date.now();
    if (now - lastChecked >= checkAfterMS) {
      lastChecked = now;
      checkForUpdate();
    }
  }));


  const showUpdateModal = () => createPortal?.(close => <UpdateModal close={close} />);

  return (
    <Show when={updateAvailable()}>
      <SidebarItemContainer onclick={showUpdateModal}>
        <Icon name='get_app' title='Update Available' color="var(--success-color)" />
      </SidebarItemContainer>
    </Show>
  );
}
function ModerationItem() {
  const { account, tickets } = useStore();
  const hasModeratorPerm = () => hasBit(account.user()?.badges || 0, USER_BADGES.FOUNDER.bit) || hasBit(account.user()?.badges || 0, USER_BADGES.ADMIN.bit);

  const selected = useMatch(() => "/app/moderation/*");

  createEffect(() => {
    tickets.updateModerationTicketNotification();
  });

  return (
    <Show when={hasModeratorPerm()}>
      <A href="/app/moderation" style={{ "text-decoration": "none" }} >
        <SidebarItemContainer selected={selected()}>
          <Show when={tickets.hasModerationTicketNotification()}><NotificationCountBadge count={"!"} top={5} right={10} /></Show>
          <Icon name='security' title='Moderation' />
        </SidebarItemContainer>
      </A>
    </Show>
  );
}

function SettingsItem() {
  const { tickets } = useStore();

  createEffect(() => {
    tickets.updateTicketNotification();
  });


  const selected = useMatch(() => "/app/settings/*");


  return (
    <A href="/app/settings/account" style={{ "text-decoration": "none" }} >
      <SidebarItemContainer selected={selected()}>
        <Show when={tickets.hasTicketNotification()}><NotificationCountBadge count={"!"} top={5} right={10} /></Show>
        <Icon name='settings' title='Settings' />
      </SidebarItemContainer>
    </A>
  );
}

const UserItem = () => {
  const { account, users } = useStore();
  const { createPortal } = useCustomPortal();
  const {currentPage} = useDrawer();
  const [hovered, setHovered] = createSignal(false);
  const [modalOpened, setModalOpened] = createSignal(false);
  const {isMobileWidth} = useWindowProperties();


  const userId = () => account.user()?.id;
  const user = () => users.get(userId()!);
  const presenceColor = () => user() && userStatusDetail(user()!.presence()?.status || 0).color;

  const isAuthenticated = account.isAuthenticated;
  const authErrorMessage = account.authenticationError;
  const isConnected = account.isConnected;

  const isAuthenticating = () => !isAuthenticated() && isConnected();
  const showConnecting = () => !authErrorMessage() && !isAuthenticated() && !isAuthenticating();

  const onClicked = () => {
    if (authErrorMessage()) {
      return createPortal?.(close => <ConnectionErrorModal close={close} />);
    }

    if (isMobileWidth()) {
      createPortal(close => <FloatingUserModal close={close} currentDrawerPage={currentPage()} />);
      return;
    }

    setModalOpened(!modalOpened());
  };

  return (
    <>
      <SidebarItemContainer class={classNames(styles.user, "sidePaneUser")} onclick={onClicked} selected={modalOpened()} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        {account.user() && <Avatar animate={hovered()} size={40} user={account.user()!} resize={96} />}
        {!showConnecting() && <div class={styles.presence} style={{ background: presenceColor() }} />}
        {showConnecting() && <Icon name='autorenew' class={styles.connectingIcon} size={24} />}
        {isAuthenticating() && <Icon name='autorenew' class={classNames(styles.connectingIcon, styles.authenticatingIcon)} size={24} />}
        {authErrorMessage() && <Icon name='error' class={styles.errorIcon} size={24} />}
      </SidebarItemContainer>
      <Show when={user() && modalOpened()}><FloatingUserModal close={() => setModalOpened(false)} currentDrawerPage={currentPage()} /></Show>
    </>
  );
};




const FloatingUserModalContainer = styled(FlexColumn) <{ isMobile: boolean }>`
  position: absolute;
  left: 67px;
  bottom: 5px;
  max-width: 300px;
  width: 100%;
  z-index: 1111111111111;
  height: 440px;
  border-radius: 6px;
  background-color: var(--pane-color);
  border: solid 1px rgba(255, 255, 255, 0.2);
  overflow: auto;
  padding-bottom: 4px;

  ${props => props.isMobile ? `
    left: 0;
    right: 0;
    bottom: 0;
    max-width: initial;
    width: initial;
    height: initial;
    max-height: 68%;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  ` : ""}
  

  .buttonContainer .button {
    background-color: transparent;
    border: none;
    justify-content: initial;
    margin: 0;
    &:hover {
      background-color: rgba(255,255,255, 0.1);
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


const ButtonContainer = styled(FlexRow)`
  padding-top: 30px;
  margin-top: auto;
  margin-left: 4px;
  margin-right: 4px;
  > * {
    flex: 1;
    display: flex;
    .button {
      flex: 1;
    }
  }
  
`;

const customButtonStyles = css`
  flex-direction: column;
  gap: 4px;
  .label {
    margin: 0;
  }
`;

function FloatingUserModal(props: { close(): void, currentDrawerPage?: number }) {
  const { account, users } = useStore();
  const { isMobileWidth } = useWindowProperties();
  const {openedPortals} = useCustomPortal();

  const userId = () => account.user()?.id;
  const user = () => users.get(userId()!);


  const onLogoutClick = async () => {
    await clearCache();
    localStorage.clear();
    location.href = "/";
  };

  onMount(() => {
    document.addEventListener("mousedown", onDocMouseDown, { capture: true });
    document.addEventListener("click", onDocClick, { capture: true });
    onCleanup(() => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("click", onDocClick);
    });
  });

  const memoIsMobileWidth = createMemo(() => isMobileWidth());

  createEffect(on([() => props.currentDrawerPage, memoIsMobileWidth], () => {
    console.log("test");
    props.close();
  }, {defer: true}));

  let pos = {x: 0, y: 0};
  const onDocMouseDown = (event: MouseEvent) => {
    pos = {x: event.x, y: event.y};
  };

  const onDocClick = (event: MouseEvent) => {
    if (pos.x !== event.x || pos.y !== event.y) return;
    if (openedPortals().length) return;

    const clickedInside = event.target instanceof HTMLElement && (event.target.closest(".floatingUserModalContainer") || event.target.closest(".sidePaneUser"));
    if (clickedInside) return;
    props.close();
  };

  return (
    <FloatingUserModalContainer class="floatingUserModalContainer" isMobile={isMobileWidth()} gap={5}>
      <Banner margin={0} radius={6} brightness={50} animate hexColor={user()?.hexColor} url={bannerUrl(user())}>
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
      <FlexColumn gap={4} style={{"margin-left": "4px", "margin-right": "4px"}}>
        <PresenceDropDown />
        <CustomStatus/>
      </FlexColumn>

      <ButtonContainer class="buttonContainer">
        
        <CustomLink onclick={props.close} href={RouterEndpoints.PROFILE(userId()!)}>
          <Button textSize={12} class={customButtonStyles} iconSize={18} padding={8} iconName='person' label='View Profile' margin={0} />
        </CustomLink>
        
        <CustomLink onclick={props.close} href="/app/settings/account">
          <Button textSize={12} class={customButtonStyles} iconSize={18} padding={8} iconName='settings' label='Edit Profile' margin={0} />
        </CustomLink>
        
        <div>
          <Button textSize={12} class={customButtonStyles} onClick={onLogoutClick} iconSize={18} padding={8} iconName='logout' color='var(--alert-color)' label='Logout' margin={0} />
        </div>


      </ButtonContainer>

    </FloatingUserModalContainer>
  );
}

function CustomStatus() {
  const {account, users} = useStore();
  const [customStatus, setCustomStatus] = createSignal("");
  const [inputRef, setInputRef] = createSignal<HTMLInputElement>();

  createEffect(on(() => account.user()?.customStatus, (custom) => {
    setCustomStatus(custom || "");
  }));

  const save = (event: FocusEvent) => {
    console.log(event);
    const formattedStatus = formatMessage(customStatus().trim() || "");
    updatePresence({
      custom: customStatus().trim() ? formattedStatus : null
    });
  };

  const changes = () => {
    return (customStatus() || "") !== (account.user()?.customStatus || "");
  };

  return (
    <>
      <Text opacity={0.8}>Custom Status</Text>
      <FlexColumn>
        <AdvancedMarkupOptions class="advancedMarkupOptions" inputElement={inputRef()!} updateText={setCustomStatus} />
        <Input type="textarea" height={30} ref={setInputRef} class={styles.customStatusInput} placeholder='' onText={setCustomStatus} value={customStatus()}  />
        <Show when={changes()}><Button label="Save" onClick={save} iconName="save" iconSize={16} margin={[6, 0, 0, 0]}/></Show>
      </FlexColumn>
    </>  
  );
}

function PresenceDropDown() {
  const { account, users } = useStore();
  const user = () => users.get(account.user()?.id!);

  const presenceStatus = () => userStatusDetail(user()?.presence()?.status || 0);

  const DropDownItems = UserStatuses.map((item, i) => {
    return {
      circleColor: item.color,
      id: item.id,
      label: item.name === "Offline" ? "Appear As Offline" : item.name,
      index: i,
      onClick: (item: { index: number }) => {
        updatePresence({
          status: item.index
        });
      }
    };
  });
  // move invisible to the bottom.
  DropDownItems.push(DropDownItems.shift()!);



  return (
    <DropDown title='Presence' class={styles.presenceDropdown} items={DropDownItems} selectedId={presenceStatus().id} />
  );
}


function ServerItem(props: { folderModeServerId?: string, server: Server, onContextMenu?: (e: MouseEvent) => void }) {
  const server = () => props.server;
  const hasNotifications = () => props.server.hasNotifications();
  const selected = useMatch(() => RouterEndpoints.SERVER(server().id) + "/*");
  const [hovered, setHovered] = createSignal(false);


  return (
    <A
      draggable={false}
      title={props.server.name}
      href={RouterEndpoints.SERVER_MESSAGES(server().id, getLastSelectedChannelId(server().id, server().defaultChannelId))}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onContextMenu={props.onContextMenu}>
      <Switch>
        <Match when={props.folderModeServerId}>
          <FolderItem serverIds={[server().id, props.folderModeServerId!]} isTemp />
        </Match>
        <Match when={!props.folderModeServerId}>
          <SidebarItemContainer class="sidebar-server-item sortable-sidebar-root-drop-class" alert={hasNotifications()} selected={selected()}>
            <NotificationCountBadge count={props.server.mentionCount()} top={5} right={10} />
            <Avatar resize={128} animate={hovered()} size={40} server={props.server} />
          </SidebarItemContainer>
        </Match>
      </Switch>
    </A>
  );
}

const FolderItem = (props: {folderId?: string, serverIds: string[], isTemp?: boolean, onAdd?: (e: { currentIndex: number, newIndex: number, id: string }) => void}) => {
  const store = useStore();
  const servers = () => props.serverIds.map(id => store.servers.get(id)).filter(Boolean) as Server[];

  const [open, setOpen] = createSignal(false);

  
  const firstFourServers = () => servers().slice(0, 4);
  return (
    <>
      <SidebarFolderItemContainer onClick={() => setOpen(!open())} style={open() ? {"border-bottom-left-radius": "0", "border-bottom-right-radius": "0"} : {}} class={classNames("sidebar-folder", "sortable-sidebar-root-drop-class", conditionalClass(props.isTemp, "sidebar-server-temp-folder-item"))}>
        <div class="grid">
          <For each={firstFourServers()}>
            {(server) => <Avatar size={20} resize={64} server={{...server, verified: false}} />}
          </For>
        </div>
      </SidebarFolderItemContainer>
      <Show when={open() && !props.isTemp}>
        <div class="sidebar-folder-items" style={{background: "rgba(255,255,255,0.14)", "border-radius": "4px", ...(open() ? {"border-top-left-radius": "0", "border-top-right-radius": "0"} : {})}}>
          
          <SimpleSortable id={props.folderId} onAdd={props.onAdd} group="sidebar-servers" items={servers()} idField="id" gap={4} >
            {(server) => (
              <ServerItem server={server} />   
            )}
          </SimpleSortable>
        
        </div>
      </Show>
    </>
  );
};

const ServerList = () => {
  const { servers, account, serverFolders } = useStore();
  const [contextPosition, setContextPosition] = createSignal<{ x: number, y: number } | undefined>();
  const [contextServerId, setContextServerId] = createSignal<string | undefined>();

  const [orderedServers, setOrderedServers, resetOrderedServers] = createTemporarySignal(servers.orderedServersAndFoldersArray);

  const [draggingOnTop, setDraggingOnTop] = createSignal<{draggingIndex: number, targetIndex: number} | null>(null);


  const draggingOnTopServerId = () => {
    if (!draggingOnTop()) return;
    const draggingItem = servers.orderedServersAndFoldersArray()[draggingOnTop()!.draggingIndex];
    if (draggingItem.serverIds) return;
    return draggingItem?.id;
  };


  const onContextMenu = (event: MouseEvent, serverId: string) => {
    event.preventDefault();
    setContextServerId(serverId);
    setContextPosition({ x: event.clientX, y: event.clientY });
  };

  const onDrop = (event: {currentIndex: number, newIndex: number}) => {
    
    const serverIds = orderedServers().map(server => server.id);
    
    if (draggingOnTop()?.targetIndex !== -1) {


      if ( orderedServers()[event.currentIndex]?.serverIds ) return;

      const folderServerIds = orderedServers()[event.newIndex]?.serverIds;

      // move on top of a folder
      if ( folderServerIds) {        
        const order: [number, number] = event.currentIndex > event.newIndex ? [event.currentIndex, event.newIndex + folderServerIds.length + 1] : [event.currentIndex, event.newIndex + folderServerIds.length];
        const newOrderedServerIds = moveArrayItemToNewIndex(serverIds, ...order);
        onAddToFolder(event.newIndex, event.currentIndex, newOrderedServerIds);

      }
      else {
        // create a new folder
        const order: [number, number] = event.currentIndex > event.newIndex ? [event.currentIndex, event.newIndex + 1] : [event.currentIndex, event.newIndex];
        const newOrderedServerIds = moveArrayItemToNewIndex(serverIds, ...order);
        onCreateNewFolder(event.newIndex, event.currentIndex, newOrderedServerIds);
      }

      return;
    }

    const newOrderedServerIds = moveArrayItemToNewIndex(serverIds, event.currentIndex, event.newIndex);
    updateServerOrder(newOrderedServerIds).then(resetOrderedServers);
  };


  const onAdd = (event: {currentIndex: number, newIndex: number, id: string}) => {
    const folderIndex = account.user()?.orderedServerIds?.indexOf(event.id);
    if (folderIndex === undefined || folderIndex === -1) return;
    const newIndex = folderIndex + event.newIndex;

    const serverIds = orderedServers().map(server => server.id);


    const order: [number, number] = event.currentIndex > newIndex ? [event.currentIndex, newIndex + 1] : [event.currentIndex, newIndex];
    const newOrderedServerIds = moveArrayItemToNewIndex(serverIds, ...order);


    onAddToFolder(newIndex, event.currentIndex, newOrderedServerIds, event.id);

  };

  const onMoveFromFolder = async (currentFolderId: string, event: {currentIndex: number, newIndex: number, id: string}) => {
    const isMovedToAnotherFolder = orderedServers().find(server => server.id === event.id && server.serverIds);

    if (!isMovedToAnotherFolder) {

      const serverIds = orderedServers().map(server => server.id);
      
      
      const folderIndex = account.user()?.orderedServerIds?.indexOf(currentFolderId);
      if (folderIndex === undefined || folderIndex === -1) return;


      const currentIndex = folderIndex + event.currentIndex;

      const order: [number, number] = currentIndex > event.newIndex ? [currentIndex, event.newIndex] : [currentIndex, event.newIndex];
      const newOrderedServerIds = moveArrayItemToNewIndex(serverIds, ...order);

      console.log(order);



      const unorderedFolderServers = serverFolders.get(currentFolderId)?.serverIds;
      if (!unorderedFolderServers) return;
      const orderedFolderServers = orderedFolderItems(unorderedFolderServers);


      const newServerIds = orderedFolderServers.toSpliced(event.currentIndex, 1);

      // await updateServerOrder(newOrderedServerIds);
      // await updateServerFolder(currentFolderId, newServerIds);



    }

  };

  const onAddToFolder = (newIndex: number, currentIndex: number, newOrderedServerIds: string[], _folderId?: string) => {
    const folderId = _folderId || orderedServers()[newIndex]?.id;
    const folder = serverFolders.get(folderId!) as RawServerFolder;
    const draggingServerId = orderedServers()[currentIndex]?.id;
    if (folder && draggingServerId) {
      updateServerOrder(newOrderedServerIds).then(async () => {
        await updateServerFolder(folder.id, [...folder.serverIds, draggingServerId]);
      });
    }
  };

  const onCreateNewFolder = (newIndex: number, currentIndex: number, newOrderedServerIds: string[]) => {
    const folderServerIds = [orderedServers()[newIndex]?.id!, orderedServers()[currentIndex]?.id!];
    updateServerOrder(newOrderedServerIds).then(async () => {
      await createServerFolder(folderServerIds);
    });
  };

  const onDragOnTop = (draggingIndex: number, targetIndex: number) => {
    if (draggingIndex === -1) {
      setDraggingOnTop(null);
      return;
    }
    setDraggingOnTop({ draggingIndex, targetIndex });
  };


  const orderedFolderItems = (unorderedServerIds: string[]) => {
    const serverIds = orderedServers().filter(server => unorderedServerIds.includes(server.id)).map(server => server.id);
    return serverIds;
  };

  return <div class={styles.serverListContainer}>
    <ContextMenuServer position={contextPosition()} onClose={() => setContextPosition(undefined)} serverId={contextServerId()} />
    <Show when={account.lastAuthenticatedAt()} fallback={<ServerListSkeleton/>}>
      <div class={css`
      .simpleSortableDraggingItem {
        opacity: 0.4;
        img {
          pointer-events: none;
        }
      }
      .simpleSortableDraggedOnTop {
        .sidebar-server-temp-folder-item:after {
          display: none;
        }
      }
      
      `}>
        <SimpleSortable onAdd={onAdd} group="sidebar-servers" dropClassName="sortable-sidebar-root-drop-class" ignoreClassName="sidebar-folder-items" items={orderedServers()} hiddenItems={s => !s.serverIds &&  !!serverFolders.isInFolder(s.id)} idField="id" gap={4} onDrop={onDrop} allowDragOnTop onDragOnTop={onDragOnTop}>
          {(server, i) => (
            <Switch>
              <Match when={server.serverIds}>
                <FolderItem
                  onAdd={(e) => onMoveFromFolder(server.id, e)}
                  folderId={server.id}
                  serverIds={[...orderedFolderItems(server.serverIds), ...(draggingOnTop()?.targetIndex === i() && draggingOnTopServerId() ? [draggingOnTopServerId()] : [])]!}
                />
              </Match>
              <Match when={!server.serverIds && !serverFolders.isInFolder(server.id)}>
                <ServerItem
                  folderModeServerId={draggingOnTop()?.targetIndex === i() ?  draggingOnTopServerId() : undefined}
                  server={server!}
                  onContextMenu={e => onContextMenu(e, server!.id)}
                />
              </Match>
            </Switch>    
          )}
        </SimpleSortable>
      </div>


    </Show>
  </div>;
};



function moveArrayItemToNewIndex(arr: string[], oldIndex: number, newIndex: number): string[] {
  if (newIndex >= arr.length) {
    let paddingCount = newIndex - arr.length + 1;
    while (paddingCount--) {
      arr.push(undefined);
    }
  }
  arr.splice(newIndex, 0, arr.splice(oldIndex, 1)[0]);
  return arr;
}









const ServerListSkeleton = () => {
  return (
    <Skeleton.List>
      <Skeleton.Item height="50px" width="60px" />
    </Skeleton.List>
  );
};


function UpdateModal(props: { close: () => void }) {
  const { latestRelease } = useAppVersion();

  const date = () => {
    const release = latestRelease();
    if (!release) return undefined;
    return formatTimestamp(new Date(release.published_at).getTime());
  };


  const onUpdateClick = async () => {
    location.reload();
  };


  const ActionButtons = (
    <FlexRow style={{ "justify-content": "flex-end", flex: 1, margin: "5px" }}>
      <Button iconName='close' onClick={props.close} label='Later' color='var(--alert-color)' />
      <Button iconName='get_app' label='Update Now' onClick={onUpdateClick} primary />
    </FlexRow>
  );
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
  );
}