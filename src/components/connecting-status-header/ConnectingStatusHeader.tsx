import styles from './ConnectingStatusHeader.module.scss';
import useStore from "@/chat-api/store/useStore";
import { classNames, conditionalClass } from '@/common/classNames';
import { StorageKeys, getStorageString } from '@/common/localStorage';
import { useWindowProperties } from '@/common/useWindowProperties';
import { useMatch } from '@solidjs/router';
import { createEffect, createSignal, on } from "solid-js"

export const ConnectingStatusHeader = () => {
  const {account} = useStore();
  const [status, setStatus] = createSignal<{color: string; text: string;} | null>(null)
  const {isMobileWidth} = useWindowProperties();

  let interval: number | undefined;
  let alreadyConnected = false;

  const invitesPage = useMatch(() => "/app/explore/servers/invites/*");
  const appPage = useMatch(() => "/app/*");


  const show = () => {
    if (!appPage()) return false;
    if (invitesPage() && !getStorageString(StorageKeys.USER_TOKEN, undefined)) return false;
    return true;
  }


  createEffect(() => {

    window.clearInterval(interval)

    if (account.authenticationError()) {
      setStatus({
        color: "var(--alert-color)",
        text: account.authenticationError()?.message || "Authentication error",
      })
      return;
    }


    if (!account.isConnected()) {
      setStatus({
        color: "var(--warn-color)",
        text: alreadyConnected ? "Reconnecting..." : "Connecting...",
      })
      return;
    }

    alreadyConnected = true;

    if (!account.isAuthenticated()) {
      setStatus({
        color: "var(--warn-color)",
        text: "Authenticating...",
      })
      return;
    }

    if (account.isAuthenticated()) {
      setStatus({
        color: "var(--success-color)",
        text: "Connected!",
      })
      interval = window.setTimeout(() => {
        setStatus(null)
      }, 3000);
    }
  })

  return (
    <div class={classNames(styles.connectingStatusHeader, conditionalClass(isMobileWidth(), styles.mobile), conditionalClass(!status() || !show(), styles.hide))} style={{background: status()?.color}}>
      <div class={styles.text}>{status()?.text}</div>
    </div>
  )
}