import env from "../../common/env";
import {
  RawApplication,
  RawChannel,
  RawFriend,
  RawMessage,
  RawServer,
  RawTicket,
  RawUser,
  TicketStatus,
} from "../RawData";
import { request } from "./Request";
import Endpoints from "./ServiceEndpoints";

interface GetTicketsOpts {
  limit: number;
  afterId?: string;
  status?: TicketStatus;
}

export const getModerationTickets = async (opts: GetTicketsOpts) => {
  const data = await request<RawTicket[]>({
    method: "GET",
    params: {
      ...(opts.afterId ? { after: opts.afterId } : undefined),
      ...(opts.status !== undefined ? { status: opts.status } : undefined),
      limit: opts.limit,
    },
    url: env.SERVER_URL + "/api/moderation/tickets",
    useToken: true,
  });
  return data;
};
export const getModerationTicket = async (id: string) => {
  const data = await request<RawTicket>({
    method: "GET",
    url: env.SERVER_URL + `/api/moderation/tickets/${id}`,
    useToken: true,
  });
  return data;
};

export const updateModerationTicket = async (
  id: string,
  status: TicketStatus
) => {
  const data = await request<RawTicket>({
    method: "POST",
    url: env.SERVER_URL + `/api/moderation/tickets/${id}`,
    body: { status },
    useToken: true,
  });
  return data;
};

export const getServers = async (limit: number, afterId?: string) => {
  const data = await request<any[]>({
    method: "GET",
    params: {
      ...(afterId ? { after: afterId } : undefined),
      limit,
    },
    url: env.SERVER_URL + "/api/moderation/servers",
    useToken: true,
  });
  return data;
};
export const getPosts = async (limit: number, afterId?: string) => {
  const data = await request<any[]>({
    method: "GET",
    params: {
      ...(afterId ? { after: afterId } : undefined),
      limit,
    },
    url: env.SERVER_URL + "/api/moderation/posts",
    useToken: true,
  });
  return data;
};
export const getMessages = async (channelId: string, messageId: string) => {
  const data = await request<{ messages: RawMessage[]; channel: RawChannel }>({
    method: "GET",
    url:
      env.SERVER_URL + "/api/moderation/channels/" + channelId + "/messages/",
    params: {
      aroundId: messageId,
    },
    useToken: true,
  });
  return data;
};

export const searchPosts = async (
  query: string,
  limit: number,
  afterId?: string
) => {
  const data = await request<any[]>({
    method: "GET",
    params: {
      q: query,
      ...(afterId ? { after: afterId } : undefined),
      limit,
    },
    url: env.SERVER_URL + "/api/moderation/posts/search",
    useToken: true,
  });
  return data;
};

export const deletePosts = async (
  confirmPassword: string,
  postIds: string[]
) => {
  const data = await request<any[]>({
    method: "POST",
    body: {
      postIds,
      password: confirmPassword,
    },
    url: env.SERVER_URL + "/api/moderation/posts/delete",
    useToken: true,
  });
  return data;
};
export const addAnnouncePost = async (
  confirmPassword: string,
  postId: string
) => {
  const data = await request<any[]>({
    method: "POST",
    body: {
      password: confirmPassword,
    },
    url: env.SERVER_URL + `/api/moderation/posts/${postId}/announcement`,
    useToken: true,
  });
  return data;
};
export const removeAnnouncePost = async (
  confirmPassword: string,
  postId: string
) => {
  const data = await request<any[]>({
    method: "DELETE",
    body: {
      password: confirmPassword,
    },
    url: env.SERVER_URL + `/api/moderation/posts/${postId}/announcement`,
    useToken: true,
  });
  return data;
};

export const getUsers = async (limit: number, afterId?: string) => {
  const data = await request<any[]>({
    method: "GET",
    params: {
      ...(afterId ? { after: afterId } : undefined),
      limit,
    },
    url: env.SERVER_URL + "/api/moderation/users",
    useToken: true,
  });
  return data;
};
export const getUsersWithSameIPAddress = async (
  userId: string,
  limit: number,
  afterId?: string
) => {
  const data = await request<any[]>({
    method: "GET",
    params: {
      ...(afterId ? { after: afterId } : undefined),
      limit,
    },
    url: env.SERVER_URL + `/api/moderation/users/${userId}/users-with-same-ip`,
    useToken: true,
  });
  return data;
};

export const searchUsers = async (
  query: string,
  limit: number,
  afterId?: string
) => {
  const data = await request<any[]>({
    method: "GET",
    params: {
      q: query,
      ...(afterId ? { after: afterId } : undefined),
      limit,
    },
    url: env.SERVER_URL + "/api/moderation/users/search",
    useToken: true,
  });
  return data;
};

export const AuditLogType = {
  userSuspend: 0,
  userUnsuspend: 1,
  userUpdate: 2,
  serverDelete: 3,
  serverUpdate: 4,
  postDelete: 5,
  userSuspendUpdate: 6,
  userWarned: 7,
  ipBan: 8,
  serverUndoDelete: 9,
  userShadowBanned: 10,
  userShadowUnbanned: 11,
} as const;

export interface AuditLog {
  id: string;
  createdAt: number;

  actionById: string;
  actionBy: RawUser;
  actionType: (typeof AuditLogType)[keyof typeof AuditLogType];

  serverName?: string;
  serverId?: string;

  channelId?: string;
  channelName?: string;

  userId?: string;
  username?: string;

  ipAddress?: string;
  count?: number;
  reason?: string;
  expireAt?: number;
}
interface getAuditLogOpts {
  search?: string;
  limit: number;
  afterId?: string;
}
export const getAuditLog = async ({
  limit,
  afterId,
  search,
}: getAuditLogOpts) => {
  const data = await request<AuditLog[]>({
    method: "GET",
    params: {
      ...(afterId ? { after: afterId } : undefined),
      ...(search ? { q: search } : undefined),
      limit,
    },
    url:
      env.SERVER_URL + "/api/moderation/audit-logs" + (search ? "/search" : ""),
    useToken: true,
  });
  return data;
};

export const searchServers = async (
  query: string,
  limit: number,
  afterId?: string
) => {
  const data = await request<any[]>({
    method: "GET",
    params: {
      q: query,
      ...(afterId ? { after: afterId } : undefined),
      limit,
    },
    url: env.SERVER_URL + "/api/moderation/servers/search",
    useToken: true,
  });
  return data;
};

export const deleteServer = async (
  serverId: string,
  confirmPassword: string,
  reason: string
) => {
  const data = await request<any[]>({
    method: "DELETE",
    body: {
      password: confirmPassword,
      reason,
    },
    url: env.SERVER_URL + `/api/moderation/servers/${serverId}`,
    useToken: true,
  });
  return data;
};

export const pinServer = async (serverId: string) => {
  const data = await request<any[]>({
    method: "POST",
    url: env.SERVER_URL + `/api/moderation/servers/${serverId}/pin`,
    useToken: true,
  });
  return data;
};
export const unpinServer = async (serverId: string) => {
  const data = await request<any[]>({
    method: "DELETE",
    url: env.SERVER_URL + `/api/moderation/servers/${serverId}/pin`,
    useToken: true,
  });
  return data;
};

export const undoDeleteServer = async (
  serverId: string,
  confirmPassword: string
) => {
  const data = await request<any[]>({
    method: "DELETE",
    body: {
      password: confirmPassword,
    },
    url: env.SERVER_URL + `/api/moderation/servers/${serverId}/schedule-delete`,
    useToken: true,
  });
  return data;
};

interface SuspendUsersOpts {
  confirmPassword: string;
  userIds: string[];
  days: number;
  reason?: string;
  ipBan?: boolean;
  deleteRecentMessages?: boolean;
}

export const suspendUsers = async (opts: SuspendUsersOpts) => {
  const data = await request<any[]>({
    method: "POST",
    body: {
      userIds: opts.userIds,
      days: opts.days,
      reason: opts.reason,
      ipBan: opts.ipBan,
      password: opts.confirmPassword,
      deleteRecentMessages: opts.deleteRecentMessages,
    },
    url: env.SERVER_URL + "/api/moderation/users/suspend",
    useToken: true,
  });
  return data;
};

export const warnUsers = async (
  confirmPassword: string,
  userIds: string[],
  reason?: string
) => {
  const data = await request<any[]>({
    method: "POST",
    body: {
      userIds,
      reason,
      password: confirmPassword,
    },
    url: env.SERVER_URL + "/api/moderation/users/warn",
    useToken: true,
  });
  return data;
};
export const shadowBan = async (
  confirmPassword: string,
  userIds: string[],
  reason?: string
) => {
  const data = await request<any[]>({
    method: "POST",
    body: {
      userIds,
      reason,
      password: confirmPassword,
    },
    url: env.SERVER_URL + "/api/moderation/users/shadow-ban",
    useToken: true,
  });
  return data;
};
export const undoShadowBan = async (
  confirmPassword: string,
  userIds: string[]
) => {
  const data = await request<any[]>({
    method: "DELETE",
    body: {
      userIds,
      password: confirmPassword,
    },
    url: env.SERVER_URL + "/api/moderation/users/shadow-ban",
    useToken: true,
  });
  return data;
};

export const editSuspendUsers = async (
  confirmPassword: string,
  userIds: string[],
  update: { days?: number; reason?: string }
) => {
  const data = await request<any[]>({
    method: "PATCH",
    body: {
      userIds,
      ...update,
      password: confirmPassword,
    },
    url: env.SERVER_URL + "/api/moderation/users/suspend",
    useToken: true,
  });
  return data;
};

export const unsuspendUsers = async (
  confirmPassword: string,
  userIds: string[]
) => {
  const data = await request<any[]>({
    method: "DELETE",
    body: {
      userIds,
      password: confirmPassword,
    },
    url: env.SERVER_URL + "/api/moderation/users/suspend",
    useToken: true,
  });
  return data;
};

export const updateServer = async (
  serverId: string,
  update: { name?: string; verified?: boolean; password?: string }
) => {
  const data = await request<any[]>({
    method: "POST",
    body: update,
    url: env.SERVER_URL + `/api/moderation/servers/${serverId}`,
    useToken: true,
  });
  return data;
};

export const getServer = async (serverId: string) => {
  const data = await request<any[]>({
    method: "GET",
    url: env.SERVER_URL + `/api/moderation/servers/${serverId}`,
    useToken: true,
  });
  return data;
};

export const getOnlineUsers = async () => {
  const data = await request<ModerationUser[]>({
    method: "GET",
    url: env.SERVER_URL + "/api/moderation/online-users",
    useToken: true,
  });
  return data;
};

export type ModerationUser = RawUser & {
  account?: {
    email: string;
    emailConfirmed?: boolean;
    warnCount?: number;
    warnExpiresAt?: number;
  };
  application?: RawApplication;
  suspension?: ModerationSuspension;
  shadowBan?: any;
  servers?: RawServer[];
};

export interface ModerationSuspension {
  expireAt?: number | null;
  reason?: string;
  suspendedAt: number;
  suspendBy: RawUser;
}

export const updateUser = async (
  userId: string,
  update: { email?: string; username?: string; tag?: string }
) => {
  const data = await request<any[]>({
    method: "POST",
    body: update,
    url: env.SERVER_URL + `/api/moderation/users/${userId}`,
    useToken: true,
  });
  return data;
};

export const getUser = async (userId: string) => {
  const data = await request<ModerationUser>({
    method: "GET",
    url: env.SERVER_URL + `/api/moderation/users/${userId}`,
    useToken: true,
  });
  return data;
};

export interface ModerationStats {
  totalRegisteredUsers: number;
  weeklyRegisteredUsers: number;
  totalCreatedServers: number;
  totalCreatedMessages: number;
  weeklyCreatedMessages: number;
}

export const getStats = async () => {
  const data = await request<ModerationStats>({
    method: "GET",
    url: env.SERVER_URL + "/api/moderation/stats",
    useToken: true,
  });
  return data;
};

export interface UserAuditLog {
  actionType: string;
  actionById: string;
  createdAt: number;
  serverId?: string;
  data?: {
    serverName?: string;
    bannedUserId?: string;
    kickedUserId?: string;
  };
}
interface UserAuditLogResponse {
  users: RawUser[];
  servers: RawServer[];
  auditLogs: UserAuditLog[];
}
export const getUsersAuditLogs = async (opts: {
  query?: string;
  afterId?: string;
  limit?: number;
}) => {
  const data = await request<UserAuditLogResponse>({
    method: "GET",
    url: env.SERVER_URL + "/api/moderation/users/audit-logs",
    params: {
      ...(opts.query ? { q: opts.query } : {}),
      ...(opts.afterId ? { after: opts.afterId } : {}),
      limit: opts.limit,
    },
    useToken: true,
  });
  return data;
};
