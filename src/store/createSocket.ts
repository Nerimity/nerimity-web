import { ServerEvents } from "@/chat-api/EventNames"
import { AuthenticatedPayload } from "@/chat-api/events/connectionEventTypes"
import socketClient from "@/chat-api/socketClient"
import { batch } from "solid-js"
import { createStore } from "solid-js/store"
import { StoreContext } from "./store"
import { UserStatus } from "./createUsersStore"
import { ActivityStatus } from "@/chat-api/RawData"
import { StorageKeys, getStorageObject } from "@/common/localStorage"
import { ProgramWithAction, electronWindowAPI } from "@/common/Electron"
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