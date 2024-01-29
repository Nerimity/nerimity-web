import { Accessor, JSX, createContext, createSignal, onCleanup, useContext } from "solid-js";
import { createUsersStore } from "./createUsersStore";
import { createSocket } from "./createSocket";
import { createAccountStore } from "./createAccountStore";
import { createServersStore } from "./createServersStore";
import { createFriendsStore } from "./createFriendsStore";
import { createInboxStore } from "./createInboxStore";
import { createChannelsStore } from "./createChannelsStore";




export class ContextStore {
  ready:  Accessor<boolean>;
  users: ReturnType<typeof createUsersStore>;
  socket: ReturnType<typeof createSocket>;
  account: ReturnType<typeof createAccountStore>;
  servers: ReturnType<typeof createServersStore>;
  friends: ReturnType<typeof createFriendsStore>;
  channels: ReturnType<typeof createChannelsStore>;
  inbox: ReturnType<typeof createInboxStore>;
  constructor() {
    const [ready, setReady] = createSignal(false);
    this.ready = ready;

    this.account = createAccountStore(this);
    this.socket = createSocket(this);
    
    this.users = createUsersStore(this);
    this.servers = createServersStore(this);
    this.friends = createFriendsStore(this);
    this.channels = createChannelsStore(this);
    this.inbox = createInboxStore(this);
    setReady(true);
  }
  dispose() {
    this.socket.dispose();
  }
}


const StoreContext = createContext<ContextStore>();


const StoreProvider = (props: { children: JSX.Element }) => {
  const state = new ContextStore();

  onCleanup(() => {
    state.dispose();
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