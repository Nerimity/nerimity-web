import { AuthenticatedPayload } from "@/chat-api/events/connectionEventTypes";
import { batch } from "solid-js";
import { ContextStore } from "../store";
import { Socket } from "socket.io-client";
import { ServerEvents } from "@/chat-api/EventNames";

const registerConnectionEvents = (socket: Socket, state: ContextStore) => {

  const onReconnectAttempt = () => {
    state.socket.dispatch("UPDATE_SOCKET_DETAILS", {
      socketId: null,
      socketConnected: false,
      socketAuthenticated: false
    })
  }
  socket.on("reconnect_attempt", onReconnectAttempt);


  const onAuthenticateError = (error: { message: string, data: any }) => {
    state.socket.dispatch("UPDATE_SOCKET_DETAILS", {
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
    const servers = payload.servers;
    const serverSettings = payload.serverSettings;
  
    state.users.dispatch("ADD_USER", {...payload.user});
    state.account.dispatch("UPDATE_ACCOUNT", {
      user: {...payload.user},
    })

    state.socket.dispatch("UPDATE_SOCKET_DETAILS", {
      socketId: socket.id,
      socketConnected: true,
      socketAuthenticated: true,
      lastAuthenticatedAt: Date.now()
    })


    for (let i = 0; i < serverSettings.length; i++) {
      const serverSetting = serverSettings[i];
      state.account.dispatch("SET_SERVER_SETTINGS", serverSetting)
    }



    state.servers.dispatch("ADD_SERVERS", servers);
    

    const serverUsers = serverMembers.map(serverMember => serverMember.user);
    state.users.dispatch("ADD_USERS", serverUsers);

    batch(() => {  
      for (let index = 0; index < userPresences.length; index++) {
        const {userId, ...presence} = userPresences[index];
        state.users.dispatch("UPDATE_USER_PRESENCE", {
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