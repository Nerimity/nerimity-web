import {
  ModerationUser,
  shadowBan,
  undoShadowBan,
} from "@/chat-api/services/ModerationService";
import { createSignal, Show } from "solid-js";
import { styled } from "solid-styled-components";
import Button from "../ui/Button";
import { FlexRow } from "../ui/Flexbox";
import Input from "../ui/input/Input";
import LegacyModal from "../ui/legacy-modal/LegacyModal";
import Text from "../ui/Text";
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

export default function UndoShadowBanUserModal(props: Props) {
  const [password, setPassword] = createSignal("");
  const [error, setError] = createSignal<{
    message: string;
    path?: string;
  } | null>(null);
  const [requestSending, setRequestSending] = createSignal(false);

  const onWarnClick = () => {
    if (requestSending()) return;
    setRequestSending(true);
    setError(null);
    const userIds = [props.user.id];

    undoShadowBan(password(), userIds)
      .then(() => {
        props.done();
        props.close();
      })
      .catch((err) => setError(err))
      .finally(() => setRequestSending(false));
  };

  const ActionButtons = (
    <FlexRow
      style={{
        "justify-content": "flex-end",
        flex: 1,
        margin: "5px",
        gap: "4px",
      }}
    >
      <Button
        onClick={onWarnClick}
        margin={0}
        color="var(--warn-color)"
        label={requestSending() ? "Undoing..." : "Undo"}
        primary
      />
    </FlexRow>
  );

  return (
    <LegacyModal
      close={props.close}
      title="Undo Shadow Ban User"
      actionButtons={ActionButtons}
      ignoreBackgroundClick
    >
      <Container>
        <Input
          label="Confirm Password"
          type="password"
          value={password()}
          onText={setPassword}
        />

        <Show when={error()}>
          <Text color="var(--alert-color)" size={12}>
            {error()?.message}
          </Text>
        </Show>
      </Container>
    </LegacyModal>
  );
}
