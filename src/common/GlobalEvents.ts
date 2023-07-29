import { ModerationSuspension } from "@/chat-api/services/ModerationService";
import EventEmitter from "eventemitter3";
import { onCleanup } from "solid-js";


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


export function useModerationUserSuspendedListener() {  
  return useEventListen<ModerationSuspension>('moderationUserSuspended')
}

export function useEventListen<TReturn>(name: string) {  
  return (callback: (event: TReturn) => void) => {
    EE.addListener(name, callback)
    onCleanup(() => {
      EE.removeListener(name, callback);
    })
  }
}