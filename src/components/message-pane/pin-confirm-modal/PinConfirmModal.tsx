import { pinMessage, unpinMessage } from "@/chat-api/services/MessageService";
import { Message } from "@/chat-api/store/useMessages";
import Text from "@/components/ui/Text";
import { onCleanup, onMount } from "solid-js";
import { css } from "solid-styled-components";
import MessageItem from "../message-item/MessageItem";
import { Modal } from "@/components/ui/modal";

const bodyContainerStyles = css`
  overflow: auto;
  max-height: 600px;
`;
const messageItemStyles = css`
  padding-top: 5px;
  border-radius: 8px;
  margin-top: 5px;

  pointer-events: none;

  && {
    padding: 10px;
    border: solid 1px rgba(255, 255, 255, 0.1);
  }
`;

const modalStyles = css`
  max-height: 800px;
  overflow: hidden;
`;

export default function PinMessageModal(props: {
  instant?: boolean;
  message: Message;
  close: () => void;
}) {
  const onPinClick = () => {
    props.close();

    if (props.message.pinned) {
      unpinMessage(props.message.channelId, props.message.id);
      return;
    }

    pinMessage(props.message.channelId, props.message.id);
  };

  if (props.instant) {
    onPinClick();
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onPinClick();
    }
  };

  onMount(() => {
    document.addEventListener("keydown", onKeyDown);
    onCleanup(() => {
      document.removeEventListener("keydown", onKeyDown);
    });
  });

  const isPinned = props.message.pinned;

  return (
    <Modal.Root
      desktopMaxWidth={600}
      desktopMinWidth={400}
      close={props.close}
      class={modalStyles}
    >
      <Modal.Header
        title={isPinned ? "Unpin Message?" : "Pin Message?"}
        icon="keep"
      />
      <Modal.Body class={bodyContainerStyles}>
        <Text size={14}>
          {isPinned
            ? "Would you like to unpin this message?"
            : "Would you like to pin this message?"}
        </Text>

        <MessageItem
          class={messageItemStyles}
          hideFloating
          message={props.message}
        />
      </Modal.Body>

      <Modal.Footer>
        <Modal.Button
          label={isPinned ? "Don't Unpin" : "Don't Pin"}
          onClick={props.close}
          iconName="close"
        />

        <Modal.Button
          primary
          label={isPinned ? "Unpin" : "Pin"}
          onClick={onPinClick}
          iconName="keep"
          color="var(--alert-color)"
        />
      </Modal.Footer>
    </Modal.Root>
  );
}
