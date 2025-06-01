import styles from "./styles.module.scss";
import Icon from "@/components/ui/icon/Icon";
import Avatar from "@/components/ui/Avatar";
import RouterEndpoints from "../../common/RouterEndpoints";
import { classNames, cn } from "@/common/classNames";
import ContextMenuServer from "@/components/servers/context-menu/ContextMenuServer";
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  on,
  Setter,
  Show,
} from "solid-js";
import useStore from "../../chat-api/store/useStore";
import { A, useLocation, useMatch } from "solid-navigator";
import { FriendStatus } from "../../chat-api/RawData";
import LegacyModal from "@/components/ui/legacy-modal/LegacyModal";
import { userStatusDetail } from "../../common/userStatus";
import { Server } from "../../chat-api/store/useServers";
import { useCustomPortal } from "../ui/custom-portal/CustomPortal";
import { hasBit, USER_BADGES } from "@/chat-api/Bitwise";
import { updateTitleAlert } from "@/common/BrowserTitle";
import { ConnectionErrorModal } from "../connection-error-modal/ConnectionErrorModal";
import ItemContainer from "../ui/LegacyItem";
import { styled } from "solid-styled-components";
import { useAppVersion } from "@/common/useAppVersion";
import { useWindowProperties } from "@/common/useWindowProperties";
import { FlexColumn, FlexRow } from "../ui/Flexbox";
import Button from "../ui/Button";
import Text from "../ui/Text";
import Marked from "@/components/marked/Marked";
import { formatTimestamp } from "@/common/date";
import { Draggable } from "../ui/Draggable";
import { updateServerOrder } from "@/chat-api/services/ServerService";
import { getLastSelectedChannelId } from "@/common/useLastSelectedServerChannel";
import { Skeleton } from "../ui/skeleton/Skeleton";
import { Tooltip } from "../ui/Tooltip";
import { AddServerModal } from "./add-server-modal/AddServerModal";
import env from "@/common/env";
import { ProfileFlyout } from "../floating-profile/FloatingProfile";
import { StorageKeys } from "@/common/localStorage";
import { useResizeBar } from "../ui/ResizeBar";
import Sortable from "solid-sortablejs";
import { useDocumentListener } from "@/common/useDocumentListener";

const SidebarItemContainer = styled(ItemContainer)`
  align-items: center;
  justify-content: center;
  aspect-ratio: 1/0.768;
`;

export default function SidePane() {
  let containerEl: HTMLDivElement | undefined;
  const { createPortal } = useCustomPortal();
  const { isMobileWidth } = useWindowProperties();

  const showAddServerModal = () => {
    createPortal?.((close) => <AddServerModal close={close} />);
  };

  const resizeBar = useResizeBar({
    storageKey: StorageKeys.SIDEBAR_WIDTH,
    defaultWidth: 65,
    minWidth: 40,
    maxWidth: 65,
    element: () => containerEl,
  });

  return (
    <div
      ref={containerEl}
      class={cn(styles.sidePane, isMobileWidth() ? styles.mobile : undefined)}
      style={
        isMobileWidth()
          ? { width: "65px" }
          : { width: `${resizeBar.width()}px` }
      }
    >
      <Show when={!isMobileWidth()}>
        <HomeItem size={resizeBar.width()} />
      </Show>
      <div class={styles.scrollable}>
        <ServerList size={resizeBar.width()} />
        <Tooltip tooltip="Add Server">
          <SidebarItemContainer onClick={showAddServerModal}>
            <Icon
              name="add_box"
              size={resizeBar.width() - resizeBar.width() * 0.378}
            />
          </SidebarItemContainer>
        </Tooltip>
      </div>
      <UpdateItem size={resizeBar.width()} />
      <Show when={!isMobileWidth()}>
        <ModerationItem size={resizeBar.width()} />
        <SettingsItem size={resizeBar.width()} />
        <UserItem size={resizeBar.width()} />
      </Show>
      <resizeBar.Handle />
    </div>
  );
}

function HomeItem(props: { size: number }) {
  const { inbox, friends, servers } = useStore();
  const location = useLocation();
  const isSelected = () => {
    if (location.pathname === "/app") return true;
    if (location.pathname.startsWith(RouterEndpoints.INBOX())) return true;
    if (location.pathname.startsWith("/app/posts")) return true;
    return false;
  };

  const notificationCount = () => inbox.notificationCount();
  const friendRequestCount = () =>
    friends.array().filter((friend) => friend.status === FriendStatus.PENDING)
      .length;

  const count = () => notificationCount() + friendRequestCount();

  createEffect(() => {
    updateTitleAlert(count() || servers.hasNotifications() ? true : false);
  });

  return (
    <Tooltip tooltip="Home">
      <A href="/app" style={{ "text-decoration": "none" }}>
        <SidebarItemContainer selected={isSelected()} alert={count()}>
          <NotificationCountBadge count={count()} top={10} right={10} />
          <Icon name="home" size={props.size - props.size * 0.6308} />
        </SidebarItemContainer>
      </A>
    </Tooltip>
  );
}

function NotificationCountBadge(props: {
  count: number | string;
  top: number;
  right: number;
}) {
  return (
    <Show when={props.count}>
      <div
        class={styles.notificationCount}
        style={{
          top: `${props.top}px`,
          right: `${props.right}px`,
        }}
      >
        {props.count}
      </div>
    </Show>
  );
}

function UpdateItem(props: { size: number }) {
  const checkAfterMS = 600000; // 10 minutes
  const { checkForUpdate, updateAvailable } = useAppVersion();
  const { createPortal } = useCustomPortal();
  const { hasFocus } = useWindowProperties();
  let lastChecked = 0;

  createEffect(
    on(hasFocus, async () => {
      if (updateAvailable()) return;
      const now = Date.now();
      if (now - lastChecked >= checkAfterMS) {
        lastChecked = now;
        checkForUpdate();
      }
    })
  );

  const showUpdateModal = () =>
    createPortal?.((close) => <UpdateModal close={close} />);

  return (
    <Show when={updateAvailable()}>
      <Tooltip tooltip="Update Available">
        <SidebarItemContainer onclick={showUpdateModal}>
          <Icon
            name="get_app"
            color="var(--success-color)"
            size={props.size - props.size * 0.6308}
          />
        </SidebarItemContainer>
      </Tooltip>
    </Show>
  );
}
function ModerationItem(props: { size: number }) {
  const { account, tickets } = useStore();
  const hasModeratorPerm = () =>
    hasBit(account.user()?.badges || 0, USER_BADGES.FOUNDER.bit) ||
    hasBit(account.user()?.badges || 0, USER_BADGES.ADMIN.bit);

  const selected = useMatch(() => "/app/moderation/*");

  return (
    <Show when={hasModeratorPerm()}>
      <Tooltip tooltip="Moderation Pane">
        <A href="/app/moderation" style={{ "text-decoration": "none" }}>
          <SidebarItemContainer selected={selected()}>
            <Show when={tickets.hasModerationTicketNotification()}>
              <NotificationCountBadge count={"!"} top={5} right={10} />
            </Show>
            <Icon name="security" size={props.size - props.size * 0.6308} />
          </SidebarItemContainer>
        </A>
      </Tooltip>
    </Show>
  );
}

function SettingsItem(props: { size: number }) {
  const { tickets } = useStore();

  const selected = useMatch(() => "/app/settings/*");

  return (
    <Tooltip tooltip="Settings">
      <A href="/app/settings/account" style={{ "text-decoration": "none" }}>
        <SidebarItemContainer selected={selected()}>
          <Show when={tickets.hasTicketNotification()}>
            <NotificationCountBadge count={"!"} top={5} right={10} />
          </Show>
          <Icon name="settings" size={props.size - props.size * 0.6308} />
        </SidebarItemContainer>
      </A>
    </Tooltip>
  );
}

const UserItem = (props: { size: number }) => {
  const { account, users } = useStore();
  const { createPortal, isPortalOpened } = useCustomPortal();
  const [hovered, setHovered] = createSignal(false);

  const userId = () => account.user()?.id;
  const user = () => users.get(userId()!);
  const presenceColor = () =>
    user() && userStatusDetail(user()?.presence()?.status || 0).color;

  const isAuthenticated = account.isAuthenticated;
  const authErrorMessage = account.authenticationError;
  const isConnected = account.isConnected;

  const isAuthenticating = () => !isAuthenticated() && isConnected();
  const showConnecting = () =>
    !authErrorMessage() && !isAuthenticated() && !isAuthenticating();

  const modalOpened = () => {
    return isPortalOpened("profile-pane-flyout-" + userId());
  };
  const onClicked = (event: MouseEvent) => {
    if (authErrorMessage()) {
      return createPortal?.((close) => <ConnectionErrorModal close={close} />);
    }

    if (!user()) return;
    const el = event.target as HTMLElement;
    const rect = el?.getBoundingClientRect()!;
    const pos = {
      left: props.size + 6,
      top: rect.top + 10,
      bottom: 8,
      anchor: "left",
    } as const;
    return createPortal(
      (close) => (
        <ProfileFlyout
          hideLatestPost
          triggerEl={el}
          showProfileSettings
          position={pos}
          close={close}
          userId={userId()}
        />
      ),
      "profile-pane-flyout-" + userId(),
      true
    );
  };

  return (
    <>
      <Tooltip
        disable={modalOpened()}
        tooltip={
          <div>
            Profile{" "}
            <Show when={user()}>
              <div style={{ "line-height": "1" }}>
                {user()!.username}:{user()!.tag}
              </div>
            </Show>
          </div>
        }
      >
        <SidebarItemContainer
          class={classNames(
            styles.user,
            "sidePaneUser",
            "trigger-profile-flyout"
          )}
          onclick={onClicked}
          selected={modalOpened()}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {account.user() && (
            <Avatar
              animate={hovered()}
              size={props.size - props.size * 0.4}
              user={account.user()!}
              resize={96}
            />
          )}
          {!showConnecting() && (
            <div
              class={styles.presence}
              style={{ background: presenceColor() }}
            />
          )}
          {showConnecting() && (
            <Icon name="autorenew" class={styles.connectingIcon} size={24} />
          )}
          {isAuthenticating() && (
            <Icon
              name="autorenew"
              class={classNames(
                styles.connectingIcon,
                styles.authenticatingIcon
              )}
              size={props.size - props.size * 0.6308}
            />
          )}
          {authErrorMessage() && (
            <Icon
              name="error"
              class={styles.errorIcon}
              size={props.size - props.size * 0.6308}
            />
          )}
        </SidebarItemContainer>
      </Tooltip>
    </>
  );
};

const [draggingId, setDraggingId] = createSignal<string | null>(null);
const [draggedOverId, setDraggedOverId] = createSignal<string | null>(null);
const [draggedOverEl, setDraggedOverEl] = createSignal<HTMLElement | null>(
  null
);
const [isDraggedOverItem, setIsDraggedOverItem] = createSignal(false);

function ServerItem(props: {
  server: Server;
  onContextMenu?: (e: MouseEvent) => void;
  size: number;
}) {
  const { id, defaultChannelId } = props.server;
  const hasNotifications = () => props.server.hasNotifications();
  const selected = useMatch(() => RouterEndpoints.SERVER(id) + "/*");
  const [hovered, setHovered] = createSignal(false);

  return (
    <Tooltip tooltip={props.server.name}>
      <A
        href={RouterEndpoints.SERVER_MESSAGES(
          id,
          getLastSelectedChannelId(id, defaultChannelId)
        )}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onContextMenu={props.onContextMenu}
      >
        <SidebarItemContainer alert={hasNotifications()} selected={selected()}>
          <NotificationCountBadge
            count={props.server.mentionCount()}
            top={5}
            right={10}
          />
          <Avatar
            resize={128}
            animate={hovered()}
            size={props.size - props.size * 0.4}
            server={props.server}
          />
        </SidebarItemContainer>
      </A>
    </Tooltip>
  );
}

interface ServerFolder {
  id: string;
  name: string;
  serverIds: string[];
}

const [folders, setFolders] = createSignal<ServerFolder[]>([
  {
    id: "1",
    name: "Folder 1",
    serverIds: ["1473046991977226240", "1473280019831889920"],
  },
]);

function ServerFolderItem(props: { folder: ServerFolder; size: number }) {
  const [showFullList, setShowFullList] = createSignal(false);

  const store = useStore();

  const servers = () => {
    const servers = props.folder.serverIds.map(
      (id) => store.servers.get(id) as Server
    );

    return servers.filter(Boolean);
  };

  return (
    <div>
      <Tooltip tooltip={props.folder.name}>
        <div
          class={styles.folderContainer}
          classList={{ [styles.opened!]: showFullList() }}
          onClick={() => setShowFullList(!showFullList())}
          onDragOver={(e) => {
            const target = e.currentTarget;

            setDraggedOverId(props.folder.id);
            setDraggedOverEl(target);
          }}
          style={{
            background:
              draggingId() && draggedOverId() === props.folder.id
                ? "var(--primary-color)"
                : "",
          }}
          draggable="true"
        >
          <div
            class={styles.folderInnerContainer}
            style={{ width: props.size - props.size * 0.15 + "px" }}
          >
            <For each={servers().slice(0, 4)}>
              {(server) => (
                <Avatar
                  resize={128}
                  size={props.size - props.size * 0.63}
                  server={server}
                />
              )}
            </For>
            <Show when={servers().length < 4}>
              <For each={Array(4 - servers().length)}>
                {(server) => (
                  <div
                    style={{
                      width: props.size - props.size * 0.63 + "px",
                      height: props.size - props.size * 0.63 + "px",
                    }}
                  />
                )}
              </For>
            </Show>
          </div>
        </div>
      </Tooltip>

      <Show when={showFullList()}>
        <div>
          <Sortable
            class={styles.folderList}
            animation={0}
            group="server-list"
            idField={"id"}
            items={servers()}
            setItems={() => {}}
          >
            {(server) => <ServerItem server={server} size={props.size} />}
          </Sortable>
        </div>
      </Show>
    </div>
  );
}

const ServerList = (props: { size: number }) => {
  const { servers, account } = useStore();
  const [contextPosition, setContextPosition] = createSignal<
    { x: number; y: number } | undefined
  >();
  const [contextServerId, setContextServerId] = createSignal<
    string | undefined
  >();

  const onContextMenu = (event: MouseEvent, serverId: string) => {
    event.preventDefault();
    setContextServerId(serverId);
    setContextPosition({ x: event.clientX, y: event.clientY });
  };

  const serversAndFolders = createMemo(() => {
    return [
      ...folders().map((f) => ({ ...f, type: "folder" as const })),
      ...servers.orderedArray().map((s) => ({ ...s, type: "server" as const })),
    ];
  });
  type ServerOrFolder = ReturnType<typeof serversAndFolders>[number];

  const onDrop = (servers: ServerOrFolder[]) => {
    const serverIds = servers
      .filter((e) => e.type === "server")
      .map((server) => server.id);
    updateServerOrder(serverIds);
  };

  useDocumentListener("drag", (event) => {
    if (!draggedOverEl()) {
      return;
    }
    const rect = draggedOverEl()?.getBoundingClientRect()!;

    const itemTriggerHeight = rect.height / 4;

    const top = rect.top;
    const bottom = rect.bottom;
    const isTopTriggered = event.clientY >= top + itemTriggerHeight;
    const isBottomTriggered = event.clientY <= bottom - itemTriggerHeight;

    const isItemHovered = isTopTriggered && isBottomTriggered;

    setIsDraggedOverItem(isItemHovered);
  });

  return (
    <div class={styles.serverListContainer}>
      <ContextMenuServer
        position={contextPosition()}
        onClose={() => setContextPosition(undefined)}
        serverId={contextServerId()}
      />
      <Show
        when={account.lastAuthenticatedAt()}
        fallback={<ServerListSkeleton size={props.size} />}
      >
        <Sortable
          group="server-list"
          onStart={() => setContextPosition(undefined)}
          class={styles.serverList}
          idField="id"
          setItems={onDrop}
          swapThreshold={0}
          onClone={(evt) => {
            const index = evt.oldIndex;
            if (index === undefined) return;
            const item = serversAndFolders()[index];
            if (item?.type === "folder") {
              console.log("hmm");
              setDraggingId(null);
              return;
            }
            setDraggingId(item?.id || null);
          }}
          onEnd={() => {
            setDraggingId(null);
            setDraggedOverId(null);
            setDraggedOverEl(null);
          }}
          invertSwap={true}
          animation={0}
          items={serversAndFolders()}
        >
          {(server) => (
            <Show
              when={server.type === "server"}
              fallback={
                <ServerFolderItem
                  folder={server as ServerFolder}
                  opened={true}
                  size={props.size}
                />
              }
            >
              <div
                onDragOver={(e) => {
                  const target = e.currentTarget;

                  setDraggedOverId(server.id);
                  setDraggedOverEl(target);
                }}
                onDragExit={() => setDraggedOverId(null)}
              >
                <Show
                  when={
                    draggingId() &&
                    draggedOverId() === server.id &&
                    isDraggedOverItem() &&
                    draggedOverId() !== draggingId()
                  }
                  fallback={
                    <ServerItem
                      server={server! as Server}
                      size={props.size}
                      onContextMenu={(e) => onContextMenu(e, server!.id)}
                    />
                  }
                >
                  <ServerFolderItem
                    folder={{
                      id: "new",
                      name: "New Folder",
                      serverIds: [server.id, draggingId()!],
                    }}
                    opened={false}
                    size={props.size}
                  />
                </Show>
              </div>
            </Show>
          )}
        </Sortable>
      </Show>
    </div>
  );
};

const ServerListSkeleton = (props: { size: number }) => {
  return (
    <Skeleton.List>
      <Skeleton.Item
        style={{ "aspect-ratio": "1/0.768" }}
        width={props.size + "px"}
      />
    </Skeleton.List>
  );
};

function UpdateModal(props: { close: () => void }) {
  const { latestRelease } = useAppVersion();

  const isRelease = env.APP_VERSION?.startsWith("v");

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
      <Button
        iconName="close"
        onClick={props.close}
        label="Later"
        color="var(--alert-color)"
      />
      <Button
        iconName="get_app"
        label="Update Now"
        onClick={onUpdateClick}
        primary
      />
    </FlexRow>
  );
  return (
    <LegacyModal
      title="Update Available"
      actionButtons={ActionButtons}
      close={props.close}
    >
      <FlexColumn gap={5}>
        <FlexColumn
          style={{
            "max-height": "400px",
            "max-width": "600px",
            overflow: "auto",
            padding: "10px",
          }}
        >
          <Show when={isRelease}>
            <Text size={24}>{latestRelease()?.name || ""}</Text>
            <Text opacity={0.7}>Released at {date() || ""}</Text>
            <Text opacity={0.7}>{latestRelease()?.tag_name}</Text>
            <Marked value={latestRelease()?.body!} />
          </Show>
        </FlexColumn>
      </FlexColumn>
    </LegacyModal>
  );
}
