import { AuthenticatedPayload } from "@/chat-api/events/connectionEventTypes";
import { batch } from "solid-js";
import { StoreContext } from "../store";
import { Socket } from "socket.io-client";
import { ServerEvents } from "@/chat-api/EventNames";

const registerConnectionEvents = (socket: Socket, state: () => StoreContext) => {

  const onReconnectAttempt = () => {
    const account = state().account;
    account.dispatch("UPDATE_ACCOUNT", {
      socketId: null,
      socketConnected: false,
      socketAuthenticated: false
    })
  }
  socket.on("reconnect_attempt", onReconnectAttempt);


  const onAuthenticateError = (error: { message: string, data: any }) => {
    const account = state().account;;
    account.dispatch("UPDATE_ACCOUNT", {
      socketId: null,
      socketConnected: false,
      socketAuthenticated: false,
      authenticationError: error,
    })
    
  }
  socket.on(ServerEvents.AUTHENTICATE_ERROR, onAuthenticateError)


  const onUserAuthenticated = (payload: AuthenticatedPayload) => {
    const serverMembers = payload.serverMembers;
    const userPresences = payload.presences
  
    state().users.dispatch("ADD_USER", payload.user);
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
  socket.on(ServerEvents.USER_AUTHENTICATED, onUserAuthenticated) 
}

export {
  registerConnectionEvents
}