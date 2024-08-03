import { Modal } from "@/components/ui/modal";
import style from "./CreateServerModal.module.scss";
import Input from "@/components/ui/input/Input";
import { useCreateServerModalController } from "./useCreateServerModalController";
import { Notice } from "@/components/ui/Notice/Notice";

export function CreateServerModal(props: { close: () => void }) {
  const controller = useCreateServerModalController(props);

  return (
    <Modal.Root close={props.close} class={style.modalRoot}>
      <Modal.Header title="Create Server" icon="dns" />
      <Modal.Body class={style.modalBody}>
        <Notice type="warn" description="NSFW content is not allowed." />
        <Input
          label="Server Name"
          onText={controller.setName}
          value={controller.name()}
          error={controller.error().message}
          placeholder="My Amazing Server"
        />
      </Modal.Body>
      <Modal.Footer>
        <Modal.Button
          label="Close"
          alert
          iconName="close"
          onClick={props.close}
        />
        <Modal.Button
          label={controller.requestSent() ? "Creating..." : "Create Server"}
          iconName="add"
          primary
          onClick={controller.onCreateClick}
        />
      </Modal.Footer>
    </Modal.Root>
  );
}
