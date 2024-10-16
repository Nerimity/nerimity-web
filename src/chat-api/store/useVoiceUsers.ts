import { batch, createSignal } from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import { RawVoice } from "../RawData";
import useUsers, { User } from "./useUsers";
import type SimplePeer from "@thaunknown/simple-peer";
import useAccount from "./useAccount";
import { emitVoiceSignal } from "../emits/voiceEmits";
import useChannels from "./useChannels";
import env from "@/common/env";
import vad from "voice-activity-detection";
import { getStorageString, StorageKeys } from "@/common/localStorage";
import { postGenerateCredential } from "../services/VoiceService";

interface VADInstance {
  connect: () => void;
  disconnect: () => void;
  destroy: () => void;
}
export type VoiceUser = RawVoice & {
  user: () => User;
  peer?: SimplePeer.Instance;
  addSignal(this: VoiceUser, signal: SimplePeer.SignalData): void;
  addPeer(this: VoiceUser, signal: SimplePeer.SignalData): void;
  audioStream?: MediaStream;
  videoStream?: MediaStream;
  vad?: VADInstance;
  voiceActivity: boolean;
  audio?: HTMLAudioElement;

  waitingForVideoStreamId?: string;
  waitingForAudioStreamId?: string;
};

// voiceUsers[channelId][userId] = VoiceUser
const [voiceUsers, setVoiceUsers] = createStore<
  Record<string, Record<string, VoiceUser | undefined>>
>({});
const [currentVoiceChannelId, _setCurrentVoiceChannelId] = createSignal<
  null | string
>(null);

interface LocalStreams {
  audioStream: MediaStream | null;
  videoStream: MediaStream | null;
  vadStream: MediaStream | null;
  vad: VADInstance | null;
}
const [localStreams, setLocalStreams] = createStore<LocalStreams>({
  audioStream: null,
  videoStream: null,
  vad: null,
  vadStream: null,
});

const set = async (voiceUser: RawVoice) => {
  const users = useUsers();
  const account = useAccount();

  if (!voiceUsers[voiceUser.channelId]) {
    setVoiceUsers(voiceUser.channelId, {});
  }

  let peer: SimplePeer.Instance | undefined;

  {
    const isSelf = voiceUser.userId === account.user()?.id;
    const isInVoice = currentVoiceChannelId() === voiceUser.channelId;

    if (!isSelf && isInVoice) {
      peer = await createPeer(voiceUser);
    }

    const user = users.get(voiceUser.userId);
    user.setVoiceChannelId(voiceUser.channelId);
  }

  const newVoice: VoiceUser = {
    ...voiceUser,
    peer,
    voiceActivity: false,
    user,
    addSignal,
    addPeer,
  };
  console.log("test");

  setVoiceUsers(voiceUser.channelId, voiceUser.userId, reconcile(newVoice));
};

function addSignal(this: VoiceUser, signal: SimplePeer.SignalData) {
  this.peer?.signal(signal);
}

async function addPeer(this: VoiceUser, signal: SimplePeer.SignalData) {
  const user = this.user();
  console.log(user.username, "peer added");

  const { default: LazySimplePeer } = await import("@thaunknown/simple-peer");
  const turnServer = await postGenerateCredential();

  const peer = new LazySimplePeer({
    initiator: false,
    trickle: true,
    config: {
      iceServers: [
        turnServer.result,
        {
          urls: ["stun:stun.l.google.com:19302"],
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
    streams: [localStreams.audioStream, localStreams.videoStream].filter(
      (stream) => stream
    ) as MediaStream[],
  });

  peer.on("signal", (signal) => {
    emitVoiceSignal(this.channelId, this.userId, signal);
  });

  peer.on("stream", (stream) => {
    console.log("stream");
    onStream(this, stream);
  });

  peer.on("data", (chunk: Uint8Array) => {
    onData(this, Uint8ArrayToJson(chunk));
  });
  peer.on("connect", () => {
    console.log("connect");
    if (localStreams.audioStream) {
      sendStreamToPeer(localStreams.audioStream, "audio");
    }
    if (localStreams.videoStream) {
      sendStreamToPeer(localStreams.videoStream, "video");
    }
  });
  peer.on("end", () => {
    console.log(user.username + " peer removed");
  });
  peer.on("error", (err) => {
    console.log(err);
  });
  peer.signal(signal);

  setVoiceUsers(this.channelId, this.userId, "peer", peer);
}

function user(this: VoiceUser) {
  const users = useUsers();
  return users.get(this.userId);
}

const removeUserInVoice = (channelId: string, userId: string) => {
  const voiceUser = voiceUsers[channelId][userId];
  batch(() => {
    voiceUser?.vad?.destroy();
    voiceUser?.user().setVoiceChannelId(undefined);
    voiceUser?.peer?.destroy();
    setVoiceUsers(channelId, userId, undefined);
  });
};

const getVoiceUsers = (channelId: string): VoiceUser[] => {
  const account = useAccount();
  const selfUserId = account.user()?.id!;
  return Object.values(voiceUsers[channelId] || {}).map((v) => {
    if (v?.userId !== selfUserId) return v;
    return {
      ...v,
      audioStream: localStreams.audioStream || undefined,
      videoStream: localStreams.videoStream || undefined,
    };
  }) as VoiceUser[];
};

const getVoiceUser = (channelId: string, userId: string) => {
  return voiceUsers[channelId]?.[userId];
};

export async function createPeer(voiceUser: VoiceUser | RawVoice) {
  const users = useUsers();
  const user = users.get(voiceUser.userId);
  console.log(user.username, "peer created");

  const { default: LazySimplePeer } = await import("@thaunknown/simple-peer");
  const turnServer = await postGenerateCredential();

  const peer = new LazySimplePeer({
    initiator: true,
    trickle: true,
    config: {
      iceServers: [
        turnServer.result,
        {
          urls: ["stun:stun.l.google.com:19302"],
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
    streams: [localStreams.audioStream, localStreams.videoStream].filter(
      (stream) => stream
    ) as MediaStream[],
  });

  peer.on("signal", (signal) => {
    emitVoiceSignal(voiceUser.channelId, voiceUser.userId, signal);
  });

  peer.on("stream", (stream) => {
    console.log("stream");
    onStream(voiceUser, stream);
  });
  peer.on("data", (chunk: Uint8Array) => {
    onData(voiceUser, Uint8ArrayToJson(chunk));
  });
  peer.on("connect", () => {
    console.log("connect");
    // if (localStreams.audioStream) {
    //   sendStreamToPeer(localStreams.audioStream, "audio");
    // }
    // if (localStreams.videoStream) {
    //   sendStreamToPeer(localStreams.videoStream, "video");
    // }
  });
  peer.on("end", () => {
    console.log(user.username, "end");
  });
  peer.on("error", (err) => {
    console.log(err);
  });
  return peer;
}

function setLocalVAD(stream: MediaStream) {
  const account = useAccount();

  const audioContext = new AudioContext();
  const track = localStreams.audioStream?.getAudioTracks()[0]!;
  const vadInstance = vad(audioContext, stream, {
    minNoiseLevel: 0.15,
    noiseCaptureDuration: 0,

    onVoiceStart: function () {
      setVoiceUsers(currentVoiceChannelId()!, account.user()?.id!, {
        voiceActivity: true,
      });
      track.enabled = true;
    },
    onVoiceStop: function () {
      setVoiceUsers(currentVoiceChannelId()!, account.user()?.id!, {
        voiceActivity: false,
      });
      track.enabled = false;
    },
  });
  setLocalStreams({ vad: vadInstance });
}

function setVAD(stream: MediaStream, voiceUser: RawVoice) {
  const audioContext = new AudioContext();
  const vadInstance = vad(audioContext, stream, {
    minNoiseLevel: 0,

    noiseCaptureDuration: 0,
    avgNoiseMultiplier: 0.1,
    onVoiceStart: function () {
      setVoiceUsers(voiceUser.channelId, voiceUser.userId, {
        voiceActivity: true,
      });
    },
    onVoiceStop: function () {
      setVoiceUsers(voiceUser.channelId, voiceUser.userId, {
        voiceActivity: false,
      });
    },
  });
  setVoiceUsers(voiceUser.channelId, voiceUser.userId, { vad: vadInstance });
}

const onData = (
  rawVoice: RawVoice,
  data?: { type: "video" | "audio"; streamId: string }
) => {
  if (!data?.type || !data?.streamId) return;
  const voiceUser = getVoiceUser(rawVoice.channelId, rawVoice.userId);
  if (!voiceUser) return;

  setVoiceUsers(voiceUser.channelId, voiceUser.userId, {
    ...(data.type === "audio"
      ? { waitingForAudioStreamId: data.streamId }
      : {}),
    ...(data.type === "video"
      ? { waitingForVideoStreamId: data.streamId }
      : {}),
  });
};

const onStream = (voiceUser: RawVoice, stream: MediaStream) => {
  // const voiceUser = getVoiceUser(rawVoiceUser.channelId, rawVoiceUser.userId);
  // if (!voiceUser) return;
  // if (!voiceUser.waitingForAudioStreamId && !voiceUser.waitingForVideoStreamId) return;

  // const streamType = voiceUser.waitingForAudioStreamId === stream.id ? "audioStream" : "videoStream";

  const videoTracks = stream.getVideoTracks();
  const streamType = videoTracks.length ? "videoStream" : "audioStream";

  stream.onremovetrack = () => {
    setVoiceUsers(voiceUser.channelId, voiceUser.userId, {
      [streamType]: null,
      ...(streamType === "audioStream"
        ? { audio: mic, voiceActivity: false }
        : {}),
    });
    stream.onremovetrack = null;
  };

  let mic: HTMLAudioElement | undefined = undefined;
  if (streamType === "audioStream") {
    setVAD(stream, voiceUser);
    mic = new Audio();
    const deviceId = getStorageString(StorageKeys.outputDeviceId, undefined);
    if (deviceId) {
      mic.setSinkId(JSON.parse(deviceId));
    }
    mic.srcObject = stream;
    mic.play();
  }
  setVoiceUsers(voiceUser.channelId, voiceUser.userId, {
    [streamType]: stream,
    ...(streamType === "audioStream" ? { audio: mic } : {}),
  });
};

const isLocalMicMuted = () => localStreams.audioStream === null;

const toggleMic = async () => {
  const deviceId = getStorageString(StorageKeys.inputDeviceId, undefined);
  if (isLocalMicMuted()) {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: !deviceId ? true : { deviceId: JSON.parse(deviceId) },
      video: false,
    });
    const vadStream = await navigator.mediaDevices.getUserMedia({
      audio: !deviceId ? true : { deviceId: JSON.parse(deviceId) },
      video: false,
    });

    setLocalStreams({ audioStream: stream, vadStream });
    setLocalVAD(vadStream);
    sendStreamToPeer(stream, "audio");
    return;
  }
  const account = useAccount();
  localStreams.vadStream?.getAudioTracks()[0].stop();
  localStreams.vad?.destroy();
  stopStream(localStreams.audioStream!);
  setLocalStreams({ audioStream: null });
  setVoiceUsers(currentVoiceChannelId()!, account.user()?.id!, {
    voiceActivity: false,
  });
};

const setVideoStream = (stream: MediaStream | null) => {
  if (localStreams.videoStream) {
    localStreams.videoStream.getTracks().forEach((t) => t.stop());
    removeStreamFromPeer(localStreams.videoStream);
  }
  setLocalStreams({ videoStream: stream });

  if (!stream) return;

  sendStreamToPeer(stream, "video");

  const videoTrack = stream.getVideoTracks()[0];

  videoTrack.onended = () => {
    stopStream(stream);
    setLocalStreams({ videoStream: null });
    videoTrack.onended = null;
  };
};

const micEnabled = (channelId: string, userId: string) => {
  const account = useAccount();
  if (account.user()?.id === userId) {
    return !!localStreams.audioStream;
  }
  return !!voiceUsers[channelId][userId]?.audioStream;
};
const videoEnabled = (channelId: string, userId: string) => {
  const account = useAccount();
  if (account.user()?.id === userId) {
    return !!localStreams.videoStream;
  }
  return !!voiceUsers[channelId][userId]?.videoStream;
};

const sendStreamToPeer = (stream: MediaStream, type: "audio" | "video") => {
  console.log("sending stream...");

  const voiceUsers = getVoiceUsers(currentVoiceChannelId()!);
  for (let i = 0; i < voiceUsers.length; i++) {
    const voiceUser = voiceUsers[i];
    // voiceUser?.peer?.write(
    //   jsonToUint8Array({
    //     type,
    //     streamId: stream.id,
    //   })
    // );
    voiceUser?.peer?.addStream(stream);
  }
};
const removeStreamFromPeer = (stream: MediaStream) => {
  console.log("removing stream...");
  const voiceUsers = getVoiceUsers(currentVoiceChannelId()!);
  for (let i = 0; i < voiceUsers.length; i++) {
    const voiceUser = voiceUsers[i];
    voiceUser?.peer?.removeStream(stream);
  }
};

const stopStream = (mediaStream: MediaStream) => {
  removeStreamFromPeer(mediaStream);
  mediaStream.getTracks().forEach((track) => track.stop());
};

const setCurrentVoiceChannelId = (channelId: string | null) => {
  const channels = useChannels();

  const oldChannelId = currentVoiceChannelId();
  if (oldChannelId) {
    const channel = channels.get(oldChannelId);
    channel?.setCallJoinedAt(undefined);
  }

  const channel = channels.get(channelId!);
  channel?.setCallJoinedAt(Date.now());

  const voiceUsers = getVoiceUsers(currentVoiceChannelId()!);
  _setCurrentVoiceChannelId(channelId);

  localStreams.videoStream && stopStream(localStreams.videoStream);
  if (localStreams.audioStream) {
    localStreams.vadStream?.getAudioTracks()[0].stop();
    localStreams.vad?.destroy();
    stopStream(localStreams.audioStream);
  }

  setLocalStreams({ videoStream: null, audioStream: null });
  if (!voiceUsers) return;

  batch(() => {
    voiceUsers.forEach((voiceUser) => {
      voiceUser?.peer?.destroy();
      voiceUser?.vad?.destroy();
      setVoiceUsers(voiceUser?.channelId!, voiceUser?.userId!, {
        peer: undefined,
        audioStream: undefined,
        videoStream: undefined,
        vad: undefined,
        voiceActivity: false,
      });
    });
  });
};

function resetAll() {
  batch(() => {
    if (currentVoiceChannelId()) {
      setCurrentVoiceChannelId(null);
    }
    setVoiceUsers(reconcile({}));
  });
}

export default function useVoiceUsers() {
  return {
    set,
    getVoiceUser,
    getVoiceUsers,
    removeUserInVoice,
    currentVoiceChannelId,
    setCurrentVoiceChannelId,
    isLocalMicMuted,
    micEnabled,
    videoEnabled,
    toggleMic,
    setVideoStream,
    resetAll,
    localStreams,
  };
}

function jsonToUint8Array<T extends object>(json: T) {
  return new TextEncoder().encode(JSON.stringify(json));
}

function Uint8ArrayToJson(array: Uint8Array) {
  try {
    return JSON.parse(new TextDecoder().decode(array));
  } catch {
    return null;
  }
}
