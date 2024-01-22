import { ServerEvents } from "@/chat-api/EventNames"
import { AuthenticatedPayload } from "@/chat-api/events/connectionEventTypes"
import socketClient from "@/chat-api/socketClient"
import { batch } from "solid-js"
import { createStore } from "solid-js/store"
import { StoreContext } from "./store"

const createSocket = (state: () => StoreContext) => {
  socketClient.socket.on(ServerEvents.USER_AUTHENTICATED, payload => onAuthenticate(payload, state))

  const dispose = () => {
    console.warn("TODO: Handle disposing socket events.") 
    // TODO socketClient.socket.removeAllListeners()
  }

  return {
    dispose
  }

}



const onAuthenticate = (payload: AuthenticatedPayload, state: () => StoreContext) => {
  const serverMembers = payload.serverMembers;

  const userPresences = payload.presences

  batch(() => {
    for (let index = 0; index < serverMembers.length; index++) {
      const serverMember = serverMembers[index];
      const user = serverMember.user;
      state().users.dispatch("ADD_USER", user);
    }

    for (let index = 0; index < userPresences.length; index++) {
      const {userId, ...presence} = userPresences[index];
      state().users.dispatch("UPDATE_USER_PRESENCE", {
        id: userId,
        update: presence
      });
    }

  })
  
}

export {
  createSocket
}