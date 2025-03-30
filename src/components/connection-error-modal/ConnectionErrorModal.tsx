import styles from "./styles.module.css";

import useStore from "@/chat-api/store/useStore";
import { formatTimestamp } from "@/common/date";
import { getStorageString, StorageKeys } from "@/common/localStorage";
import { useNavigate } from "solid-navigator";
import { Match, Show, Switch } from "solid-js";
import Button from "../ui/Button";
import { FlexRow } from "../ui/Flexbox";
import LegacyModal from "../ui/legacy-modal/LegacyModal";
import Text from "../ui/Text";
import { logout } from "@/common/logout";
import { t } from "i18next";

export const ConnectionErrorModal = (props: {
  close: () => void;
  suspensionPreview?: {
    reason?: string;
    expire?: number;
    by?: { username: string };
  };
}) => {
  const { account } = useStore();
  const navigate = useNavigate();
  const err = () => account.authenticationError()!;

  const logoutClick = () => {
    if (props.suspensionPreview) return;
    logout();
  };

  const loginPage = () => {
    navigate("/login");
    props.close();
  };

  const hasToken = () => getStorageString(StorageKeys.USER_TOKEN, null);

  const ActionButtons = (
    <FlexRow style={{ "justify-content": "flex-end", flex: 1, margin: "5px" }}>
      <Button onClick={props.close} label="OK" />
      <Show when={hasToken()}>
        <Button
          onClick={logoutClick}
          label={t("connectionError.logout")}
          color="var(--alert-color)"
        />
      </Show>
      <Show when={!hasToken()}>
        <Button onClick={() => loginPage()} label={t("connectionError.login")} />
      </Show>
    </FlexRow>
  );

  return (
    <LegacyModal
      title={t("connectionError.title")}
      close={props.close}
      actionButtons={ActionButtons}
      ignoreBackgroundClick
    >
      <div class={styles.connectionErrorContainer}>
        <Switch fallback={<div class={styles.message}>{err()?.message}</div>}>
          <Match when={!hasToken()}>
            <div class={styles.message}>{t("connectionError.noToken")}</div>
          </Match>
          <Match
            when={err()?.data?.type === "suspend" || props.suspensionPreview}
          >
            <SuspendMessage {...(err()?.data || props.suspensionPreview)} />
          </Match>
          <Match when={err()?.data?.type === "ip-ban"}>
            <IPBanMessage {...err().data} />
          </Match>
        </Switch>
      </div>
    </LegacyModal>
  );
};

function SuspendMessage(props: {
  reason?: string;
  expire?: number;
  by?: { username: string };
}) {
  return (
    <div class={styles.suspendContainer}>
      <div class={styles.message}>{t("connectionError.accountDeleted")}</div>
      <div class={styles.message}>
        {t("connectionError.reason")}{" "}
        <span class={styles.messageDim}>
          {props.reason || t("connectionError.defaultReason")}
        </span>
      </div>
      <div class={styles.message}>
        {t("connectionError.until")}{" "}
        <span class={styles.messageDim}>
          {props.expire ? formatTimestamp(props.expire) : "never"}
        </span>
      </div>
      <div class={styles.message}>
        {t("connectionError.by")} <span class={styles.messageDim}>{props.by?.username}</span>
      </div>
      <Show when={!props.expire}>
        <div class={styles.notice}>
          {t("connectionError.deletionNotice")}
        </div>
      </Show>
    </div>
  );
}
function IPBanMessage(props: { reason?: string; expire?: number }) {
  return (
    <>
      <div class={styles.message}>{t("connectionError.ipBan.title")}</div>
      <div class={styles.message}>
        {t("connectionError.until")}{" "}
        <span class={styles.messageDim}>{formatTimestamp(props.expire!)}</span>
        <div class={styles.notice}>
          {t("connectionError.ipBan.notice")}
        </div>
      </div>
    </>
  );
}
