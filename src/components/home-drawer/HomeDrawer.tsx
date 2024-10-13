import { useLocation, useMatch } from "solid-navigator";
import ItemContainer from "../ui/Item";
import style from "./HomeDrawer.module.scss";
import Icon from "../ui/icon/Icon";
import { t } from "i18next";
import { CustomLink } from "../ui/CustomLink";
import {
  HomeDrawerControllerProvider,
  useHomeDrawerController,
} from "./useHomeDrawerController";
import { createEffect, For, on, Show } from "solid-js";
import HomeDrawerFriendItem from "./friend-item/HomeDrawerFriendItem";
import { Friend } from "@/chat-api/store/useFriends";
import { User } from "@/chat-api/store/useUsers";
import { Modal } from "../ui/modal";
import { cn } from "@/common/classNames";
import { DrawerHeader } from "../drawer-header/DrawerHeader";
import { isExperimentEnabled } from "@/common/experiments";
import { useCustomPortal } from "../ui/custom-portal/CustomPortal";
import { QuickTravel } from "../QuickTravel";
import InVoiceActions from "../InVoiceActions";

export default function HomeDrawer() {
  return (
    <HomeDrawerControllerProvider>
      <div class={style.container}>
        <SearchBar />
        <HorizontalItems />

        <Items />
        <Friends />
        <Inbox />
      </div>
      <InVoiceActions />
    </HomeDrawerControllerProvider>
  );
}

const SearchBar = () => {
  const { createPortal } = useCustomPortal();
  const onClick = () => {
    createPortal?.((close) => <QuickTravel close={close} />, "quick-travel");
  };
  return (
    <DrawerHeader class={style.searchBarOuter}>
      <div onClick={onClick} class={style.searchBar}>
        <Icon name="search" size={18} />
        {t("inbox.drawer.searchBarPlaceholder")} (Ctrl + Space)
      </div>
    </DrawerHeader>
  );
};

const HorizontalItems = () => {
  const controller = useHomeDrawerController();

  return (
    <div class={style.horizontalItems}>
      <HorizontalItem
        icon="note_alt"
        name={t("inbox.drawer.notes")}
        selected={controller?.inbox.isSavedNotesOpened()}
        onClick={controller?.inbox.openSavedNotes}
      />
      <HorizontalItem
        icon="person_add"
        name={t("inbox.drawer.addFriendButton")}
        onClick={controller?.friends.showAddFriendModel}
      />
      <HorizontalItem
        icon="block"
        name={t("inbox.drawer.blockedUsersButton")}
        onClick={controller?.friends.showBlockedUsersModal}
      />
    </div>
  );
};

const HorizontalItem = (props: {
  icon: string;
  name: string;
  selected?: boolean;
  href?: string;
  onClick?: () => void;
}) => {
  return (
    <CustomLink
      href={props.href}
      class={cn(style.horizontalItem, props.selected && style.selected)}
      onClick={props.onClick}
    >
      <Icon name={props.icon} size={18} />
      <span>{props.name}</span>
    </CustomLink>
  );
};

const Items = () => {
  const controller = useHomeDrawerController();

  return (
    <div class={style.items}>
      <Item label={t("dashboard.title")} icon="dashboard" href="/app" />
      <Item
        label={t("explore.drawer.title")}
        icon="explore"
        href="/app/explore/servers"
      />
    </div>
  );
};

interface ItemProps {
  label: string;
  href?: string;
  icon?: string;
  match?: string;
  selected?: boolean;
  onClick?: () => void;
}

function Item(props: ItemProps) {
  const selected = useMatch(() => props.match || props.href || "");

  return (
    <CustomLink href={props.href} onClick={props.onClick}>
      <ItemContainer
        class={cn(style.item, (selected() || props.selected) && style.selected)}
        selected={props.selected || selected()}
      >
        <Icon name={props.icon} size={18} />
        <div class={style.label}>{props.label}</div>
      </ItemContainer>
    </CustomLink>
  );
}

function Friends() {
  const controller = useHomeDrawerController();

  const onlineFriends = () => {
    if (controller?.friends.viewAllFriends()) {
      return controller?.friends?.onlineFriends();
    }
    return controller?.friends?.topThreeFriends();
  };
  const showOfflineFriends = () => {
    if (controller?.friends.viewAllFriends()) {
      return controller?.friends?.hasOfflineFriends();
    }
    return false;
  };

  return (
    <div class={style.friends}>
      <Show when={controller?.friends?.hasFriendRequests()}>
        <FriendRequestsHeader />
        <FriendsList friends={controller?.friends?.friendRequests()} />
      </Show>
      <OnlineFriendsHeader />
      <FriendsList friends={onlineFriends()} />
      <Show when={showOfflineFriends()}>
        <FriendOfflineHeader />
        <FriendsList friends={controller?.friends?.offlineFriends()} />
      </Show>
    </div>
  );
}

const FriendOfflineHeader = () => {
  const controller = useHomeDrawerController();

  return (
    <div class={style.header}>
      <div>
        {t("inbox.drawer.offlineFriends", {
          count: controller?.friends?.offlineFriends().length,
        })}
      </div>
    </div>
  );
};
const OnlineFriendsHeader = () => {
  const controller = useHomeDrawerController();

  return (
    <div class={style.header}>
      {t("inbox.drawer.onlineFriends", {
        count: controller?.friends?.offlineFriends().length,
      })}
      <CustomLink decoration onclick={controller?.friends.toggleViewAllFriends}>
        {t("inbox.drawer.viewAll")}
      </CustomLink>
    </div>
  );
};
const FriendRequestsHeader = () => {
  const controller = useHomeDrawerController();

  return (
    <div class={style.header}>
      <div>
        {t("inbox.drawer.friendRequests", {
          count: controller?.friends?.friendRequests().length,
        })}
      </div>
    </div>
  );
};

const FriendsList = (props: {
  friends?: Friend[];
  users?: User[];
  inbox?: boolean;
}) => {
  return (
    <div class={style.friendsList}>
      <For each={props.friends || props.users!}>
        {(friend) => (
          <HomeDrawerFriendItem
            isInboxTab={props.inbox}
            friend={props.friends ? (friend as Friend) : undefined}
            user={props.users ? (friend as User) : undefined}
          />
        )}
      </For>
    </div>
  );
};

const Inbox = () => {
  const controller = useHomeDrawerController();

  return (
    <div class={style.inbox}>
      <div class={style.header}>{t("inbox.drawer.inboxTitle")}</div>
      <FriendsList users={controller?.inbox?.inboxUsers()} inbox />
    </div>
  );
};

export const BlockedUsersModal = (props: { close: () => void }) => {
  const controller = useHomeDrawerController();
  const location = useLocation();

  createEffect(
    on(
      () => location.pathname,
      () => {
        props.close();
      },
      { defer: true }
    )
  );

  return (
    <Modal.Root close={props.close} class={style.blockedUsersModal}>
      <Modal.Header title="Blocked Users" icon="block" />
      <Modal.Body>
        <div class={style.blockedUsersList}>
          <For each={controller?.friends.blockedUsers()}>
            {(user) => <HomeDrawerFriendItem friend={user} />}
          </For>
        </div>
      </Modal.Body>
    </Modal.Root>
  );
};
