import env from '@/common/env';
import {createStore} from 'solid-js/store';
import { SelfUser } from '../events/connectionEventTypes';
import { RawServerSettings, RawUser } from '../RawData';
import { USER_BADGES, hasBit } from '../Bitwise';


type ServerSettings = Omit<RawServerSettings, 'serverId'>;
interface Account {
  user: SelfUser | null,

  socketId: string | null,
  socketConnected: boolean,
  socketAuthenticated: boolean,
  authenticationError: {message: string, data: any} | null;
  serverSettings: Record<string, ServerSettings>
  lastAuthenticatedAt: null | number;
}


const [account, setAccount] = createStore<Account>({
  user: null,
  socketId: null,
  socketConnected: false,
  socketAuthenticated: false,
  authenticationError: null,
  serverSettings: {},
  lastAuthenticatedAt: null
});


const setServerSettings = (serverId: string, setting: Partial<RawServerSettings>) => {
  setAccount('serverSettings', serverId, {...setting, serverId: undefined});
}

const getServerSettings = (serverId: string) => account.serverSettings[serverId] as ServerSettings | undefined;

interface SetSocketDetailsArgs {
  socketId?: string | null,
  socketAuthenticated?: boolean,
  socketConnected?: boolean,
  authenticationError?: {message: string, data: any} | null,
  lastAuthenticatedAt?: number;
}
const setSocketDetails = (details: SetSocketDetailsArgs) => {
  setAccount(details);
}


const setUser = (user: Partial<SelfUser> | null) => setAccount('user', user);

const user = () => account.user;

const isConnected = () => account.socketConnected;
const isAuthenticated = () => account.socketAuthenticated;
const authenticationError = () => account.authenticationError;

const lastAuthenticatedAt = () => account.lastAuthenticatedAt

const avatarUrl = () => user()?.avatar ? env.NERIMITY_CDN + user()?.avatar : null;

const hasModeratorPerm = () => hasBit(user()?.badges || 0, USER_BADGES.FOUNDER.bit) || hasBit(user()?.badges || 0, USER_BADGES.ADMIN.bit)


export default function useAccount() {
  return {
    user,
    avatarUrl,
    setUser,
    setSocketDetails,
    isConnected,
    isAuthenticated,
    authenticationError,
    setServerSettings,
    getServerSettings,
    hasModeratorPerm,
    lastAuthenticatedAt
  }
}