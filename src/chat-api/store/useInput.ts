import {createStore} from 'solid-js/store';
import useChannels from './useChannels';
import { Message } from './useMessages';

export type Input = {
  content: string;
  editMessageId?: string
}

const [inputs, setInputs] = createStore<Record<string, Input>>({});


const updateContent = (channelId: string, content: string) => {
  if (!inputs[channelId]) {
    setInputs(channelId, {content})
    return
  }
  setInputs(channelId, 'content', content);
}
const getInput = (channelId: string) => inputs[channelId] as Input | undefined;

const setEditMessage = (channelId: string, message?: Message) => {
  if (!inputs[channelId]) {
    setInputs(channelId, {editMessageId: message?.id, content: message?.content || ''})
    return
  }
  setInputs(channelId, 'editMessageId', message?.id);
  setInputs(channelId, 'content', message?.content || '');
}


export default function useInput() {
  return {
    updateContent,
    getInput,
    setEditMessage
  }
}