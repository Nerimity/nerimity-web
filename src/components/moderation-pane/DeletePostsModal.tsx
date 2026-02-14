import { deletePosts } from "@/chat-api/services/ModerationService";
import { createSignal, Show } from "solid-js";
import { styled } from "solid-styled-components";
import Button from "../ui/Button";
import { FlexRow } from "../ui/Flexbox";
import Input from "../ui/input/Input";
import LegacyModal from "../ui/legacy-modal/LegacyModal";
import Text from "../ui/Text";

const DeletePostsContainer = styled("div")`
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
  postIds: string[];
  close: () => void;
  done: () => void;
}

export default function DeletePostsModal(props: Props) {
  const [password, setPassword] = createSignal("");
  const [error, setError] = createSignal<{
    message: string;
    path?: string;
  } | null>(null);
  const [deleting, setDeleting] = createSignal(false);

  const onDeleteClicked = () => {
    if (deleting()) return;
    setDeleting(true);
    setError(null);

    deletePosts(password(), props.postIds)
      .then(() => {
        props.done();
        props.close();
      })
      .catch((err) => setError(err))
      .finally(() => setDeleting(false));
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
        label={deleting() ? "Deleting..." : "Delete"}
        color="var(--alert-color)"
        primary
      />
    </FlexRow>
  );

  return (
    <LegacyModal
      close={props.close}
      title={`Delete ${props.postIds.length} post(s)`}
      actionButtons={ActionButtons}
      ignoreBackgroundClick
      color="var(--alert-color)"
    >
      <DeletePostsContainer>
        <Input
          label="Confirm Password"
          type="password"
          value={password()}
          onText={setPassword}
          onEnter={onDeleteClicked}
          autofocus
        />

        <Show when={error()}>
          <Text color="var(--alert-color)" size={12}>
            {error()?.message}
          </Text>
        </Show>
      </DeletePostsContainer>
    </LegacyModal>
  );
}
