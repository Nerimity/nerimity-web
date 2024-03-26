import styles from "./styles.module.css";

import useStore from "@/chat-api/store/useStore";
import { formatTimestamp } from "@/common/date";
import { getStorageString, StorageKeys } from "@/common/localStorage";
import { useNavigate } from "solid-navigator";
import { Match, Show, Switch } from "solid-js";
import Button from "../ui/Button";
import { FlexRow } from "../ui/Flexbox";
import Modal from "../ui/modal/Modal";
import Text from "../ui/Text";

export const ConnectionErrorModal = (props: {close: () => void, suspensionPreview?: {reason?: string, expire?: number, by?: {username: string}}}) => {
  const { account } = useStore();
  const navigate = useNavigate();
  const err = () => account.authenticationError()!;

  const logout = () => {
    if (props.suspensionPreview) return;
    localStorage.clear();
    navigate("/");
    props.close();
  };

  const loginPage = () => {
    navigate("/login");
    props.close();
  };

  const hasToken = () => getStorageString(StorageKeys.USER_TOKEN, null);


  const ActionButtons = (
    <FlexRow style={{"justify-content": "flex-end", flex: 1, margin: "5px" }}>
      <Button onClick={props.close} label="OK" />
      <Show when={hasToken()}><Button onClick={logout} label="Logout" color="var(--alert-color)" /></Show>
      <Show when={!hasToken()}><Button onClick={() => loginPage()} label="Login" /></Show>
    </FlexRow>
  );


  return (
    <Modal title="Connection Error" close={props.close} actionButtons={ActionButtons} ignoreBackgroundClick>
      <div class={styles.connectionErrorContainer}>
        <Switch fallback={<div class={styles.message}>{err()?.message}</div>}>
          <Match when={!hasToken()}><div class={styles.message}>No token provided.</div></Match>
          <Match when={err()?.data?.type === "suspend" || props.suspensionPreview}><SuspendMessage {...(err()?.data || props.suspensionPreview)} /></Match>
          <Match when={err()?.data?.type === "ip-ban"}><IPBanMessage {...err().data} /></Match>
        </Switch>
      </div>
    </Modal>
  );
};

function SuspendMessage(props: {reason?: string; expire?: number; by?: {username: string};}) {
  return (
    <div class={styles.suspendContainer}>
      <div class={styles.message}>You are suspended.</div>
      <div class={styles.message}>Reason: <span class={styles.messageDim}>{props.reason || "Violating the TOS"}</span></div>
      <div class={styles.message}>Until: <span class={styles.messageDim}>{props.expire ? formatTimestamp(props.expire) : "never"}</span></div>
      <div class={styles.message}>By: <span class={styles.messageDim}>{props.by?.username}</span></div>
    </div>
  );
}
function IPBanMessage(props: {reason?: string; expire?: number;}) {
  return (
    <>

      <div class={styles.message}>Your IP is banned.</div>
      <div class={styles.message}>Until: <span class={styles.messageDim}>{ formatTimestamp(props.expire!)}</span></div>
    </>
  );
}