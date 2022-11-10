
import env from '../../common/env';
import { RawFriend } from '../RawData';
import { request } from './Request';
import Endpoints from './ServiceEndpoints';



export const getServers = async (limit: number, afterId?: string) => {
  const data = await request<any[]>({
    method: 'GET',
    params: {
      ...(afterId ? {after: afterId} : undefined),
      limit
    },
    url: env.SERVER_URL + "/api/moderation/servers",
    useToken: true,
  });
  return data;
};

export const getUsers = async (limit: number, afterId?: string) => {
  const data = await request<any[]>({
    method: 'GET',
    params: {
      ...(afterId ? {after: afterId} : undefined),
      limit
    },
    url: env.SERVER_URL + "/api/moderation/users",
    useToken: true,
  });
  return data;
};

export const suspendUsers = async (confirmPassword: string, userIds: string[], days: number, reason?: string) => {
  const data = await request<any[]>({
    method: 'post',
    body: {
      userIds,
      days,
      reason,
      password: confirmPassword
    },
    url: env.SERVER_URL + "/api/moderation/users/suspend",
    useToken: true,
  });
  return data;
};

export const getOnlineUsers = async () => {
  const data = await request<any[]>({
    method: 'GET',
    url: env.SERVER_URL + "/api/moderation/online-users",
    useToken: true,
  });
  return data;
};