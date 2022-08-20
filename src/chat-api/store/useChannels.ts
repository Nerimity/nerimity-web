import {createStore} from 'solid-js/store';
import { useWindowProperties } from '../../common/useWindowProperties';
import {dismissChannelNotification} from '../emits/userEmits';
import { CHANNEL_PERMISSIONS, getAllPermissions, Permission } from '../Permissions';
import { RawChannel } from '../RawData';
import useAccount from './useAccount';
import useUsers, { User } from './useUsers';

export type Channel = Omit<RawChannel, 'recipient'> & {
  updateLastSeen(this: Channel, timestamp?: string): void;
  updateLastMessaged(this: Channel, timestamp?: string): void;
  dismissNotification(this: Channel, force?: boolean): void;
  setRecipientId(this: Channel, userId: string): void;
  update: (this: Channel, update: Partial<RawChannel>) => void;

  permissionList: Array<Permission & {hasPerm: boolean}>
  recipient?: User;
  recipientId?: string;
  lastSeen?: string;
  hasNotifications: boolean;
}


const [channels, setChannels] = createStore<Record<string, Channel | undefined>>({});

const users = useUsers();
const account = useAccount();

const set = (channel: RawChannel) => {


  setChannels({
    ...channels,
    [channel.id]: {
      ...channel,
      get recipient(): User {
        return users.get(this.recipientId!);
      },
      get hasNotifications() {
        const lastMessagedAt = new Date(this.lastMessagedAt!).getTime() || 0;
        const lastSeenAt = new Date(this.lastSeen!).getTime() || 0;
        if (!lastSeenAt) return true;
        return lastMessagedAt > lastSeenAt;
      },
      get permissionList () {
        const permissions = this.permissions || 0;
        return getAllPermissions(CHANNEL_PERMISSIONS, permissions);
      },
      updateLastSeen(timestamp?: string) {
        setChannels(this.id, "lastSeen", timestamp);
      },
      updateLastMessaged(timestamp?: string) {
        setChannels(this.id, "lastMessagedAt", timestamp);
      },
      dismissNotification(force = false) {
        const {hasFocus} = useWindowProperties();
        if (!hasFocus() && !force) return;
        if (!this.hasNotifications && !force) return;
        dismissChannelNotification(channel.id);
      },
      setRecipientId(userId: string) {
        setChannels(this.id, "recipientId", userId);
      },
      update(update) {
        setChannels(this.id, update);
      }
    }
  });
}


const deleteChannel = (channelId: string) => {
  setChannels(channelId, undefined);
}


const get = (channelId: string) => {
  return channels[channelId];
}

const array = () => Object.values(channels);

const getChannelsByServerId = (serverId: string) => array().filter(channel => channel?.serverId === serverId);

export default function useChannels() {
  return {
    array,
    getChannelsByServerId,
    deleteChannel,
    get,
    set
  }
}