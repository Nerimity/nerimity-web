import {createStore} from 'solid-js/store';
import { RawUser } from '../RawData';
import useInbox, { Inbox } from './useInbox';
import { openDMChannelRequest } from '../services/UserService';
import useChannels from './useChannels';

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
  inboxChannelId?: string
  setInboxChannelId: (this: User, channelId: string) => void;
  openDM: (this: User) => Promise<void>;
}

const [users, setUsers] = createStore<Record<string, User>>({});


const set = (user: RawUser) => {
  const inbox = useInbox();
  const channels = useChannels();
  if (users[user._id]) return;
  setUsers(user._id, {
    ...user,
    setInboxChannelId(channelId) {
      setUsers(this._id, 'inboxChannelId', channelId);
    },
    async openDM() {
      const rawInbox = await openDMChannelRequest(this._id);
      channels.set(rawInbox.channel);
      inbox.set({...rawInbox, channel: rawInbox.channel._id});
    }
  });
}

const get = (userId: string) => users[userId]

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