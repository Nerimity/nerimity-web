import { ModerationSuspension, ModerationUser, editSuspendUsers, warnUsers } from "@/chat-api/services/ModerationService";
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
import { Notice } from "../ui/Notice/Notice";


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




interface Props {
  user: ModerationUser;
  close: () => void;
  done: () => void;
}

export default function WarnUserModal(props: Props) {
  const store = useStore();

  const [reason, setReason] = createSignal("");

  const [password, setPassword] = createSignal("");
  const [error, setError] = createSignal<{message: string, path?: string} | null>(null);
  const [requestSending, setRequestSending] = createSignal(false);

  const {createPortal} = useCustomPortal();

  const expired = () => !props.user.account.warnExpiresAt ? true : new Date(props.user.account.warnExpiresAt) < new Date();
  const warnCount = () => expired() ? 0 : props.user.account.warnCount || 0;


  

  const onWarnClick = () => {
    if (requestSending()) return;
    setRequestSending(true);
    setError(null);
    const userIds = [props.user.id];
    
    warnUsers(password(), userIds, reason())
      .then(() => {
        props.done(); 
        props.close();
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
        <Show when={warnCount() >= 2}>
          <Notice type="warn" description="This user has been warned more than 2 times. Suspension is recommended."/>
        </Show>
        <Input label="Reason" value={reason()} onText={setReason} />

        <Input label="Confirm Password" type="password" value={password()} onText={setPassword} />

        <Show when={error()}>
          <Text color="var(--alert-color)" size={12}>{error()?.message}</Text>
        </Show>
      </Container>
    </Modal>
  );
}

