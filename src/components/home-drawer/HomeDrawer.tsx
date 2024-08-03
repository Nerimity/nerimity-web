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
import InboxDrawerFriendItem from "../inbox/drawer/friends/friend-item/InboxDrawerFriendItem";
import { Friend } from "@/chat-api/store/useFriends";
import { User } from "@/chat-api/store/useUsers";
import LegacyModal from "../ui/legacy-modal/LegacyModal";

export default function HomeDrawer() {
  return (
    <HomeDrawerControllerProvider>
      <div class={style.container}>
        <Items />
        <Friends />
        <Inbox />
      </div>
    </HomeDrawerControllerProvider>
  );
}

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
      <Item
        label={t("inbox.drawer.savedNotesButton")}
        icon="note_alt"
        onClick={controller?.inbox.openSavedNotes}
        selected={controller?.inbox.isSavedNotesOpened()}
      />
      <Item
        label="Blocked Users"
        icon="block"
        onClick={controller?.friends.showBlockedUsersModal}
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
      <ItemContainer class={style.item} selected={props.selected || selected()}>
        <Icon name={props.icon} size={18} />
        {props.label}
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
      <div class={style.separator} />
      <AddFriendButton />
    </div>
  );
}

const FriendOfflineHeader = () => {
  const controller = useHomeDrawerController();

  return (
    <div class={style.header}>
      <div>{controller?.friends?.offlineFriends().length} Offline Friends</div>
    </div>
  );
};
const OnlineFriendsHeader = () => {
  const controller = useHomeDrawerController();

  return (
    <div class={style.header}>
      <div>{controller?.friends?.onlineFriends().length} Online Friends</div>
      <CustomLink decoration onclick={controller?.friends.toggleViewAllFriends}>
        View All
      </CustomLink>
    </div>
  );
};
const FriendRequestsHeader = () => {
  const controller = useHomeDrawerController();

  return (
    <div class={style.header}>
      <div>{controller?.friends?.friendRequests().length} Friend Requests</div>
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
          <InboxDrawerFriendItem
            isInboxTab={props.inbox}
            friend={props.friends ? (friend as Friend) : undefined}
            user={props.users ? (friend as User) : undefined}
          />
        )}
      </For>
    </div>
  );
};

const AddFriendButton = () => {
  const controller = useHomeDrawerController();

  return (
    <div
      onClick={controller?.friends?.showAddFriendModel}
      class={style.addFriend}
    >
      <Icon name="group_add" size={18} />
      Add Friend
    </div>
  );
};

const Inbox = () => {
  const controller = useHomeDrawerController();

  return (
    <div class={style.inbox}>
      <div class={style.header}>Inbox</div>
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
    <LegacyModal
      title="Blocked Users"
      close={props.close}
      maxWidth={500}
      class={style.blockedUsersModal}
    >
      <div class={style.blockedUsersList}>
        <For each={controller?.friends.blockedUsers()}>
          {(user) => <InboxDrawerFriendItem friend={user} />}
        </For>
      </div>
    </LegacyModal>
  );
};
