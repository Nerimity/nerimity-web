import env from '@/common/env';
import {createStore} from 'solid-js/store';
import { ChannelType, RawCustomEmoji, RawServer, ServerNotificationPingMode } from '../RawData';
import { deleteServer } from '../services/ServerService';
import useAccount from './useAccount';
import useChannels from './useChannels';
import useMention from './useMention';
import { createEffect, createMemo, createRoot } from 'solid-js';
import { emojiShortcodeToUnicode } from '@/emoji';

export type Server = RawServer & {
  hasNotifications: boolean;
  update: (this: Server, update: Partial<RawServer>) => void;
  leave: () => Promise<RawServer>;
  mentionCount: number;
  avatarUrl(this: Server): string | null
}
const [servers, setServers] = createStore<Record<string, Server | undefined>>({});


export const avatarUrl = (item: {avatar?: string}): string | null => item?.avatar ? env.NERIMITY_CDN + item?.avatar : null;
export const bannerUrl = (item: {banner?: string}): string | null => item?.banner ? env.NERIMITY_CDN + item?.banner : null;



const set = (server: RawServer) => 
  setServers({
    ...servers,
    [server.id]: {
      ...server,
      get hasNotifications() {
        const channels = useChannels();

        const account = useAccount();
        const notificationPingMode = account.getServerSettings(this.id)?.notificationPingMode;
        if (notificationPingMode === ServerNotificationPingMode.MUTE) return false;
        
        return channels.getChannelsByServerId(server.id).some(channel => {
          const hasNotification = channel!.hasNotifications;
          if (hasNotification !== 'mention' && notificationPingMode === ServerNotificationPingMode.MENTIONS_ONLY ) return false;
          return hasNotification && channel?.type === ChannelType.SERVER_TEXT
        })
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
const emojis = createRoot(() => createMemo(() => orderedArray().map(s => (s.customEmojis.map(emoji => ({...emoji, serverId: s.id})))).flat()));

const emojisUpdatedDupName = createRoot(() => createMemo(() => {
  const uniqueNamedEmojis: RawCustomEmoji[] = [];
  const counts: {[key: string]: number} = {};
  
  for (let i = 0; i < emojis().length; i++) {
    const emoji = emojis()[i];
    let count = counts[emoji.name] || 0;
    const hasEmojiShortcode = emojiShortcodeToUnicode(emoji.name)
    if (hasEmojiShortcode) count++;
    const newName = count ? `${emoji.name}-${count}` : emoji.name;
    if (!hasEmojiShortcode) count++;
    counts[emoji.name] = count
    uniqueNamedEmojis.push({ ...emoji, name: newName });
  }
  return uniqueNamedEmojis;
}));


const customEmojiNamesToEmoji = createRoot(() => createMemo(() => {
  const obj: {[key: string]: RawCustomEmoji} = {};

  for (let index = 0; index < emojisUpdatedDupName().length; index++) {
    const emoji = emojisUpdatedDupName()[index];
    obj[emoji.name] = emoji;   
  }
  return obj;
}));


export default function useServers() {
  return {
    emojis,
    emojisUpdatedDupName,
    customEmojiNamesToEmoji,
    array,
    get,
    set,
    hasNotifications,
    orderedArray,
    remove
  }
}