import {createStore, produce, reconcile} from 'solid-js/store';
import { MessageType, RawMessage } from '../RawData';
import { fetchMessages, postMessage } from '../services/MessageService';
import socketClient from '../socketClient';
import useAccount from './useAccount';
import useChannels from './useChannels';

const account = useAccount();

export enum MessageSentStatus {
  SENDING = 0,
  FAILED = 1,
}

export type Message = RawMessage & {
  tempId?: string;
  sentStatus?: MessageSentStatus;
}

const [messages, setMessages] = createStore<Record<string, Message[]>>({});

const fetchAndStoreMessages = async (channelId: string) => {
  if (getMessagesByChannelId(channelId)) return;
  const newMessages = await fetchMessages(channelId);
  setMessages({
    [channelId]: newMessages
  });
}

const sendAndStoreMessage = async (channelId: string, content: string) => {
  const channels = useChannels();
  const tempMessageId = `${Date.now()}-${Math.random()}`;
  const channel = channels.get(channelId);

  const user = account.user();
  if (!user) return;

  const localMessage: Message = {
    _id: "",
    tempId: tempMessageId,
    channel: channelId,
    content,
    createdAt: Date.now(),
    sentStatus: MessageSentStatus.SENDING,
    type: MessageType.CONTENT,
    createdBy: {
      _id: user._id,
      username: user.username,
      tag: user.tag,
      hexColor: user.hexColor,
    },
  };

  setMessages(channelId, messages[channelId].length, localMessage);

  const message: void | Message = await postMessage({
    content,
    channelId,
    socketId: socketClient.id(),
  }).catch(() => {
    console.log("failed to send message");
  });
  channel.updateLastSeen(Date.now());
  channel?.updateLastMessaged?.(message?.createdAt!);

  const index = messages[channelId].findIndex(m => m.tempId === tempMessageId);

  if (!message) {
    setMessages(channelId, index, 'sentStatus', MessageSentStatus.FAILED);
    return;
  }
  message.tempId = tempMessageId;
  setMessages(channelId, index, reconcile(message));

}


const pushMessage = (channelId: string, message: Message) => {
  if (!messages[channelId]) return;
  setMessages(channelId, messages[channelId].length, message);
  
};

const locallyRemoveMessage = (channelId: string, messageId: string) => {
  const channelMessages = messages[channelId];
  if (!channelMessages) return;
  const index = channelMessages.findIndex(m => m._id === messageId);
  if (index === -1) return;
  setMessages(channelId, produce(messages => messages.splice(index, 1)));
}

const get = (channelId: string) => messages[channelId]


const getMessagesByChannelId = (channelId: string) => messages[channelId];

export default function useMessages() {
  return {
    getMessagesByChannelId,
    fetchAndStoreMessages,
    sendAndStoreMessage,
    locallyRemoveMessage,
    pushMessage,
    get,
  }
}