import { RawServerSettings } from "@/chat-api/RawData";
import { ContextStore } from "./store";
import { createDispatcher } from "./createDispatcher";
import { createStore, reconcile } from "solid-js/store";
import { SelfUser } from "@/chat-api/events/connectionEventTypes";


interface Account {
  user: SelfUser | null,
  serverSettings: Record<string, RawServerSettings>
}


const [account, setAccount] = createStore<Account>({
  user: null,
  serverSettings: {},
});

const UPDATE_ACCOUNT = (update: Partial<Account>) => {
  setAccount(update);
  return true;
}
const SET_SERVER_SETTINGS = (settings: RawServerSettings) => {
  setAccount('serverSettings', settings.serverId, reconcile(settings));
  return true;
}

const SET_SERVER_ORDER = (serverIds: string[]) => {
  setAccount('user', 'orderedServerIds', reconcile(serverIds));
}

const actions = {
  UPDATE_ACCOUNT,
  SET_SERVER_SETTINGS,
  SET_SERVER_ORDER
}


const getLoggedInUser = () => account.user;


export const createAccountStore = (state: ContextStore) => {  
  const dispatch = createDispatcher(actions, state);

  
  return {
    dispatch,

    getLoggedInUser
  }
}