import env from '@/common/env';
import {createStore} from 'solid-js/store';
import { SelfUser } from '../events/connectionEventTypes';
import { RawServerSettings, RawUser } from '../RawData';


type ServerSettings = Omit<RawServerSettings, 'serverId'>;
interface Account {
  user: SelfUser | null,

  socketId: string | null,
  socketConnected: boolean,
  socketAuthenticated: boolean,
  authenticationError: {message: string, data: any} | null;
  serverSettings: Record<string, ServerSettings>
}


const [account, setAccount] = createStore<Account>({
  user: null,
  socketId: null,
  socketConnected: false,
  socketAuthenticated: false,
  authenticationError: null,
  serverSettings: {}
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
}
const setSocketDetails = (details: SetSocketDetailsArgs) => {
  setAccount(details);
}


const setUser = (user: Partial<SelfUser> | null) => setAccount('user', user);

const user = () => account.user;

const isConnected = () => account.socketConnected;
const isAuthenticated = () => account.socketAuthenticated;
const authenticationError = () => account.authenticationError;

const avatarUrl = () => user()?.avatar ? env.NERIMITY_CDN + user()?.avatar : null;

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
    getServerSettings
  }
}