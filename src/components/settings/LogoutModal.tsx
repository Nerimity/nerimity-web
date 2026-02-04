import { createSignal } from "solid-js";
import Checkbox from "../ui/Checkbox";
import { Modal } from "../ui/modal";
import { logout } from "@/common/logout";
import { t } from "@nerimity/i18lite";

export const LogoutModal = (props: { close: () => void }) => {
  const [clearLocalSettings, setClearLocalSettings] = createSignal(true);
  return (
    <Modal.Root close={props.close}>
      <Modal.Header title={t("logoutModal.title")} icon="logout" alert />
      <Modal.Body>{t("logoutModal.body")}</Modal.Body>
      <Checkbox
        label={t("logoutModal.clearSettings")}
        checked={clearLocalSettings()}
        onChange={setClearLocalSettings}
      />
      <Modal.Footer>
        <Modal.Button
          label={t("logoutModal.cancelButton")}
          onClick={props.close}
          iconName="close"
        />
        <Modal.Button
          primary
          label={t("header.logoutButton")}
          iconName="logout"
          alert
          onClick={() => logout(undefined, !clearLocalSettings())}
        />
      </Modal.Footer>
    </Modal.Root>
  );
};
