import {
  ModerationUser,
  shadowBan,
} from "@/chat-api/services/ModerationService";
import { createSignal, Show } from "solid-js";
import { styled } from "solid-styled-components";
import Button from "../ui/Button";
import { FlexRow } from "../ui/Flexbox";
import Input from "../ui/input/Input";
import LegacyModal from "../ui/legacy-modal/LegacyModal";
import Text from "../ui/Text";
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

export default function ShadowBanUserModal(props: Props) {
  const [reason, setReason] = createSignal("");

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

    shadowBan(password(), userIds, reason())
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
        label={requestSending() ? t("moderationPane.shadowBan.shadowBanning") : t("moderationPane.shadowBan.shadowBanUser")}
        primary
      />
    </FlexRow>
  );

  return (
    <LegacyModal
      close={props.close}
      title={t("moderationPane.shadowBan.shadowBanUser")}
      actionButtons={ActionButtons}
      ignoreBackgroundClick
    >
      <Container>
        <div>
          <Notice type="warn" description={t("moderationPane.shadowBan.notice")} />
          <Notice
            type="warn"
            description={t("moderationPane.shadowBan.description")}
          />
        </div>
        <Input label={t("moderationPane.shadowBan.reason")} value={reason()} onText={setReason} />

        <Input
          label={t("moderationPane.shadowBan.confirmPassword")}
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
