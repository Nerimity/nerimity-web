import { JSX, batch, createContext, onCleanup, useContext } from "solid-js";
import { createUsersStore } from "./createUsersStore";
import socketClient from "@/chat-api/socketClient";
import { ClientEvents, ServerEvents } from "@/chat-api/EventNames";
import { AuthenticatedPayload } from "@/chat-api/events/connectionEventTypes";
import { createSocket } from "./createSocket";



interface StoreContext {
  users: ReturnType<typeof createUsersStore>;
  socket: ReturnType<typeof createSocket>;
}

const StoreContext = createContext<StoreContext>();


const StoreProvider = (props: { children: JSX.Element }) => {
  const stateFunc = () => state;
  const state = {
    users: createUsersStore(stateFunc),
    socket: createSocket(stateFunc)
  } as StoreContext


  onCleanup(() => {
    state.socket.dispose();
  })


  return (
    <StoreContext.Provider value={state}>
      {props.children}
    </StoreContext.Provider>
  )
}



const useStore = () => {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error("Store provider not found.");
  }
  return store;
}


export {
  useStore,
  StoreContext,
  StoreProvider
}