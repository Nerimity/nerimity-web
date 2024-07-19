import type SimplePeer from "simple-peer";
import { RawVoice } from "../RawData";
import useAccount from "../store/useAccount";
import useVoiceUsers from "../store/useVoiceUsers";

export function onVoiceUserJoined(payload: RawVoice) {
  const {set} = useVoiceUsers();

  set(payload);
}
export function onVoiceUserLeft(payload: {userId: string, channelId: string}) {
  const {removeUserInVoice, setCurrentVoiceChannelId} = useVoiceUsers();
  const {user} = useAccount();

  if (user()?.id === payload.userId) {
    setCurrentVoiceChannelId(null);
  }

  removeUserInVoice(payload.channelId, payload.userId);
}

interface VoiceSignalReceivedPayload {
  fromUserId: string;
  channelId: string;
  signal: SimplePeer.SignalData;
}

export function onVoiceSignalReceived(payload: VoiceSignalReceivedPayload) {
  const voiceUsers = useVoiceUsers();
  const voiceUser = voiceUsers.getVoiceUser(payload.channelId, payload.fromUserId);
  if (!voiceUser) return;

  if (!voiceUser.peer) {
    return voiceUser.addPeer(payload.signal);
  }

  voiceUser.addSignal(payload.signal);
}