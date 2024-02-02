import { ModerationSuspension } from "@/chat-api/services/ModerationService";
import EventEmitter from "eventemitter3";
import { onCleanup } from "solid-js";

export const GlobalEventName = {
  SCROLL_TO_MESSAGE: "scrollToMessage",
  MODERATION_USER_SUSPENDED: "moderationUserSuspended",
  DRAWER_GO_TO_MAIN: "drawerGoToMain"
} as const


const EE = new EventEmitter()

export function emitScrollToMessage(payload: {messageId: string}) {
  EE.emit("scrollToMessage", payload)
}


export function useScrollToMessageListener() {  
  return useEventListen<{messageId: string}>('scrollToMessage')
}


export function emitModerationUserSuspended(payload: ModerationSuspension) {
  EE.emit("moderationUserSuspended", payload)
}

export function emitDrawerGoToMain() {
  EE.emit("drawerGoToMain")
}


export function useModerationUserSuspendedListener() {  
  return useEventListen<ModerationSuspension>('moderationUserSuspended')
}

export function useEventListen<TReturn>(name:  typeof GlobalEventName[keyof typeof GlobalEventName]) {
  return (callback: (event: TReturn) => void) => {
    EE.addListener(name, callback)
    onCleanup(() => {
      EE.removeListener(name, callback);
    })
  }
}