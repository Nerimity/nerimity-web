import RouterEndpoints from '@/common/RouterEndpoints';
import { runWithContext } from '@/common/runWithContext';
import { batch } from 'solid-js';
import {createStore} from 'solid-js/store';
import { useWindowProperties } from '../../common/useWindowProperties';
import {dismissChannelNotification} from '../emits/userEmits';
import { CHANNEL_PERMISSIONS, getAllPermissions, Bitwise, hasBit, ROLE_PERMISSIONS } from '../Bitwise';
import { RawChannel, ServerNotificationPingMode } from '../RawData';
import useMessages from './useMessages';
import useUsers, { User } from './useUsers';
import useStore from './useStore';
import useServerMembers from './useServerMembers';
import useAccount from './useAccount';
import useMention from './useMention';
import socketClient from '../socketClient';
import { postJoinVoice, postLeaveVoice } from '../services/VoiceService';
import useVoiceUsers from './useVoiceUsers';

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
  hasNotifications: boolean | 'mention';
  mentionCount: number;
  joinCall: () => void;
  leaveCall: () => void;
}


const [channels, setChannels] = createStore<Record<string, Channel | undefined>>({});


const set = (channel: RawChannel & {lastSeen?: number}) => {
  const users = useUsers();
  const serverMembers = useServerMembers();
  const account = useAccount();

  setChannels({
    ...channels,
    [channel.id]: {
      ...channel,
      get recipient(): User {
        return users.get(this.recipientId!);
      },
      get hasNotifications() {
        const isAdminChannel = () => hasBit(this.permissions || 0, CHANNEL_PERMISSIONS.PRIVATE_CHANNEL.bit);

        if (this.serverId && isAdminChannel()) {
          const member = serverMembers.get(this.serverId, account.user()?.id!);
          const hasAdminPermission = member?.hasPermission(ROLE_PERMISSIONS.ADMIN) || member?.amIServerCreator();
          if (!hasAdminPermission) return false;
        }

        const {mentions} = useStore();
        const hasMentions = mentions.get(channel.id)?.count;

        if (hasMentions) return 'mention';

        const lastMessagedAt = this.lastMessagedAt! || 0;
        const lastSeenAt = this.lastSeen! || 0;
        if (!lastSeenAt) return true;
        return lastMessagedAt > lastSeenAt;
      },
      get permissionList () {
        const permissions = this.permissions || 0;
        return getAllPermissions(CHANNEL_PERMISSIONS, permissions);
      },
      get mentionCount() {
        const mention = useMention();
        const count = mention.get(channel.id)?.count || 0

        return count;
      },
      updateLastSeen(timestamp?: number) {
        setChannels(this.id, "lastSeen", timestamp);
      },
      updateLastMessaged(timestamp?: number) {
        setChannels(this.id, "lastMessagedAt", timestamp);
      },
      dismissNotification(force = false) {
        if (force) return dismissChannelNotification(channel.id);
        const {hasFocus} = useWindowProperties();
        if (!hasFocus()) return;
        if (!this.hasNotifications) return;
        dismissChannelNotification(channel.id);
      },
      setRecipientId(userId: string) {
        setChannels(this.id, "recipientId", userId);
      },
      update(update) {
        setChannels(this.id, update);
      },
      joinCall() {
        const {setCurrentVoiceChannelId} = useVoiceUsers();
        postJoinVoice(this.id, socketClient.id()).then(() => {
          setCurrentVoiceChannelId(this.id);
        })
      },
      leaveCall() {
        const {setCurrentVoiceChannelId} = useVoiceUsers();
        postLeaveVoice(this.id).then(() => {
          setCurrentVoiceChannelId(null);
        })
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

const getChannelsByServerId = (serverId: string, hidePrivateIfNoPerm = false) => {
  if (!hidePrivateIfNoPerm) return array().filter(channel => channel?.serverId === serverId);
  const serverMembers = useServerMembers();
  const account = useAccount();
  const member = serverMembers.get(serverId, account.user()?.id!);
  const hasAdminPerm = member?.hasPermission(ROLE_PERMISSIONS.ADMIN) || member?.amIServerCreator();
  if (hasAdminPerm) return array().filter(channel => channel?.serverId === serverId);


  return array().filter(channel => {
    const isServerChannel = channel?.serverId === serverId;
    const isPrivateChannel = hasBit(channel?.permissions || 0, CHANNEL_PERMISSIONS.PRIVATE_CHANNEL.bit);
    return isServerChannel && !isPrivateChannel;
  });
}


// if order field exists, sort by order, else, sort by created date
const getSortedChannelsByServerId = (serverId: string, hidePrivateIfNoPerm = false) => {
  return getChannelsByServerId(serverId, hidePrivateIfNoPerm).sort((a, b) => {
    if (a!.order && b!.order) {
      return a!.order - b!.order;
    } else {
      return a!.createdAt - b!.createdAt;
    }
  })
}



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
    getSortedChannelsByServerId,
    deleteChannel,
    get,
    set,
    removeAllServerChannels
  }
}