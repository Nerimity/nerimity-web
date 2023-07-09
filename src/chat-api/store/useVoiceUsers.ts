
import { createSignal } from 'solid-js';
import { createStore } from 'solid-js/store';
import { RawVoice } from '../RawData';
import useUsers, { User } from './useUsers';
import SimplePeer from '@thaunknown/simple-peer';
import useAccount from './useAccount';
import { emitVoiceSignal } from '../emits/voiceEmits';


export type VoiceUser = RawVoice & {
  user: User;
  peer?: SimplePeer.Instance
  addSignal(signal: SimplePeer.SignalData): void;
  addPeer(this: VoiceUser, signal: SimplePeer.SignalData): void;
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

  const isSelf = voiceUser.userId === user()?.id;
  const isInVoice = currentVoiceChannelId() === voiceUser.channelId;

  if (!isSelf && isInVoice) {
    peer = createPeer(voiceUser);
  }

  setVoiceUsers(voiceUser.channelId, voiceUser.userId, {
    ...voiceUser,
    peer,
    get user() {
      return users.get(voiceUser.userId);
    },
    addSignal(signal) {
      peer?.signal(signal);
    },
    addPeer(signal) {
      setVoiceUsers(voiceUser.channelId, voiceUser.userId, 'peer', addPeer(voiceUser, signal))
    }
  });
}



const removeUserInVoice = (channelId: string, userId: string) => {
  setVoiceUsers(channelId, userId, undefined);
}


const getVoiceInChannel = (channelId: string) => {
  return voiceUsers[channelId];
}


const getVoiceUser = (channelId: string, userId: string) => {
  return voiceUsers[channelId][userId];
}

export function createPeer(voiceUser: RawVoice) {
  console.log("peer created")
  const peer = new SimplePeer({
    initiator: true,
    trickle: true,
    streams: []
  })

  peer.on("signal", signal => {
    emitVoiceSignal(voiceUser.channelId, voiceUser.userId, signal)
  })
  
  peer.on("stream", stream => {
    console.log("stream")
  })

  peer.on("connect", () => {
    console.log("connect")
  })
  return peer;
}

export function addPeer(voiceUser: RawVoice, signal: SimplePeer.SignalData) {
  console.log("peer added")
  const peer = new SimplePeer({
    initiator: false,
    trickle: true,
    streams: []
  })

  peer.on("signal", signal => {
    emitVoiceSignal(voiceUser.channelId, voiceUser.userId, signal)
  })
  
  peer.on("stream", stream => {
    console.log("stream")
  })

  peer.on("connect", () => {
    console.log("connect")
  })
  peer.signal(signal)
  return peer;
}


export default function useVoiceUsers() {
  return {
    set,
    getVoiceUser,
    getVoiceInChannel,
    removeUserInVoice,
    currentVoiceChannelId,
    setCurrentVoiceChannelId
  }
}