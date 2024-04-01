import { ModerationSuspension, editSuspendUsers } from "@/chat-api/services/ModerationService";
import { createSignal, Show } from "solid-js";
import { styled } from "solid-styled-components";
import Button from "../ui/Button";
import { FlexRow } from "../ui/Flexbox";
import Input from "../ui/input/Input";
import Modal from "../ui/modal/Modal";
import Text from "../ui/Text";
import useStore from "@/chat-api/store/useStore";
import { useCustomPortal } from "../ui/custom-portal/CustomPortal";
import { ConnectionErrorModal } from "../connection-error-modal/ConnectionErrorModal";
import { WarnedModal } from "../warned-modal/WarnedModal";


const Container = styled("div")`
  min-width: 260px;
  margin-bottom: 10px;
  padding-left: 8px;
  padding-right: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  overflow: auto;
`;


interface MinimalUser {
  id: string;
  username: string;
  tag: string
}

interface Props {
  user: MinimalUser;
  close: () => void;
  done: (suspension: ModerationSuspension) => void;
}

export default function WarnUserModal(props: Props) {
  const store = useStore();

  const [reason, setReason] = createSignal("");

  const [password, setPassword] = createSignal("");
  const [error, setError] = createSignal<{message: string, path?: string} | null>(null);
  const [requestSending, setRequestSending] = createSignal(false);

  const {createPortal} = useCustomPortal();

  

  const onWarnClick = () => {
    if (requestSending()) return;
    setRequestSending(true);
    setError(null);
    const userIds = [props.user.id];
    

    const update = {
      reason: reason()
    };

    editSuspendUsers(password(), userIds, update)
      .then(() => {
        props.done(update); props.close();
      })
      .catch(err => setError(err))
      .finally(() => setRequestSending(false));
  };

  const onPreviewClick = () => {
    createPortal(close => <WarnedModal bypassCounter close={close} reason={reason()} by={{username: store.account.user()!.username}} />);
  };

  const ActionButtons = (
    <FlexRow style={{"justify-content": "flex-end", flex: 1, margin: "5px", gap: "4px" }}>

      <Button onClick={onPreviewClick} margin={0} label="Preview" />
      <Button onClick={onWarnClick} margin={0} color="var(--warn-color)" label={requestSending() ? "Warning..." : "Warn User"} primary />
    </FlexRow>
  );

  return (
    <Modal close={props.close} title="Warn User" actionButtons={ActionButtons} ignoreBackgroundClick>
      <Container>
        <Input label="Reason" value={reason()} onText={setReason} />

        <Input label="Confirm Password" type="password" value={password()} onText={setPassword} />

        <Show when={error()}>
          <Text color="var(--alert-color)" size={12}>{error()?.message}</Text>
        </Show>
      </Container>
    </Modal>
  );
}

