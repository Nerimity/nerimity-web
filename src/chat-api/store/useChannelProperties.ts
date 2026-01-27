import { createStore, SetStoreFunction } from "solid-js/store";
import { Message } from "./useMessages";
import { RawAttachment, RawBotCommand, RawMessage } from "../RawData";
import { batch } from "solid-js";

export type ChannelProperties = {
  content: string;
  editMessageId?: string;

  replyToMessages: RawMessage[];
  mentionReplies?: boolean;

  attachment?: {
    file: File;
    uploadTo: "google_drive" | "nerimity_cdn";
  };

  scrollTop?: number;

  isScrolledBottom: boolean;

  moreTopToLoad?: boolean;
  moreBottomToLoad?: boolean;

  slowDownMode?: {
    ttl: number;
    startedAt: number;
  };

  stale?: boolean;
  selectedBotCommand?: RawBotCommand;
  // advanced markup html
  htmlEnabled?: boolean;
};

const [properties, setChannelProperties] = createStore<
  Record<string, ChannelProperties>
>({});

const staleAll = () => {
  batch(() => {
    for (const channelId in properties) {
      setChannelProperties(channelId, { stale: true });
    }
  });
};

const updateStale = (channelId: string, stale: boolean) => {
  setChannelProperties(channelId, { stale });
};

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
  if (property.replyToMessages.find((m) => m.id === message.id)) {
    // toggle it
    removeReply(channelId, message.id);
    return;
  }
  setChannelProperties(channelId, {
    replyToMessages: [...property.replyToMessages, message],
    ...(!property.replyToMessages.length ? { mentionReplies: true } : {}),
  });
};

const removeReply = (channelId: string, messageId: string) => {
  const property = get(channelId)!;
  setChannelProperties(channelId, {
    replyToMessages: property.replyToMessages.filter((m) => m.id !== messageId),
  });
};

const removeReplies = (channelId: string) => {
  setChannelProperties(channelId, {
    replyToMessages: [],
    mentionReplies: true,
  });
};

const toggleMentionReplies = (channelId: string) => {
  initIfMissing(channelId);
  const property = get(channelId)!;
  setChannelProperties(channelId, { mentionReplies: !property.mentionReplies });
};

const updateContent = (channelId: string, content: string) => {
  initIfMissing(channelId);
  setChannelProperties(channelId, "content", content);
};

const update: SetStoreFunction<Record<string, ChannelProperties>> = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...args: any
) => {
  initIfMissing(args[0]);
  setChannelProperties(...(args as ["1", "content", "test"]));
};

const get = (channelId: string) =>
  properties[channelId] as ChannelProperties | undefined;

const setEditMessage = (channelId: string, message?: Message) => {
  initIfMissing(channelId);
  if (!message && !get(channelId)?.editMessageId) return;
  setChannelProperties(channelId, {
    editMessageId: message?.id,
    content: message?.content || "",
  });
};

const setAttachment = (
  channelId: string,
  file?: File,
  uploadTo?: "google_drive" | "nerimity_cdn",
) => {
  initIfMissing(channelId);
  if (!file && !uploadTo) {
    setChannelProperties(channelId, "attachment", undefined);
    return;
  }

  const isMoreThan50MB = file && file.size > 50 * 1024 * 1024;

  const _uploadTo =
    uploadTo || (isMoreThan50MB ? "google_drive" : "nerimity_cdn");

  setChannelProperties(channelId, "attachment", {
    ...(file ? { file } : undefined),
    uploadTo: _uploadTo,
  });
};

const setScrollTop = (channelId: string, scrollTop: number) => {
  initIfMissing(channelId);
  const isScrolledBottom = get(channelId)?.isScrolledBottom;
  setChannelProperties(channelId, {
    scrollTop: !isScrolledBottom ? scrollTop : undefined,
  });
};
const setScrolledBottom = (channelId: string, isScrolledBottom: boolean) => {
  initIfMissing(channelId);
  setChannelProperties(channelId, { isScrolledBottom });
};

const setMoreTopToLoad = (channelId: string, value: boolean) => {
  initIfMissing(channelId);
  setChannelProperties(channelId, { moreTopToLoad: value });
};

const setMoreBottomToLoad = (channelId: string, value: boolean) => {
  initIfMissing(channelId);
  setChannelProperties(channelId, { moreBottomToLoad: value });
};

const updateSlowDownMode = (
  channelId: string,
  slowDownMode?: { ttl: number; startedAt: number },
) => {
  if (!get(channelId)) return;
  setChannelProperties(channelId, "slowDownMode", slowDownMode);
};

const updateSelectedBotCommand = (
  channelId: string,
  botCommand?: RawBotCommand,
) => {
  if (!get(channelId)) return;
  setChannelProperties(channelId, "selectedBotCommand", botCommand);
};

export default function useChannelProperties() {
  return {
    update,
    updateContent,
    get,
    setEditMessage,
    setAttachment,
    setScrollTop,
    updateStale,
    setScrolledBottom,
    setMoreTopToLoad,
    setMoreBottomToLoad,
    addReply,
    removeReply,
    removeReplies,
    toggleMentionReplies,
    staleAll,
    updateSlowDownMode,
    updateSelectedBotCommand,
  };
}
