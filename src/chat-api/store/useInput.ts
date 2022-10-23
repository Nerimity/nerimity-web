import {createStore} from 'solid-js/store';
import useChannels from './useChannels';

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

const setEditMessageId = (channelId: string, messageId?: string) => {
  if (!inputs[channelId]) {
    setInputs(channelId, {editMessageId: messageId})
    return
  }
  setInputs(channelId, 'editMessageId', messageId);
}


export default function useInput() {
  return {
    updateContent,
    getInput,
    setEditMessageId
  }
}