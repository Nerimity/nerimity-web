import { RawServerSettings, RawUserConnection } from "@/chat-api/RawData";
import { ContextStore } from "./store";
import { createDispatcher } from "./createDispatcher";
import { createStore, produce, reconcile } from "solid-js/store";
import { SelfUser } from "@/chat-api/events/connectionEventTypes";
import { batch } from "solid-js";


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

const SET_ACCOUNT = (account: Account) => {
  setAccount(reconcile(account));
}


const SET_SERVER_SETTINGS = (settings: RawServerSettings) => {
  setAccount('serverSettings', settings.serverId, reconcile(settings));
  return true;
}

const SET_ALL_SERVER_SETTINGS = (settings: RawServerSettings[]) => {
  batch(() => {
    for (let i = 0; i < settings.length; i++) {
      const setting = settings[i];
      setAccount('serverSettings', setting.serverId, reconcile(setting));
    }
  })
}

const UPDATE_SERVER_SETTINGS = (payload: {serverId: string, updated: Partial<RawServerSettings>}) => {
  setAccount('serverSettings', payload.serverId, payload.updated);
}

const SET_SERVER_ORDER = (serverIds: string[]) => {
  setAccount('user', 'orderedServerIds', reconcile(serverIds));
}

const ADD_CONNECTION = (connection: RawUserConnection) => {
  setAccount('user', 'connections', produce(c => c.push(connection)));
}

const REMOVE_CONNECTION = (connectionId: string) => {
  setAccount('user', 'connections', reconcile(account.user?.connections.filter(c => c.id !== connectionId) || []));
}

const actions = {
  SET_ACCOUNT,
  UPDATE_ACCOUNT,
  SET_SERVER_SETTINGS,
  SET_SERVER_ORDER,
  UPDATE_SERVER_SETTINGS,
  ADD_CONNECTION,
  REMOVE_CONNECTION,
  SET_ALL_SERVER_SETTINGS
}


const getLoggedInUser = () => account.user;


export const createAccountStore = (state: ContextStore) => {  
  const dispatch = createDispatcher(actions, state);

  
  return {
    dispatch,

    getLoggedInUser
  }
}