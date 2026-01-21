import { css } from "solid-styled-components";
import { Modal } from "./modal";
import { InviteBotPopup } from "@/components/InviteBotPopup";
import { useCustomPortal } from "./custom-portal/CustomPortal";
import { t } from "@nerimity/i18lite";

export const openInviteBotModal = (
  createPortal: ReturnType<typeof useCustomPortal>["createPortal"],
  appId: string,
  permissions?: number,
) => {
  createPortal((c) => (
    <Modal.Root
      close={c}
      desktopMaxWidth={400}
      desktopClass={css`
        width: 100%;
      `}
    >
      <Modal.Header title={`${t("botInvite.title")}`} />
      <Modal.Body
        class={css`
          overflow: auto;
        `}
      >
        <InviteBotPopup appId={appId} permissions={permissions} />
      </Modal.Body>
    </Modal.Root>
  ));
};
