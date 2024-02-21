import env from "@/common/env";
import {createStore} from "solid-js/store";
import { SelfUser } from "../events/connectionEventTypes";
import { RawUserNotificationSettings } from "../RawData";
import { USER_BADGES, hasBit } from "../Bitwise";


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


const setNotificationSettings = (channelOrServerId: string, setting: Partial<RawUserNotificationSettings>) => {
  setAccount("notificationSettings", channelOrServerId, setting);
};

const getNotificationSettings = (serverOrChannelId: string) => account.notificationSettings[serverOrChannelId] as RawUserNotificationSettings | undefined;

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
    getNotificationSettings,
    hasModeratorPerm,
    lastAuthenticatedAt
  };
}