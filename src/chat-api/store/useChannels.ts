import { runWithContext } from "@/common/runWithContext";
import { batch } from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import { useWindowProperties } from "../../common/useWindowProperties";
import { dismissChannelNotification } from "../emits/userEmits";
import {
  CHANNEL_PERMISSIONS,
  getAllPermissions,
  Bitwise,
  hasBit,
  ROLE_PERMISSIONS,
  addBit,
} from "../Bitwise";
import { ChannelType, RawChannel } from "../RawData";
import useMessages from "./useMessages";
import useUsers from "./useUsers";
import useServerMembers from "./useServerMembers";
import useAccount from "./useAccount";
import useMention from "./useMention";
import socketClient from "../socketClient";
import {
  postGenerateCredential,
  postJoinVoice,
  postLeaveVoice,
} from "../services/VoiceService";
import useVoiceUsers from "./useVoiceUsers";
import { useMatch, useNavigate, useParams } from "solid-navigator";
import RouterEndpoints from "@/common/RouterEndpoints";
import useServers from "./useServers";

export type Channel = Omit<RawChannel, "recipient"> & {
  updateLastSeen(this: Channel, timestamp?: number): void;
  updateLastMessaged(this: Channel, timestamp?: number): void;
  dismissNotification(this: Channel, force?: boolean): void;
  setRecipientId(this: Channel, userId: string): void;
  update: (this: Channel, update: Partial<RawChannel>) => void;

  permissionList: typeof permissionList;
  recipient: typeof recipient;
  recipientId?: string;
  lastSeen?: number;
  hasNotifications: typeof hasNotifications;
  mentionCount: typeof mentionCount;
  joinCall: () => void;
  leaveCall: () => void;
  callJoinedAt?: number;
  setCallJoinedAt: (this: Channel, joinedAt: number | undefined) => void;
  hasPermission: (
    this: Channel,
    bitwise: Bitwise,
    defaultRoleOnly?: boolean
  ) => boolean;
};

const [channels, setChannels] = createStore<
  Record<string, Channel | undefined>
>({});

const set = (channel: RawChannel & { lastSeen?: number }) => {
  const newChannel: Channel = {
    ...channel,
    recipient,
    hasNotifications,
    permissionList,
    mentionCount,
    updateLastSeen,
    updateLastMessaged,
    dismissNotification,
    setRecipientId,
    setCallJoinedAt,
    update,
    joinCall,
    leaveCall,
    hasPermission,
  };

  setChannels(channel.id, newChannel);
};

function permissionList(this: Channel) {
  const permissions = this.permissions || 0;

  return getAllPermissions(CHANNEL_PERMISSIONS, permissions);
}

function hasPermission(
  this: Channel,
  bitwise: Bitwise,
  defaultRoleOnly = false
) {
  if (!this.serverId) return false;

  const account = useAccount();
  const serverMembers = useServerMembers();
  const member = serverMembers.get(this.serverId, account.user()?.id as string);
  const defaultRoleId = member?.server().defaultRoleId;

  if (defaultRoleOnly) {
    const permissions = this.permissions?.find(
      (p) => p.roleId === defaultRoleId!
    )?.permissions;
    return hasBit(permissions || 0, bitwise.bit);
  }

  const roleIds = [...(member?.roleIds || []), defaultRoleId];
  let permissions = 0;
  for (let i = 0; i < this.permissions!.length; i++) {
    const perm = this.permissions![i]!;
    if (roleIds.includes(perm.roleId)) {
      permissions = addBit(permissions, perm?.permissions);
    }
  }

  return hasBit(permissions, bitwise.bit);
}

function mentionCount(this: Channel) {
  const mention = useMention();
  const count = mention.get(this.id)?.count || 0;

  return count;
}

function hasNotifications(this: Channel) {
  const serverMembers = useServerMembers();
  const account = useAccount();
  const mentions = useMention();
  const isAdminChannel = () =>
    !this.hasPermission(CHANNEL_PERMISSIONS.PUBLIC_CHANNEL);

  if (this.serverId && isAdminChannel()) {
    const member = serverMembers.get(
      this.serverId,
      account.user()?.id as string
    );
    const hasAdminPermission = member?.hasPermission(ROLE_PERMISSIONS.ADMIN);
    if (!hasAdminPermission) return false;
  }

  const hasMentions = mentions.get(this.id)?.count;

  if (hasMentions) return "mention";

  const lastMessagedAt = this.lastMessagedAt! || 0;
  const lastSeenAt = this.lastSeen! || 0;
  if (!lastSeenAt) return true;
  return lastMessagedAt > lastSeenAt;
}

function recipient(this: Channel) {
  const users = useUsers();
  return users.get(this.recipientId!);
}

async function joinCall(this: Channel) {
  const { setCurrentChannelId } = useVoiceUsers();
  await postGenerateCredential();
  postJoinVoice(this.id, socketClient.id()!).then(() => {
    setCurrentChannelId(this.id);
    this.setCallJoinedAt(Date.now());
  });
}
function leaveCall(this: Channel) {
  const { setCurrentChannelId } = useVoiceUsers();
  postLeaveVoice(this.id).then(() => {
    setCurrentChannelId(null);
  });
}
function update(this: Channel, update: Partial<RawChannel>) {
  setChannels(this.id, update);
}

function setCallJoinedAt(this: Channel, joinedAt: number | undefined) {
  setChannels(this.id, "callJoinedAt", joinedAt);
}

function setRecipientId(this: Channel, userId: string) {
  setChannels(this.id, "recipientId", userId);
}

function dismissNotification(this: Channel, force = false) {
  if (force) return dismissChannelNotification(this.id);
  const { hasFocus } = useWindowProperties();
  if (!hasFocus()) return;
  if (!this.hasNotifications()) return;
  dismissChannelNotification(this.id);
}

function updateLastMessaged(this: Channel, timestamp?: number) {
  setChannels(this.id, "lastMessagedAt", timestamp);
}

function updateLastSeen(this: Channel, timestamp?: number) {
  setChannels(this.id, "lastSeen", timestamp);
}

const deleteChannel = (channelId: string, serverId?: string) =>
  runWithContext(() => {
    const messages = useMessages();
    const voice = useVoiceUsers();
    const voiceChannelId = voice.currentUser();
    if (serverId) {
      const servers = useServers();
      const defaultChannelId = servers.get(serverId)?.defaultChannelId;
      const channel = get(channelId);
      if (channel?.type === ChannelType.CATEGORY) {
        const serverChannels = getChannelsByServerId(serverId, false, true);
        batch(() => {
          for (let i = 0; i < serverChannels.length; i++) {
            const serverChannel = serverChannels[i]!;
            if (serverChannel.categoryId === channelId) {
              setChannels(serverChannel.id, "categoryId", undefined);
            }
          }
        });
      }
      if (defaultChannelId) {
        const match = useMatch(() => "/app/servers/:serverId/:channelId")();
        const matchedChannelId = match?.params.channelId;
        if (matchedChannelId === channelId) {
          useNavigate()(
            RouterEndpoints.SERVER_MESSAGES(serverId, defaultChannelId),
            { replace: true }
          );
        }
      }
    }

    batch(() => {
      if (voiceChannelId && voiceChannelId === channelId) {
        voice.setCurrentChannelId(null);
      }

      messages.deleteChannelMessages(channelId);
      setChannels(channelId, undefined);
    });
  });

const get = (channelId?: string) => {
  if (!channelId) return undefined;
  return channels[channelId];
};

const array = () => Object.values(channels) as Channel[];

const serverChannelsWithPerm = () => {
  const serverMembers = useServerMembers();
  const account = useAccount();

  return array().filter((channel) => {
    if (!channel.serverId) return;
    const member = serverMembers.get(channel.serverId, account.user()?.id!);
    const hasAdminPerm = member?.hasPermission(ROLE_PERMISSIONS.ADMIN);
    if (hasAdminPerm) return true;

    const isPrivateChannel = !channel.hasPermission(
      CHANNEL_PERMISSIONS.PUBLIC_CHANNEL
    );
    return !isPrivateChannel;
  });
};

const getChannelsByServerId = (
  serverId: string,
  hidePrivateIfNoPerm = false,
  showPrivateCategories = false
) => {
  if (!hidePrivateIfNoPerm)
    return array().filter((channel) => channel?.serverId === serverId);
  const serverMembers = useServerMembers();
  const account = useAccount();
  const member = serverMembers.get(serverId, account.user()?.id!);
  const hasAdminPerm = member?.hasPermission(ROLE_PERMISSIONS.ADMIN);
  if (hasAdminPerm)
    return array().filter((channel) => channel?.serverId === serverId);

  return array().filter((channel) => {
    const isServerChannel = channel?.serverId === serverId;
    if (channel.type === ChannelType.CATEGORY && showPrivateCategories)
      return isServerChannel;
    const isPrivateChannel = !channel.hasPermission(
      CHANNEL_PERMISSIONS.PUBLIC_CHANNEL
    );
    return isServerChannel && !isPrivateChannel;
  });
};

// if order field exists, sort by order, else, sort by created date
const getSortedChannelsByServerId = (
  serverId: string,
  hidePrivateIfNoPerm = false,
  showPrivateCategories = false
) => {
  return getChannelsByServerId(
    serverId,
    hidePrivateIfNoPerm,
    showPrivateCategories
  ).sort((a, b) => {
    if (a!.order && b!.order) {
      return a!.order - b!.order;
    } else {
      return a!.createdAt - b!.createdAt;
    }
  });
};

const removeAllServerChannels = (serverId: string) => {
  const channelsArr = array();
  batch(() => {
    for (let i = 0; i < channelsArr.length; i++) {
      const channel = channelsArr[i];
      if (channel?.serverId !== serverId) continue;
      deleteChannel(channel.id);
    }
  });
};

const reset = () => {
  setChannels(reconcile({}));
};
export default function useChannels() {
  return {
    reset,
    array,
    getChannelsByServerId,
    getSortedChannelsByServerId,
    deleteChannel,
    get,
    set,
    removeAllServerChannels,
    serverChannelsWithPerm,
  };
}
