import env from "@/common/env";
import {createStore} from "solid-js/store";
import { SelfUser } from "../events/connectionEventTypes";
import { RawUserNotificationSettings, ServerNotificationPingMode, ServerNotificationSoundMode } from "../RawData";
import { USER_BADGES, hasBit } from "../Bitwise";
import { updateNotificationSettings } from "../services/UserService";


interface Account {
  user: SelfUser | null,

  socketId: string | null,
  socketConnected: boolean,
  socketAuthenticated: boolean,
  authenticationError: {message: string, data: any} | null;
  notificationSettings: Record<string, RawUserNotificationSettings>
  lastAuthenticatedAt: null | number;
}


const [account, setAccount] = createStore<Account>({
  user: null,
  socketId: null,
  socketConnected: false,
  socketAuthenticated: false,
  authenticationError: null,
  notificationSettings: {},
  lastAuthenticatedAt: null
});

const removeNotificationSettings = (channelOrServerId: string) => {
  setAccount("notificationSettings", channelOrServerId, undefined!);
};

const setNotificationSettings = (channelOrServerId: string, setting: Partial<RawUserNotificationSettings>) => {
  setAccount("notificationSettings", channelOrServerId, setting);
};

const getRawNotificationSettings = (serverOrChannelId: string) => account.notificationSettings[serverOrChannelId] as RawUserNotificationSettings | undefined;

const getCombinedNotificationSettings = (serverId?: string, channelId?: string) => {
  const channelNotification = account.notificationSettings[channelId!] as RawUserNotificationSettings | undefined;
  const serverNotification = account.notificationSettings[serverId!] as RawUserNotificationSettings | undefined;
  
  if (!channelNotification) return serverNotification;

  return {
    ...channelNotification,
    ...serverNotification,
    notificationPingMode: channelNotification.notificationPingMode ?? serverNotification?.notificationPingMode,
    notificationSoundMode: channelNotification.notificationSoundMode ?? serverNotification?.notificationSoundMode
  } as RawUserNotificationSettings;
};

interface SetSocketDetailsArgs {
  socketId?: string | null,
  socketAuthenticated?: boolean,
  socketConnected?: boolean,
  authenticationError?: {message: string, data: any} | null,
  lastAuthenticatedAt?: number;
}
const setSocketDetails = (details: SetSocketDetailsArgs) => {
  setAccount(details);
};


const setUser = (user: Partial<SelfUser> | null) => setAccount("user", user);

const user = () => account.user;

const isConnected = () => account.socketConnected;
const isAuthenticated = () => account.socketAuthenticated;
const authenticationError = () => account.authenticationError;

const lastAuthenticatedAt = () => account.lastAuthenticatedAt;

const avatarUrl = () => user()?.avatar ? env.NERIMITY_CDN + user()?.avatar : null;

const hasModeratorPerm = () => hasBit(user()?.badges || 0, USER_BADGES.FOUNDER.bit) || hasBit(user()?.badges || 0, USER_BADGES.ADMIN.bit);





const updateUserNotificationSettings = (opts: {serverId?: string, channelId?: string, notificationPingMode?: number | null, notificationSoundMode?: number | null}) => {
  const currentNotificationSoundMode = () => getRawNotificationSettings(opts.channelId || opts.serverId!)?.notificationSoundMode ?? (opts.channelId ? null : 0);

  if (opts.notificationSoundMode !== undefined) {
    return updateNotificationSettings({
      serverId: opts.serverId,
      channelId: opts.channelId,
      notificationSoundMode: opts.notificationSoundMode
    });
  }

  let notificationSoundMode: number | null | undefined = null;

  if (opts.notificationPingMode !== null && currentNotificationSoundMode() === null) {
    notificationSoundMode = opts.notificationPingMode;
  }
  if (opts.notificationPingMode === ServerNotificationPingMode.MENTIONS_ONLY && currentNotificationSoundMode() === ServerNotificationSoundMode.ALL) {
    notificationSoundMode = ServerNotificationSoundMode.MENTIONS_ONLY;
  }
  if (opts.notificationPingMode === ServerNotificationPingMode.MUTE) {
    notificationSoundMode = ServerNotificationSoundMode.MUTE;
  }

  return updateNotificationSettings({
    notificationPingMode: opts.notificationPingMode,
    ...(notificationSoundMode !== null ? {notificationSoundMode} : undefined),
    serverId: opts.serverId,
    channelId: opts.channelId
  });
};


const isMe = (userId: string) => account.user &&  account.user.id === userId;


export default function useAccount() {
  return {
    user,
    avatarUrl,
    setUser,
    setSocketDetails,
    isConnected,
    isAuthenticated,
    authenticationError,
    setNotificationSettings,
    getRawNotificationSettings,
    getCombinedNotificationSettings,
    updateUserNotificationSettings,
    removeNotificationSettings,
    hasModeratorPerm,
    lastAuthenticatedAt,
    isMe
  };
}