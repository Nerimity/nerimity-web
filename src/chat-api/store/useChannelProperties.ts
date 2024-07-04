import {createStore} from "solid-js/store";
import { Message } from "./useMessages";
import { RawMessage } from "../RawData";

export type ChannelProperties = {
  content: string;
  editMessageId?: string;

  replyToMessages: RawMessage[];
  mentionReplies?: boolean;

  attachment?: File;

  isScrolledBottom: boolean;
  scrollTop?: number;
  
  moreTopToLoad?: boolean;
  moreBottomToLoad?: boolean;

}

const [properties, setChannelProperties] = createStore<Record<string, ChannelProperties>>({});

const initIfMissing = (channelId: string) => {
  if (properties[channelId]) return;
  setChannelProperties(channelId, {
    content: "",
    isScrolledBottom: false,
    replyToMessages: [],
  });
};

const addReply = (channelId: string, message: RawMessage) => {
  initIfMissing(channelId);
  const property = get(channelId)!;
  if (property.replyToMessages.length >= 5) return;
  if (property.replyToMessages.find(m => m.id === message.id)) return;
  setChannelProperties(channelId, { 
    replyToMessages: [message, ...property.replyToMessages],
    ...(!property.replyToMessages.length ? {mentionReplies: true} : {})
   });
}

const removeReply = (channelId: string, messageId: string) => {
  const property = get(channelId)!;
  setChannelProperties(channelId, { replyToMessages: property.replyToMessages.filter(m => m.id !== messageId) });
}

const removeReplies = (channelId: string) => {
  setChannelProperties(channelId, { replyToMessages: [], mentionReplies: true });
}

const toggleMentionReplies = (channelId: string) => {
  initIfMissing(channelId);
  const property = get(channelId)!;
  setChannelProperties(channelId, { mentionReplies: !property.mentionReplies });
}

const updateContent = (channelId: string, content: string) => {
  initIfMissing(channelId);
  setChannelProperties(channelId, "content", content);
};

const get = (channelId: string) => properties[channelId] as ChannelProperties | undefined;

const setEditMessage = (channelId: string, message?: Message) => {
  initIfMissing(channelId);
  if (!message && !get(channelId)?.editMessageId) return;
  setChannelProperties(channelId, {
    editMessageId: message?.id,
    content: message?.content || ""
  });
};

const setAttachment = (channelId: string, file?: File) => {
  initIfMissing(channelId);
  setChannelProperties(channelId, {
    attachment: file
  });
};

const setScrollTop = (channelId: string, scrollTop: number) => {
  initIfMissing(channelId);
  const isScrolledBottom = get(channelId)?.isScrolledBottom;
  setChannelProperties(channelId, { scrollTop: !isScrolledBottom ? scrollTop : undefined });
};
const setScrolledBottom = (channelId: string, isScrolledBottom: boolean) => {
  initIfMissing(channelId);
  setChannelProperties(channelId, { isScrolledBottom });
};

const setMoreTopToLoad = (channelId: string, value: boolean) => {
  setChannelProperties(channelId, { moreTopToLoad: value});
};

const setMoreBottomToLoad = (channelId: string, value: boolean) => {
  setChannelProperties(channelId, { moreBottomToLoad: value});
};


export default function useChannelProperties() {
  return {
    updateContent,
    get,
    setEditMessage,
    setAttachment,
    setScrollTop,
    setScrolledBottom,
    setMoreTopToLoad,
    setMoreBottomToLoad,
    addReply,
    removeReply,
    removeReplies,
    toggleMentionReplies
  };
}