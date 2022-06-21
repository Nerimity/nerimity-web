import useChannels from "../store/useChannels";
import useUsers, { UserStatus } from "../store/useUsers";

export function onUserPresenceUpdate(payload: {status: UserStatus, userId: string}) {
  const users = useUsers();
  users.setPresence(payload.userId, {status: payload.status})
}

export function onNotificationDismissed(payload: {channelId: string}) {
  const channels = useChannels();
  channels.get(payload.channelId).updateLastSeen(Date.now());
}