
import env from '../../common/env';
import { RawFriend, RawUser } from '../RawData';
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
    method: 'POST',
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

export const updateServer = async (serverId: string, update: {name?: string, verified?: boolean, password?: string}) => {
  const data = await request<any[]>({
    method: 'POST',
    body: update,
    url: env.SERVER_URL + `/api/moderation/servers/${serverId}`,
    useToken: true,
  });
  return data;
};

export const getServer = async (serverId: string) => {
  const data = await request<any[]>({
    method: 'GET',
    url: env.SERVER_URL + `/api/moderation/servers/${serverId}`,
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


export interface ModerationUser {
  email: string;
  user: RawUser
}

export const updateUser = async (userId: string, update: {email?: string, username?: string, tag?: string}) => {
  const data = await request<any[]>({
    method: 'POST',
    body: update,
    url: env.SERVER_URL + `/api/moderation/users/${userId}`,
    useToken: true,
  });
  return data;
};

export const getUser = async (userId: string) => {
  const data = await request<ModerationUser>({
    method: 'GET',
    url: env.SERVER_URL + `/api/moderation/users/${userId}`,
    useToken: true,
  });
  return data;
};

export interface ModerationStats {
  totalRegisteredUsers: number,
  weeklyRegisteredUsers: number,
  totalCreatedServers: number,
  totalCreatedMessages: number,
  weeklyCreatedMessages: number,
}

export const getStats = async () => {
  const data = await request<ModerationStats>({
    method: 'GET',
    url: env.SERVER_URL + `/api/moderation/stats`,
    useToken: true,
  });
  return data;
};
