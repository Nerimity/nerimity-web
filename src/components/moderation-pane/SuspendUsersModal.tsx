import { RawUser } from "@/chat-api/RawData";
import { suspendUsers } from "@/chat-api/services/ModerationService";
import { createEffect, createSignal, Show } from "solid-js";
import { css, styled } from "solid-styled-components";
import Button from "../ui/Button";
import { FlexRow } from "../ui/Flexbox";
import Input from "../ui/input/Input";
import Modal from "../ui/modal/Modal";
import Text from "../ui/Text";


const SuspendUsersContainer = styled("div")`
  width: 260px;
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
}

export default function SuspendUsersModal({users, close}: Props) {
  const [reason, setReason] = createSignal("");
  const [suspendFor, setSuspendFor] = createSignal("7");
  const [password, setPassword] = createSignal("");
  const [error, setError] = createSignal<{message: string, path?: string} | null>(null);
  const [suspending, setSuspending] = createSignal(false);

  createEffect(() => {
    let round = Math.round(parseInt(suspendFor()));
    round < 0 && (round = 0);
    setSuspendFor(round.toString());
  })

  const onSuspendClicked = () => {
    if (suspending()) return;
    setSuspending(true);
    setError(null);
    const userIds = users.map(u => u.id);
    suspendUsers(password(), userIds, parseInt(suspendFor()), reason() || undefined)
      .catch(err => setError(err))
      .finally(() => setSuspending(false))
  }

  return (
    <Modal close={close} title={`Suspend ${users.length} User(s)`}>
      <SuspendUsersContainer>
        <Input label="Reason" value={reason()} onText={setReason} />
        <FlexRow gap={10}>
          <Input class={suspendInputStyle} label="Suspend for" type="number" value={suspendFor()} onText={setSuspendFor} />
          <Text style={{"margin-top": "45px"}}>Day(s)</Text>
        </FlexRow>
        <Text size={12} opacity={0.7}>0 days will suspend them indefinitely</Text>
        <Input label="Confirm Password" type="password" value={password()} onText={setPassword} />
        <Show when={error()}>
          <Text color="var(--alert-color)" size={12}>{error()?.message}</Text>
        </Show>
      </SuspendUsersContainer>
      <Button onClick={onSuspendClicked} margin={0} label={suspending() ? "Suspending..." : "Suspend"} color="var(--alert-color)" primary />
    </Modal>
  )
}