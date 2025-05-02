import { Modal } from "@/components/ui/modal";
import style from "./CreateServerModal.module.scss";
import Input from "@/components/ui/input/Input";
import { useCreateServerModalController } from "./useCreateServerModalController";
import { Notice } from "@/components/ui/Notice/Notice";
import { t } from "i18next";

export function CreateServerModal(props: { close: () => void }) {
  const controller = useCreateServerModalController(props);

  return (
    <Modal.Root close={props.close} class={style.modalRoot}>
      <Modal.Header title={t("createServerModal.title")} icon="dns" />
      <Modal.Body class={style.modalBody}>
        <Notice
          type="warn"
          description={[
            t("createServerModal.notice"),
            "Server MUST be in English.",
          ]}
        />
        <Input
          label={t("createServerModal.serverName")}
          onText={controller.setName}
          value={controller.name()}
          error={controller.error().message}
          placeholder={t("createServerModal.placeholder")}
        />
      </Modal.Body>
      <Modal.Footer>
        <Modal.Button
          label={t("createServerModal.closeButton")}
          alert
          iconName="close"
          onClick={props.close}
        />
        <Modal.Button
          label={
            controller.requestSent()
              ? t("createServerModal.creating")
              : t("createServerModal.createServerButton")
          }
          iconName="add"
          primary
          onClick={controller.onCreateClick}
        />
      </Modal.Footer>
    </Modal.Root>
  );
}
