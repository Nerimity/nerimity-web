import {createStore} from 'solid-js/store';
import useChannels from './useChannels';

export type Mention = {
  channelId: string;
  userId: string;
  count: number;
}

const [mentions, setMentions] = createStore<Record<string, Mention | undefined>>({});


const set = (mention: Mention) => {
  setMentions(mention.channelId, mention);
}

const array = () => Object.values(mentions);
const get = (channelId: string) => mentions[channelId];

const getDmCount = (userId: string) => {
  const channels = useChannels();
  return array().find(m => {
    const channel = channels.get(m?.channelId!);
    return m?.userId === userId && (!channel || channel.recipientId)
  })?.count || 0; 
}

const remove = (channelId: string) => {
  setMentions(channelId, undefined);
}



export default function useMention() {
  return {
    array,
    set,
    get,
    getDmCount,
    remove
  }
}