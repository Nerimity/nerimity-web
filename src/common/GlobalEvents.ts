import { ModerationSuspension } from "@/chat-api/services/ModerationService";
import EventEmitter from "eventemitter3";
import { onCleanup } from "solid-js";

export const GlobalEventName = {
  SCROLL_TO_MESSAGE: "scrollToMessage",
  MODERATION_USER_SUSPENDED: "moderationUserSuspended",
  MODERATION_SERVER_DELETED: "moderationServerDeleted",
  MODERATION_UNDO_SERVER_DELETE: "moderationUndoServerDelete",
  MODERATION_SHOW_MESSAGES: "moderationShowMessages",
  DRAWER_GO_TO_MAIN: "drawerGoToMain",
} as const;

const EE = new EventEmitter();

export function emitScrollToMessage(payload: { messageId: string }) {
  EE.emit("scrollToMessage", payload);
}
export function useScrollToMessageListener() {
  return useEventListen<{ messageId: string }>("scrollToMessage");
}
export function emitModerationShowMessages(payload: {
  messageId: string;
  channelId: string;
}) {
  EE.emit("moderationShowMessages", payload);
}

export function useModerationShowMessages() {
  return useEventListen<{ messageId: string; channelId: string }>(
    "moderationShowMessages"
  );
}

export function emitModerationServerDeleted(servers: any[]) {
  EE.emit("moderationServerDeleted", servers);
}

export function emitModerationUndoServerDelete(serverId: string) {
  EE.emit(GlobalEventName.MODERATION_UNDO_SERVER_DELETE, serverId);
}
export function emitModerationUserSuspended(payload: ModerationSuspension) {
  EE.emit("moderationUserSuspended", payload);
}

export function emitDrawerGoToMain() {
  EE.emit("drawerGoToMain");
}

export function useModerationUserSuspendedListener() {
  return useEventListen<ModerationSuspension>("moderationUserSuspended");
}

export function useModerationServerDeletedListener() {
  return useEventListen<any[]>("moderationServerDeleted");
}
export function useModerationUndoServerDeleteListener() {
  return useEventListen<string>(GlobalEventName.MODERATION_UNDO_SERVER_DELETE);
}

export function useEventListen<TReturn>(
  name: (typeof GlobalEventName)[keyof typeof GlobalEventName]
) {
  return (callback: (event: TReturn) => void) => {
    EE.addListener(name, callback);
    onCleanup(() => {
      EE.removeListener(name, callback);
    });
  };
}
