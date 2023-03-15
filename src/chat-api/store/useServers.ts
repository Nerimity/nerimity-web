import env from '@/common/env';
import {createStore} from 'solid-js/store';
import { RawServer } from '../RawData';
import { deleteServer } from '../services/ServerService';
import useAccount from './useAccount';
import useChannels from './useChannels';
import useMention from './useMention';

export type Server = RawServer & {
  hasNotifications: boolean;
  update: (this: Server, update: Partial<RawServer>) => void;
  leave: () => Promise<RawServer>;
  mentionCount: number;
  avatarUrl(this: Server): string | null
}
const [servers, setServers] = createStore<Record<string, Server | undefined>>({});


export const avatarUrl = (item: {avatar?: string}): string | null => item.avatar ? env.NERIMITY_CDN + item.avatar : null;



const set = (server: RawServer) => 
  setServers({
    ...servers,
    [server.id]: {
      ...server,
      get hasNotifications() {
        const channels = useChannels();
        return channels.getChannelsByServerId(server.id).some(channel => channel!.hasNotifications)
      },
      get mentionCount() {
        const mention = useMention();
        let count = 0;
        const mentions = mention.array().filter(mention => mention!.serverId === server.id);
        for (let i = 0; i < mentions.length; i++) {
          const mention = mentions[i];
          count += mention?.count || 0
        }
        return count;
      },
      update(update) {
        setServers(this.id, update);
      },
      async leave() {
        return deleteServer(server.id);
      },
      avatarUrl(){
        return this?.avatar ? env.NERIMITY_CDN + this?.avatar : null;
      }
    }
  });

const remove = (serverId: string) => {  
  setServers(serverId, undefined);
}


const get = (serverId: string) => servers[serverId]

const array = () => Object.values(servers) as Server[];

const orderedArray = () => {
  const account = useAccount();
  const serverIdsArray = account.user()?.orderedServerIds;
  const order: Record<string, number> = {};
  serverIdsArray?.forEach((a, i) => {order[a] = i})
  
  return array()
    .sort((a, b) => a.createdAt - b.createdAt)
    .sort((a, b) => {
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
}


const hasNotifications =  () => {
  return array().find(s => s?.hasNotifications);
}

export default function useServers() {
  return {
    array,
    get,
    set,
    hasNotifications,
    orderedArray,
    remove
  }
}