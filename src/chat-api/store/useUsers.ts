import {createStore} from 'solid-js/store';
import { RawUser } from '../RawData';

export enum UserStatus {
  OFFLINE = 0,
  ONLINE = 1,
  LTP = 2, // Looking To Play
  AFK = 3, // Away from keyboard
  DND = 4, // Do not disturb
}

export interface Presence {
  custom?: string;
  status: UserStatus;
}

export type User = RawUser & {
  presence?: Presence
}

const [users, setUsers] = createStore<Record<string, User>>({});


const set = (user: RawUser) => {
  if (users[user._id]) return;
  setUsers({
    ...users,
    [user._id]: user
  });
}

const get = (serverId: string) => users[serverId]

const array = () => Object.values(users);

const setPresence = (userId: string, presence: Presence) => {
  const isOffline = presence.status === UserStatus.OFFLINE;
  setUsers(userId, 'presence', {
    custom: isOffline ? undefined : presence.custom,
    status: presence.status
  });

}

export default function useUsers() {
  return {
    array,
    get,
    set,
    setPresence
  }
}