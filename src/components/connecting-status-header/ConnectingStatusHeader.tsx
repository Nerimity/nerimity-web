import styles from './ConnectingStatusHeader.module.scss';
import { classNames, conditionalClass } from '@/common/classNames';
import { StorageKeys, getStorageString } from '@/common/localStorage';
import { useWindowProperties } from '@/common/useWindowProperties';
import { useMatch } from 'solid-navigator';
import { createEffect, createSignal } from "solid-js"
import { useStore } from '@/store';

export const ConnectingStatusHeader = () => {
  const store = useStore();
  const socketDetails = () => store.socket.details;
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

    if (socketDetails().authenticationError) {
      setStatus({
        color: "var(--alert-color)",
        text: socketDetails().authenticationError?.message || "Authentication error",
      })
      return;
    }


    if (!socketDetails().socketConnected) {
      setStatus({
        color: "var(--warn-color)",
        text: alreadyConnected ? "Reconnecting..." : "Connecting...",
      })
      return;
    }

    alreadyConnected = true;

    if (!socketDetails().socketAuthenticated) {
      setStatus({
        color: "var(--warn-color)",
        text: "Authenticating...",
      })
      return;
    }

    if (socketDetails().socketAuthenticated) {
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