import { RawUser } from "@/chat-api/RawData";
import { suspendUsers, unsuspendUsers } from "@/chat-api/services/ModerationService";
import { createEffect, createSignal, Show } from "solid-js";
import { css, styled } from "solid-styled-components";
import Button from "../ui/Button";
import { FlexRow } from "../ui/Flexbox";
import Input from "../ui/input/Input";
import Modal from "../ui/modal/Modal";
import Text from "../ui/Text";


const SuspendUsersContainer = styled("div")`
  min-width: 260px;
  margin-bottom: 10px;
`;

const suspendInputStyle = css`
  width: 90px; 
`;

interface MinimalUser {
  id: string;
  username: string;
  tag: string
}

interface Props {
  users: MinimalUser[];
  close: () => void;
  done: () => void;
}

export default function UnsuspendUsersModal(props: Props) {
  const [password, setPassword] = createSignal("");
  const [error, setError] = createSignal<{message: string, path?: string} | null>(null);
  const [suspending, setSuspending] = createSignal(false);


  const onUnsuspendClicked = () => {
    if (suspending()) return;
    setSuspending(true);
    setError(null);
    const userIds = props.users.map(u => u.id);
    unsuspendUsers(password(), userIds)
      .then(() => {props.done(); props.close();})
      .catch(err => setError(err))
      .finally(() => setSuspending(false))
  }

  const ActionButtons = (
    <FlexRow style={{"justify-content": "flex-end", flex: 1, margin: "5px" }}>
      <Button onClick={onUnsuspendClicked} margin={0} label={suspending() ? "Suspending..." : "Suspend"} color="var(--alert-color)" primary />
    </FlexRow>
  )



  return (
    <Modal close={props.close} title={`Unsuspend ${props.users.length} User(s)`} actionButtons={ActionButtons}>
      <SuspendUsersContainer>
        <Input label="Confirm Password" type="password" value={password()} onText={setPassword} />
        <Show when={error()}>
          <Text color="var(--alert-color)" size={12}>{error()?.message}</Text>
        </Show>
      </SuspendUsersContainer>
    </Modal>
  )
}