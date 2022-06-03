import {createStore} from 'solid-js/store';
import { RawMessage } from '../RawData';
import { fetchMessages } from '../services/MessageService';



const [messages, setMessages] = createStore<Record<string, RawMessage[]>>({});

const fetchAndStoreMessages = async (channelId: string) => {
  if (getMessagesByChannelId(channelId)) return;
  const newMessages = await fetchMessages(channelId);
  setMessages({
    ...messages,
    [channelId]: newMessages
  });
  return () => getMessagesByChannelId(channelId);
}

const get = (channelId: string) => messages[channelId]


const getMessagesByChannelId = (channelId: string) => messages[channelId];

export default function useMessages() {
  return {
    getMessagesByChannelId,
    fetchAndStoreMessages,
    get,
  }
}