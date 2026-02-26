import env from "@/common/env";
import { createStore, produce, reconcile } from "solid-js/store";
import {
  MessageType,
  RawMessage,
  RawMessageReaction,
  RawUser,
} from "../RawData";
import {
  fetchMessages,
  postMessage,
  updateMessage,
} from "../services/MessageService";
import socketClient from "../socketClient";
import useAccount from "./useAccount";
import useChannelProperties from "./useChannelProperties";
import useChannels from "./useChannels";
import { getGoogleAccessToken } from "../services/UserService";
import { uploadFileGoogleDrive } from "@/common/driveAPI";
import { batch } from "solid-js";
import { uploadAttachment } from "../services/nerimityCDNService";

const account = useAccount();

export enum MessageSentStatus {
  SENDING = 0,
  FAILED = 1,
}

export type Message = RawMessage & {
  tempId?: string;
  sentStatus?: MessageSentStatus;
  uploadingAttachment?: { file: File; progress: number; speed?: string };
  local?: boolean;
};

const [messages, setMessages] = createStore<
  Record<string, Message[] | undefined>
>({});
const fetchAndStoreMessages = async (channelId: string, force = false) => {
  if (!force && getMessagesByChannelId(channelId)) return;

  const channelProperties = useChannelProperties();
  channelProperties.setMoreTopToLoad(channelId, true);
  channelProperties.setMoreBottomToLoad(channelId, false);

  const newMessages = await fetchMessages(channelId);
  setMessages({
    [channelId]: newMessages,
  });
};

const loadMoreTopAndStoreMessages = async (
  channelId: string,
  beforeSet: () => void,
  afterSet: (data: { hasMore: boolean; data: RawMessage[] }) => void
) => {
  const channelMessages = messages[channelId]!;
  const newMessages = await fetchMessages(channelId, {
    beforeMessageId: channelMessages[0].id,
  });
  const clamp = sliceEnd([...newMessages, ...channelMessages]);
  const hasMore = newMessages.length === env.MESSAGE_LIMIT;

  beforeSet();
  if (newMessages.length) {
    setMessages({
      [channelId]: clamp,
    });
  }
  afterSet({ hasMore, data: newMessages });
};

const loadMoreBottomAndStoreMessages = async (
  channelId: string,
  beforeSet: () => void,
  afterSet: (data: { hasMore: boolean }) => void
) => {
  const channelMessages = messages[channelId]!;
  const newMessages = await fetchMessages(channelId, {
    afterMessageId: channelMessages[channelMessages.length - 1].id,
  });
  const clamp = sliceBeginning([...channelMessages, ...newMessages]);
  const hasMore = newMessages.length === env.MESSAGE_LIMIT;

  beforeSet();
  setMessages({
    [channelId]: clamp,
  });
  afterSet({ hasMore });
};

const loadAroundAndStoreMessages = async (
  channelId: string,
  aroundMessageId: string
) => {
  const newMessages = await fetchMessages(channelId, { aroundMessageId });

  setMessages({
    [channelId]: newMessages,
  });
};

function sliceEnd(arr: any[]) {
  return arr.slice(0, env.MESSAGE_LIMIT * 2);
}

function sliceBeginning(arr: any[]) {
  return arr.slice(-(env.MESSAGE_LIMIT * 2), arr.length);
}

const editAndStoreMessage = async (
  channelId: string,
  messageId: string,
  content: string
) => {
  const messages = get(channelId) || [];
  const index = messages.findIndex((m) => m.id === messageId);
  if (index < 0) return;
  if (messages[index].content === content) return;
  setMessages(channelId, index, {
    sentStatus: MessageSentStatus.SENDING,
    content,
  });

  await updateMessage({
    channelId,
    messageId,
    content,
  }).catch(() => {
    updateLocalMessage(
      { sentStatus: MessageSentStatus.FAILED },
      channelId,
      messageId
    );
  });
};

const updateLocalMessage = async (
  message: Partial<RawMessage & { sentStatus: MessageSentStatus }>,
  channelId: string,
  messageId: string
) => {
  const messages = get(channelId) || [];
  const index = messages.findIndex((m) => m.id === messageId);
  if (index < 0) return;
  setMessages(channelId, index, message);
};

const silentRegex = /^@silent([\s]|$)/;

const generateLocalId = () => `local-${Date.now()}-${Math.random()}`;

const sendAndStoreMessage = async (channelId: string, content?: string) => {
  const channels = useChannels();
  const channelProperties = useChannelProperties();
  const properties = channelProperties.get(channelId);
  const file = properties?.attachment?.file;
  const tempMessageId = generateLocalId();
  const channel = channels.get(channelId);

  const htmlMode = properties?.htmlEnabled;
  channelProperties.update(channelId, "htmlEnabled", false);

  if (properties?.selectedBotCommand && content) {
    const args = content?.split(" ");
    args[0] = `${args[0]}:${properties.selectedBotCommand.botUserId}`;
    content = args.join(" ");
    channelProperties.updateSelectedBotCommand(channelId, undefined);
  }

  const isSilent = !!content && silentRegex.test(content);

  if (content && isSilent) {
    if (content === "@silent") {
      content = undefined;
      if (!file) return;
    } else {
      content = content.replace(silentRegex, "").trim();
      if (!content && !file) return;
    }
  }

  const user = account.user();
  if (!user) return;

  const localMessage: Message = {
    id: tempMessageId,
    tempId: tempMessageId,
    silent: isSilent,
    channelId,
    content,
    createdAt: Date.now(),
    sentStatus: MessageSentStatus.SENDING,
    type: MessageType.CONTENT,
    ...(!properties?.attachment
      ? undefined
      : {
          uploadingAttachment: {
            file: properties.attachment.file,
            progress: 0,
          },
        }),
    reactions: [],
    roleMentions: [],
    quotedMessages: [],
    replyMessages:
      properties?.replyToMessages.map((m) => ({
        replyToMessage: { ...m },
      })) || [],
    createdBy: {
      profile: {
        font: user.profile?.font,
      },
      id: user.id,
      username: user.username,
      tag: user.tag,
      badges: user.badges,
      hexColor: user.hexColor,
      avatar: user.avatar,
    },
  };

  !properties?.moreBottomToLoad &&
    setMessages({
      [channelId]: sliceBeginning([...messages[channelId]!, localMessage]),
    });

  const onUploadProgress = (percent: number, speed?: string) => {
    const messageIndex = messages[channelId]!.findIndex(
      (m) => m.tempId === tempMessageId
    );
    if (messageIndex === -1) return;
    setMessages(channelId, messageIndex, "uploadingAttachment", {
      progress: percent,
      speed,
    });
  };

  const isImage = properties?.attachment?.file.type?.startsWith("image/");
  const isMoreThan12MB = file && file.size > 12 * 1024 * 1024;

  const shouldUploadToGoogleDrive =
    properties?.attachment?.uploadTo === "google_drive";
  const shouldUploadToNerimityCdn =
    properties?.attachment?.uploadTo === "nerimity_cdn";

  let googleDriveFileId: string | undefined;
  if (file && shouldUploadToGoogleDrive) {
    try {
      const accessToken = await getGoogleAccessToken();
      const res = await uploadFileGoogleDrive(
        file,
        accessToken.accessToken,
        onUploadProgress
      );
      googleDriveFileId = res.id;
    } catch (err: any) {
      channelProperties.updateContent(channelId, content || "");
      channelProperties.update(channelId, "htmlEnabled", htmlMode);
      channelProperties.setAttachment(channelId, file, "google_drive");
      pushFailedMessage(channelId, err.message || "Failed to upload File.");
      const index = messages[channelId]?.findIndex(
        (m) => m.tempId === tempMessageId
      );
      setMessages(channelId, index!, "sentStatus", MessageSentStatus.FAILED);
      return;
    }
  }

  const replyToMessageIds = properties?.replyToMessages?.map((m) => m.id) || [];
  const mentionReplies = properties?.mentionReplies;

  channelProperties.removeReplies(channelId);

  let nerimityCdnFileId: string | undefined;
  if (shouldUploadToNerimityCdn && file) {
    const data = await uploadAttachment(channelId, {
      file,
      onUploadProgress,
    }).catch((err) => {
      channelProperties.updateContent(channelId, content || "");
      channelProperties.update(channelId, "htmlEnabled", htmlMode);
      channelProperties.setAttachment(channelId, file, "nerimity_cdn");
      pushFailedMessage(channelId, err.message || "Failed to upload File. ");
      const index = messages[channelId]?.findIndex(
        (m) => m.tempId === tempMessageId
      );
      setMessages(channelId, index!, "sentStatus", MessageSentStatus.FAILED);
      return;
    });
    if (!data) {
      return;
    }
    nerimityCdnFileId = data.fileId;
  }

  const message: void | Message = await postMessage({
    ...(htmlMode ? { htmlEmbed: content } : { content }),
    silent: isSilent,
    channelId,
    socketId: socketClient.id(),
    replyToMessageIds,
    mentionReplies,
    nerimityCdnFileId,
    googleDriveAttachment: googleDriveFileId
      ? { id: googleDriveFileId, mime: file?.type! }
      : undefined,
    onUploadProgress,
  }).catch((err) => {
    console.log(err);

    if (err.slowMode) {
      if (channel?.slowModeSeconds) {
        channelProperties.updateSlowDownMode(channelId, {
          startedAt: Date.now(),
          ttl: err.ttl,
        });
      }
    }
    channelProperties.updateContent(channelId, content || "");
    channelProperties.update(channelId, "htmlEnabled", htmlMode);
    if (properties?.attachment) {
      channelProperties.setAttachment(
        channelId,
        file,
        properties?.attachment?.uploadTo
      );
    }
    pushFailedMessage(channelId, err.message || "Failed to send message. ");
  });

  if (message && channel?.slowModeSeconds) {
    channelProperties.updateSlowDownMode(message.channelId, {
      startedAt: message.createdAt,
      ttl: channel.slowModeSeconds * 1000,
    });
  }
  channel?.updateLastSeen(message?.createdAt! + 1);
  channel?.updateLastMessaged?.(message?.createdAt!);

  const index = messages[channelId]?.findIndex(
    (m) => m.tempId === tempMessageId
  );

  if (!message) {
    !properties?.moreBottomToLoad &&
      setMessages(channelId, index!, "sentStatus", MessageSentStatus.FAILED);
    return;
  }
  message.tempId = tempMessageId;

  !properties?.moreBottomToLoad &&
    setMessages(channelId, index!, reconcile(message, { key: "tempId" }));
};

const pushMessage = (channelId: string, message: Message) => {
  if (!messages[channelId]) return;
  const channelProperties = useChannelProperties();
  const properties = channelProperties.get(channelId);
  !properties?.moreBottomToLoad &&
    setMessages({
      [channelId]: sliceBeginning([...messages[channelId]!, message]),
    });
};

const pushFailedMessage = (channelId: string, content: string) => {
  pushMessage(channelId, {
    channelId: channelId,
    createdAt: Date.now(),
    createdBy: {
      username: "Nerimity",
      tag: "owo",
      badges: 0,
      hexColor: "0",
      id: "0",
    },
    reactions: [],
    roleMentions: [],
    quotedMessages: [],
    id: generateLocalId(),
    type: MessageType.CONTENT,
    local: true,
    content,
  });
};

const locallyRemoveMessage = (channelId: string, messageId: string) => {
  const channelMessages = messages[channelId];
  if (!channelMessages) return;
  const index = channelMessages.findIndex((m) => m.id === messageId);
  if (index === -1) return;
  setMessages(
    channelId,
    produce((messages) => messages?.splice(index, 1))
  );
};

const locallyRemoveServerMessagesBatch = (payload: {
  userId: string;
  serverId: string;
  fromTime: number;
  toTime: number;
}) => {
  const channels = useChannels();
  const channelProperties = useChannelProperties();
  const properties = channelProperties.get(payload.serverId);
  const serverChannels = channels.getChannelsByServerId(payload.serverId);
  if (!serverChannels) return;
  batch(() => {
    for (let i = 0; i < serverChannels.length; i++) {
      const channel = serverChannels[i]!;
      const channelMessages = messages[channel.id];
      if (!channelMessages) continue;
      const filteredMessages = channelMessages.filter((m) => {
        if (m.createdBy.id !== payload.userId) return true;
        if (m.createdAt < payload.fromTime) return false;
        if (m.createdAt > payload.toTime) return false;
      });

      setMessages(channel.id, reconcile(filteredMessages));
      if (!properties) return;
      channelProperties.setMoreTopToLoad(channel.id, true);
      channelProperties.setMoreBottomToLoad(channel.id, true);
    }
  });
};

const locallyRemoveMessagesBatch = (channelId: string, count: number) => {
  const channelMessages = messages[channelId];
  if (!channelMessages) return;
  setMessages(
    channelId,
    produce((messages) => messages?.splice(messages.length - count, count))
  );
};

const updateMessageReaction = (
  channelId: string,
  messageId: string,
  reaction: Partial<RawMessageReaction>
) => {
  const channelMessages = messages[channelId];
  if (!channelMessages) return;
  const index = channelMessages.findIndex((m) => m.id === messageId);
  if (index === -1) return;

  const message = channelMessages[index];
  const reactionIndex = message.reactions.findIndex((r) => {
    return r.emojiId === reaction.emojiId && r.name === reaction.name;
  });

  if (!reaction.count) {
    if (reactionIndex >= 0)
      return setMessages(
        channelId,
        index,
        "reactions",
        produce((arr) => arr.splice(reactionIndex, 1))
      );
  }

  if (reactionIndex >= 0) {
    return setMessages(channelId, index, "reactions", reactionIndex, reaction);
  }

  setMessages(
    channelId,
    index,
    "reactions",
    message.reactions.length,
    reaction
  );
};

const get = (channelId: string) => messages[channelId];

const getMessagesByChannelId = (channelId: string) => messages[channelId];

const deleteChannelMessages = (channelId: string) =>
  setMessages(channelId, undefined);

export default function useMessages() {
  return {
    getMessagesByChannelId,
    fetchAndStoreMessages,
    loadMoreTopAndStoreMessages,
    loadAroundAndStoreMessages,
    loadMoreBottomAndStoreMessages,
    editAndStoreMessage,
    sendAndStoreMessage,
    locallyRemoveMessage,
    pushMessage,
    deleteChannelMessages,
    get,
    updateLocalMessage,
    updateMessageReaction,
    locallyRemoveServerMessagesBatch,
  };
}
