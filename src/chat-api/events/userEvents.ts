import { batch } from "solid-js";
import useChannels from "../store/useChannels";
import useMention from "../store/useMention";
import useStore from "../store/useStore";
import useUsers, { UserStatus } from "../store/useUsers";
import { LastOnlineStatus, SelfUser } from "./connectionEventTypes";
import {
  ActivityStatus,
  FriendStatus,
  RawUserNotificationSettings,
  RawUser,
  RawUserConnection,
  RawNotice,
} from "../RawData";
import useFriends from "../store/useFriends";
import useAccount from "../store/useAccount";
import { StorageKeys, getStorageObject } from "@/common/localStorage";
import { ProgramWithAction, electronWindowAPI } from "@/common/Electron";
import { isExperimentEnabled } from "@/common/experiments";
import { userInfo } from "os";

export function onUserPresenceUpdate(payload: {
  userId: string;
  status?: UserStatus;
  custom?: string;
  activity?: ActivityStatus;
}) {
  const users = useUsers();
  const account = useAccount();

  if (payload.status !== undefined && account.user()?.id === payload.userId) {
    const user = users.get(payload.userId);
    const wasOffline =
      !user?.presence()?.status && payload.status !== UserStatus.OFFLINE;
    if (wasOffline) {
      const programs = getStorageObject<ProgramWithAction[]>(
        StorageKeys.PROGRAM_ACTIVITY_STATUS,
        []
      );
      electronWindowAPI()?.restartActivityStatus(programs);
      electronWindowAPI()?.restartRPCServer();
    }
  }

  if (payload.status === UserStatus.OFFLINE) {
    users.updateLastOnlineAt(payload.userId);
  }

  users.setPresence(payload.userId, {
    ...(payload.status !== undefined ? { status: payload.status } : undefined),
    ...(payload.custom !== undefined ? { custom: payload.custom } : undefined),
    ...(payload.activity !== undefined
      ? { activity: payload.activity }
      : undefined),
  });
}

export function onNotificationDismissed(payload: { channelId: string }) {
  const channels = useChannels();
  const mentions = useMention();
  const channel = channels.get(payload.channelId);
  batch(() => {
    channel?.updateLastSeen((channel.lastMessagedAt || Date.now()) + 1);
    mentions.remove(payload.channelId);
  });
}

export function onUserUpdatedSelf(payload: Partial<SelfUser>) {
  const { account, users } = useStore();
  account.setUser(payload);

  const user = users.get(account.user()?.id!);
  user?.update(payload);
}
export function onUserUpdated(payload: {
  userId: string;
  updated: Partial<RawUser>;
}) {
  const { users, friends } = useStore();
  const user = users.get(payload.userId);
  user?.update(payload.updated);
  if (payload.updated.lastOnlineStatus) {
    const lastOnlineStatus = payload.updated.lastOnlineStatus;
    const areFriends =
      friends.get(payload.userId)?.status === FriendStatus.FRIENDS;
    if (!areFriends && lastOnlineStatus === LastOnlineStatus.FRIENDS) {
      users.updateLastOnlineAt(payload.userId);
    }
  }
}

export function onUserNotificationSettingsUpdate(payload: {
  serverId?: string;
  channelId?: string;
  updated: Partial<RawUserNotificationSettings>;
}) {
  const { account } = useStore();
  account.setNotificationSettings(
    payload.channelId || payload.serverId!,
    payload.updated
  );
}

export function onUserBlocked(payload: { user: RawUser }) {
  const account = useAccount();
  const friends = useFriends();
  friends.set({
    createdAt: Date.now(),
    recipient: payload.user,
    userId: account.user()?.id!,
    status: FriendStatus.BLOCKED,
  });
}
export function onUserUnblocked(payload: { userId: string }) {
  const friends = useFriends();
  friends.delete(payload.userId);
}

export function onUserConnectionAdded(payload: {
  connection: RawUserConnection;
}) {
  const account = useAccount();
  account.setUser({
    connections: [...(account.user()?.connections || []), payload.connection],
  });
}

export function onUserConnectionRemoved(payload: { connectionId: string }) {
  const account = useAccount();
  account.setUser({
    connections: account
      .user()
      ?.connections.filter((c) => c.id !== payload.connectionId),
  });
}

export function onUserNoticeUpdated(payload: RawNotice) {
  const account = useAccount();
  const notices: RawNotice[] = [...(account.user()?.notices || [])];
  notices.push(payload);
  account.setUser({ notices });
}
