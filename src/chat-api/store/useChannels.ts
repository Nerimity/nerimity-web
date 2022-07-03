import {createStore} from 'solid-js/store';
import { useWindowProperties } from '../../common/useWindowProperties';
import {dismissChannelNotification} from '../emits/userEmits';
import { RawChannel } from '../RawData';
import useAccount from './useAccount';
import useUsers, { User } from './useUsers';

export type Channel = Omit<RawChannel, 'recipient'> & {
  updateLastSeen(this: Channel, timestamp?: number): void;
  updateLastMessaged(this: Channel, timestamp?: number): void;
  dismissNotification(this: Channel, force?: boolean): void;
  setRecipientId(this: Channel, userId: string): void;
  recipient?: User;
  recipientId?: string;
  lastSeen?: number;
  hasNotifications: boolean;
}


const [channels, setChannels] = createStore<Record<string, Channel>>({});

const users = useUsers();
const account = useAccount();

const set = (channel: RawChannel) => {


  setChannels({
    ...channels,
    [channel._id]: {
      ...channel,
      get recipient(): User {
        return users.get(this.recipientId!);
      },
      get hasNotifications() {
        const lastMessagedAt = this.lastMessagedAt || 0;
        const lastSeenAt = this.lastSeen;
        if (!lastSeenAt) return true;
        return lastMessagedAt > lastSeenAt;
      },
      updateLastSeen(timestamp?: number) {
        setChannels(this._id, "lastSeen", timestamp);
      },
      updateLastMessaged(timestamp?: number) {
        setChannels(this._id, "lastMessagedAt", timestamp);
      },
      dismissNotification(force = false) {
        const {hasFocus} = useWindowProperties();
        if (!hasFocus() && !force) return;
        if (!this.hasNotifications && !force) return;
        dismissChannelNotification(channel._id);
      },
      setRecipientId(userId: string) {
        setChannels(this._id, "recipientId", userId);
      }
    }
  });
}


const get = (channelId: string) => {
  return channels[channelId];
}

const array = () => Object.values(channels);

const getChannelsByServerId = (serverId: string) => array().filter(channel => channel.server === serverId);

export default function useChannels() {
  return {
    array,
    getChannelsByServerId,
    get,
    set
  }
}