import { JSX, batch, createContext, onCleanup, useContext } from "solid-js";
import { createUsersStore } from "./createUsersStore";
import socketClient from "@/chat-api/socketClient";
import { ClientEvents, ServerEvents } from "@/chat-api/EventNames";
import { AuthenticatedPayload } from "@/chat-api/events/connectionEventTypes";
import { createSocket } from "./createSocket";
import { createAccountStore } from "./createAccountStore";



interface StoreContext {
  users: ReturnType<typeof createUsersStore>;
  socket: ReturnType<typeof createSocket>;
  account: ReturnType<typeof createAccountStore>;
}

const StoreContext = createContext<StoreContext>();


const StoreProvider = (props: { children: JSX.Element }) => {
  const stateFunc = () => state;
  const state = {
    users: createUsersStore(stateFunc),
    socket: createSocket(stateFunc),
    account: createAccountStore(stateFunc)
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