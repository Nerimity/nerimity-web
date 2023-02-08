import { batch } from "solid-js";
import useChannels from "../store/useChannels";
import useMention from "../store/useMention";
import useStore from "../store/useStore";
import useUsers, { UserStatus } from "../store/useUsers";
import { SelfUser } from "./connectionEventTypes";

export function onUserPresenceUpdate(payload: {status: UserStatus, userId: string}) {
  const users = useUsers();
  users.setPresence(payload.userId, {status: payload.status})
}

export function onNotificationDismissed(payload: {channelId: string}) {
  const channels = useChannels();
  const mentions = useMention();
  const channel = channels.get(payload.channelId);
  batch(() => {
    channel?.updateLastSeen((channel.lastMessagedAt || Date.now()) + 1);
    mentions.remove(payload.channelId);
  })
  
}

export function onUserUpdated(payload: Partial<SelfUser>) {
  const {account} = useStore();
  account.setUser(payload)
}