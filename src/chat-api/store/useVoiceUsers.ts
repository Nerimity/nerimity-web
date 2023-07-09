
import { createSignal } from 'solid-js';
import { createStore } from 'solid-js/store';
import { RawVoice } from '../RawData';
import useUsers, { User } from './useUsers';
import SimplePeer from '@thaunknown/simple-peer';
import useAccount from './useAccount';


export type VoiceUser = RawVoice & {
  user: User;
  peer?: SimplePeer.Instance
}


// voiceUsers[channelId][userId] = VoiceUser
const [voiceUsers, setVoiceUsers] = createStore<Record<string, Record<string, VoiceUser | undefined>>>({});
const [currentVoiceChannelId, setCurrentVoiceChannelId] = createSignal<null | string>(null);


const set = (voiceUser: RawVoice) => {
  const users = useUsers();
  const {user} = useAccount();

  if (!voiceUsers[voiceUser.channelId]) {
    setVoiceUsers(voiceUser.channelId, {});
  }

  let peer: SimplePeer.Instance | undefined;

  if (voiceUser.userId !== user()?.id) {
    peer = createPeer();
  }

  setVoiceUsers(voiceUser.channelId, voiceUser.userId, {
    ...voiceUser,
    peer,
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


export function createPeer() {
  console.log("peer created")
  const peer = new SimplePeer({
    initiator: true,
    trickle: true,
    streams: []
  })

  peer.on("signal", signal => {
    console.log("signal", signal)
  })
  
  peer.on("stream", signal => {
    console.log("stream")
  })

  peer.on("connect", () => {
    console.log("connect")
  })
  return peer;
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