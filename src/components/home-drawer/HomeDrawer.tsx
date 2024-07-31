import { useMatch } from "solid-navigator";
import ItemContainer from "../ui/Item";
import style from "./HomeDrawer.module.scss";
import Icon from "../ui/icon/Icon";
import { t } from "i18next";
import { CustomLink } from "../ui/CustomLink";
import {
  HomeDrawerControllerProvider,
  useHomeDrawerController,
} from "./useHomeDrawerController";
import { For } from "solid-js";
import InboxDrawerFriendItem from "../inbox/drawer/friends/friend-item/InboxDrawerFriendItem";

export default function HomeDrawer() {
  return (
    <HomeDrawerControllerProvider>
      <div class={style.container}>
        <Items />
        <OnlineFriends />
      </div>
    </HomeDrawerControllerProvider>
  );
}

function OnlineFriends() {
  return (
    <div class={style.onlineFriends}>
      <OnlineFriendsHeader />
      <OnlineFriendsList />
      <AddFriendButton />
    </div>
  );
}

const OnlineFriendsHeader = () => {
  const controller = useHomeDrawerController();

  return (
    <div class={style.header}>
      <div>{controller.onlineFriends().length} Online Friends</div>
      <CustomLink decoration href="#" onclick={() => alert("TODO")}>
        View All
      </CustomLink>
    </div>
  );
};

const OnlineFriendsList = () => {
  const controller = useHomeDrawerController();
  return (
    <div class={style.friends}>
      <For each={controller.onlineFriends()}>
        {(friend) => <InboxDrawerFriendItem friend={friend} />}
      </For>
    </div>
  );
};

const AddFriendButton = () => {
  const controller = useHomeDrawerController();

  return (
    <div onClick={controller.showAddFriendModel} class={style.addFriend}>
      <Icon name="group_add" size={18} />
      Add Friend
    </div>
  );
};

const Items = () => {
  return (
    <div class={style.items}>
      <Item label={t("dashboard.title")} icon="dashboard" href="/app" />
      <Item
        label={t("explore.drawer.title")}
        icon="explore"
        href="/app/explore"
      />
    </div>
  );
};

interface ItemProps {
  label: string;
  href: string;
  icon?: string;
  match?: string;
}

function Item(props: ItemProps) {
  const selected = useMatch(() => props.match || props.href);

  return (
    <CustomLink href={props.href}>
      <ItemContainer class={style.item} selected={selected()}>
        <Icon name={props.icon} size={18} />
        {props.label}
      </ItemContainer>
    </CustomLink>
  );
}
