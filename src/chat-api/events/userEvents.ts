import { batch } from "solid-js";
import useChannels from "../store/useChannels";
import useUsers, { UserStatus } from "../store/useUsers";

export function onUserPresenceUpdate(payload: {status: UserStatus, userId: string}) {
  const users = useUsers();
  users.setPresence(payload.userId, {status: payload.status})
}

export function onNotificationDismissed(payload: {channelId: string}) {
  const channels = useChannels();
  const channel = channels.get(payload.channelId);
  batch(() => {
    channel.updateLastSeen(Date.now());
    if (channel.recipient) {
      channel.recipient.updateMentionCount(0);
    }
  })
  
}