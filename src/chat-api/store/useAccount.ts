import {createStore} from 'solid-js/store';
import { SelfUser } from '../events/connectionEventTypes';
import { RawUser } from '../RawData';


interface Account {
  user: SelfUser | null,

  socketId: string | null,
  socketConnected: boolean,
  socketAuthenticated: boolean,
  authenticationError: {message: string, data: any} | null;
}


const [account, setAccount] = createStore<Account>({
  user: null,
  socketId: null,
  socketConnected: false,
  socketAuthenticated: false,
  authenticationError: null,
});

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


export default function useAccount() {
  return {
    user,
    setUser,
    setSocketDetails,
    isConnected,
    isAuthenticated,
    authenticationError
  }
}