import style from "./MobileBottomPane.module.scss";
import { createEffect, createSignal, Show } from "solid-js";
import { useDrawer } from "./drawer/Drawer";
import Icon from "./icon/Icon";
import ItemContainer from "./LegacyItem";
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
import { isExperimentEnabled } from "@/common/experiments";
import { ProfileFlyout } from "../floating-profile/FloatingProfile";
import { useReminders } from "../useReminders";

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
      <HomeItem />

      <ModerationItem />
      <SettingsItem />
      <UserItem />
    </div>
  );
}

function HomeItem() {
  const { inbox, friends, servers } = useStore();
  const { hasActiveReminder } = useReminders();

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
    updateTitleAlert(
      hasActiveReminder() || count() || servers.hasNotifications()
        ? true
        : false
    );
  });

  return (
    <AnchorItem
      selected={isSelected()}
      title="Home"
      icon="home"
      href="/app"
      notify={count() ? { count: count(), top: 3, right: 16 } : undefined}
    />
  );
}
function SettingsItem() {
  const { tickets } = useStore();
  return (
    <AnchorItem
      title="Settings"
      icon="settings"
      href="/app/settings/account"
      notify={
        tickets.hasTicketNotification() ? { top: 3, right: 16 } : undefined
      }
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
  const { account, users } = useStore();
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

    createPortal(
      (close) => (
        <ProfileFlyout
          showProfileSettings
          close={close}
          userId={userId()}
          hideLatestPost
        />
      ),
      "profile-pane-flyout-" + userId(),
      true
    );
  };

  return (
    <ItemContainer
      onclick={onClicked}
      class={cn(style.item, "trigger-profile-flyout")}
      handlePosition="bottom"
    >
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
