import { batch } from "solid-js";
import useChannels from "../store/useChannels";
import useMention from "../store/useMention";
import useStore from "../store/useStore";
import useUsers, { UserStatus } from "../store/useUsers";
import { SelfUser } from "./connectionEventTypes";
import { ActivityStatus, FriendStatus, RawServerSettings, RawUser, RawUserConnection } from "../RawData";
import useFriends from "../store/useFriends";
import useAccount from "../store/useAccount";
import { StorageKeys, getStorageObject } from "@/common/localStorage";
import { ProgramWithAction, electronWindowAPI } from "@/common/Electron";

// migrated
export function onUserPresenceUpdate(payload: { userId: string; status?: UserStatus, custom?: string; activity?: ActivityStatus}) {
  const users = useUsers();
  const account = useAccount();

  if (payload.status !== undefined && account.user()?.id === payload.userId) {
    const user = users.get(payload.userId);
    const wasOffline = !user?.presence?.status && payload.status !== UserStatus.OFFLINE;
    if (wasOffline) {
      const programs = getStorageObject<ProgramWithAction[]>(StorageKeys.PROGRAM_ACTIVITY_STATUS, [])
      electronWindowAPI()?.restartActivityStatus(programs);
    }
  }
  
  
  
  users.setPresence(payload.userId, {
    ...(payload.status !== undefined ? {status: payload.status} : undefined), 
    ...(payload.custom !== undefined ? {custom: payload.custom} : undefined),
    ...(payload.activity !== undefined ? {activity: payload.activity} : undefined)
  })
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

// migrated
export function onUserUpdated(payload: Partial<SelfUser>) {
  const {account, users} = useStore();
  account.setUser(payload)

  const user = users.get(account.user()?.id!)
  user?.update(payload)
}


// migrated
export function onUserServerSettingsUpdate(payload: {serverId: string, updated: Partial<RawServerSettings>}) {
  const {account} = useStore();
  account.setServerSettings(payload.serverId, payload.updated)
}

// migrated
export function onUserBlocked(payload: {user: RawUser}) {
  const account = useAccount();
  const friends = useFriends();
  friends.set({
    createdAt: Date.now(),
    recipient: payload.user,
    userId: account.user()?.id!,
    status: FriendStatus.BLOCKED,
  })
}

// migrated
export function onUserUnblocked(payload: {userId: string}) {
  const friends = useFriends();
  friends.delete(payload.userId);
}

// migrated
export function onUserConnectionAdded (payload: {connection: RawUserConnection}) {
  const account = useAccount();
  account.setUser({
    connections: [...(account.user()?.connections || []), payload.connection]
  })
}
// migrated
export function onUserConnectionRemoved (payload: {connectionId: string}) {
  const account = useAccount();
  account.setUser({connections: account.user()?.connections.filter(c => c.id !== payload.connectionId)})
  
}