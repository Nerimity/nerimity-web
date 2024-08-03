import { deleteMessage } from "@/chat-api/services/MessageService";
import { Message } from "@/chat-api/store/useMessages";
import Button from "@/components/ui/Button";
import { FlexColumn, FlexRow } from "@/components/ui/Flexbox";
import Text from "@/components/ui/Text";
import LegacyModal from "@/components/ui/legacy-modal/LegacyModal";
import { onCleanup, onMount } from "solid-js";
import { css, styled } from "solid-styled-components";
import MessageItem from "../message-item/MessageItem";

const DeleteMessageModalContainer = styled(FlexColumn)`
  overflow: auto;
  max-height: 200px;
  padding-left: 8px;
  padding-right: 8px;
  gap: 6px;
`;
const deleteMessageItemContainerStyles = css`
  padding-top: 5px;
  border-radius: 8px;
  margin-top: 5px;

  pointer-events: none;

  && {
    padding: 0;
    padding-top: 2px;
    padding-bottom: 2px;
  }
`;

const deleteMessageModalStyles = css`
  max-height: 800px;
  overflow: hidden;
`;

export default function DeleteMessageModal(props: {
  instant?: boolean;
  message: Message;
  close: () => void;
}) {
  const onDeleteClick = () => {
    props.close();
    deleteMessage({
      channelId: props.message.channelId,
      messageId: props.message.id,
    });
  };

  if (props.instant) {
    onDeleteClick();
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onDeleteClick();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      props.close();
    }
  };

  onMount(() => {
    document.addEventListener("keydown", onKeyDown);
    onCleanup(() => {
      document.removeEventListener("keydown", onKeyDown);
    });
  });

  return (
    <LegacyModal
      actionButtonsArr={[
        { label: "Don't Delete", onClick: props.close, iconName: "close" },
        {
          primary: true,
          label: "Delete",
          onClick: onDeleteClick,
          iconName: "delete",
          color: "var(--alert-color)",
        },
      ]}
      color="var(--alert-color)"
      close={props.close}
      title="Delete Message?"
      icon="delete"
      class={deleteMessageModalStyles}
      maxWidth={500}
    >
      <DeleteMessageModalContainer>
        <Text size={14}>Would you like to delete this message?</Text>
        <MessageItem
          class={deleteMessageItemContainerStyles}
          hideFloating
          message={props.message}
        />
      </DeleteMessageModalContainer>
    </LegacyModal>
  );
}
