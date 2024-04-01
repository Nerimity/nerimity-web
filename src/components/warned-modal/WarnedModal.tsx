import styles from "./styles.module.css";
import Button from "../ui/Button";
import { FlexRow } from "../ui/Flexbox";
import Modal from "../ui/modal/Modal";
import { createSignal, onCleanup, onMount } from "solid-js";

export const WarnedModal = (props: {close: () => void, reason?: string, by?: {username: string}, bypassCounter?: boolean}) => {

  const [countdown, setCountdown] = createSignal(10);

  const interval = setInterval(() => {
    if (countdown() <= 1) {
      clearInterval(interval);
    }
    setCountdown(countdown() - 1);
  }, 1000);

  onCleanup(() => clearInterval(interval));


  const onClick = () => {
    if (!props.bypassCounter && countdown() !== 0) return; 
    props.close();
  };

  const ActionButtons = (
    <FlexRow style={{"justify-content": "flex-end", flex: 1, margin: "5px" }}>
      <Button onClick={onClick} label={countdown() === 0 ? "Understood" : `${countdown()}s`} primary />
    </FlexRow>
  );

  return (
    <Modal title="You Have Been Warned!" actionButtons={ActionButtons} >
      <div class={styles.container}>
        <div class={styles.suspendContainer}>
          <span>{props.reason || "Violating the TOS"}</span>
          <div class={styles.message}>By: <span class={styles.messageDim}>{props.by?.username}</span></div>
          <div class={styles.messageDim} style={{"font-size": "14px", "margin-top": "6px", "max-width": "300px"}}>if you continue with this behavior, your account will be suspended.</div>
        </div>
      </div>
    </Modal>
  );
};