import { createSignal } from "solid-js";
import Checkbox from "../ui/Checkbox";
import { Modal } from "../ui/modal";
import { logout } from "@/common/logout";

export const LogoutModal = (props: { close: () => void }) => {
  const [clearLocalSettings, setClearLocalSettings] = createSignal(true);
  return (
    <Modal.Root close={props.close}>
      <Modal.Header title="Logout?" icon="logout" alert />
      <Modal.Body>Are you sure you want to logout?</Modal.Body>
      <Checkbox
        label="Clear Local Settings"
        checked={clearLocalSettings()}
        onChange={setClearLocalSettings}
      />
      <Modal.Footer>
        <Modal.Button
          label="Don't Logout"
          onClick={props.close}
          type="hover_border"
          iconName="close"
        />
        <Modal.Button
          primary
          label="Logout"
          iconName="logout"
          alert
          onClick={() => logout(undefined, !clearLocalSettings())}
        />
      </Modal.Footer>
    </Modal.Root>
  );
};
