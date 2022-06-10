import env from '../../common/env';
import { RawMessage } from '../RawData';
import { request } from './Request';
import Endpoints from './ServiceEndpoints';




export const fetchMessages = async (channelId: string) => {
  const data = await request<RawMessage[]>({
    method: 'GET',
    url: env.SERVER_URL + "/api" + Endpoints.messages(channelId),
    useToken: true
  });
  return data;
};

interface PostMessageOpts {
  content: string;
  channelId: string;
  socketId?: string;
}

export const postMessage = async (opts: PostMessageOpts) => {
  const data = await request<RawMessage>({
    method: 'POST',
    url: env.SERVER_URL + "/api" + Endpoints.messages(opts.channelId),
    useToken: true,
    body: {
      content: opts.content,
      ...(opts.socketId ? { socketId: opts.socketId } : {}),
    }
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