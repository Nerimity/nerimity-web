import { RawUser } from "@/chat-api/RawData";
import {
  deleteServer,
  ModerationSuspension,
  suspendUsers,
} from "@/chat-api/services/ModerationService";
import { createSignal, For, Show } from "solid-js";
import { styled } from "solid-styled-components";
import Button from "../ui/Button";
import { FlexRow } from "../ui/Flexbox";
import Input from "../ui/input/Input";
import LegacyModal from "../ui/legacy-modal/LegacyModal";
import Text from "../ui/Text";
import useStore from "@/chat-api/store/useStore";
import { useCustomPortal } from "../ui/custom-portal/CustomPortal";
import Checkbox from "../ui/Checkbox";

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

interface MinimalServer {
  id: string;
}

interface Props {
  servers: MinimalServer[];
  close: () => void;
  done: () => void;
}

export default function DeleteServersModal(props: Props) {
  const [password, setPassword] = createSignal("");
  const [reason, setReason] = createSignal("");

  const [templates, setTemplates] = createSignal({
    "NSFW Server": false,
    "Non-English Server": false,
    Other: false,
  } as Record<string, boolean>);

  const [error, setError] = createSignal<{
    message: string;
    path?: string;
  } | null>(null);
  const [requestSent, setRequestSent] = createSignal(false);

  const constructedReason = () => {
    const values: string[] = [];
    // append the template key to value if the template is true.
    Object.keys(templates()).forEach((key) => {
      if (!templates()[key]) return;
      if (key === "Other") {
        values.push(reason());
        return;
      }
      if (templates()[key]) {
        values.push(key);
      }
    });
    return values.join(", ");
  };

  const onSuspendClicked = async () => {
    console.log(constructedReason());
    if (!constructedReason().trim()) {
      setError({ message: "Please provide a reason." });
      return;
    }

    if (requestSent()) return;
    setRequestSent(true);
    setError(null);
    const serverIds = props.servers.map((u) => u.id);

    let hasErrors = false;
    let invalidPassword = false;

    for (let i = 0; i < serverIds.length; i++) {
      const serverId = serverIds[i]!;

      const result = await deleteServer(
        serverId,
        password(),
        constructedReason()
      ).catch((err) => {
        hasErrors = true;
        if (err.path === "password") {
          invalidPassword = true;
          setError(err);
          setRequestSent(false);
        }
      });
      if (invalidPassword) {
        break;
      }
    }
    if (invalidPassword) return;

    if (hasErrors) {
      alert(
        "Some servers could not be deleted due to an error. Please try again."
      );
    }
    props.done();
    props.close();
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
        onClick={onSuspendClicked}
        margin={0}
        label={requestSent() ? "Deleting..." : "Delete"}
        color="var(--alert-color)"
        primary
      />
    </FlexRow>
  );

  return (
    <LegacyModal
      close={props.close}
      title={`Delete ${props.servers.length} Server(s)`}
      actionButtons={ActionButtons}
      ignoreBackgroundClick
    >
      <Container>
        <For each={Object.keys(templates())}>
          {(template) => (
            <Checkbox
              label={template}
              checked={templates()[template] || false}
              onChange={() => {
                setTemplates((prev) => ({
                  ...prev,
                  [template]: !prev[template],
                }));
              }}
            />
          )}
        </For>
        <Show when={templates().Other}>
          <Input label="Reason" value={reason()} onText={setReason} />
        </Show>

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
