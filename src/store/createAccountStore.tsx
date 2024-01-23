import { ActivityStatus, RawPresence, RawServerSettings, RawUser } from "@/chat-api/RawData";
import { StoreContext } from "./store";
import { createDispatcher } from "./createDispatcher";
import { batch } from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import { SelfUser } from "@/chat-api/events/connectionEventTypes";


interface Account {
  user: SelfUser | null,

  socketId: string | null,
  socketConnected: boolean,
  socketAuthenticated: boolean,
  authenticationError: {message: string, data: any} | null;
  serverSettings: Record<string, RawServerSettings>
  lastAuthenticatedAt: null | number;
}


const [account, setAccount] = createStore<Account>({
  user: null,

  socketId: null,
  socketConnected: false,
  socketAuthenticated: false,
  authenticationError: null,
  serverSettings: {},
  lastAuthenticatedAt: null
});

const UPDATE_ACCOUNT = (update: Partial<Account>) => {
  setAccount(update);
  return true;
}

const actions = {
  UPDATE_ACCOUNT,
}


const getLoggedInUser = () => account.user;


export const createAccountStore = (state: () => StoreContext) => {  
  const dispatch = createDispatcher(actions, state);

  
  return {
    dispatch,
    getLoggedInUser
  }
}