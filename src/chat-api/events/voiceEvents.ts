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
