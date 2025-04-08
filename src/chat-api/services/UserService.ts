import env from "../../common/env";
import {
  RawBotCommand,
  RawChannel,
  RawChannelNotice,
  RawInboxWithoutChannel,
  RawMessage,
  RawPost,
  RawServer,
  RawUser,
  RawUserConnection,
} from "../RawData";
import { Presence, UserStatus } from "../store/useUsers";
import { request } from "./Request";
import ServiceEndpoints from "./ServiceEndpoints";

export async function createGoogleAccountLink(): Promise<string> {
  return request({
    url: env.SERVER_URL + "/api/google/create-link",
    method: "GET",
    notJSON: true,
    useToken: true,
  });
}

export async function registerFCM(token: string) {
  return request({
    url: env.SERVER_URL + "/api" + ServiceEndpoints.user("register-fcm"),
    body: { token },
    method: "POST",
    useToken: true,
    notJSON: true,
  });
}

export async function linkAccountWithGoogle(
  code: string,
  nerimityUserToken: string
): Promise<{ connection: RawUserConnection }> {
  return request({
    url: env.SERVER_URL + "/api/google/link-account",
    method: "POST",
    body: {
      code,
      nerimityToken: nerimityUserToken,
    },
    useToken: false,
  });
}
export async function unlinkAccountWithGoogle(): Promise<{ status: boolean }> {
  return request({
    url: env.SERVER_URL + "/api/google/unlink-account",
    method: "POST",
    useToken: true,
  });
}

export async function getGoogleAccessToken(): Promise<{ accessToken: string }> {
  return request({
    url: env.SERVER_URL + "/api/google/access-token",
    method: "GET",
    useToken: true,
  });
}

export async function sendResetPassword(
  email: string
): Promise<{ message: string }> {
  return request({
    url:
      env.SERVER_URL +
      "/api" +
      ServiceEndpoints.user("reset-password/send-code"),
    body: { email },
    method: "POST",
  });
}

export async function resetPassword(
  code: string,
  userId: string,
  newPassword: string
): Promise<{ token: string }> {
  return request({
    url: env.SERVER_URL + "/api" + ServiceEndpoints.user("reset-password"),
    params: { code, userId },
    body: { newPassword },
    method: "POST",
    useToken: true,
  });
}

export async function sendEmailConfirmCode(): Promise<{ message: string }> {
  return request({
    url:
      env.SERVER_URL +
      "/api" +
      ServiceEndpoints.user("emails/verify/send-code"),
    method: "POST",
    useToken: true,
  });
}
export async function verifyEmailConfirmCode(
  code: string
): Promise<{ status: boolean }> {
  return request({
    url: env.SERVER_URL + "/api" + ServiceEndpoints.user("emails/verify"),
    params: { code },
    method: "POST",
    useToken: true,
  });
}

// Returns {token}
// error returns {path?, message}
export async function loginRequest(
  email: string,
  password: string
): Promise<{ token: string }> {
  const isUsernameAndTag = email.includes(":");
  return request({
    url: env.SERVER_URL + "/api" + ServiceEndpoints.login(),
    method: "POST",
    body: {
      ...(isUsernameAndTag ? { usernameAndTag: email } : { email }),
      password,
    },
  });
}

// Returns {token}
// error returns {path?, message}
export async function registerRequest(
  email: string,
  username: string,
  password: string,
  token: string
): Promise<{ token: string }> {
  return request({
    url: env.SERVER_URL + "/api" + ServiceEndpoints.register(),
    method: "POST",
    body: {
      email,
      username,
      password,
      token,
    },
  });
}

export interface UserDetails {
  block: boolean;
  suspensionExpiresAt?: number;
  user: RawUser & {
    application?: {
      botCommands?: RawBotCommand[];
      creatorAccount: {
        user: {
          username: string;
          tag: string;
          id: string;
          avatar?: string;
          badges: number;
          hexColor: string;
        };
      };
    };
    _count: {
      followers: number;
      following: number;
      likedPosts: number;
      posts: number;
    };
    following: any[];
    followers: any[];
  };
  mutualFriendIds: string[];
  mutualServerIds: string[];
  latestPost: RawPost;
  pinnedPosts: RawPost[];
  profile?: UserProfile;
  hideFollowers?: boolean;
  hideFollowing?: boolean;
}
export interface UserProfile {
  bio?: string;
  bgColorOne?: string;
  bgColorTwo?: string;
  primaryColor?: string;
}

export async function getUserDetailsRequest(
  userId?: string,
  includePinnedPosts?: boolean,
  includeBotCommands?: boolean
) {
  return request<UserDetails>({
    url: env.SERVER_URL + "/api" + ServiceEndpoints.user(userId || ""),
    method: "GET",
    params: {
      ...(includePinnedPosts ? { includePinnedPosts } : {}),
      ...(includeBotCommands ? { includeBotCommands } : {}),
    },
    useToken: true,
  });
}

export async function getSearchUsers(search: string) {
  return request<RawUser[]>({
    url: env.SERVER_URL + "/api" + ServiceEndpoints.user("search"),
    method: "GET",
    params: { q: search },
    useToken: true,
  });
}

export interface RawNotification {
  message: RawMessage;
  server: RawServer;
}

export async function getUserNotificationsRequest() {
  return request<RawNotification[]>({
    url: env.SERVER_URL + "/api" + ServiceEndpoints.user("notifications"),
    method: "GET",
    useToken: true,
  });
}

export async function getFollowers(userId?: string) {
  return request<RawUser[]>({
    url:
      env.SERVER_URL +
      "/api" +
      ServiceEndpoints.user(userId || "") +
      "/followers",
    method: "GET",
    useToken: true,
  });
}
export async function getFollowing(userId?: string) {
  return request<RawUser[]>({
    url:
      env.SERVER_URL +
      "/api" +
      ServiceEndpoints.user(userId || "") +
      "/following",
    method: "GET",
    useToken: true,
  });
}

export async function toggleBadge(bit: number) {
  return request<{ badges: number }>({
    url: env.SERVER_URL + "/api/users/badges/toggle",
    body: { bit },
    method: "POST",
    useToken: true,
  });
}
export async function openDMChannelRequest(userId: string) {
  return request<RawInboxWithoutChannel & { channel: RawChannel }>({
    url: env.SERVER_URL + "/api" + ServiceEndpoints.openUserDM(userId),
    method: "POST",
    useToken: true,
  });
}
export async function closeDMChannelRequest(channelId: string) {
  return request({
    url: env.SERVER_URL + "/api" + ServiceEndpoints.channel(channelId),
    method: "DELETE",
    useToken: true,
  });
}

export async function blockUser(userId: string) {
  return request({
    url: env.SERVER_URL + "/api" + ServiceEndpoints.user(userId) + "/block",
    method: "POST",
    useToken: true,
  });
}
export async function unblockUser(userId: string) {
  return request({
    url: env.SERVER_URL + "/api" + ServiceEndpoints.user(userId) + "/block",
    method: "DELETE",
    useToken: true,
  });
}

export async function updatePresence(presence: Partial<Presence>) {
  return request<RawInboxWithoutChannel & { channel: RawChannel }>({
    url: env.SERVER_URL + "/api" + ServiceEndpoints.updatePresence(),
    method: "POST",
    body: presence,
    useToken: true,
  });
}

interface UpdateUserOptions {
  email?: string;
  username?: string;
  avatarId?: string;
  bannerId?: string;
  tag?: string;
  password?: string;
  newPassword?: string;
  bio?: string | null;
  socketId?: string;
  dmStatus?: number;
  friendRequestStatus?: number;
  lastOnlineStatus?: number;
  hideFollowers?: boolean;
  hideFollowing?: boolean;
}
export async function updateUser(
  body: UpdateUserOptions,
  token?: string | null
) {
  return request<{ user: any; newToken?: string }>({
    url: env.SERVER_URL + "/api" + ServiceEndpoints.user(""),
    method: "POST",
    body,
    useToken: true,
    token,
  });
}
export async function followUser(userId: string) {
  return request({
    url: env.SERVER_URL + "/api" + ServiceEndpoints.userFollow(userId),
    method: "POST",
    useToken: true,
  });
}
export async function unfollowUser(userId: string) {
  return request({
    url: env.SERVER_URL + "/api" + ServiceEndpoints.userFollow(userId),
    method: "DELETE",
    useToken: true,
  });
}

interface UpdateNotificationSettings {
  notificationSoundMode?: number | null;
  notificationPingMode?: number | null;
  serverId?: string;
  channelId?: string;
}

export async function updateNotificationSettings(
  update: UpdateNotificationSettings
) {
  return request({
    url: env.SERVER_URL + "/api" + ServiceEndpoints.user("notifications"),
    method: "POST",
    useToken: true,
    body: update,
  });
}

export async function deleteAccount(password: string, deleteContent: boolean) {
  return request({
    url: env.SERVER_URL + "/api" + ServiceEndpoints.user("delete-account"),
    method: "DELETE",
    useToken: true,
    body: { password, deleteContent },
  });
}

export const updateDMChannelNotice = async (
  content: string,
  token?: string | null
) => {
  const data = await request<{ notice: RawChannelNotice }>({
    method: "PUT",
    url: env.SERVER_URL + "/api" + ServiceEndpoints.user("channel-notice"),
    body: { content },
    useToken: true,
    token,
  });
  return data;
};

export const deleteDMChannelNotice = async (token?: string | null) => {
  const data = await request({
    method: "DELETE",
    url: env.SERVER_URL + "/api" + ServiceEndpoints.user("channel-notice"),
    useToken: true,
    token,
  });
  return data;
};
export const getDMChannelNotice = async (token?: string | null) => {
  const data = await request<{ notice: RawChannelNotice }>({
    method: "GET",
    url: env.SERVER_URL + "/api" + ServiceEndpoints.user("channel-notice"),
    useToken: true,
    token,
  });
  return data;
};

export async function userNoticeDismiss(id: string) {
  return request<any>({
    url: env.SERVER_URL + "/api" + ServiceEndpoints.user("notices/" + id),
    method: "DELETE",
    useToken: true,
  });
}
