import style from "./MobileBottomPane.module.scss";
import { createSignal, JSX, Show } from "solid-js";
import { useDrawer } from "./drawer/Drawer";
import Icon from "./icon/Icon";
import ItemContainer from "./LegacyItem";
import { useLocation, useMatch } from "solid-navigator";
import { CustomLink } from "./CustomLink";
import useStore from "@/chat-api/store/useStore";
import RouterEndpoints from "@/common/RouterEndpoints";
import { FriendStatus } from "@/chat-api/RawData";

import { classNames, cn } from "@/common/classNames";
import Avatar from "./Avatar";
import { userStatusDetail } from "@/common/userStatus";
import { ConnectionErrorModal } from "../connection-error-modal/ConnectionErrorModal";
import { useCustomPortal } from "./custom-portal/CustomPortal";

import { useTransContext } from "@nerimity/solid-i18lite";
import { LogoMono } from "../../LogoMono";
import {
  SideBarHomeContextMenu,
  sideHomeIcon
} from "../side-pane/SideBarHomeContextMenu";

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
  const { friends } = useStore();
  const [t] = useTransContext();
  const [contextPos, setContextPos] = createSignal<{ x: number; y: number }>();

  const location = useLocation();
  const isSelected = () => {
    if (location.pathname === "/app") return true;
    if (location.pathname.startsWith(RouterEndpoints.INBOX())) return true;
    if (location.pathname.startsWith("/app/posts")) return true;
    return false;
  };

  const friendRequestCount = () =>
    friends.array().filter((friend) => friend.status === FriendStatus.PENDING)
      .length;

  const count = () => friendRequestCount();

  return (
    <>
      <AnchorItem
        class={style.homeItem}
        selected={isSelected()}
        title={t("sidePane.homeShort")}
        onContextMenu={(e) => {
          e.preventDefault();
          setContextPos({ x: e.clientX, y: e.clientY });
        }}
        icon={
          sideHomeIcon() === "default" ? (
            <div class={cn(style.homeLogo, isSelected() && style.selected)}>
              <LogoMono />
            </div>
          ) : (
            "home"
          )
        }
        href="/app"
        notify={count() ? { count: count(), top: 3, right: 16 } : undefined}
      />
      <Show when={contextPos()}>
        <SideBarHomeContextMenu
          position={contextPos()}
          onClose={() => setContextPos(undefined)}
        />
      </Show>
    </>
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
            ? {
                top: 3,
                right: 16,
                count: tickets.hasModerationTicketNotification()
              }
            : undefined
        }
      />
    </Show>
  );
}

interface ItemProps {
  title?: string;
  icon?: string | JSX.Element;
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
      <Show when={typeof props.icon === "string"}>
        <Icon name={props.icon as string} size={22} />
      </Show>
      <Show when={typeof props.icon === "object" && props.icon !== null}>
        {props.icon}
      </Show>
      {props.title}
    </ItemContainer>
  );
}

function AnchorItem(
  props: ItemProps & {
    href: string;
    class?: string;
    onContextMenu?: (e: MouseEvent) => void;
  }
) {
  const selected = useMatch(() => props.href);
  return (
    <CustomLink
      onContextMenu={props.onContextMenu}
      href={props.href}
      class={cn(style.anchor, props.class)}
    >
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
          right: `${props.notify!.right}px`
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
        userId: userId()
      },
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
              isAuthenticating() ? style.authenticatingIcon : undefined
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
