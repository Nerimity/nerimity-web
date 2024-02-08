import { createSignal, Show } from "solid-js";
import { styled } from "solid-styled-components";
import Button from "../ui/Button";
import { FlexRow } from "../ui/Flexbox";
import Input from "../ui/input/Input";
import Modal from "../ui/modal/Modal";
import Text from "../ui/Text";
import { deleteServer } from "@/chat-api/services/ModerationService";

const DeleteServerModalContainer = styled("div")`
  min-width: 260px;
  margin-bottom: 10px;
`;

interface Props {
  serverId: string;
  close: () => void;
  done: () => void;
}

export default function DeleteServerModal(props: Props) {
  const [password, setPassword] = createSignal("");
  const [error, setError] = createSignal<{message: string, path?: string} | null>(null);
  const [deleting, setDeleting] = createSignal(false);

  const onDeleteClick = () => {
    if (deleting()) return;
    setDeleting(true);
    setError(null);

    deleteServer(props.serverId, password())
      .then(() => {props.done(); props.close();})
      .catch(err => setError(err))
      .finally(() => setDeleting(false))
  }

  const ActionButtons = (
    <FlexRow style={{"justify-content": "flex-end", flex: 1, margin: "5px" }}>
      <Button onClick={onDeleteClick} margin={0} label={deleting() ? "Deleting..." : "Delete"} color="var(--alert-color)" primary />
    </FlexRow>
  )

  return (
    <Modal close={props.close} title="Delete Server" actionButtons={ActionButtons}>
      <DeleteServerModalContainer>
        <Input label="Confirm Password" type="password" value={password()} onText={setPassword} />
        <Show when={error()}>
          <Text color="var(--alert-color)" size={12}>{error()?.message}</Text>
        </Show>
      </DeleteServerModalContainer>
    </Modal>
  )
}

