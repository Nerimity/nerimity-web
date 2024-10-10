import { addAnnouncePost } from "@/chat-api/services/ModerationService";
import { createSignal, Show } from "solid-js";
import { styled } from "solid-styled-components";
import Button from "../ui/Button";
import { FlexRow } from "../ui/Flexbox";
import Input from "../ui/input/Input";
import LegacyModal from "../ui/legacy-modal/LegacyModal";
import Text from "../ui/Text";

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
  postId: string;
  close: () => void;
  done: () => void;
}

export default function AnnouncePostsModal(props: Props) {
  const [password, setPassword] = createSignal("");
  const [error, setError] = createSignal<{
    message: string;
    path?: string;
  } | null>(null);
  const [requestSent, setRequestSent] = createSignal(false);

  const onDeleteClicked = () => {
    if (requestSent()) return;
    setRequestSent(true);
    setError(null);

    addAnnouncePost(password(), props.postId)
      .then(() => {
        props.done();
        props.close();
      })
      .catch((err) => setError(err))
      .finally(() => setRequestSent(false));
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
        onClick={onDeleteClicked}
        margin={0}
        label={requestSent() ? "Announcing..." : "Announce"}
        color="var(--primary-color)"
        primary
      />
    </FlexRow>
  );

  return (
    <LegacyModal
      close={props.close}
      title={"Announce Post"}
      actionButtons={ActionButtons}
      ignoreBackgroundClick
    >
      <Container>
        <Text size={14}>
          Announcing a post will show on everyone's Dashboard.
        </Text>
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
