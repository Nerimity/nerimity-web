
import { batch, createSignal } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import { RawVoice } from '../RawData';
import useUsers, { User } from './useUsers';
import SimplePeer from '@thaunknown/simple-peer';
import useAccount from './useAccount';
import { emitVoiceSignal } from '../emits/voiceEmits';
import useChannels from './useChannels';
import env from '@/common/env';
import vad from 'voice-activity-detection';

interface VADInstance {
  connect: () => void;
  disconnect: () => void;
  destroy: () => void;
}
export type VoiceUser = RawVoice & {
  user: User;
  peer?: SimplePeer.Instance
  addSignal(this: VoiceUser, signal: SimplePeer.SignalData): void;
  addPeer(this: VoiceUser, signal: SimplePeer.SignalData): void;
  audioStream?: MediaStream;
  videoStream?: MediaStream;
  vad?: VADInstance;
  voiceActivity: boolean
}


// voiceUsers[channelId][userId] = VoiceUser
const [voiceUsers, setVoiceUsers] = createStore<Record<string, Record<string, VoiceUser | undefined>>>({});
const [currentVoiceChannelId, _setCurrentVoiceChannelId] = createSignal<null | string>(null);

interface LocalStreams {
  audioStream: MediaStream | null;
  videoStream: MediaStream | null;
  vadStream: MediaStream | null;
  vad: VADInstance | null
}
const [localStreams, setLocalStreams] = createStore<LocalStreams>({audioStream: null, videoStream: null, vad: null, vadStream: null});


const set = (voiceUser: RawVoice) => {
  const users = useUsers();
  const account = useAccount();

  if (!voiceUsers[voiceUser.channelId]) {
    setVoiceUsers(voiceUser.channelId, {});
  }

  let peer: SimplePeer.Instance | undefined;

  const isSelf = voiceUser.userId === account.user()?.id;
  const isInVoice = currentVoiceChannelId() === voiceUser.channelId;

  if (!isSelf && isInVoice) {
    peer = createPeer(voiceUser);
  }

  const user = users.get(voiceUser.userId);
  user.setVoiceChannelId(voiceUser.channelId);

  setVoiceUsers(voiceUser.channelId, voiceUser.userId, {
    ...voiceUser,
    peer,
    voiceActivity: false,
    get user() {
      return users.get(voiceUser.userId);
    },
    addSignal(signal) {
      this.peer?.signal(signal);
    },
    addPeer(signal) {
      setVoiceUsers(voiceUser.channelId, voiceUser.userId, 'peer', addPeer(voiceUser, signal))
    }
  });
}



const removeUserInVoice = (channelId: string, userId: string) => {
  const voiceUser = voiceUsers[channelId][userId];
  batch(() => {
    voiceUser?.vad?.destroy();
    voiceUser?.user.setVoiceChannelId(undefined);
    voiceUser?.peer?.destroy();
    setVoiceUsers(channelId, userId, undefined);
  })
}


const getVoiceInChannel = (channelId: string) => {
  return voiceUsers[channelId];
}


const getVoiceUser = (channelId: string, userId: string) => {
  return voiceUsers[channelId][userId];
}

export function createPeer(voiceUser: RawVoice) {
  const users = useUsers();
  const user = users.get(voiceUser.userId);
  console.log(user.username, "peer created")
  const peer = new SimplePeer({
    initiator: true,
    trickle: true,
    config: {
      iceServers: [
        {
          urls: [
            'stun:stun.l.google.com:19302',
          ]
        },
        {
          urls: "stun:stun.relay.metered.ca:80",
        },
        {
          urls: "turn:a.relay.metered.ca:80",
          username: "b9fafdffb3c428131bd9ae10",
          credential: "DTk2mXfXv4kJYPvD",
        },
        {
          urls: "turn:a.relay.metered.ca:80?transport=tcp",
          username: "b9fafdffb3c428131bd9ae10",
          credential: "DTk2mXfXv4kJYPvD",
        },
        {
          urls: "turn:a.relay.metered.ca:443",
          username: "b9fafdffb3c428131bd9ae10",
          credential: "DTk2mXfXv4kJYPvD",
        },
        {
          urls: "turn:a.relay.metered.ca:443?transport=tcp",
          username: "b9fafdffb3c428131bd9ae10",
          credential: "DTk2mXfXv4kJYPvD",
        },
      ],
    },
    streams: [localStreams.audioStream, localStreams.videoStream].filter(stream => stream) as MediaStream[]
  })

  peer.on("signal", signal => {
    emitVoiceSignal(voiceUser.channelId, voiceUser.userId, signal)
  })
  
  peer.on("stream", stream => {
    console.log("stream")
    onStream(voiceUser, stream)
  })

  peer.on("connect", () => {
    console.log("connect")
  })
  peer.on("end", () => {console.log(user.username, "end")})
  peer.on("error", (err) => {console.log(err)})
  return peer;
}


function setLocalVAD(stream: MediaStream) {
  const account = useAccount();

  const audioContext = new AudioContext();
  const track = localStreams.audioStream?.getAudioTracks()[0]!;
  const vadInstance = vad(audioContext, stream, {

    minNoiseLevel: 0.15,
    noiseCaptureDuration: 0,

    onVoiceStart: function() {
      setVoiceUsers(currentVoiceChannelId()!, account.user()?.id!, {voiceActivity: true})
      track.enabled = true;
    },
    onVoiceStop: function() {
      setVoiceUsers(currentVoiceChannelId()!, account.user()?.id!, {voiceActivity: false})
      track.enabled = false;
    },
  })
  setLocalStreams({vad: vadInstance});
}

function setVAD(stream: MediaStream, voiceUser: RawVoice) {
  const audioContext = new AudioContext();
  const vadInstance = vad(audioContext, stream, {
    minNoiseLevel: 0,

    noiseCaptureDuration: 0,
    avgNoiseMultiplier: 0.1,
    onVoiceStart: function() {
      setVoiceUsers(voiceUser.channelId, voiceUser.userId, {voiceActivity: true})
    },
    onVoiceStop: function() {
      setVoiceUsers(voiceUser.channelId, voiceUser.userId, {voiceActivity: false})
    },
  })
  setVoiceUsers(voiceUser.channelId, voiceUser.userId, {vad: vadInstance});
}

export function addPeer(voiceUser: RawVoice, signal: SimplePeer.SignalData) {
  const users = useUsers();
  const user = users.get(voiceUser.userId);
  console.log(user.username, "peer added")
  const peer = new SimplePeer({
    initiator: false,
    trickle: true,
    config: {
      iceServers: [
        {
          urls: [
            'stun:stun.l.google.com:19302'
          ]
        },
        {
          urls: "stun:stun.relay.metered.ca:80",
        },
        {
          urls: "turn:a.relay.metered.ca:80",
          username: "b9fafdffb3c428131bd9ae10",
          credential: "DTk2mXfXv4kJYPvD",
        },
        {
          urls: "turn:a.relay.metered.ca:80?transport=tcp",
          username: "b9fafdffb3c428131bd9ae10",
          credential: "DTk2mXfXv4kJYPvD",
        },
        {
          urls: "turn:a.relay.metered.ca:443",
          username: "b9fafdffb3c428131bd9ae10",
          credential: "DTk2mXfXv4kJYPvD",
        },
        {
          urls: "turn:a.relay.metered.ca:443?transport=tcp",
          username: "b9fafdffb3c428131bd9ae10",
          credential: "DTk2mXfXv4kJYPvD",
        },
      ],
    },
    streams: [localStreams.audioStream, localStreams.videoStream].filter(stream => stream) as MediaStream[]
  })

  peer.on("signal", signal => {
    emitVoiceSignal(voiceUser.channelId, voiceUser.userId, signal)
  })
  
  peer.on("stream", stream => {
    console.log("stream")
    onStream(voiceUser, stream)
  })

  
  peer.on("connect", () => {
    console.log("connect")
  })
  peer.on("end", () => {user.username, console.log("end")})
  peer.on("error", (err) => {console.log(err)})
  peer.signal(signal)
  return peer;
}

const onStream = (voiceUser: RawVoice, stream: MediaStream) => {
  const videoTracks = stream.getVideoTracks();
  const streamType = videoTracks.length ? "videoStream" : "audioStream";

  stream.onremovetrack = () => {
    setVoiceUsers(voiceUser.channelId, voiceUser.userId, {
      [streamType]: null,
      voiceActivity: false
    })
    stream.onremovetrack = null;
  }

  if (streamType === "audioStream") {
    setVAD(stream, voiceUser);
    const mic = new Audio();
    mic.srcObject = stream;
    mic.play();
  }
  setVoiceUsers(voiceUser.channelId, voiceUser.userId, {
    [streamType]: stream,
  })
};

const isLocalMicMuted = () => localStreams.audioStream === null;

const toggleMic = async () => {
  if (isLocalMicMuted()) {
    const stream = await navigator.mediaDevices.getUserMedia({audio: true, video: false});
    const vadStream = await navigator.mediaDevices.getUserMedia({audio: true, video: false});

    setLocalStreams({audioStream: stream, vadStream});
    setLocalVAD(vadStream);
    sendStreamToPeer(stream, 'audio')
    return;
  }
  const account = useAccount();
  localStreams.vadStream?.getAudioTracks()[0].stop();
  localStreams.vad?.destroy();
  stopStream(localStreams.audioStream!);
  setLocalStreams({audioStream: null});
  setVoiceUsers(currentVoiceChannelId()!, account.user()?.id!, {voiceActivity: false});
}


const micEnabled = (channelId: string, userId: string) => {
  const account = useAccount();
  if (account.user()?.id === userId) {
    return !!localStreams.audioStream;
  }
  return !!voiceUsers[channelId][userId]?.audioStream;
}



const sendStreamToPeer = (stream: MediaStream, type: 'audio' | 'video') => {
  console.log("sending stream...")

  const voiceUsers = Object.values(getVoiceInChannel(currentVoiceChannelId()!));
  for (let i = 0; i < voiceUsers.length; i++) {
    const voiceUser = voiceUsers[i];
    voiceUser?.peer?.addStream(stream);
  }
}
const removeStreamFromPeer = (stream: MediaStream) => {
  console.log("removing stream...")
  const voiceUserObj = getVoiceInChannel(currentVoiceChannelId()!);
  if (!voiceUserObj) return;
  const voiceUsers = Object.values(voiceUserObj)
  for (let i = 0; i < voiceUsers.length; i++) {
    const voiceUser = voiceUsers[i];
    voiceUser?.peer?.removeStream(stream);
  }
}




const stopStream = (mediaStream: MediaStream) => {
  removeStreamFromPeer(mediaStream);
  mediaStream.getTracks().forEach(track => track.stop());
}


const setCurrentVoiceChannelId = (channelId: string | null) => {
  const channels = useChannels();

  const oldChannelId = currentVoiceChannelId();
  if (oldChannelId) {
    const channel = channels.get(oldChannelId);
    channel?.setCallJoinedAt(undefined);
  }

  const channel = channels.get(channelId!);
  channel?.setCallJoinedAt(Date.now());
  
  const voiceUsers = getVoiceInChannel(currentVoiceChannelId()!);
  _setCurrentVoiceChannelId(channelId);

  localStreams.videoStream && stopStream(localStreams.videoStream);
  if (localStreams.audioStream) {
    localStreams.vadStream?.getAudioTracks()[0].stop();
    localStreams.vad?.destroy();
    stopStream(localStreams.audioStream);
  }

  setLocalStreams({videoStream: null, audioStream: null});
  if (!voiceUsers) return;

  batch(() => {
    Object.values(voiceUsers).forEach(voiceUser => {
      voiceUser?.peer?.destroy()
      voiceUser?.vad?.destroy();
      setVoiceUsers(voiceUser?.channelId!, voiceUser?.userId!, {
        peer: undefined,
        audioStream: undefined,
        videoStream: undefined,
        vad: undefined,
        voiceActivity: false,
      });
    });
  })
  
}


function resetAll() {
  batch(() => {
    if (currentVoiceChannelId()) {
      setCurrentVoiceChannelId(null);
    }
    setVoiceUsers(reconcile({}));
  })
}



export default function useVoiceUsers() {
  return {
    set,
    getVoiceUser,
    getVoiceInChannel,
    removeUserInVoice,
    currentVoiceChannelId,
    setCurrentVoiceChannelId,
    isLocalMicMuted,
    micEnabled,
    toggleMic,
    resetAll
  }
}

async function test () {
  const stream = await navigator.mediaDevices.getDisplayMedia({audio: {


  }, video: true});
  

  const st = new MediaStream([stream.getAudioTracks()[0]])
  return st;
}