import RouterEndpoints from '@/common/RouterEndpoints';
import { runWithContext } from '@/common/runWithContext';
import { batch, createSignal } from 'solid-js';
import { createStore } from 'solid-js/store';
import { useWindowProperties } from '../../common/useWindowProperties';
import { dismissChannelNotification } from '../emits/userEmits';
import { CHANNEL_PERMISSIONS, getAllPermissions, Bitwise, hasBit, ROLE_PERMISSIONS } from '../Bitwise';
import { RawChannel, RawVoice, ServerNotificationPingMode } from '../RawData';
import useMessages from './useMessages';
import useUsers, { User } from './useUsers';
import useStore from './useStore';
import useServerMembers from './useServerMembers';
import useAccount from './useAccount';
import useMention from './useMention';

export type VoiceUser = RawVoice & {
  user: User;
}


// voiceUsers[channelId][userId] = VoiceUser
const [voiceUsers, setVoiceUsers] = createStore<Record<string, Record<string, VoiceUser | undefined>>>({});
const [currentVoiceChannelId, setCurrentVoiceChannelId] = createSignal<null | string>(null);


const set = (voiceUser: RawVoice) => {
  const users = useUsers();

  if (!voiceUsers[voiceUser.channelId]) {
    setVoiceUsers(voiceUser.channelId, {});
  }

  setVoiceUsers(voiceUser.channelId, voiceUser.userId, {
    ...voiceUser,
    get user() {
      return users.get(voiceUser.userId);
    }
  });
}



const removeUserInVoice = (channelId: string, userId: string) => {
  setVoiceUsers(channelId, userId, undefined);
}


const getVoiceInChannel = (channelId: string) => {
  return voiceUsers[channelId];
}



export default function useVoiceUsers() {
  return {
    set,
    getVoiceInChannel,
    removeUserInVoice,
    currentVoiceChannelId,
    setCurrentVoiceChannelId
  }
}