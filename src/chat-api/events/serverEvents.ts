import { runWithContext } from "@/common/runWithContext";
import { batch, from } from "solid-js";
import {
  ChannelType,
  RawChannel,
  RawCustomEmoji,
  RawPresence,
  RawServer,
  RawServerFolder,
  RawServerMember,
  RawServerRole,
  RawVoice
} from "../RawData";
import useAccount from "../store/useAccount";
import useChannels, { Channel } from "../store/useChannels";
import useServerMembers from "../store/useServerMembers";
import useServerRoles from "../store/useServerRoles";
import useServers from "../store/useServers";
import useUsers from "../store/useUsers";
import { CHANNEL_PERMISSIONS, addBit, hasBit, removeBit } from "../Bitwise";
import { useParams } from "solid-navigator";
import useVoiceUsers from "../store/useVoiceUsers";
import useChannelProperties from "../store/useChannelProperties";

interface ServerJoinedPayload {
  server: RawServer;
  members: RawServerMember[];
  channels: RawChannel[];
  roles: RawServerRole[];
  memberPresences: RawPresence[];
  voiceChannelUsers: RawVoice[];
}

export const onServerJoined = (payload: ServerJoinedPayload) => {
  const serverMembers = useServerMembers();
  const users = useUsers();
  const servers = useServers();
  const channels = useChannels();
  const roles = useServerRoles();
  const voiceUsers = useVoiceUsers();

  servers.set(payload.server);

  batch(() => {
    for (let i = 0; i < payload.roles.length; i++) {
      const role = payload.roles[i];
      roles.set(role.serverId, role);
    }

    for (let index = 0; index < payload.channels.length; index++) {
      const channel = payload.channels[index];
      channels.set(channel);
    }

    for (let i = 0; i < payload.members.length; i++) {
      const serverMember = payload.members[i];
      serverMembers.set(serverMember);
    }
    for (let i = 0; i < payload.memberPresences.length; i++) {
      const presence = payload.memberPresences[i];
      users.setPresence(presence.userId, presence);
    }
    for (let i = 0; i < payload.voiceChannelUsers.length; i++) {
      const rawVoice = payload.voiceChannelUsers[i]!;
      voiceUsers.createVoiceUser(rawVoice);
    }
  });
};

export const onServerLeft = (payload: { serverId: string }) =>
  runWithContext(() => {
    const account = useAccount();
    const serverMembers = useServerMembers();
    const servers = useServers();
    const channels = useChannels();
    const roles = useServerRoles();
    const voiceUsers = useVoiceUsers();

    const currentVoiceChannelId = voiceUsers.currentUser()?.channelId;

    const serverChannels = channels.getChannelsByServerId(payload.serverId);

    batch(() => {
      servers.remove(payload.serverId);
      serverMembers.removeAllServerMembers(payload.serverId);
      channels.removeAllServerChannels(payload.serverId);
      roles.deleteAllByServerId(payload.serverId);

      account.removeNotificationSettings(payload.serverId);
      for (let i = 0; i < serverChannels.length; i++) {
        const channel = serverChannels[i]!;
        account.removeNotificationSettings(channel.id);
        if (currentVoiceChannelId === channel.id) {
          voiceUsers.setCurrentChannelId(null);
        }
      }
    });
  });

interface ServerMemberJoinedPayload {
  serverId: string;
  member: RawServerMember;
}

export const onServerMemberJoined = (payload: ServerMemberJoinedPayload) => {
  const serverMembers = useServerMembers();
  serverMembers.set(payload.member);
};
interface ServerUpdated {
  serverId: string;
  updated: {
    name?: string;
    defaultChannelId: string;
  };
}

export const onServerMemberLeft = (payload: {
  userId: string;
  serverId: string;
}) => {
  const serverMembers = useServerMembers();
  serverMembers.remove(payload.serverId, payload.userId);
};

interface ServerMemberUpdated {
  serverId: string;
  userId: string;
  updated: {
    roleIds: string[];
  };
}

export const onServerMemberUpdated = (payload: ServerMemberUpdated) => {
  const serverMembers = useServerMembers();
  const member = serverMembers.get(payload.serverId, payload.userId);
  if (!member) return;

  serverMembers.update(member, payload.updated);
};

export const onServerEmojiAdd = (payload: {
  serverId: string;
  emoji: RawCustomEmoji;
}) => {
  const servers = useServers();
  const server = servers.get(payload.serverId);
  server?.update({
    customEmojis: [...server.customEmojis, payload.emoji]
  });
};

export const onServerEmojiUpdate = (payload: {
  serverId: string;
  emojiId: string;
  name: string;
}) => {
  const servers = useServers();
  const server = servers.get(payload.serverId);
  server?.update({
    customEmojis: server.customEmojis.map((e) =>
      e.id !== payload.emojiId ? e : { ...e, name: payload.name }
    )
  });
};

export const onServerEmojiRemove = (payload: {
  serverId: string;
  emojiId: string;
}) => {
  const servers = useServers();
  const server = servers.get(payload.serverId);
  server?.update({
    customEmojis: server.customEmojis.filter((e) => e.id !== payload.emojiId)
  });
};

export const onServerScheduleDelete = (payload: {
  serverId: string;
  scheduleAt: number;
}) => {
  const servers = useServers();
  const server = servers.get(payload.serverId);
  server?.update({ scheduledForDeletion: { scheduledAt: payload.scheduleAt } });
};
export const onServerRemoveScheduleDelete = (payload: { serverId: string }) => {
  const servers = useServers();
  const server = servers.get(payload.serverId);
  server?.update({ scheduledForDeletion: undefined });
};

export const onServerUpdated = (payload: ServerUpdated) => {
  const servers = useServers();
  const server = servers.get(payload.serverId);
  server?.update(payload.updated);
};
export const onServerOrderUpdated = (payload: { serverIds: string[] }) => {
  const account = useAccount();
  account.setUser({
    orderedServerIds: payload.serverIds
  });
};

export const onServerFolderCreated = (payload: { folder: RawServerFolder }) => {
  const account = useAccount();

  const existingFolders = account.user()?.serverFolders || [];

  account.setUser({
    serverFolders: [...existingFolders, payload.folder]
  });
};
export const onServerFolderUpdated = (payload: { folder: RawServerFolder }) => {
  const account = useAccount();

  const existingFolders = account.user()?.serverFolders || [];

  if (payload.folder.serverIds.length === 0) {
    account.setUser({
      serverFolders: existingFolders.filter((f) => f.id !== payload.folder.id)
    });
    return;
  }

  account.setUser({
    serverFolders: existingFolders.map((f) =>
      f.id === payload.folder.id ? { ...f, ...payload.folder } : f
    )
  });
};

interface ServerChannelCreated {
  serverId: string;
  channel: RawChannel;
}

export const onServerChannelCreated = (payload: ServerChannelCreated) => {
  const channels = useChannels();
  channels.set(payload.channel);
};

interface ServerChannelUpdated {
  serverId: string;
  channelId: string;
  updated: {
    name?: string;
    permissions?: number;
    slowModeSeconds?: number;
  };
}

export const onServerChannelUpdated = (payload: ServerChannelUpdated) => {
  const channels = useChannels();
  const channelProperties = useChannelProperties();
  const channel = channels.get(payload.channelId);

  if (
    payload.updated.slowModeSeconds ||
    payload.updated.slowModeSeconds === null
  ) {
    channelProperties.updateSlowDownMode(payload.channelId, undefined);
  }

  channel?.update(payload.updated);
};

interface ServerChannelDeleted {
  serverId: string;
  channelId: string;
}

export const onServerChannelDeleted = (payload: ServerChannelDeleted) => {
  const channels = useChannels();

  channels.deleteChannel(payload.channelId, payload.serverId);
};

export const onServerRoleCreated = (createdRole: RawServerRole) => {
  const serverRoles = useServerRoles();
  serverRoles.addNewRole(createdRole.serverId, createdRole);
};

interface ServerRoleUpdated {
  serverId: string;
  roleId: string;
  updated: Partial<RawServerRole>;
}
export const onServerRoleUpdated = (payload: ServerRoleUpdated) => {
  const serverRoles = useServerRoles();
  serverRoles.update(payload.serverId, payload.roleId, payload.updated);
};

interface ServerRoleOrderUpdated {
  serverId: string;
  roleIds: string[];
}

export const onServerRoleOrderUpdated = (payload: ServerRoleOrderUpdated) => {
  const serverRoles = useServerRoles();
  batch(() => {
    for (let i = 0; i < payload.roleIds.length; i++) {
      const roleId = payload.roleIds[i];
      serverRoles.update(payload.serverId, roleId, { order: i + 1 });
    }
  });
};

export const onServerRoleDeleted = (payload: {
  serverId: string;
  roleId: string;
}) => {
  const serverRoles = useServerRoles();
  const serverMembers = useServerMembers();
  const channels = useChannels();
  const members = serverMembers.array(payload.serverId);
  const serverChannels = channels.getChannelsByServerId(
    payload.serverId,
    false
  );

  batch(() => {
    for (let i = 0; i < members.length; i++) {
      const member = members[i];
      if (!member?.roleIds.includes(payload.roleId)) continue;
      serverMembers.update(member, {
        roleIds: member.roleIds.filter((ids) => ids !== payload.roleId)
      });
    }

    for (let i = 0; i < serverChannels.length; i++) {
      const channel = serverChannels[i]!;
      const channelWithoutRole = channel.permissions?.filter(
        (p) => p.roleId !== payload.roleId
      );
      if (channelWithoutRole?.length !== channel.permissions?.length) {
        channel.update({
          permissions: channelWithoutRole
        });
      }
    }

    serverRoles.deleteRole(payload.serverId, payload.roleId);
  });
};

interface ServerChannelPermissionsUpdated {
  permissions: number;
  roleId: string;
  serverId: string;
  channelId: string;
}

export const onServerChannelPermissionsUpdated = (
  payload: ServerChannelPermissionsUpdated
) => {
  const channels = useChannels();
  const channel = channels.get(payload.channelId);
  if (!channel) return;
  const permissions = [...(channel.permissions || [])];
  const roleChannelIndex = permissions.findIndex(
    (p) => p.roleId === payload.roleId
  );
  if (roleChannelIndex === -1) {
    permissions.push(payload);
    channel.update({ permissions });
    return;
  }

  permissions[roleChannelIndex]! = payload;
  channel.update({ permissions });
};

interface ServerChannelOrderUpdatedPayload {
  serverId: string;
  categoryId?: string;
  orderedChannelIds: string[];
}

export const onServerChannelOrderUpdated = (
  payload: ServerChannelOrderUpdatedPayload
) => {
  const channels = useChannels();
  const orderedChannels = channels.getSortedChannelsByServerId(
    payload.serverId
  );

  batch(() => {
    for (let i = 0; i < orderedChannels.length; i++) {
      const channel = orderedChannels[i];
      if (!channel) continue;

      const updateOrder = payload.orderedChannelIds.includes(channel.id)
        ? { order: payload.orderedChannelIds.indexOf(channel.id) + 1 }
        : undefined;

      const updateOrAddCategoryId =
        payload.categoryId &&
        payload.categoryId !== channel.categoryId &&
        payload.orderedChannelIds.includes(channel.id)
          ? {
              categoryId: payload.categoryId
            }
          : undefined;

      const removeCategoryId =
        !payload.categoryId &&
        channel.categoryId &&
        payload.orderedChannelIds.includes(channel.id)
          ? {
              categoryId: undefined
            }
          : undefined;

      channel?.update({
        ...updateOrder,
        ...updateOrAddCategoryId,
        ...removeCategoryId
      });
    }
  });
};
