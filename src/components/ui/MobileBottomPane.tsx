import style from "./MobileBottomPane.module.scss";
import { createEffect, Show } from "solid-js";
import { useDrawer } from "./drawer/Drawer";
import Icon from "./icon/Icon";
import ItemContainer from "./LegacyItem";
import { useLocation, useMatch } from "solid-navigator";
import { CustomLink } from "./CustomLink";
import useStore from "@/chat-api/store/useStore";
import RouterEndpoints from "@/common/RouterEndpoints";
import { FriendStatus } from "@/chat-api/RawData";
import { updateTitleAlert } from "@/common/BrowserTitle";
import { classNames, cn } from "@/common/classNames";
import Avatar from "./Avatar";
import { userStatusDetail } from "@/common/userStatus";
import { ConnectionErrorModal } from "../connection-error-modal/ConnectionErrorModal";
import { useCustomPortal } from "./custom-portal/CustomPortal";
import { useReminders } from "../useReminders";
import { useTransContext } from "@nerimity/solid-i18lite";

export default function MobileBottomPane() {
  const drawer = useDrawer();

  const showPane = () => drawer?.currentPage() === 0;

  return (
    <div
      class={classNames(
        "mobileBottomPane",
        style.container,
        showPane() ? style.show : undefined,
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
  const { inbox, friends, servers, mentions } = useStore();
  const [t] = useTransContext();
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
        : false,
      count() + mentions.count(),
    );
  });

  return (
    <AnchorItem
      selected={isSelected()}
      title={t("sidePane.homeShort")}
      icon="home"
      href="/app"
      notify={count() ? { count: count(), top: 3, right: 16 } : undefined}
    />
  );
}
function SettingsItem() {
  const { tickets } = useStore();
  const [t] = useTransContext();

  return (
    <AnchorItem
      title={t("settings.drawer.title")}
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
  const [t] = useTransContext();

  const hasModeratorPerm = () => account.hasModeratorPerm(true);

  const selected = useMatch(() => "/app/moderation/*");
  return (
    <Show when={hasModeratorPerm()}>
      <AnchorItem
        title={t("sidePane.moderationShort")}
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
  const { createPortal, createRegisteredPortal } = useCustomPortal();
  const [t] = useTransContext();

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

    createRegisteredPortal(
      "ProfileFlyout",
      {
        hideLatestPost: true,
        showProfileSettings: true,
        close: close,
        userId: userId(),
      },
      "profile-pane-flyout-" + userId(),
      true,
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
          <Avatar size={24} user={account.user()!} resize={96} />
        </Show>
        <Show when={!showConnecting()}>
          <div class={style.presence} style={{ background: presenceColor() }} />
        </Show>
        <Show when={showConnecting()}>
          <Icon
            name="autorenew"
            class={cn(
              style.connectingIcon,
              isAuthenticating() ? style.authenticatingIcon : undefined,
            )}
            size={24}
          />
        </Show>
        <Show when={authErrorMessage()}>
          <Icon name="error" class={style.errorIcon} size={24} />
        </Show>
      </div>
      {t("settings.drawer.profile")}
    </ItemContainer>
  );
}
