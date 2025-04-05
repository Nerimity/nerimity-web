import { request } from "./Request";
import ServiceEndpoints from "./ServiceEndpoints";
import {
  RawBotCommand,
  ChannelType,
  RawChannel,
  RawCustomEmoji,
  RawPublicServer,
  RawServer,
  RawServerRole,
  RawServerWelcomeAnswer,
  RawServerWelcomeQuestion,
  RawUser,
} from "../RawData";
import env from "../../common/env";
import { uploadEmoji } from "./nerimityCDNService";

export async function getInvites(serverId: string): Promise<any> {
  return request({
    method: "GET",
    url: env.SERVER_URL + "/api" + ServiceEndpoints.serverInvites(serverId),
    useToken: true,
  });
}
export async function transferOwnership(
  serverId: string,
  password: string,
  newOwnerUserId: string
): Promise<any> {
  return request({
    method: "POST",
    url:
      env.SERVER_URL +
      "/api" +
      ServiceEndpoints.server(serverId) +
      "/transfer-ownership",
    body: { password, newOwnerUserId },
    useToken: true,
  });
}
export async function getServerBotCommands(
  serverId: string
): Promise<{ commands: RawBotCommand[] }> {
  return request({
    method: "GET",
    url:
      env.SERVER_URL +
      "/api" +
      ServiceEndpoints.server(serverId) +
      "/bot-commands",
    useToken: true,
  });
}

export async function updateServer(
  serverId: string,
  update: any
): Promise<any> {
  return request({
    method: "POST",
    body: update,
    url: env.SERVER_URL + "/api" + ServiceEndpoints.server(serverId),
    useToken: true,
  });
}
export async function kickServerMember(
  serverId: string,
  userId: string
): Promise<any> {
  return request({
    method: "DELETE",
    url:
      env.SERVER_URL +
      "/api" +
      ServiceEndpoints.serverMemberKick(serverId, userId),
    useToken: true,
  });
}
export async function BanServerMember(
  serverId: string,
  userId: string,
  shouldDeleteRecentMessages?: boolean
): Promise<any> {
  return request({
    method: "POST",
    url:
      env.SERVER_URL +
      "/api" +
      ServiceEndpoints.serverMemberBan(serverId, userId),
    params: {
      shouldDeleteRecentMessages, // delete messages sent in the last 7 hours.
    },
    useToken: true,
  });
}
export async function removeBanServerMember(
  serverId: string,
  userId: string
): Promise<any> {
  return request({
    method: "DELETE",
    url:
      env.SERVER_URL +
      "/api" +
      ServiceEndpoints.serverMemberBan(serverId, userId),
    useToken: true,
  });
}

export interface Ban {
  serverId: string;
  user: RawUser;
}

export async function bannedMembersList(serverId: string): Promise<Ban[]> {
  return request({
    method: "GET",
    url:
      env.SERVER_URL + "/api" + ServiceEndpoints.serverMemberBan(serverId, ""),
    useToken: true,
  });
}

interface CreateServerChannelOpts {
  serverId: string;
  name?: string;
  type?: ChannelType;
}
export async function createServerChannel(
  opts: CreateServerChannelOpts
): Promise<RawChannel> {
  return request({
    method: "POST",
    url:
      env.SERVER_URL + "/api" + ServiceEndpoints.serverChannels(opts.serverId),
    body: {
      ...(opts.name ? { name: opts.name } : undefined),
      ...(opts.type ? { type: opts.type } : undefined),
    },
    useToken: true,
  });
}
export async function createServerRole(
  serverId: string
): Promise<RawServerRole> {
  return request({
    method: "POST",
    url: env.SERVER_URL + "/api" + ServiceEndpoints.serverRoles(serverId),
    useToken: true,
  });
}

export async function updateServerOrder(
  serverIds: string[]
): Promise<RawServerRole> {
  return request({
    method: "POST",
    body: { serverIds },
    url: env.SERVER_URL + "/api" + ServiceEndpoints.serverOrder(),
    useToken: true,
  });
}

export async function updateServerChannelOrder(
  serverId: string,
  updated: { channelIds: string[]; categoryId?: string }
): Promise<RawServerRole> {
  return request({
    method: "POST",
    body: { channelIds: updated.channelIds, categoryId: updated.categoryId },
    url:
      env.SERVER_URL + "/api" + ServiceEndpoints.serverChannelOrder(serverId),
    useToken: true,
  });
}

export async function updateServerRole(
  serverId: string,
  roleId: string,
  update: any
): Promise<any> {
  return request({
    method: "POST",
    body: update,
    url:
      env.SERVER_URL + "/api" + ServiceEndpoints.serverRole(serverId, roleId),
    useToken: true,
  });
}
export async function updateServerRoleOrder(
  serverId: string,
  roleIds: string[]
): Promise<any> {
  return request({
    method: "POST",
    body: { roleIds },
    url: env.SERVER_URL + "/api" + ServiceEndpoints.serverRolesOrder(serverId),
    useToken: true,
  });
}
export async function deleteServerRole(
  serverId: string,
  roleId: string
): Promise<any> {
  return request({
    method: "DELETE",
    url:
      env.SERVER_URL + "/api" + ServiceEndpoints.serverRole(serverId, roleId),
    useToken: true,
  });
}

export async function updateServerMemberProfile(
  serverId: string,
  userId: string,
  update: { nickname?: null | string }
): Promise<any> {
  return request({
    method: "POST",
    body: update,
    url:
      env.SERVER_URL +
      "/api" +
      ServiceEndpoints.serverMember(serverId, userId) +
      "/profile",
    useToken: true,
  });
}

export async function updateServerMember(
  serverId: string,
  userId: string,
  update: any
): Promise<any> {
  return request({
    method: "POST",
    body: update,
    url:
      env.SERVER_URL + "/api" + ServiceEndpoints.serverMember(serverId, userId),
    useToken: true,
  });
}

export async function updateServerChannelPermissions(opts: {
  serverId: string;
  channelId: string;
  roleId: string;
  permissions: number;
}): Promise<any> {
  return request({
    method: "POST",
    body: { permissions: opts.permissions },
    url:
      env.SERVER_URL +
      "/api" +
      ServiceEndpoints.serverChannel(opts.serverId, opts.channelId) +
      `/permissions/${opts.roleId}`,
    useToken: true,
  });
}

export async function updateServerChannel(
  serverId: string,
  channelId: string,
  update: any
): Promise<any> {
  return request({
    method: "POST",
    body: update,
    url:
      env.SERVER_URL +
      "/api" +
      ServiceEndpoints.serverChannel(serverId, channelId),
    useToken: true,
  });
}
export async function deleteServerChannel(
  serverId: string,
  channelId: string
): Promise<any> {
  return request({
    method: "DELETE",
    url:
      env.SERVER_URL +
      "/api" +
      ServiceEndpoints.serverChannel(serverId, channelId),
    useToken: true,
  });
}

export async function createServer(serverName: string): Promise<RawServer> {
  return request<RawServer>({
    method: "POST",
    url: env.SERVER_URL + "/api" + ServiceEndpoints.servers(),
    useToken: true,
    body: { name: serverName },
  });
}

export async function createInvite(serverId: string): Promise<any> {
  return request({
    method: "POST",
    url: env.SERVER_URL + "/api" + ServiceEndpoints.serverInvites(serverId),
    useToken: true,
  });
}
export async function deleteInvite(
  serverId: string,
  code: string
): Promise<any> {
  return request({
    method: "DELETE",
    url:
      env.SERVER_URL +
      "/api" +
      ServiceEndpoints.serverInvites(serverId) +
      `/${code}`,
    useToken: true,
  });
}

export async function createCustomInvite(
  code: string,
  serverId: string
): Promise<any> {
  return request({
    method: "POST",
    url:
      env.SERVER_URL +
      "/api" +
      ServiceEndpoints.serverInvites(serverId) +
      "/custom",
    body: { code },
    useToken: true,
  });
}

export async function deleteServer(serverId: string): Promise<RawServer> {
  return request({
    method: "DELETE",
    url: env.SERVER_URL + "/api" + ServiceEndpoints.server(serverId),
    useToken: true,
  });
}

export async function leaveServer(serverId: string): Promise<RawServer> {
  return request({
    method: "POST",
    url: env.SERVER_URL + "/api" + ServiceEndpoints.server(serverId) + "/leave",
    useToken: true,
  });
}

export async function joinServerByInviteCode(inviteCode: string) {
  return request<RawServer>({
    method: "POST",
    url:
      env.SERVER_URL + "/api" + ServiceEndpoints.serverInviteCode(inviteCode),
    useToken: true,
  });
}
export async function inviteBot(
  serverId: string,
  appId: string,
  permissions: number
) {
  return request<{ success: boolean }>({
    method: "POST",
    url:
      env.SERVER_URL +
      `/api/servers/${serverId}/invites/applications/${appId}/bot`,
    params: { permissions },
    useToken: true,
  });
}

export type ServerWithMemberCount = RawServer & { memberCount: number };

export async function serverDetailsByInviteCode(inviteCode: string) {
  return request<ServerWithMemberCount>({
    method: "GET",
    url:
      env.SERVER_URL + "/api" + ServiceEndpoints.serverInviteCode(inviteCode),
  });
}

export async function publicServerByEmojiId(id: string) {
  return request<RawPublicServer>({
    method: "GET",
    url: env.SERVER_URL + `/api/emojis/${id}/server`,
    useToken: true,
  });
}

// Explore
export async function joinPublicServer(serverId: string) {
  return request<RawServer>({
    method: "POST",
    url:
      env.SERVER_URL +
      "/api" +
      ServiceEndpoints.exploreServer(serverId) +
      "/join",
    useToken: true,
  });
}
export async function BumpPublicServer(serverId: string, token: string) {
  return request<RawPublicServer>({
    method: "POST",
    body: { token },
    url:
      env.SERVER_URL +
      "/api" +
      ServiceEndpoints.exploreServer(serverId) +
      "/bump",
    useToken: true,
  });
}

export async function getPublicServer(serverId: string) {
  return request<RawPublicServer>({
    method: "GET",
    url: env.SERVER_URL + "/api" + ServiceEndpoints.exploreServer(serverId),
    useToken: true,
  });
}

export type PublicServerSort =
  | "pinned_at"
  | "most_bumps"
  | "most_members"
  | "recently_added"
  | "recently_bumped";
export type PublicServerFilter = "pinned" | "all" | "verified";

interface getPublicServersOpts {
  sort: PublicServerSort;
  filter: PublicServerFilter;
  limit?: number;
  afterId?: string;
  search?: string;
}
export async function getPublicServers(opts: getPublicServersOpts) {
  return request<RawPublicServer[]>({
    params: opts,
    method: "GET",
    url: env.SERVER_URL + "/api" + ServiceEndpoints.exploreServer(""),
    useToken: true,
  });
}

export async function updatePublicServer(
  serverId: string,
  description: string
) {
  return request<RawPublicServer>({
    method: "POST",
    url: env.SERVER_URL + "/api" + ServiceEndpoints.exploreServer(serverId),
    body: { description },
    useToken: true,
  });
}
export async function deletePublicServer(serverId: string) {
  return request<RawPublicServer>({
    method: "DELETE",
    url: env.SERVER_URL + "/api" + ServiceEndpoints.exploreServer(serverId),
    useToken: true,
  });
}

export async function addServerEmoji(
  serverId: string,
  emojiName: string,
  file: File
) {
  const { fileId } = await uploadEmoji({
    file,
  });

  return request<RawCustomEmoji>({
    method: "POST",
    url:
      env.SERVER_URL + "/api" + ServiceEndpoints.server(serverId) + "/emojis",
    body: {
      name: emojiName,
      fileId,
    },
    useToken: true,
  });
}

export type RawCustomEmojiWithCreator = RawCustomEmoji & {
  uploadedBy: RawUser;
};

export async function getServerEmojis(serverId: string) {
  return request<RawCustomEmojiWithCreator[]>({
    method: "GET",
    url:
      env.SERVER_URL + "/api" + ServiceEndpoints.server(serverId) + "/emojis",
    useToken: true,
  });
}

export async function updateServerEmoji(
  serverId: string,
  emojiId: string,
  newName: string
) {
  return request<RawCustomEmoji>({
    method: "POST",
    url:
      env.SERVER_URL +
      "/api" +
      ServiceEndpoints.server(serverId) +
      "/emojis/" +
      emojiId,
    body: {
      name: newName,
    },
    useToken: true,
  });
}
export async function deleteServerEmoji(serverId: string, emojiId: string) {
  return request<void>({
    method: "DELETE",
    url:
      env.SERVER_URL +
      "/api" +
      ServiceEndpoints.server(serverId) +
      "/emojis/" +
      emojiId,
    notJSON: true,
    useToken: true,
  });
}

export interface CreateQuestion {
  title: string;
  multiselect: boolean;
  answers: CreateAnswer[];
}
export interface CreateAnswer {
  title: string;
  roleIds: string[];
  order?: number;
}
export async function createWelcomeQuestion(
  serverId: string,
  question: CreateQuestion
) {
  return request<RawServerWelcomeQuestion>({
    method: "POST",
    url:
      env.SERVER_URL +
      "/api" +
      ServiceEndpoints.server(serverId) +
      "/welcome/questions",
    body: question,
    useToken: true,
  });
}

export interface UpdateQuestion {
  id?: string;
  title: string;
  multiselect: boolean;
  answers: UpdateAnswer[];
}
export interface UpdateAnswer {
  id: string;
  title: string;
  roleIds: string[];
  order?: number;
}
export async function updateWelcomeQuestion(
  serverId: string,
  questionId: string,
  question: UpdateQuestion
) {
  return request<RawServerWelcomeQuestion>({
    method: "POST",
    url:
      env.SERVER_URL +
      "/api" +
      ServiceEndpoints.server(serverId) +
      "/welcome/questions/" +
      questionId,
    body: question,
    useToken: true,
  });
}

export async function getWelcomeQuestions(serverId: string) {
  return request<RawServerWelcomeQuestion[]>({
    method: "GET",
    url:
      env.SERVER_URL +
      "/api" +
      ServiceEndpoints.server(serverId) +
      "/welcome/questions",
    useToken: true,
  });
}
export async function getWelcomeQuestion(serverId: string, questionId: string) {
  return request<RawServerWelcomeQuestion>({
    method: "GET",
    url:
      env.SERVER_URL +
      "/api" +
      ServiceEndpoints.server(serverId) +
      "/welcome/questions/" +
      questionId,
    useToken: true,
  });
}

export async function deleteWelcomeQuestion(
  serverId: string,
  questionId: string
) {
  return request<{ status: boolean }>({
    method: "DELETE",
    url:
      env.SERVER_URL +
      "/api" +
      ServiceEndpoints.server(serverId) +
      "/welcome/questions/" +
      questionId,
    useToken: true,
  });
}

export async function addAnswerToMember(serverId: string, answerId: string) {
  return request<{ status: boolean }>({
    method: "POST",
    url:
      env.SERVER_URL +
      "/api" +
      ServiceEndpoints.server(serverId) +
      "/welcome/answers/" +
      answerId +
      "/answer",
    useToken: true,
  });
}
export async function removeAnswerFromMember(
  serverId: string,
  answerId: string
) {
  return request<{ status: boolean }>({
    method: "DELETE",
    url:
      env.SERVER_URL +
      "/api" +
      ServiceEndpoints.server(serverId) +
      "/welcome/answers/" +
      answerId +
      "/answer",
    useToken: true,
  });
}

export interface UserAuditLog {
  actionType: string;
  actionById: string;
  createdAt: number;
  serverId?: string;
  data?: {
    serverName?: string;
  };
}
interface UserAuditLogResponse {
  users: RawUser[];
  servers: RawServer[];
  auditLogs: UserAuditLog[];
}
export const getServerAuditLogs = async (opts: {
  serverId: string;
  afterId?: string;
  limit?: number;
}) => {
  const data = await request<UserAuditLogResponse>({
    method: "GET",
    url:
      env.SERVER_URL +
      `/api/${ServiceEndpoints.server(opts.serverId)}/audit-logs`,
    params: {
      ...(opts.afterId ? { after: opts.afterId } : {}),
      limit: opts.limit,
    },
    useToken: true,
  });
  return data;
};
