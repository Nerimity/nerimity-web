import styles from "./styles.module.css";

import useStore from "@/chat-api/store/useStore";
import { formatTimestamp } from "@/common/date";
import { getStorageString, StorageKeys } from "@/common/localStorage";
import { useNavigate } from "solid-navigator";
import { Match, Show, Switch } from "solid-js";
import Button from "../ui/Button";
import { FlexRow } from "../ui/Flexbox";
import Modal from "../ui/modal/Modal";

export const ConnectionErrorModal = (props: {close: () => void}) => {
  const { account } = useStore();
  const navigate = useNavigate();
  const err = () => account.authenticationError()!;

  const logout = () => {
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
          <Match when={err()?.data?.type === "suspend"}><SuspendMessage {...err().data} /></Match>
          <Match when={err()?.data?.type === "ip-ban"}><IPBanMessage {...err().data} /></Match>
        </Switch>
      </div>
    </Modal>
  );
};

function SuspendMessage(props: {reason?: string; expire?: number;}) {
  return (
    <>
      <div class={styles.message}>You are suspended for </div>
      <div class={styles.message}> {props.reason || "Violating the TOS"}</div>
      <div class={styles.messageDim}> until</div>
      <div class={styles.message}> {props.expire ? formatTimestamp(props.expire) : "never"}</div>
    </>
  );
}
function IPBanMessage(props: {reason?: string; expire?: number;}) {
  return (
    <>
      <div class={styles.messageDim}>You are IP banned</div>
      <div class={styles.messageDim}> until</div>
      <div class={styles.message}> {props.expire ? formatTimestamp(props.expire) : "never"}</div>
    </>
  );
}