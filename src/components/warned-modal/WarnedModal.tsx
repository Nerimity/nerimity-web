import styles from "./styles.module.css";
import Button from "../ui/Button";
import { FlexRow } from "../ui/Flexbox";
import LegacyModal from "../ui/legacy-modal/LegacyModal";
import { createSignal, onCleanup, onMount } from "solid-js";
import useStore from "@/chat-api/store/useStore";
import { userNoticeDismiss } from "@/chat-api/services/UserService";

export const WarnedModal = (props: {
  id?: string;
  close: () => void;
  reason?: string;
  by?: { username: string };
  bypassCounter?: boolean;
}) => {
  const store = useStore();

  const [countdown, setCountdown] = createSignal(10);

  const interval = setInterval(() => {
    if (countdown() <= 1) {
      clearInterval(interval);
    }
    setCountdown(countdown() - 1);
  }, 1000);

  onCleanup(() => clearInterval(interval));

  const onClick = async () => {
    if (!props.bypassCounter && countdown() !== 0) return;
    props.close();
    await userNoticeDismiss(props.id || "").catch(() => {});

    const user = store.account.user();
    let notices = [...(user?.notices || [])];
    notices = notices.filter((n) => n.id !== props.id);
    store.account.setUser({ ...user, notices: notices });
  };

  const ActionButtons = (
    <FlexRow style={{ "justify-content": "flex-end", flex: 1, margin: "5px" }}>
      <Button
        color="var(--warn-color)"
        onClick={onClick}
        label={countdown() === 0 ? "Understood" : `${countdown()}s`}
        primary
      />
    </FlexRow>
  );

  return (
    <LegacyModal
      color="var(--warn-color)"
      title="You Have Been Warned!"
      actionButtons={ActionButtons}
    >
      <div class={styles.container}>
        <div class={styles.suspendContainer}>
          <span>{props.reason || "Violating the TOS"}</span>
          <div class={styles.message}>
            By: <span class={styles.messageDim}>{props.by?.username}</span>
          </div>
          <div
            class={styles.messageDim}
            style={{
              "font-size": "14px",
              "margin-top": "6px",
              "max-width": "300px",
            }}
          >
            if you continue with this behavior, your account will be suspended.
          </div>
        </div>
      </div>
    </LegacyModal>
  );
};
