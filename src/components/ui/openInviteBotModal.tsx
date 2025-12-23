import { css } from "solid-styled-components";
import { Modal } from "./modal";
import { InviteBotPopup } from "@/pages/InviteServerBot";
import { useCustomPortal } from "./custom-portal/CustomPortal";

export const openInviteBotModal = (
  createPortal: ReturnType<typeof useCustomPortal>["createPortal"],
  appId: string,
  permissions?: number
) => {
  createPortal((c) => (
    <Modal.Root
      close={c}
      desktopMaxWidth={400}
      desktopClass={css`
        width: 100%;
      `}
    >
      <Modal.Body
        class={css`
          overflow: auto;
        `}
      >
        <InviteBotPopup
          appId={appId}
          permissions={permissions}
        />
      </Modal.Body>
    </Modal.Root>
  ));
};
