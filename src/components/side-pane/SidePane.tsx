import styles from "./styles.module.scss";
import Icon from "@/components/ui/icon/Icon";
import Avatar from "@/components/ui/Avatar";
import RouterEndpoints from "../../common/RouterEndpoints";
import { classNames, cn, conditionalClass } from "@/common/classNames";
import ContextMenuServer from "@/components/servers/context-menu/ContextMenuServer";
import {
  createEffect,
  createMemo,
  createResource,
  createSignal,
  For,
  on,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import useStore from "../../chat-api/store/useStore";
import { A, useLocation, useParams, useMatch } from "solid-navigator";
import { FriendStatus, TicketStatus } from "../../chat-api/RawData";
import LegacyModal from "@/components/ui/legacy-modal/LegacyModal";
import { UserStatuses, userStatusDetail } from "../../common/userStatus";
import { Server } from "../../chat-api/store/useServers";
import { useCustomPortal } from "../ui/custom-portal/CustomPortal";
import { hasBit, USER_BADGES } from "@/chat-api/Bitwise";
import { updateTitleAlert } from "@/common/BrowserTitle";
import { ConnectionErrorModal } from "../connection-error-modal/ConnectionErrorModal";
import ItemContainer from "../ui/LegacyItem";
import { css, styled } from "solid-styled-components";
import { useAppVersion } from "@/common/useAppVersion";
import { useWindowProperties } from "@/common/useWindowProperties";
import { FlexColumn, FlexRow } from "../ui/Flexbox";
import Button from "../ui/Button";
import Text from "../ui/Text";
import Marked from "@/components/marked/Marked";
import { formatTimestamp } from "@/common/date";
import { Draggable } from "../ui/Draggable";
import { updateServerOrder } from "@/chat-api/services/ServerService";
import { Banner } from "../ui/Banner";
import { User, UserStatus, bannerUrl } from "@/chat-api/store/useUsers";
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
import { Tooltip } from "../ui/Tooltip";
import { logout } from "@/common/logout";
import { isExperimentEnabled, ShowExperiment } from "@/common/experiments";
import { CreateServerModal } from "./create-server-modal/CreateServerModal";
import env from "@/common/env";

const SidebarItemContainer = styled(ItemContainer)`
  align-items: center;
  justify-content: center;
  height: 50px;
  width: 60px;
`;

export default function SidePane() {
  const { createPortal } = useCustomPortal();
  const { isMobileWidth } = useWindowProperties();

  const showAddServerModal = () => {
    createPortal?.((close) => <CreateServerModal close={close} />);
  };

  return (
    <div
      class={cn(styles.sidePane, isMobileWidth() ? styles.mobile : undefined)}
    >
      <Show when={!isMobileWidth()}>
        <HomeItem />
      </Show>
      <div class={styles.scrollable}>
        <ServerList />
        <Tooltip tooltip="Create Server">
          <SidebarItemContainer onClick={showAddServerModal}>
            <Icon name="add_box" size={40} />
          </SidebarItemContainer>
        </Tooltip>
      </div>
      <UpdateItem />
      <Show when={!isMobileWidth()}>
        <ModerationItem />
        <SettingsItem />
        <UserItem />
      </Show>
    </div>
  );
}

function HomeItem() {
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
          <Icon name="home" />
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

function UpdateItem() {
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
          <Icon name="get_app" color="var(--success-color)" />
        </SidebarItemContainer>
      </Tooltip>
    </Show>
  );
}
function ModerationItem() {
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
            <Icon name="security" />
          </SidebarItemContainer>
        </A>
      </Tooltip>
    </Show>
  );
}

function SettingsItem() {
  const { tickets } = useStore();

  const selected = useMatch(() => "/app/settings/*");

  return (
    <Tooltip tooltip="Settings">
      <A href="/app/settings/account" style={{ "text-decoration": "none" }}>
        <SidebarItemContainer selected={selected()}>
          <Show when={tickets.hasTicketNotification()}>
            <NotificationCountBadge count={"!"} top={5} right={10} />
          </Show>
          <Icon name="settings" />
        </SidebarItemContainer>
      </A>
    </Tooltip>
  );
}

const UserItem = () => {
  const { account, users } = useStore();
  const { createPortal } = useCustomPortal();
  const drawer = useDrawer();
  const [hovered, setHovered] = createSignal(false);
  const [modalOpened, setModalOpened] = createSignal(false);
  const { isMobileWidth } = useWindowProperties();

  const userId = () => account.user()?.id;
  const user = () => users.get(userId()!);
  const presenceColor = () =>
    user() && userStatusDetail(user().presence()?.status || 0).color;

  const isAuthenticated = account.isAuthenticated;
  const authErrorMessage = account.authenticationError;
  const isConnected = account.isConnected;

  const isAuthenticating = () => !isAuthenticated() && isConnected();
  const showConnecting = () =>
    !authErrorMessage() && !isAuthenticated() && !isAuthenticating();

  const onClicked = () => {
    if (authErrorMessage()) {
      return createPortal?.((close) => <ConnectionErrorModal close={close} />);
    }

    if (isMobileWidth()) {
      createPortal((close) => (
        <FloatingUserModal
          close={close}
          currentDrawerPage={drawer?.currentPage()}
        />
      ));
      return;
    }

    setModalOpened(!modalOpened());
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
          class={classNames(styles.user, "sidePaneUser")}
          onclick={onClicked}
          selected={modalOpened()}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {account.user() && (
            <Avatar
              animate={hovered()}
              size={40}
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
              size={24}
            />
          )}
          {authErrorMessage() && (
            <Icon name="error" class={styles.errorIcon} size={24} />
          )}
        </SidebarItemContainer>
      </Tooltip>
      <Show when={user() && modalOpened()}>
        <FloatingUserModal
          close={() => setModalOpened(false)}
          currentDrawerPage={drawer?.currentPage()}
        />
      </Show>
    </>
  );
};

const FloatingUserModalContainer = styled(FlexColumn)<{ isMobile: boolean }>`
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

  ${(props) =>
    props.isMobile
      ? `
    left: 0;
    right: 0;
    bottom: 0;
    max-width: initial;
    width: initial;
    height: initial;
    max-height: 68%;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  `
      : ""}

  .buttonContainer .button {
    background-color: transparent;
    border: none;
    justify-content: initial;
    margin: 0;
    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
  }
`;

const BannerContainer = styled(FlexRow)`
  display: flex;
  height: 100%;
  align-items: center;
  padding: 10px;
  padding-left: 20px;
  overflow: hidden;
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

export function FloatingUserModal(props: {
  close(): void;
  currentDrawerPage?: number;
}) {
  const { account, users } = useStore();
  const { isMobileWidth, width } = useWindowProperties();
  const { openedPortals } = useCustomPortal();

  const userId = () => account.user()?.id;
  const user = () => users.get(userId()!);

  const onLogoutClick = async () => {
    logout();
  };

  onMount(() => {
    document.addEventListener("mousedown", onDocMouseDown, { capture: true });
    document.addEventListener("click", onDocClick, { capture: true });
    onCleanup(() => {
      document.removeEventListener("mousedown", onDocMouseDown, {
        capture: true,
      });
      document.removeEventListener("click", onDocClick, { capture: true });
    });
  });

  const memoIsMobileWidth = createMemo(() => isMobileWidth());

  createEffect(
    on(
      [() => props.currentDrawerPage, memoIsMobileWidth],
      () => {
        props.close();
      },
      { defer: true }
    )
  );

  let pos = { x: 0, y: 0 };
  const onDocMouseDown = (event: MouseEvent) => {
    pos = { x: event.x, y: event.y };
  };

  const onDocClick = (event: any) => {
    if (pos.x !== event.x || pos.y !== event.y) return;

    let portals = openedPortals().length;
    if (isMobileWidth()) {
      portals--;
    }

    if (portals) {
      return;
    }

    const clickedInside =
      event.target.closest(".floatingUserModalContainer") ||
      event.target.closest(".sidePaneUser");

    if (clickedInside) return;
    props.close();
  };

  return (
    <FloatingUserModalContainer
      class="floatingUserModalContainer"
      isMobile={isMobileWidth()}
      gap={5}
    >
      <Banner
        margin={0}
        radius={6}
        brightness={50}
        animate
        hexColor={user()?.hexColor}
        url={bannerUrl(user())}
      >
        <BannerContainer>
          <Avatar animate size={60} user={user()} />
          <DetailsContainer>
            <FlexRow style={{ "line-height": "1" }}>
              <Text
                style={{
                  "white-space": "nowrap",
                  overflow: "hidden",
                  "text-overflow": "ellipsis",
                }}
              >
                {user().username}
              </Text>
              <Text color="rgba(255,255,255,0.6)">:{user().tag}</Text>
            </FlexRow>
            <UserPresence animate showOffline userId={userId()!} />
          </DetailsContainer>
        </BannerContainer>
      </Banner>
      <FlexColumn
        gap={4}
        style={{ "margin-left": "4px", "margin-right": "4px" }}
      >
        <PresenceDropDown />
        <CustomStatus />
      </FlexColumn>

      <ButtonContainer class="buttonContainer">
        <CustomLink
          onclick={props.close}
          href={RouterEndpoints.PROFILE(userId()!)}
        >
          <Button
            textSize={12}
            class={customButtonStyles}
            iconSize={18}
            padding={8}
            iconName="person"
            label="View Profile"
            margin={0}
          />
        </CustomLink>

        <CustomLink onclick={props.close} href="/app/settings/account">
          <Button
            textSize={12}
            class={customButtonStyles}
            iconSize={18}
            padding={8}
            iconName="settings"
            label="Edit Profile"
            margin={0}
          />
        </CustomLink>

        <div>
          <Button
            textSize={12}
            class={customButtonStyles}
            onClick={onLogoutClick}
            iconSize={18}
            padding={8}
            iconName="logout"
            color="var(--alert-color)"
            label="Logout"
            margin={0}
          />
        </div>
      </ButtonContainer>
    </FloatingUserModalContainer>
  );
}

function CustomStatus() {
  const { account, users } = useStore();
  const [customStatus, setCustomStatus] = createSignal("");
  const [inputRef, setInputRef] = createSignal<HTMLInputElement>();

  createEffect(
    on(
      () => account.user()?.customStatus,
      (custom) => {
        setCustomStatus(custom || "");
      }
    )
  );

  const save = (event: FocusEvent) => {
    console.log(event);
    const formattedStatus = formatMessage(customStatus().trim() || "");
    updatePresence({
      custom: customStatus().trim() ? formattedStatus : null,
    });
  };

  const changes = () => {
    return (customStatus() || "") !== (account.user()?.customStatus || "");
  };

  return (
    <>
      <Text opacity={0.8}>Custom Status</Text>
      <FlexColumn>
        <AdvancedMarkupOptions
          class="advancedMarkupOptions"
          inputElement={inputRef()!}
          updateText={setCustomStatus}
        />
        <Input
          type="textarea"
          height={30}
          ref={setInputRef}
          class={styles.customStatusInput}
          placeholder=""
          onText={setCustomStatus}
          value={customStatus()}
        />
        <Show when={changes()}>
          <Button
            label="Save"
            onClick={save}
            iconName="save"
            iconSize={16}
            margin={[6, 0, 0, 0]}
          />
        </Show>
      </FlexColumn>
    </>
  );
}

function PresenceDropDown() {
  const { account, users } = useStore();
  const user = () => users.get(account.user()?.id!);

  const presenceStatus = () =>
    userStatusDetail(user()?.presence()?.status || 0);

  const DropDownItems = UserStatuses.map((item, i) => {
    return {
      circleColor: item.color,
      id: item.id,
      label: item.name === "Offline" ? "Appear As Offline" : item.name,
      index: i,
      onClick: (item: { index: number }) => {
        updatePresence({
          status: item.index,
        });
      },
    };
  });
  // move invisible to the bottom.
  DropDownItems.push(DropDownItems.shift()!);

  return (
    <DropDown
      title="Presence"
      class={styles.presenceDropdown}
      items={DropDownItems}
      selectedId={presenceStatus().id}
    />
  );
}

function ServerItem(props: {
  server: Server;
  onContextMenu?: (e: MouseEvent) => void;
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
            size={40}
            server={props.server}
          />
        </SidebarItemContainer>
      </A>
    </Tooltip>
  );
}

const ServerList = () => {
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

  const onDrop = (servers: Server[]) => {
    const serverIds = servers.map((server) => server.id);
    updateServerOrder(serverIds);
  };

  return (
    <div class={styles.serverListContainer}>
      <ContextMenuServer
        position={contextPosition()}
        onClose={() => setContextPosition(undefined)}
        serverId={contextServerId()}
      />
      <Show
        when={account.lastAuthenticatedAt()}
        fallback={<ServerListSkeleton />}
      >
        <Draggable
          onStart={() => setContextPosition(undefined)}
          class={styles.serverList}
          onDrop={onDrop}
          items={servers.orderedArray()}
        >
          {(server) => (
            <ServerItem
              server={server!}
              onContextMenu={(e) => onContextMenu(e, server!.id)}
            />
          )}
        </Draggable>
      </Show>
    </div>
  );
};

const ServerListSkeleton = () => {
  return (
    <Skeleton.List>
      <Skeleton.Item height="50px" width="60px" />
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
