import style from "./MobileBottomPane.module.scss";
import { createEffect, createSignal, Show } from "solid-js";
import { useDrawer } from "./drawer/Drawer";
import Icon from "./icon/Icon";
import ItemContainer from "./Item";
import { A, useLocation, useMatch } from "solid-navigator";
import { CustomLink } from "./CustomLink";
import useStore from "@/chat-api/store/useStore";
import RouterEndpoints from "@/common/RouterEndpoints";
import { FriendStatus } from "@/chat-api/RawData";
import { updateTitleAlert } from "@/common/BrowserTitle";
import { hasBit, USER_BADGES } from "@/chat-api/Bitwise";
import { classNames, cn } from "@/common/classNames";
import Avatar from "./Avatar";
import { userStatusDetail } from "@/common/userStatus";
import { ConnectionErrorModal } from "../connection-error-modal/ConnectionErrorModal";
import { useWindowProperties } from "@/common/useWindowProperties";
import { useCustomPortal } from "./custom-portal/CustomPortal";
import { FloatingUserModal } from "../side-pane/SidePane";

export default function MobileBottomPane() {
  const drawer = useDrawer();

  const showPane = () => drawer?.currentPage() === 0;

  return (
    <div
      class={classNames(
        "mobileBottomPane",
        style.container,
        showPane() ? style.show : undefined
      )}
    >
      <InboxItem />
      <AnchorItem
        href={RouterEndpoints.EXPLORE_SERVER("")}
        title="Explore"
        icon="explore"
      />
      <ModerationItem />
      <UserItem />
    </div>
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
  const friendRequestCount = () =>
    friends.array().filter((friend) => friend.status === FriendStatus.PENDING)
      .length;

  const count = () => notificationCount() + friendRequestCount();

  createEffect(() => {
    updateTitleAlert(count() || servers.hasNotifications() ? true : false);
  });

  return (
    <AnchorItem
      title="Inbox"
      icon="all_inbox"
      href="/app/inbox"
      notify={count() ? { count: count(), top: 3, right: 16 } : undefined}
    />
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
      <AnchorItem
        title="Mod"
        icon="security"
        href="/app/moderation/"
        selected={!!selected()}
        notify={
          tickets.hasModerationTicketNotification()
            ? { top: 3, right: 16 }
            : undefined
        }
      />
    </Show>
  );
}

interface ItemProps {
  title?: string;
  icon?: string;
  selected?: boolean;
  notify?: {
    count?: number | string;
    top: number;
    right: number;
  };
  alertCount?: number | string;
}

function Item(props: ItemProps) {
  return (
    <ItemContainer
      class={style.item}
      handlePosition="bottom"
      selected={props.selected}
    >
      <Notify notify={props.notify} />
      <Icon name={props.icon} size={22} />
      {props.title}
    </ItemContainer>
  );
}

function AnchorItem(props: ItemProps & { href: string }) {
  const selected = useMatch(() => props.href);
  return (
    <CustomLink href={props.href} class={style.anchor}>
      <Item selected={!!selected()} {...props} />
    </CustomLink>
  );
}

function Notify(props: { notify?: ItemProps["notify"] }) {
  return (
    <Show when={props.notify}>
      <div
        class={style.notify}
        style={{
          top: `${props.notify!.top}px`,
          right: `${props.notify!.right}px`,
        }}
      >
        {props.notify?.count || "!"}
      </div>
    </Show>
  );
}

function UserItem() {
  const { account, users, tickets } = useStore();
  const drawer = useDrawer();
  const { createPortal } = useCustomPortal();

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

  const onClicked = () => {
    if (authErrorMessage()) {
      return createPortal?.((close) => <ConnectionErrorModal close={close} />);
    }
    if (!user()) return;

    createPortal((close) => (
      <div class={style.userModal}>
        <FloatingUserModal
          close={close}
          currentDrawerPage={drawer?.currentPage()}
        />
      </div>
    ));
  };

  return (
    <ItemContainer
      onclick={onClicked}
      class={style.item}
      handlePosition="bottom"
    >
      <Notify
        notify={
          tickets.hasTicketNotification() ? { top: 3, right: 16 } : undefined
        }
      />
      <div class={style.user}>
        <Show when={account.user()}>
          <Avatar size={28} user={account.user()!} resize={96} />
        </Show>
        <Show when={!showConnecting()}>
          <div class={style.presence} style={{ background: presenceColor() }} />
        </Show>
        <Show when={showConnecting()}>
          <Icon
            name="autorenew"
            class={cn(
              style.connectingIcon,
              isAuthenticating() ? style.authenticatingIcon : undefined
            )}
            size={24}
          />
        </Show>
        <Show when={authErrorMessage()}>
          <Icon name="error" class={style.errorIcon} size={24} />
        </Show>
      </div>
      Me
    </ItemContainer>
  );
}
