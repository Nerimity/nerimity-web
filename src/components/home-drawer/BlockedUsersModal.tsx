import { createEffect, on, For } from "solid-js";
import { useLocation } from "solid-navigator";
import { Modal } from "../ui/modal";
import { t } from "@nerimity/i18lite";
import { useHomeDrawerController } from "./useHomeDrawerController";
import HomeDrawerFriendItem from "./friend-item/HomeDrawerFriendItem";
import style from "./HomeDrawer.module.scss";

export const BlockedUsersModal = (props: { close: () => void }) => {
  const controller = useHomeDrawerController();
  const location = useLocation();

  createEffect(
    on(
      () => location.pathname,
      () => {
        props.close();
      },
      { defer: true },
    ),
  );

  return (
    <Modal.Root close={props.close} class={style.blockedUsersModal}>
      <Modal.Header title={t("inbox.blockedUsersModal.title")} icon="block" />
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
