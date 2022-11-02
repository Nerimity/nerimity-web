import {createStore} from 'solid-js/store';
import { RawServer } from '../RawData';
import { deleteServer } from '../services/ServerService';
import useChannels from './useChannels';

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
  setServers(serverId, undefined);
}


const get = (serverId: string) => servers[serverId]

const array = () => Object.values(servers);


const hasNotifications =  () => {
  return array().find(s => s?.hasNotifications);
}

export default function useServers() {
  return {
    array,
    get,
    set,
    hasNotifications,
    remove
  }
}