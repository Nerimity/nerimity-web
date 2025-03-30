import {
  ModerationSuspension,
  ModerationUser,
  editSuspendUsers,
  warnUsers,
} from "@/chat-api/services/ModerationService";
import { createSignal, Show } from "solid-js";
import { styled } from "solid-styled-components";
import Button from "../ui/Button";
import { FlexRow } from "../ui/Flexbox";
import Input from "../ui/input/Input";
import LegacyModal from "../ui/legacy-modal/LegacyModal";
import Text from "../ui/Text";
import useStore from "@/chat-api/store/useStore";
import { useCustomPortal } from "../ui/custom-portal/CustomPortal";
import { ConnectionErrorModal } from "../connection-error-modal/ConnectionErrorModal";
import { WarnedModal } from "../warned-modal/WarnedModal";
import { Notice } from "../ui/Notice/Notice";
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
  user: ModerationUser;
  close: () => void;
  done: () => void;
}

export default function WarnUserModal(props: Props) {
  const store = useStore();

  const [reason, setReason] = createSignal("");

  const [password, setPassword] = createSignal("");
  const [error, setError] = createSignal<{
    message: string;
    path?: string;
  } | null>(null);
  const [requestSending, setRequestSending] = createSignal(false);

  const { createPortal } = useCustomPortal();

  const expired = () =>
    !props.user.account.warnExpiresAt
      ? true
      : new Date(props.user.account.warnExpiresAt) < new Date();
  const warnCount = () => (expired() ? 0 : props.user.account.warnCount || 0);

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
      .catch((err) => setError(err))
      .finally(() => setRequestSending(false));
  };

  const onPreviewClick = () => {
    createPortal((close) => (
      <WarnedModal
        bypassCounter
        close={close}
        reason={reason()}
        by={{ username: store.account.user()!.username }}
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
      <Button onClick={onPreviewClick} margin={0} label={t("suspension.preview")} />
      <Button
        onClick={onWarnClick}
        margin={0}
        color="var(--warn-color)"
        label={requestSending() ? t("suspension.warnings.warning") : t("suspension.warnings.warnUserButton")}
        primary
      />
    </FlexRow>
  );

  return (
    <LegacyModal
      close={props.close}
      title={t("suspension.warnings.title")}
      actionButtons={ActionButtons}
      ignoreBackgroundClick
    >
      <Container>
        <Show when={warnCount() >= 2}>
          <Notice
            type="warn"
            description={t("suspension.warnings.description")}
          />
        </Show>
        <Input label={t("suspension.reason")} value={reason()} onText={setReason} />

        <Input
          label={t("suspension.confirmPassword")}
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
