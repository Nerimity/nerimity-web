import style from "./styles.module.scss";

import Input from "@/components/ui/input/Input";
import { Modal } from "@/components/ui/modal";
import { useAddFriendModalController } from "./AddFriendModalController";
import { t } from "i18next";

export default function AddFriendModal(props: { close: () => void }) {
  const controller = useAddFriendModalController();

  return (
    <Modal.Root close={props.close}>
      <Modal.Header title={t("inbox.drawer.addFriend.title")} icon="group_add" />
      <Modal.Body class={style.body}>
        <div class={style.description}>
          Enter your friends username and tag to add them.
        </div>
        <Input
          placeholder={t("inbox.drawer.addFriend.placeholder")}
          error={controller.error().message}
          onText={controller.setUserTag}
          value={controller.userTag()}
          success={controller.success() && t("inbox.drawer.addFriend.requestSent")}
        />
      </Modal.Body>
      <Modal.Footer>
        <Modal.Button
          label={t("inbox.drawer.addFriend.close")}
          alert
          iconName="close"
          onClick={props.close}
        />
        <Modal.Button
          label={controller.requestSent() ? t("inbox.drawer.addFriend.sending") : t("inbox.drawer.addFriend.sendRequest")}
          primary
          iconName="add"
          onClick={controller.onSendClick}
        />
      </Modal.Footer>
    </Modal.Root>
  );
}
