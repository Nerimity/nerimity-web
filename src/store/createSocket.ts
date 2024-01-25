import socketClient from "@/chat-api/socketClient"
import { ContextStore } from "./store"
import { registerConnectionEvents } from "./events/connectionEvents"
import { registerUserEvents } from "./events/userEvents"
import { createDispatcher } from "./createDispatcher";
import { createStore } from "solid-js/store";
import { registerServerEvents } from "./events/serverEvents";


interface SocketDetails {
  socketId: string | null,
  socketConnected: boolean,
  socketAuthenticated: boolean,
  authenticationError: {message: string, data: any} | null;
  lastAuthenticatedAt: null | number;
}


const [socketDetails, setSocketDetails] = createStore<SocketDetails>({
  socketId: null,
  socketConnected: false,
  socketAuthenticated: false,
  authenticationError: null,
  lastAuthenticatedAt: null
})


const UPDATE_SOCKET_DETAILS = (update: Partial<SocketDetails>) => {
  setSocketDetails(update);
}



const actions = {
  UPDATE_SOCKET_DETAILS
}

const createSocket = (state: ContextStore) => {
  const dispatch = createDispatcher(actions, state);
  registerConnectionEvents(socketClient.socket, state);
  registerUserEvents(socketClient.socket, state);
  registerServerEvents(socketClient.socket, state);
  

  const dispose = () => {
    console.warn("TODO: Handle disposing socket events.") 
    // TODO socketClient.socket.removeAllListeners()
  }

  return {
    dispatch,
    dispose,
    details: socketDetails,
 }
}

export {
  createSocket
}