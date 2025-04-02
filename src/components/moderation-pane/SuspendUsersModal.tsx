import { RawUser } from "@/chat-api/RawData";
import {
  ModerationSuspension,
  suspendUsers,
} from "@/chat-api/services/ModerationService";
import { createEffect, createSignal, For, Show } from "solid-js";
import { css, styled } from "solid-styled-components";
import Button from "../ui/Button";
import { FlexRow } from "../ui/Flexbox";
import Input from "../ui/input/Input";
import LegacyModal from "../ui/legacy-modal/LegacyModal";
import Text from "../ui/Text";
import Checkbox, { CheckboxProps } from "../ui/Checkbox";
import useStore from "@/chat-api/store/useStore";
import { useCustomPortal } from "../ui/custom-portal/CustomPortal";
import { ConnectionErrorModal } from "../connection-error-modal/ConnectionErrorModal";
import { RadioBox } from "../ui/RadioBox";
import { createStore } from "solid-js/store";

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
  tag: string;
}

interface Props {
  users: MinimalUser[];
  close: () => void;
  done: (suspension: ModerationSuspension) => void;
}

export default function SuspendUsersModal(props: Props) {
  const store = useStore();
  const [reason, setReason] = createSignal("");
  const [suspendFor, setSuspendFor] = createSignal("7");
  const [password, setPassword] = createSignal("");
  const [error, setError] = createSignal<{
    message: string;
    path?: string;
  } | null>(null);
  const [suspending, setSuspending] = createSignal(false);

  const { createPortal } = useCustomPortal();
  const [ipBan, setIpBan] = createSignal(false);
  const [deleteRecentMessages, setDeleteRecentMessages] = createSignal(false);

  const [checkedViolation, setCheckedViolation] = createStore([
    false,
    false,
    false,
    false,
    false,
    false,
  ]);

  const checkboxItems: CheckboxProps[] = [
    { label: "Bypassing Suspensions (Alt)", checked: false },
    { label: "Being Racist", checked: false },
    { label: "Threating Harm or Violence", checked: false },
    { label: "Being Hateful", checked: false },
    { label: "Sharing NSFW Content", checked: false },
    { label: "Other", checked: false },
  ];

  createEffect(() => {
    let round = Math.round(parseInt(suspendFor()));
    round < 0 && (round = 0);
    setSuspendFor(round.toString());
  });

  const compiledReason = () => {
    const checkedLabels = checkboxItems
      .filter((item, i) => {
        if (i === checkboxItems.length - 1) return false;
        return checkedViolation[i];
      })
      .map((i) => i.label);
    if (checkedViolation[checkboxItems.length - 1] && reason()?.trim()) {
      checkedLabels.push(reason());
    }

    const lf = new Intl.ListFormat("en");
    return lf.format(checkedLabels as string[]);
  };

  const onSuspendClicked = () => {
    if (suspending()) return;
    setSuspending(true);
    setError(null);
    const userIds = props.users.map((u) => u.id);

    const intSuspendFor = parseInt(suspendFor());

    const preview: ModerationSuspension = {
      expireAt: intSuspendFor ? daysToDate(intSuspendFor) : null,
      suspendedAt: Date.now(),
      reason: compiledReason() || undefined,
      suspendBy: store.account.user()! as unknown as RawUser,
    };

    suspendUsers({
      confirmPassword: password(),
      userIds,
      days: intSuspendFor,
      reason: compiledReason() || undefined,
      ipBan: ipBan(),
      deleteRecentMessages: deleteRecentMessages(),
    })
      .then(() => {
        props.done(preview);
        props.close();
      })
      .catch((err) => setError(err))
      .finally(() => setSuspending(false));
  };

  const onPreviewClick = () => {
    const intSuspendFor = parseInt(suspendFor());
    const expireAt = intSuspendFor ? daysToDate(intSuspendFor) : undefined;
    const r = compiledReason() || undefined;

    createPortal((close) => (
      <ConnectionErrorModal
        close={close}
        suspensionPreview={{
          expire: expireAt,
          reason: r,
          by: { username: store.account.user()!.username },
        }}
      />
    ));
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
      <Button onClick={onPreviewClick} margin={0} label="Preview" />
      <Button
        onClick={onSuspendClicked}
        margin={0}
        label={suspending() ? "Suspending..." : "Suspend"}
        color="var(--alert-color)"
        primary
      />
    </FlexRow>
  );

  return (
    <LegacyModal
      close={props.close}
      title={`Suspend ${props.users.length} User(s)`}
      actionButtons={ActionButtons}
      ignoreBackgroundClick
    >
      <SuspendUsersContainer>
        <For each={checkboxItems}>
          {(item, i) => (
            <Checkbox
              {...item}
              onChange={(v) => setCheckedViolation(i(), v)}
              labelSize={14}
            />
          )}
        </For>
        <Show when={checkedViolation[5]}>
          <Input label="Reason" value={reason()} onText={setReason} />
        </Show>
        <Input
          class={suspendInputStyle}
          label="Suspend for"
          type="number"
          value={suspendFor()}
          onText={setSuspendFor}
          suffix="days"
        />
        <Text
          size={12}
          opacity={0.7}
          class={css`
            margin-top: -4px;
          `}
        >
          0 days will suspend them indefinitely
        </Text>

        <div style={{ "margin-top": "6px", "margin-bottom": "2px" }}>
          <Checkbox
            labelSize={14}
            checked={ipBan()}
            onChange={setIpBan}
            label="IP ban for a week"
          />
        </div>
        <div style={{ "margin-top": "2px", "margin-bottom": "6px" }}>
          <Checkbox
            labelSize={14}
            checked={deleteRecentMessages()}
            onChange={setDeleteRecentMessages}
            label="Delete past 7 hours of messages (raids only)"
          />
        </div>

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
      </SuspendUsersContainer>
    </LegacyModal>
  );
}

function daysToDate(days: number) {
  const DAY_IN_MS = 86400000;
  const now = Date.now();
  const expireDate = new Date(now + DAY_IN_MS * days);
  return expireDate.getTime();
}
