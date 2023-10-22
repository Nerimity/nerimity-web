import {createStore} from 'solid-js/store';
import { ActivityStatus, RawUser } from '../RawData';
import useInbox, { Inbox } from './useInbox';
import { closeDMChannelRequest, openDMChannelRequest } from '../services/UserService';
import useChannels from './useChannels';
import RouterEndpoints from '../../common/RouterEndpoints';
import { useNavigate } from '@solidjs/router';
import { runWithContext } from '@/common/runWithContext';
import env from '@/common/env';
import useAccount from './useAccount';
import { StorageKeys, getStorageObject } from '@/common/localStorage';
import { Program, electronWindowAPI } from '@/common/Electron';


export enum UserStatus {
  OFFLINE = 0,
  ONLINE = 1,
  LTP = 2, // Looking To Play
  AFK = 3, // Away from keyboard
  DND = 4, // Do not disturb
}

export interface Presence {
  custom?: string | null;
  status: UserStatus;
  activity?: ActivityStatus
}

export const avatarUrl = (item: {avatar?: string}): string | null => item?.avatar ? env.NERIMITY_CDN + item?.avatar : null;

export const bannerUrl = (item: {banner?: string}): string | null => item?.banner ? env.NERIMITY_CDN + item?.banner : null;

export type User = RawUser & {
  presence?: Presence
  inboxChannelId?: string
  voiceChannelId?: string
  setInboxChannelId: (this: User, channelId: string | undefined) => void;
  setVoiceChannelId: (this: User, channelId: string | undefined) => void;
  openDM: (this: User) => Promise<void>;
  closeDM: (this: User) => Promise<void>;
  avatarUrl(this: User): string | null
  bannerUrl(this: User): string | null
  update(this: User, update: Partial<RawUser>): void
}

const [users, setUsers] = createStore<Record<string, User>>({});


const set = (user: RawUser) => runWithContext(() => {
  if (users[user.id]) return;
  setUsers(user.id, {
    ...user,
    setInboxChannelId(channelId) {
      setUsers(this.id, 'inboxChannelId', channelId);
    },
    setVoiceChannelId(channelId) {
      setUsers(this.id, 'voiceChannelId', channelId);
    },
    async openDM() {
      await openDM(this.id)
    },
    async closeDM() {
      await closeDM(this.inboxChannelId!)
    },
    avatarUrl(){
      return this?.banner ? env.NERIMITY_CDN + this?.banner : null;
    },
    update(update) {
      setUsers(this.id, update);
    }
  });
});

const openDM = async (userId: string) => runWithContext(async () =>{
  const navigate = useNavigate();
  const inbox = useInbox();
  const channels = useChannels();
  const user = () => get(userId);
  const inboxItem = () => inbox.get(user()?.inboxChannelId!);
    // check if dm already exists
  if (!inboxItem()) {
    const rawInbox = await openDMChannelRequest(userId);
    channels.set(rawInbox.channel);
    inbox.set({...rawInbox, channelId: rawInbox.channel.id});
    user()?.setInboxChannelId(rawInbox.channel.id);
  }
  navigate(RouterEndpoints.INBOX_MESSAGES(inboxItem().channelId));
});

const closeDM = async (channelId: string) => runWithContext(async () =>{
  await closeDMChannelRequest(channelId);
});

const get = (userId: string) => users[userId]

const array = () => Object.values(users);

const setPresence = (userId: string, presence: Partial<Presence>) => {
  const account = useAccount();
  
  const wasOffline = !get(userId).presence?.status && presence.status !== UserStatus.OFFLINE;


  
  if (account.user()?.id === userId) {
    if (wasOffline) {
      const programs = getStorageObject<(Program & {action: string})[]>(StorageKeys.PROGRAM_ACTIVITY_STATUS, [])
      electronWindowAPI()?.restartActivityStatus(programs);
    }

    
    account.setUser({
      ...(presence.custom !== undefined ? {
        customStatus: presence.custom || undefined
      } : undefined),
    })
  }
  const isOffline = presence.status !== undefined && presence.status === UserStatus.OFFLINE;
  if (isOffline) {
    setUsers(userId, 'presence', undefined)
    return;
  }
  if (presence.custom === null) presence.custom = undefined;
  if (presence.activity === null) presence.activity = undefined;
  setUsers(userId, 'presence', presence);
}


export default function useUsers() {
  return {
    array,
    get,
    set,
    setPresence,
    openDM
  }
}