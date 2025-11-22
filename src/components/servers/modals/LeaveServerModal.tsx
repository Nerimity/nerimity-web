import { onCleanup, onMount } from "solid-js";
import Text from "@/components/ui/Text";
import { css } from "solid-styled-components";
import { Modal } from "@/components/ui/modal";

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
    <Modal.Root
      desktopMaxWidth={600}
      desktopMinWidth={400}
      close={props.close}
    >
      <Modal.Header title="Leave Server?" icon="home" />

      <Modal.Body class={bodyContainerStyles}>
        <Text size={14}>
          Are you sure you want to leave <b>{props.server.name}</b>?
          <br />
          You can join back anytime! 
        </Text>
      </Modal.Body>

      <Modal.Footer>
        <Modal.Button
          label="Don't Leave"
          onClick={props.close}
          iconName="close"
        />

        <Modal.Button
          primary
          label="Leave"
          onClick={onLeaveClick}
          iconName="logout"
          color="var(--alert-color)"
        />
      </Modal.Footer>
    </Modal.Root>
  );
}
