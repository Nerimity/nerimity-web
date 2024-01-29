import { RawServer } from "@/chat-api/RawData";
import { ContextStore } from "./store";
import { createDispatcher } from "./createDispatcher";
import { batch, createMemo } from "solid-js";
import { createStore, reconcile } from "solid-js/store";




type Server = {

} & RawServer;

const [servers, setServers] = createStore<Record<string, Server>>({});

const ADD_SERVER = (server: Server) => {
  setServers(server.id, reconcile(server));
  return true;
}

const ADD_SERVERS = (servers: Server[]) => {
  batch(() => {
    for (let index = 0; index < servers.length; index++) {
      const server = servers[index];
      setServers(server.id, reconcile(server));
    }
  })
}

const UPDATE_SERVER = (payload: {id: string, server: Partial<Server>}) => {
  if (!servers[payload.id]) return;
  setServers(payload.id, payload.server);
}

const actions = {
  ADD_SERVER,
  ADD_SERVERS,
  UPDATE_SERVER,
}


export const createServersStore = (state: ContextStore) => {  
  const dispatch = createDispatcher(actions, state);
  
  const getServer = (id: string) => servers[id];
  const list = () => Object.values(servers);
  
  const orderedList = createMemo(() => {
    if (!state.ready()) return [];
    const loggedInUser = state.account.getLoggedInUser();
    const serverIdsArray = loggedInUser?.orderedServerIds;

    const order: Record<string, number> = {};
    serverIdsArray?.forEach((a, i) => {order[a] = i})
    
    return list()
      .toSorted((a, b) => a.createdAt - b.createdAt)
      .toSorted((a, b) => {
        const orderA = order[a.id];
        const orderB = order[b.id];
        if (orderA === undefined) {
          return -1;
        }
        if (orderB === undefined) {
          return 1;
        }
        return orderA - orderB;
      })
  })


  
  return {
    dispatch,
    get: getServer,
    list,
    orderedList
  }

}