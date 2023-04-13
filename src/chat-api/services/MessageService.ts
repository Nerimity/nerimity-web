import env from '../../common/env';
import { RawMessage } from '../RawData';
import { request } from './Request';
import Endpoints from './ServiceEndpoints';




export const fetchMessages = async (channelId: string, limit = 50, afterMessageId?: string, beforeMessageId?: string) => {
  const data = await request<RawMessage[]>({
    method: 'GET',
    url: env.SERVER_URL + "/api" + Endpoints.messages(channelId),
    params: {
      limit,
      ...(afterMessageId ? {after: afterMessageId}: undefined),
      ...(beforeMessageId ? {before: beforeMessageId}: undefined)
    },
    useToken: true
  });
  return data;
};

interface PostMessageOpts {
  content: string;
  channelId: string;
  socketId?: string;
  attachment?: File
}

export const postMessage = async (opts: PostMessageOpts) => {

  let body: any = {
    content: opts.content,
    ...(opts.socketId ? { socketId: opts.socketId } : {}),
  }

  if (opts.attachment) {
    const fd = new FormData();
    fd.append('content', opts.content);
    if (opts.socketId) {
      fd.append('socketId', opts.socketId);
    }
    fd.append('attachment', opts.attachment);
    body = fd;
  }

  const data = await request<RawMessage>({
    method: 'POST',
    url: env.SERVER_URL + "/api" + Endpoints.messages(opts.channelId),
    useToken: true,
    body
  });
  return data;
};

interface UpdateMessageOpts {
  content: string,
  channelId: string,
  messageId: string,
}

export const updateMessage = async (opts: UpdateMessageOpts) => {
  const data = await request<Partial<{updated: RawMessage}>>({
    method: 'PATCH',
    url: env.SERVER_URL + "/api" + Endpoints.message(opts.channelId, opts.messageId),
    useToken: true,
    body: {
      content: opts.content,
    }
  });
  return data;
};

export const postChannelTyping = async (channelId: string) => {
  const data = await request<RawMessage>({
    method: 'POST',
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
  const data = await request<{message: string}>({
    method: 'DELETE',
    url: env.SERVER_URL + "/api" + Endpoints.message(opts.channelId, opts.messageId),
    useToken: true,
  });
  return data;
};