import {createStore} from "solid-js/store";
import useChannels from "./useChannels";
import useAccount from "./useAccount";
import { ServerNotificationPingMode } from "../RawData";

export type Mention = {
  channelId: string;
  userId: string;
  count: number;
  serverId?: string;
}

// [channelId]: Mention
const [mentions, setMentions] = createStore<Record<string, Mention | undefined>>({});


const set = (mention: Mention) => {

  const channels = useChannels();
  const channel = channels.get(mention.channelId);
  const account = useAccount();
  
  if (channel?.serverId) {
    const notificationPingMode = account.getServerSettings(channel.serverId)?.notificationPingMode;
    if (notificationPingMode === ServerNotificationPingMode.MUTE) return;
  }

  setMentions(mention.channelId, mention);
};

const array = () => Object.values(mentions);
const get = (channelId: string) => mentions[channelId];

const getDmCount = (userId: string) => {
  const channels = useChannels();
  return array().find(m => {
    const channel = channels.get(m?.channelId!);
    return m?.userId === userId && (!channel || channel.recipientId);
  })?.count || 0; 
};

const remove = (channelId: string) => {
  setMentions(channelId, undefined);
};



export default function useMention() {
  return {
    array,
    set,
    get,
    getDmCount,
    remove
  };
}