import RouterEndpoints from '@/common/RouterEndpoints';
import { runWithContext } from '@/common/runWithContext';
import { batch } from 'solid-js';
import {createStore} from 'solid-js/store';
import { useWindowProperties } from '../../common/useWindowProperties';
import {dismissChannelNotification} from '../emits/userEmits';
import { CHANNEL_PERMISSIONS, getAllPermissions, Bitwise } from '../Bitwise';
import { RawChannel } from '../RawData';
import useMessages from './useMessages';
import useUsers, { User } from './useUsers';

export type Channel = Omit<RawChannel, 'recipient'> & {
  updateLastSeen(this: Channel, timestamp?: number): void;
  updateLastMessaged(this: Channel, timestamp?: number): void;
  dismissNotification(this: Channel, force?: boolean): void;
  setRecipientId(this: Channel, userId: string): void;
  update: (this: Channel, update: Partial<RawChannel>) => void;

  permissionList: Array<Bitwise & {hasPerm: boolean}>
  recipient?: User;
  recipientId?: string;
  lastSeen?: number;
  hasNotifications: boolean;
}


const [channels, setChannels] = createStore<Record<string, Channel | undefined>>({});

const users = useUsers();

const set = (channel: RawChannel) => {


  setChannels({
    ...channels,
    [channel.id]: {
      ...channel,
      get recipient(): User {
        return users.get(this.recipientId!);
      },
      get hasNotifications() {
        const lastMessagedAt = this.lastMessagedAt! || 0;
        const lastSeenAt = this.lastSeen! || 0;
        if (!lastSeenAt) return true;
        return lastMessagedAt > lastSeenAt;
      },
      get permissionList () {
        const permissions = this.permissions || 0;
        return getAllPermissions(CHANNEL_PERMISSIONS, permissions);
      },
      updateLastSeen(timestamp?: number) {
        setChannels(this.id, "lastSeen", timestamp);
      },
      updateLastMessaged(timestamp?: number) {
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


const deleteChannel = (channelId: string, serverId?: string) => runWithContext(() => {
  const messages = useMessages();


  batch(() => {
    messages.deleteChannelMessages(channelId);
    setChannels(channelId, undefined);
  })
});


const get = (channelId: string) => {
  return channels[channelId];
}

const array = () => Object.values(channels);

const getChannelsByServerId = (serverId: string) => array().filter(channel => channel?.serverId === serverId);

const removeAllServerChannels = (serverId: string) => {
  const channelsArr = array();
  batch(() => {
    for (let i = 0; i < channelsArr.length; i++) {
      const channel = channelsArr[i];
      if (channel?.serverId !== serverId) continue; 
      deleteChannel(channel.id);
    }
  })
}


export default function useChannels() {
  return {
    array,
    getChannelsByServerId,
    deleteChannel,
    get,
    set,
    removeAllServerChannels
  }
}