import { ServerEvents } from "@/chat-api/EventNames"
import { AuthenticatedPayload } from "@/chat-api/events/connectionEventTypes"
import socketClient from "@/chat-api/socketClient"
import { batch } from "solid-js"
import { createStore } from "solid-js/store"
import { StoreContext } from "./store"
import { UserStatus } from "./createUsersStore"
import { ActivityStatus } from "@/chat-api/RawData"

const createSocket = (state: () => StoreContext) => {
  socketClient.socket.on(ServerEvents.USER_AUTHENTICATED, payload => onAuthenticate(payload, state))
  socketClient.socket.on(ServerEvents.USER_PRESENCE_UPDATE, payload => onUserPresenceUpdate(payload, state))

  const dispose = () => {
    console.warn("TODO: Handle disposing socket events.") 
    // TODO socketClient.socket.removeAllListeners()
  }

  return {
    dispose
  }

}



export function onUserPresenceUpdate(payload: { userId: string; status?: UserStatus, custom?: string; activity?: ActivityStatus}, state: () => StoreContext) {


  state().users.dispatch("UPDATE_USER_PRESENCE", {
    id: payload.userId,
    update: {
      ...(payload.status !== undefined ? {status: payload.status} : undefined), 
      ...(payload.custom !== undefined ? {custom: payload.custom} : undefined),
      ...(payload.activity !== undefined ? {activity: payload.activity} : undefined)
    }
  })
}






const onAuthenticate = (payload: AuthenticatedPayload, state: () => StoreContext) => {
  const serverMembers = payload.serverMembers;
  const userPresences = payload.presences


  state().account.dispatch("UPDATE_ACCOUNT", {
    user: payload.user,
    socketConnected: true,
    socketAuthenticated: true,
    lastAuthenticatedAt: Date.now()
  })

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