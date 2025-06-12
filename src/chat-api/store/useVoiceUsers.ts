import { createStore, reconcile } from "solid-js/store";
import { RawVoice } from "../RawData";
import { batch, createEffect, createMemo, createSignal, on } from "solid-js";
import { getCachedCredentials } from "../services/VoiceService";
import { emitVoiceSignal } from "../emits/voiceEmits";

import type SimplePeer from "@thaunknown/simple-peer";
import useUsers, { User } from "./useUsers";
import LazySimplePeer from "@/components/LazySimplePeer";
import {
  getStorageObject,
  getStorageString,
  StorageKeys,
  useVoiceInputMode,
} from "@/common/localStorage";
import useAccount from "./useAccount";
import { set } from "idb-keyval";
import vad from "voice-activity-detection";
import { downKeys, useGlobalKey } from "@/common/GlobalKey";
import { arrayEquals } from "@/common/arrayEquals";

const createIceServers = () => [
  getCachedCredentials(),
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
];

type StreamWithTracks = {
  stream: MediaStream;
  tracks: MediaStreamTrack[];
};

export type ConnectionStatus = "CONNECTED" | "DISCONNECTED" | "CONNECTING";

export type VoiceUser = RawVoice & {
  user: () => User;
  peer?: SimplePeer.Instance;
  streamWithTracks?: StreamWithTracks[];
  audio?: HTMLAudioElement;
  voiceActivity?: boolean;
  vadInstance?: ReturnType<typeof vad>;
  connectionStatus: ConnectionStatus;
};

type ChannelUsersMap = Record<string, VoiceUser | undefined>;
type VoiceUsersMap = Record<string, ChannelUsersMap>;

// voiceUsers[channelId][userId] = VoiceUser
const [voiceUsers, setVoiceUsers] = createStore<VoiceUsersMap>({});
const [deafened, setDeafened] = createStore({
  enabled: false,
  wasMicEnabled: false,
});

interface CurrentVoiceUser {
  channelId: string;
  audioStream: MediaStream | null;
  videoStream: MediaStream | null;
  vadInstance?: ReturnType<typeof vad>;
  vadAudioStream?: MediaStream | null;
}
const [currentVoiceUser, setCurrentVoiceUser] = createSignal<
  CurrentVoiceUser | undefined
>(undefined);

const { start, stop } = useGlobalKey();
const [voiceMode] = useVoiceInputMode();

createEffect(
  on(currentVoiceUser, (current) => {
    stop();
    if (!current?.channelId) return;
    if (voiceMode() !== "PTT") return;
    start();
  })
);

function toggleDeafen() {
  const newDeafenEnabled = !deafened.enabled;
  const currentUser = currentVoiceUser();
  if (!currentUser) return;

  const isMicEnabled = !!currentUser.audioStream;

  const voiceUsers = getVoiceUsersByChannelId(currentUser.channelId);
  voiceUsers.forEach((voiceUser) => {
    if (voiceUser.audio) {
      voiceUser.audio.muted = newDeafenEnabled;
    }
  });

  if (!newDeafenEnabled && deafened.wasMicEnabled) {
    enableMic();
  }

  if (newDeafenEnabled && isMicEnabled) {
    disableMic();
  }

  batch(() => {
    setDeafened("enabled", newDeafenEnabled);
    setDeafened("wasMicEnabled", isMicEnabled);
  });
}

const micTrack = createMemo(() => {
  const current = currentVoiceUser();
  return current?.audioStream?.getAudioTracks()[0];
});

createEffect(
  on(
    () => downKeys.length,
    () => {
      const bound = getStorageObject(StorageKeys.PTTBoundKeys, []);
      if (!bound.length) return;
      const mic = micTrack();
      if (!mic) return;
      const current = currentVoiceUser();
      if (!current) return;

      if (!arrayEquals(downKeys, bound)) {
        mic.enabled = false;
        setVoiceUsers(current.channelId, useAccount().user()?.id!, {
          voiceActivity: false,
        });
        return;
      }
      mic.enabled = true;
      setVoiceUsers(current.channelId, useAccount().user()?.id!, {
        voiceActivity: true,
      });
    }
  )
);

const setCurrentChannelId = (channelId: string | null, reconnect = false) => {
  const current = currentVoiceUser();
  if (current?.channelId) {
    removeAllPeers(current?.channelId);
    current.vadInstance?.destroy();
    current.vadAudioStream?.getAudioTracks()[0]?.stop();
    batch(() => {
      getVoiceUsersByChannelId(current.channelId).forEach((voiceUser) => {
        voiceUser.vadInstance?.destroy();
        setVoiceUsers(current.channelId, voiceUser.userId, {
          voiceActivity: false,
          vadInstance: undefined,
        });
      });
    });
  }
  if (!channelId) {
    setCurrentVoiceUser(undefined);
    setDeafened("wasMicEnabled", false);

    current?.audioStream?.getTracks().forEach((track) => {
      track.stop();
    });
    current?.videoStream?.getTracks().forEach((track) => {
      track.stop();
    });

    return;
  }
  if (!reconnect) {
    setCurrentVoiceUser({
      channelId,
      audioStream: null,
      videoStream: null,
      vadAudioStream: null,
      vadInstance: undefined,
      micMuted: true,
    });
  }
};

const activeRemoteStream = (userId: string, kind: "audio" | "video") => {
  const current = currentVoiceUser();
  if (!current) return;
  const voiceUser = getVoiceUser(current.channelId, userId);
  if (!voiceUser) return;

  if (kind === "audio") {
    return voiceUser.streamWithTracks?.find((stream) =>
      stream.tracks.every((track) => track.kind === kind)
    )?.stream;
  } else {
    return voiceUser.streamWithTracks?.find((stream) =>
      stream.tracks.find((track) => track.kind === kind)
    )?.stream;
  }
};

const removeAllPeers = (channelIdToRemove?: string) => {
  batch(() => {
    for (const channelId in voiceUsers) {
      for (const userId in voiceUsers[channelId]) {
        const voiceUser = getVoiceUser(channelId, userId);
        if (!voiceUser) continue;
        if (channelIdToRemove && voiceUser?.channelId !== channelIdToRemove)
          continue;
        voiceUser.peer?.destroy();
        voiceUser.vadInstance?.destroy();
        voiceUser.audio?.remove();
        setVoiceUsers(channelId, userId, "peer", undefined);
        setVoiceUsers(channelId, userId, "streamWithTracks", []);
      }
    }
  });
};

const getVoiceUsersByChannelId = (id: string) => {
  return Object.values(voiceUsers[id] || {}) as VoiceUser[];
};

const getVoiceUser = (channelId?: string, userId?: string) => {
  return voiceUsers[channelId!]?.[userId!];
};
const removeVoiceUser = (channelId: string, userId: string) => {
  const voiceUser = getVoiceUser(channelId, userId);
  if (!voiceUser) return;
  batch(() => {
    voiceUser?.vadInstance?.destroy();
    voiceUser.peer?.destroy();
    voiceUser.audio?.remove();
    setVoiceUsers(channelId, userId, undefined);
  });
};

const createVoiceUser = (rawVoice: RawVoice, reconnecting = false) => {
  const account = useAccount();
  const users = useUsers();

  if (!voiceUsers[rawVoice.channelId]) {
    setVoiceUsers(rawVoice.channelId, {});
  }

  {
    const user = users.get(rawVoice.userId);
    user?.setVoiceChannelId(rawVoice.channelId);
  }

  const newVoiceUser: VoiceUser = {
    connectionStatus: "CONNECTING",
    ...rawVoice,
    user,
    streamWithTracks: [],
  };

  if (!reconnecting || rawVoice.userId !== account.user()?.id) {
    setVoiceUsers(rawVoice.channelId, rawVoice.userId, newVoiceUser);
  }

  const isCurrentUserInVoice =
    rawVoice.channelId === currentVoiceUser()?.channelId;

  if (isCurrentUserInVoice) {
    if (!reconnecting) {
      createPeer(newVoiceUser);
    }
  }
};

function user(this: VoiceUser) {
  const users = useUsers();
  return users.get(this.userId)!;
}

const updateConnectionStatus = (
  voiceUser: VoiceUser,
  status: ConnectionStatus
) => {
  try {
    setVoiceUsers(
      voiceUser.channelId,
      voiceUser.userId,
      "connectionStatus",
      status
    );
  } catch {
    /* empty */
  }
};

const createPeer = (voiceUser: VoiceUser, signal?: SimplePeer.SignalData) => {
  const current = currentVoiceUser();
  if (voiceUser.userId === useAccount().user()?.id) return;
  const initiator = !signal;

  const streams: MediaStream[] = [];
  if (current?.audioStream) {
    streams.push(current.audioStream);
  }
  if (current?.videoStream) {
    streams.push(current.videoStream);
  }

  const peer =
    voiceUser.peer ||
    new LazySimplePeer({
      initiator,
      trickle: true,
      config: {
        iceServers: createIceServers(),
      },
      streams,
    });

  setVoiceUsers(voiceUser.channelId, voiceUser.userId, "peer", peer);

  peer.on("connect", () => {
    console.log("RTC> Connected to", voiceUser.user().username + "!");
    updateConnectionStatus(voiceUser, "CONNECTED");
  });
  peer.on("end", () => {
    console.log("RTC> Disconnected from", voiceUser.user().username + ".");
    updateConnectionStatus(voiceUser, "DISCONNECTED");
  });
  peer.on("close", () => {
    console.log("RTC>", voiceUser.user().username, "disconnected.");
    updateConnectionStatus(voiceUser, "DISCONNECTED");
  });
  peer.on("error", (err) => {
    console.error(err);
  });
  peer.on("signal", (data) => {
    emitVoiceSignal(voiceUser.channelId, voiceUser.userId, data);
  });

  peer.on("track", (track, stream) => {
    const channelId = voiceUser.channelId;
    const userId = voiceUser.userId;

    stream.onremovetrack = (event) => {
      const newVoiceUser = getVoiceUser(channelId, userId);
      const activeAudioStream = activeRemoteStream(userId, "audio");
      if (activeAudioStream?.id === stream.id) {
        newVoiceUser?.vadInstance?.destroy();
        setVoiceUsers(channelId, userId, {
          voiceActivity: false,
          vadInstance: undefined,
        });
      }

      const streams = newVoiceUser?.streamWithTracks;
      if (!streams) return;
      const streamWithTracksIndex = streams.findIndex(
        (s) => s.stream?.id === stream?.id
      );
      const tracks = streams[streamWithTracksIndex]?.tracks;

      const newTracks = tracks?.filter((t) => t.id !== event.track.id);
      if (!newTracks?.length) {
        const newStreamWithTracks = streams.filter(
          (s) => s.stream?.id !== stream?.id
        );
        setVoiceUsers(
          channelId,
          userId,
          "streamWithTracks",
          newStreamWithTracks
        );
        return;
      }

      setVoiceUsers(
        channelId,
        userId,
        "streamWithTracks",
        streamWithTracksIndex,
        "tracks",
        newTracks
      );
    };

    pushVoiceUserTrack(voiceUser, track, stream);

    const newVoiceUser = getVoiceUser(channelId, userId);

    const streams = newVoiceUser?.streamWithTracks;
    if (!streams) return;

    const audio = newVoiceUser.audio || new Audio();
    audio.muted = deafened.enabled;
    const deviceId = getStorageString(StorageKeys.outputDeviceId, undefined);
    if (deviceId) {
      audio.setSinkId(JSON.parse(deviceId));
    }
    const activeAudio = activeRemoteStream(userId, "audio");

    newVoiceUser.vadInstance?.destroy();

    const vadInstance = createVadInstance(activeAudio, undefined, userId);
    batch(() => {
      setVoiceUsers(channelId, userId, "vadInstance", vadInstance);

      audio.srcObject = activeAudio || null;
      audio.play();
      if (!audio.srcObject) {
        setVoiceUsers(channelId, userId, "audio", undefined);
      }
      setVoiceUsers(channelId, userId, "audio", audio);
    });
  });

  if (signal) {
    peer.signal(signal);
  }
};

function createVadInstance(
  vadStream?: MediaStream,
  originalStream?: MediaStream,
  userId?: string
) {
  if (!vadStream) return;
  const account = useAccount();

  const originalStreamTrack = originalStream?.getAudioTracks()[0];

  const current = currentVoiceUser();
  if (!current) return;
  const audioContext = new AudioContext();
  const vadInstance = vad(audioContext, vadStream, {
    ...(!userId
      ? {
          minNoiseLevel: 0.15,
          noiseCaptureDuration: 0,
        }
      : {
          minNoiseLevel: 0,
          noiseCaptureDuration: 100,
          avgNoiseMultiplier: 0.1,
          maxNoiseLevel: 0.01,
        }),

    onVoiceStart: function () {
      setVoiceUsers(current.channelId, userId || account.user()?.id!, {
        voiceActivity: true,
      });
      if (originalStreamTrack) {
        originalStreamTrack.enabled = true;
      }
    },
    onVoiceStop: function () {
      setVoiceUsers(current.channelId, userId || account.user()?.id!, {
        voiceActivity: false,
      });
      if (originalStreamTrack) {
        originalStreamTrack.enabled = false;
      }
    },
  });

  return vadInstance;
}

const pushVoiceUserTrack = (
  voiceUser: VoiceUser,
  track: MediaStreamTrack,
  stream: MediaStream
) => {
  const channelId = voiceUser.channelId;
  const userId = voiceUser.userId;

  const newVoiceUser = getVoiceUser(channelId, userId);

  const streams = newVoiceUser?.streamWithTracks;
  if (!streams) return;

  const streamWithTracksIndex = streams.findIndex(
    (s) => s.stream.id === stream.id
  );
  const streamWithTracks = streams[streamWithTracksIndex];

  if (streamWithTracks && streamWithTracksIndex >= 0) {
    setVoiceUsers(
      channelId,
      userId,
      "streamWithTracks",
      streamWithTracksIndex,
      {
        tracks: [...streamWithTracks.tracks, track],
      }
    );
    return;
  }

  setVoiceUsers(channelId, userId, "streamWithTracks", streams.length, {
    stream,
    tracks: [track],
  });
};

const disableMic = () => {
  const userId = useAccount().user()?.id!;
  const current = currentVoiceUser();
  if (!current) return;

  if (current.audioStream) {
    current.vadInstance?.destroy();

    current.vadAudioStream?.getTracks().forEach((track) => {
      track.stop();
    });
    removeStream(current.audioStream);
    setCurrentVoiceUser({ ...current, audioStream: null });
    setVoiceUsers(current.channelId, userId, {
      voiceActivity: false,
    });

    return;
  }
};

const enableMic = async () => {
  const current = currentVoiceUser();
  if (!current) return;

  if (current.audioStream) {
    return;
  }
  const deviceId = getStorageString(StorageKeys.inputDeviceId, undefined);
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: !deviceId ? true : { deviceId: JSON.parse(deviceId) },
    video: false,
  });

  let vadStream: MediaStream | undefined;
  let vadInstance: ReturnType<typeof vad> | undefined;

  if (voiceMode() === "OPEN") {
    setVoiceUsers(current.channelId, useAccount().user()?.id!, {
      voiceActivity: true,
    });
  }

  if (voiceMode() !== "OPEN") {
    stream.getAudioTracks()[0]!.enabled = false;
  }

  if (voiceMode() === "VOICE_ACTIVITY") {
    vadStream = await navigator.mediaDevices.getUserMedia({
      audio: !deviceId ? true : { deviceId: JSON.parse(deviceId) },
      video: false,
    });
    vadInstance = createVadInstance(vadStream, stream);
  }

  addStreamToPeers(stream);

  setCurrentVoiceUser({
    ...current,
    audioStream: stream,
    vadInstance,
    vadAudioStream: vadStream,
  });
};

const toggleMic = async () => {
  const current = currentVoiceUser();
  if (!current) return;

  if (current.audioStream) {
    disableMic();
    return;
  }
  enableMic();
};

const setVideoStream = (stream: MediaStream | null) => {
  const current = currentVoiceUser();
  if (!current) return;
  if (current.videoStream) {
    removeStream(current.videoStream);
  }
  setCurrentVoiceUser({ ...current, videoStream: stream });

  if (!stream) return;

  addStreamToPeers(stream);

  const videoTrack = stream.getVideoTracks()[0]!;

  videoTrack.onended = () => {
    removeStream(stream);
    setCurrentVoiceUser({ ...current, videoStream: null });
    videoTrack.onended = null;
  };
};

const removeStream = (stream: MediaStream) => {
  removeStreamFromPeers(stream);
  stream.getTracks().forEach((track) => {
    track.stop();
  });
};

const addStreamToPeers = (stream: MediaStream) => {
  const current = currentVoiceUser();
  if (!current) return;
  const voiceUsers = getVoiceUsersByChannelId(current.channelId);

  voiceUsers.forEach((voiceUser) => {
    voiceUser.peer?.addStream(stream);
  });
};

const removeStreamFromPeers = (stream: MediaStream) => {
  const current = currentVoiceUser();
  if (!current) return;
  const voiceUsers = getVoiceUsersByChannelId(current.channelId);

  voiceUsers.forEach((voiceUser) => {
    voiceUser.peer?.removeStream(stream);
  });
};

const signal = (voiceUser: VoiceUser, signal: SimplePeer.SignalData) => {
  if (!voiceUser.peer) {
    console.error("No peer for voice user", voiceUser);
    return;
  }

  voiceUser.peer.signal(signal);
};

function resetAll() {
  const account = useAccount();
  const current = currentVoiceUser();
  batch(() => {
    removeAllPeers();
    // setCurrentVoiceUser(undefined);

    if (current) {
      const currentVoiceUser = getVoiceUser(
        current.channelId,
        account.user()?.id!
      );
      if (currentVoiceUser) {
        setVoiceUsers(
          reconcile({
            [current.channelId]: { [account.user()?.id!]: currentVoiceUser },
          })
        );
      }
    } else {
      setVoiceUsers(reconcile({}));
    }
  });
}

const micEnabled = (userId: string) => {
  const account = useAccount();
  if (account.user()?.id === userId) {
    const currentUser = currentVoiceUser();
    return !!currentUser?.audioStream;
  }
  return activeRemoteStream(userId, "audio");
};

const videoEnabled = (userId: string) => {
  const account = useAccount();
  if (account.user()?.id === userId) {
    const currentUser = currentVoiceUser();
    return currentUser?.videoStream;
  }
  return activeRemoteStream(userId, "video");
};

export default function useVoiceUsers() {
  return {
    createPeer,
    createVoiceUser,
    getVoiceUser,
    getVoiceUsersByChannelId,
    signal,
    removeVoiceUser,
    setCurrentChannelId,
    currentUser: currentVoiceUser,
    activeRemoteStream,
    videoEnabled,
    toggleMic,
    setVideoStream,
    resetAll,

    isLocalMicMuted: () => !currentVoiceUser()?.audioStream,

    micEnabled,
    toggleDeafen,
    deafened,
  };
}
