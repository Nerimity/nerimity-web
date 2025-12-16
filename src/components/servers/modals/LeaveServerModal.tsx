import { onCleanup, onMount } from "solid-js";
import Text from "@/components/ui/Text";
import { css } from "solid-styled-components";
import { Modal } from "@/components/ui/modal";
import { UnescapedTrans } from "../../UnescapedTrans";
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
          <UnescapedTrans
            key="servers.leaveModal.body.part1"
            options={{ serverName: props.server?.name }}
          >
            Are you sure you want to leave <b>{props.server?.name}</b>?
          </UnescapedTrans>
          <br />
          <UnescapedTrans key="servers.leaveModal.body.part2">
            You can join back anytime!
          </UnescapedTrans>
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
