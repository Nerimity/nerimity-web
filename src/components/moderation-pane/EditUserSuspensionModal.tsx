import { RawUser } from "@/chat-api/RawData";
import { ModerationSuspension, editSuspendUsers, suspendUsers } from "@/chat-api/services/ModerationService";
import { createEffect, createSignal, For, Show } from "solid-js";
import { css, styled } from "solid-styled-components";
import Button from "../ui/Button";
import { FlexRow } from "../ui/Flexbox";
import Input from "../ui/input/Input";
import Modal from "../ui/modal/Modal";
import Text from "../ui/Text";
import useStore from "@/chat-api/store/useStore";
import { useCustomPortal } from "../ui/custom-portal/CustomPortal";
import { ConnectionErrorModal } from "../connection-error-modal/ConnectionErrorModal";
import { createUpdatedSignal } from "@/common/createUpdatedSignal";


const SuspendUsersContainer = styled("div")`
  min-width: 260px;
  margin-bottom: 10px;
  padding-left: 8px;
  padding-right: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  overflow: auto;
`;

const suspendInputStyle = css`
  width: 120px; 
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
  suspension: ModerationSuspension; 
}

export default function EditUserSuspensionModal(props: Props) {
  const store = useStore();

  const defaultInput = () => ({
    reason: props.suspension.reason || "",
    suspendFor: dateToDays(props.suspension.expireAt!).toString() || "0"
  });

  const [inputValues, updatedInputValues, setInputValue] = createUpdatedSignal(defaultInput);

  const [password, setPassword] = createSignal("");
  const [error, setError] = createSignal<{message: string, path?: string} | null>(null);
  const [suspending, setSuspending] = createSignal(false);

  const {createPortal} = useCustomPortal();

  


  createEffect(() => {
    let round = Math.round(parseInt(inputValues().suspendFor));
    round < 0 && (round = 0);
    setInputValue("suspendFor", round.toString());
  });


  const onSuspendClicked = () => {
    if (suspending()) return;
    setSuspending(true);
    setError(null);
    const userIds = [props.user.id];
    
    const intSuspendFor = parseInt(inputValues().suspendFor);

    const preview: ModerationSuspension = {
      expireAt: intSuspendFor ? daysToDate(intSuspendFor) : null,
      suspendedAt: Date.now(),
      reason: inputValues().reason || undefined,
      suspendBy: props.suspension.suspendBy
    };

    const update = {
      ...(updatedInputValues().suspendFor ? {days: intSuspendFor}: {}),
      ...(updatedInputValues().reason ? {reason: updatedInputValues().reason!} : {})
    };

    editSuspendUsers(password(), userIds, update)
      .then(() => {
        props.done(preview); props.close();
      })
      .catch(err => setError(err))
      .finally(() => setSuspending(false));
  };

  const onPreviewClick = () => {


    const intSuspendFor = parseInt(inputValues().suspendFor);
    const expireAt = intSuspendFor ? daysToDate(intSuspendFor) : undefined;
    const r = inputValues().reason || undefined;


    createPortal(close => <ConnectionErrorModal close={close} suspensionPreview={{expire: expireAt, reason: r, by: {username: props.suspension.suspendBy.username}}} />);
  };

  const ActionButtons = (
    <FlexRow style={{"justify-content": "flex-end", flex: 1, margin: "5px", gap: "4px" }}>

      <Button onClick={onPreviewClick} margin={0} label="Preview" />
      <Button onClick={onSuspendClicked} margin={0} label={suspending() ? "Editing..." : "Edit Suspension"} primary />
    </FlexRow>
  );



  return (
    <Modal close={props.close} title={"Edit Suspension"} actionButtons={ActionButtons} ignoreBackgroundClick>
      <SuspendUsersContainer>
        <Input label="Reason" value={inputValues().reason} onText={(t) => setInputValue("reason", t)} />
        <Input class={suspendInputStyle} label="Suspend for" type="number" value={inputValues().suspendFor} onText={(t) => setInputValue("suspendFor", t)} suffix="days" />
        <Text size={12} opacity={0.7} class={css`margin-top: -4px;`}>0 days will suspend them indefinitely</Text>

        <Input label="Confirm Password" type="password" value={password()} onText={setPassword} />

        <Show when={error()}>
          <Text color="var(--alert-color)" size={12}>{error()?.message}</Text>
        </Show>
      </SuspendUsersContainer>
    </Modal>
  );
}

function daysToDate(days: number) {
  const DAY_IN_MS = 86400000;
  const now = Date.now();
  const expireDate = new Date(now + DAY_IN_MS * days);
  return expireDate.getTime();
}

function dateToDays(date: number) {
  const DAY_IN_MS = 86400000;
  const now = Date.now();
  const expireDate = new Date(date);
  return Math.round((expireDate.getTime() - now) / DAY_IN_MS);
}