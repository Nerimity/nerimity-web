import { deletePosts, undoDeleteServer } from "@/chat-api/services/ModerationService";
import { createSignal, Show } from "solid-js";
import { styled } from "solid-styled-components";
import Button from "../ui/Button";
import { FlexRow } from "../ui/Flexbox";
import Input from "../ui/input/Input";
import LegacyModal from "../ui/legacy-modal/LegacyModal";
import Text from "../ui/Text";
import { RawServer } from "@/chat-api/RawData";
import { emitModerationUndoServerDelete } from "@/common/GlobalEvents";
import { t } from "i18next";

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
  server: RawServer
  close: () => void;
  done: () => void;
}

export default function UndoServerDeleteModal(props: Props) {
  const [password, setPassword] = createSignal("");
  const [error, setError] = createSignal<{
    message: string;
    path?: string;
  } | null>(null);
  const [restoring, setRestore] = createSignal(false);

  const onRestoreClick = () => {
    if (restoring()) return;
    setRestore(true);
    setError(null);

    undoDeleteServer(props.server.id, password())
      .then(() => {
        emitModerationUndoServerDelete(props.server.id);
        props.done();
        props.close();
      })
      .catch((err) => setError(err))
      .finally(() => setRestore(false));
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
        onClick={onRestoreClick}
        margin={0}
        label={restoring() ? t("moderationPane.restoring") : t("moderationPane.restoreButton")}
        primary
      />
    </FlexRow>
  );

  return (
    <LegacyModal
      close={props.close}
      title={t("moderationPane.undoServerDeletion", { name: props.server.name})}
      actionButtons={ActionButtons}
      ignoreBackgroundClick
    >
      <Container>
        <Input
          label={t("moderationPane.confirmPassword")}
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
