import styles from "./ConnectingStatusHeader.module.scss";
import useStore from "@/chat-api/store/useStore";
import { classNames, conditionalClass } from "@/common/classNames";
import { StorageKeys, getStorageString } from "@/common/localStorage";
import { useWindowProperties } from "@/common/useWindowProperties";
import { useMatch } from "solid-navigator";
import { createEffect, createSignal, on } from "solid-js";
import socketClient from "@/chat-api/socketClient";
import { ServerEvents } from "@/chat-api/EventNames";
import { t } from "@nerimity/i18lite";

export default function ConnectingStatusHeader() {
  const { account } = useStore();
  const [status, setStatus] = createSignal<{
    color: string;
    text: string;
  } | null>(null);
  const [queuePos, setQueuePos] = createSignal(0);
  const { isMobileWidth } = useWindowProperties();

  socketClient.useSocketOn(
    ServerEvents.USER_AUTH_QUEUE_POSITION,
    (payload: { pos: number }) => {
      setQueuePos(payload.pos);
    }
  );

  let interval: number | undefined;
  let alreadyConnected = false;

  const invitesPage = useMatch(() => "/app/explore/servers/invites/*");
  const appPage = useMatch(() => "/app/*");

  const show = () => {
    if (!appPage()) return false;
    if (invitesPage() && !getStorageString(StorageKeys.USER_TOKEN, undefined))
      return false;
    return true;
  };

  createEffect(
    on(
      [
        account.authenticationError,
        account.isConnected,
        account.isAuthenticated,
      ],
      () => {
        setQueuePos(0);
      }
    )
  );

  createEffect(() => {
    window.clearInterval(interval);

    if (account.authenticationError()) {
      setStatus({
        color: "var(--alert-color)",
        text:
          account.authenticationError()?.message ||
          t("statusHeader.authenticationError"),
      });
      return;
    }

    if (!account.isConnected()) {
      setStatus({
        color: "var(--warn-color)",
        text: alreadyConnected
          ? t("statusHeader.reconnecting")
          : t("statusHeader.connecting"),
      });
      return;
    }

    alreadyConnected = true;

    if (!account.isAuthenticated()) {
      setStatus({
        color: "var(--warn-color)",
        text: queuePos()
          ? t("statusHeader.inQueue", { count: queuePos() })
          : t("statusHeader.authenticating"),
      });
      return;
    }

    if (account.isAuthenticated()) {
      setStatus({
        color: "var(--success-color)",
        text: t("statusHeader.connected"),
      });
      interval = window.setTimeout(() => {
        setStatus(null);
      }, 1000);
    }
  });

  return (
    <div
      class={classNames(
        styles.connectingStatusHeader,
        conditionalClass(isMobileWidth(), styles.mobile),
        conditionalClass(!status() || !show(), styles.hide)
      )}
      style={{ background: status()?.color }}
    >
      <div class={styles.text}>{status()?.text}</div>
    </div>
  );
}
