import style from "./styles.module.scss";
import Input from "@/components/ui/input/Input";
import { Modal } from "@/components/ui/modal";
import { useAddFriendModalController } from "./AddFriendModalController";
import { t } from "@nerimity/i18lite";

export default function AddFriendModal(props: { close: () => void }) {
  const controller = useAddFriendModalController();

  return (
    <Modal.Root close={props.close}>
      <Modal.Header title={t("addFriendModal.title")} icon="group_add" />
      <Modal.Body class={style.body}>
        <div class={style.description}>
          {t("addFriendModal.description")}
        </div>
        <Input
          placeholder={t("addFriendModal.placeholder")}
          error={controller.error().message}
          onText={controller.setUserTag}
          value={controller.userTag()}
          success={controller.success() && t("addFriendModal.requestSent")}
        />
      </Modal.Body>
      <Modal.Footer>
        <Modal.Button
          label={t("addFriendModal.closeButton")}
          alert
          iconName="close"
          onClick={props.close}
        />
        <Modal.Button
          label={
            controller.requestSent()
              ? t("addFriendModal.sending")
              : t("addFriendModal.sendRequest")
          }
          primary
          iconName="add"
          onClick={controller.onSendClick}
        />
      </Modal.Footer>
    </Modal.Root>
  );
}
