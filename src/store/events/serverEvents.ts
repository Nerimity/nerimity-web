import { Socket } from "socket.io-client";
import { ContextStore } from "../store";
import { ServerEvents } from "@/chat-api/EventNames";



const registerServerEvents = (socket: Socket, state: ContextStore) => {
  
  const onServerOrderUpdated = (payload: { serverIds: string[] }) => {
    state.account.dispatch("SET_SERVER_ORDER", payload.serverIds)
  }
  socket.on(ServerEvents.SERVER_ORDER_UPDATED, onServerOrderUpdated)
  
};



export {
  registerServerEvents
}
