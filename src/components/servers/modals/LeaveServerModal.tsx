import { onCleanup, onMount } from "solid-js";
import Text from "@/components/ui/Text";
import { css } from "solid-styled-components";
import { Modal } from "@/components/ui/modal";
import { t } from "@nerimity/i18lite";

const bodyContainerStyles = css`
  overflow: auto;
  max-height: 600px;
`;

export default function LeaveServerModal(props: {
  server: any;
  close: () => void;
}) {
  const onLeaveClick = async () => {
    props.close();
    await props.server.leave();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onLeaveClick();
    }
  };

  onMount(() => {
    document.addEventListener("keydown", onKeyDown);
    onCleanup(() => {
      document.removeEventListener("keydown", onKeyDown);
    });
  });

  return (
    <Modal.Root desktopMaxWidth={600} desktopMinWidth={400} close={props.close}>
      <Modal.Header title={t("servers.leaveModal.title")} icon="home" />

      <Modal.Body class={bodyContainerStyles}>
        <Text size={14}>
          {t("servers.leaveModal.bodyPart1")} <b>{props.server.name}</b>
          <br />
          {t("servers.leaveModal.bodyPart2")}
        </Text>
      </Modal.Body>

      <Modal.Footer>
        <Modal.Button
          label={t("servers.leaveModal.cancelButton")}
          onClick={props.close}
          iconName="close"
        />

        <Modal.Button
          primary
          label={t("servers.leaveModal.confirmButton")}
          onClick={onLeaveClick}
          iconName="logout"
          color="var(--alert-color)"
        />
      </Modal.Footer>
    </Modal.Root>
  );
}
