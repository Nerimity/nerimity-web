import { deleteMessage } from "@/chat-api/services/MessageService";
import { Message } from "@/chat-api/store/useMessages";
import Button from "@/components/ui/Button";
import { FlexColumn, FlexRow } from "@/components/ui/Flexbox";
import Text from "@/components/ui/Text";
import Modal from "@/components/ui/modal/Modal";
import { onCleanup, onMount } from "solid-js";
import { css, styled } from "solid-styled-components";
import MessageItem from "../message-item/MessageItem";



const DeleteMessageModalContainer = styled(FlexColumn)`
  overflow: auto;
  padding: 10px;
  max-height: 200px;

`;
const deleteMessageItemContainerStyles = css`
  padding-top: 5px;
  border-radius: 8px;
  margin-top: 5px;
  background-color: rgba(0,0,0,0.3);

  overflow: hidden;
  &&{
    &:hover {
      background-color: rgba(0,0,0,0.3);
    }
  }
`;

const deleteMessageModalStyles = css`
  max-height: 800px;
  overflow: hidden;
`;

export default function DeleteMessageModal(props: { instant?: boolean; message: Message, close: () => void }) {

  const onDeleteClick = () => {
    props.close();
    deleteMessage({ channelId: props.message.channelId, messageId: props.message.id });
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
      props. close();
    }
  };


  onMount(() => {
    document.addEventListener("keydown", onKeyDown);
    onCleanup(() => {
      document.removeEventListener("keydown", onKeyDown);
    });
  });



  const ActionButtons = (
    <FlexRow style={{ "justify-content": "flex-end", flex: 1, margin: "5px" }}>
      <Button onClick={props.close} iconName="close" label="Cancel" />
      <Button onClick={onDeleteClick} iconName="delete" color='var(--alert-color)' label="Delete" />
    </FlexRow>
  );

  return (
    <Modal close={props.close} title='Delete Message?' icon='delete' class={deleteMessageModalStyles} actionButtons={ActionButtons} maxWidth={500}>
      <DeleteMessageModalContainer>
        <Text>Are you sure you would like to delete this message?</Text>
        <MessageItem class={deleteMessageItemContainerStyles} hideFloating message={props.message} />
      </DeleteMessageModalContainer>
    </Modal>
  );
}


