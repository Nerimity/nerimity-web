import socketClient from "@/chat-api/socketClient"
import { StoreContext } from "./store"
import { registerConnectionEvents } from "./events/connectionEvents"
import { registerUserEvents } from "./events/userEvents"

const createSocket = (state: () => StoreContext) => {
  registerConnectionEvents(socketClient.socket, state);
  registerUserEvents(socketClient.socket, state);

  const dispose = () => {
    console.warn("TODO: Handle disposing socket events.") 
    // TODO socketClient.socket.removeAllListeners()
  }
  return {
    dispose
 }
}

export {
  createSocket
}