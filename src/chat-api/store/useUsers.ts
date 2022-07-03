import {createStore} from 'solid-js/store';
import { RawUser } from '../RawData';
import useInbox, { Inbox } from './useInbox';
import { openDMChannelRequest } from '../services/UserService';
import useChannels from './useChannels';
import { Navigator } from 'solid-app-router';
import RouterEndpoints from '../../common/RouterEndpoints';


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
  openDM: (this: User, navigate: Navigator) => Promise<void>;
  updateMentionCount(this: User, count: number): void;
  mentionCount: number
}

const [users, setUsers] = createStore<Record<string, User>>({});


const set = (user: RawUser) => {
  const inbox = useInbox();
  const channels = useChannels();
  if (users[user._id]) return;
  setUsers(user._id, {
    ...user,
    mentionCount: 0,
    updateMentionCount(count) {
      setUsers(this._id, "mentionCount", count);
    },
    setInboxChannelId(channelId) {
      setUsers(this._id, 'inboxChannelId', channelId);
    },
    async openDM(navigate: Navigator) {
      // check if dm already exists
      const inboxItem = () => inbox.get(this.inboxChannelId!);
      if (!inboxItem()) {
        const rawInbox = await openDMChannelRequest(this._id);
        channels.set(rawInbox.channel);
        inbox.set({...rawInbox, channel: rawInbox.channel._id});
        this.setInboxChannelId(rawInbox.channel._id);
      }
      navigate(RouterEndpoints.INBOX_MESSAGES(inboxItem().channelId));
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