import { AuthenticatedPayload } from "@/chat-api/events/connectionEventTypes";
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

  const onAuthenticateError = (error: { message: string, data: any }) => {
    state.socket.dispatch("UPDATE_SOCKET_DETAILS", {
      socketId: null,
      socketConnected: false,
      socketAuthenticated: false,
      authenticationError: error,
    })
    
  }

  const onUserAuthenticated = (payload: AuthenticatedPayload) => {
    const serverMembers = payload.serverMembers;
    const userPresences = payload.presences
    const servers = payload.servers;
    const serverSettings = payload.serverSettings;
    const friends = payload.friends;
  
    state.users.dispatch("ADD_USER", {...payload.user});
    state.account.dispatch("SET_ACCOUNT", {
      user: {...payload.user},
      serverSettings: {}
    })

    state.socket.dispatch("UPDATE_SOCKET_DETAILS", {
      socketId: socket.id,
      socketConnected: true,
      socketAuthenticated: true,
      lastAuthenticatedAt: Date.now()
    })


    state.account.dispatch("SET_ALL_SERVER_SETTINGS", serverSettings)


    state.servers.dispatch("ADD_SERVERS", servers);
    

    const serverUsers = serverMembers.map(serverMember => serverMember.user);
    state.users.dispatch("ADD_USERS", serverUsers);
    
    state.users.dispatch("SET_ALL_USER_PRESENCES", userPresences);
    
    state.users.dispatch("ADD_USERS", friends.map(friend => friend.recipient));
    state.friends.setFriends(friends)

  }

  socket.on(ServerEvents.USER_AUTHENTICATED, onUserAuthenticated) 
  socket.on("reconnect_attempt", onReconnectAttempt);
  socket.on(ServerEvents.AUTHENTICATE_ERROR, onAuthenticateError)

}

export {
  registerConnectionEvents
}