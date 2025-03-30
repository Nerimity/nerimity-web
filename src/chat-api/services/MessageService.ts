import env from "../../common/env";
import { RawAttachment, RawMessage, RawUser } from "../RawData";
import { uploadAttachment } from "./nerimityCDNService";
import { request, xhrRequest } from "./Request";
import Endpoints from "./ServiceEndpoints";

interface FetchMessageOpts {
  limit?: number;
  beforeMessageId?: string;
  aroundMessageId?: string;
  afterMessageId?: string;
}

export const fetchMessages = async (
  channelId: string,
  opts?: FetchMessageOpts
) => {
  const data = await request<RawMessage[]>({
    method: "GET",
    url: env.SERVER_URL + "/api" + Endpoints.messages(channelId),
    params: {
      limit: opts?.limit || env.MESSAGE_LIMIT,
      ...(opts?.afterMessageId ? { after: opts.afterMessageId } : undefined),
      ...(opts?.beforeMessageId ? { before: opts.beforeMessageId } : undefined),
      ...(opts?.aroundMessageId ? { around: opts.aroundMessageId } : undefined),
    },
    useToken: true,
  });
  return data;
};

export const fetchChannelAttachments = async (
  channelId: string,
  limit = 50,
  afterAttachmentId?: string,
  beforeAttachmentId?: string
) => {
  const data = await request<RawAttachment[]>({
    method: "GET",
    url: env.SERVER_URL + "/api" + Endpoints.channelAttachments(channelId),
    params: {
      limit,
      ...(afterAttachmentId ? { after: afterAttachmentId } : undefined),
      ...(beforeAttachmentId ? { before: beforeAttachmentId } : undefined),
    },
    useToken: true,
  });
  return data;
};

interface PostMessageOpts {
  content?: string;
  channelId: string;
  socketId?: string;
  replyToMessageIds?: string[];
  mentionReplies?: boolean;
  silent?: boolean;
  nerimityCdnFileId?: string;
  googleDriveAttachment?: {
    id: string;
    mime: string;
  };
  onUploadProgress?: (progress: number) => void;
}

export const postMessage = async (opts: PostMessageOpts) => {
  const body: any = {
    content: opts.content?.trim() || undefined,

    ...(opts.silent ? { silent: true } : {}),

    ...(opts.replyToMessageIds?.length
      ? {
        replyToMessageIds: opts.replyToMessageIds,
        mentionReplies: opts.mentionReplies,
      }
      : {}),

    ...(opts.nerimityCdnFileId ? { nerimityCdnFileId: opts.nerimityCdnFileId } : {}),

    ...(opts.googleDriveAttachment
      ? { googleDriveAttachment: opts.googleDriveAttachment }
      : {}),
    ...(opts.socketId ? { socketId: opts.socketId } : {}),
  };



  const data = await request<RawMessage>({
    method: "POST",
    url: env.SERVER_URL + "/api" + Endpoints.messages(opts.channelId),
    useToken: true,
    body,
  });
  return data;
};
interface UpdateMessageOpts {
  content: string;
  channelId: string;
  messageId: string;
}


interface MarkMessageUnreadOpts {
  channelId: string;
  messageId: string;
}

export const markMessageUnread = async (opts: MarkMessageUnreadOpts) => {
  const data = await request<Partial<{ status: boolean }>>({
    method: "POST",
    url:
      env.SERVER_URL +
      "/api" +
      Endpoints.message(opts.channelId, opts.messageId) + "/mark-unread",
    useToken: true,
  });
  return data;
};
export const updateMessage = async (opts: UpdateMessageOpts) => {
  const data = await request<Partial<{ updated: RawMessage }>>({
    method: "PATCH",
    url:
      env.SERVER_URL +
      "/api" +
      Endpoints.message(opts.channelId, opts.messageId),
    useToken: true,
    body: {
      content: opts.content,
    },
  });
  return data;
};

export const postChannelTyping = async (channelId: string) => {
  const data = await request<RawMessage>({
    method: "POST",
    url: env.SERVER_URL + "/api" + Endpoints.channelTyping(channelId),
    useToken: true,
    notJSON: true,
  });
  return data;
};

interface DeleteMessageOpts {
  channelId: string;
  messageId: string;
}

export const deleteMessage = async (opts: DeleteMessageOpts) => {
  const data = await request<{ message: string }>({
    method: "DELETE",
    url:
      env.SERVER_URL +
      "/api" +
      Endpoints.message(opts.channelId, opts.messageId),
    useToken: true,
  });
  return data;
};
export const addMessageReaction = async (opts: {
  channelId: string;
  messageId: string;
  name: string;
  emojiId?: string | null;
  gif?: boolean;
}) => {
  const data = await request<any>({
    method: "POST",
    url:
      env.SERVER_URL +
      "/api" +
      Endpoints.message(opts.channelId, opts.messageId) +
      "/reactions",
    body: {
      name: opts.name,
      emojiId: opts.emojiId,
      gif: opts.gif,
    },
    useToken: true,
  });
  return data;
};
export const removeMessageReaction = async (opts: {
  channelId: string;
  messageId: string;
  name: string;
  emojiId?: string | null;
}) => {
  const data = await request<any>({
    method: "POST",
    url:
      env.SERVER_URL +
      "/api" +
      Endpoints.message(opts.channelId, opts.messageId) +
      "/reactions/remove",
    body: {
      name: opts.name,
      emojiId: opts.emojiId,
    },
    useToken: true,
  });
  return data;
};

export interface ReactedUser {
  reactedAt: number;
  user: RawUser;
}

export const fetchMessageReactedUsers = async (opts: {
  limit?: number;
  channelId: string;
  messageId: string;
  name: string;
  emojiId?: string | null;
}) => {
  const data = await request<ReactedUser[]>({
    method: "GET",
    url:
      env.SERVER_URL +
      "/api" +
      Endpoints.message(opts.channelId, opts.messageId) +
      "/reactions/users",
    params: {
      name: opts.name,
      ...(opts.limit ? { limit: opts.limit } : undefined),
      ...(opts.emojiId ? { emojiId: opts.emojiId } : undefined),
    },
    useToken: true,
  });
  return data;
};

export const messageButtonClick = async (
  channelId: string,
  messageId: string,
  buttonId: string
) => {
  const data = await request({
    method: "POST",
    url:
      env.SERVER_URL +
      "/api" +
      Endpoints.message(channelId, messageId) +
      "/buttons/" +
      buttonId,
    useToken: true,
    notJSON: true,
  });
  return data;
};
