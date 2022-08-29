import { update } from 'idb-keyval';
import { batch } from 'solid-js';
import {createStore} from 'solid-js/store';
import { RawServer } from '../RawData';
import { deleteServer } from '../services/ServerService';
import useChannels from './useChannels';
import useTabs from './useTabs';

export type Server = RawServer & {
  hasNotifications: boolean;
  update: (this: Server, update: Partial<RawServer>) => void;
  leave: () => Promise<RawServer>;
}
const [servers, setServers] = createStore<Record<string, Server | undefined>>({});





const set = (server: RawServer) => 
  setServers({
    ...servers,
    [server.id]: {
      ...server,
      get hasNotifications() {
        const channels = useChannels();
        return channels.getChannelsByServerId(server.id).some(channel => channel!.hasNotifications)
      },
      update(update) {
        setServers(this.id, update);
      },
      async leave() {
        return deleteServer(server.id);
      }
    }
  });

const remove = (serverId: string) => {

  const tabs = useTabs();

  const serverRelatedTabs = tabs.array.filter(tab => tab.serverId === serverId).map(t => t.path);
  

  tabs.closeTabs(serverRelatedTabs)

  setServers(serverId, undefined);
}


const get = (serverId: string) => servers[serverId]

const array = () => Object.values(servers);

export default function useServers() {
  return {
    array,
    get,
    set,
    remove
  }
}