import {createStore} from 'solid-js/store';
import { Message } from './useMessages';

export type ChannelProperties = {
  content: string;
  editMessageId?: string;
  isScrolledBottom: boolean;
  scrollTop?: number;
}

const [properties, setChannelProperties] = createStore<Record<string, ChannelProperties>>({});

const initIfMissing = (channelId: string) => {
  if (properties[channelId]) return;
  setChannelProperties(channelId, {content: '', isScrolledBottom: false})
}

const updateContent = (channelId: string, content: string) => {
  initIfMissing(channelId)
  setChannelProperties(channelId, 'content', content);
}

const get = (channelId: string) => properties[channelId] as ChannelProperties | undefined;

const setEditMessage = (channelId: string, message?: Message) => {
  initIfMissing(channelId)
  setChannelProperties(channelId, {
    editMessageId: message?.id,
    content: message?.content || '',
  });
}

const setScrollTop = (channelId: string, scrollTop: number) => {
  initIfMissing(channelId);
  if (scrollTop === 0) {
    console.log(scrollTop, channelId)
  }
  const isScrolledBottom = get(channelId)?.isScrolledBottom;
  setChannelProperties(channelId, { scrollTop: !isScrolledBottom ? scrollTop : undefined });
}
const setScrolledBottom = (channelId: string, isScrolledBottom: boolean) => {
  initIfMissing(channelId);
  setChannelProperties(channelId, { isScrolledBottom });
}


export default function useChannelProperties() {
  return {
    updateContent,
    get,
    setEditMessage,
    setScrollTop,
    setScrolledBottom
  }
}