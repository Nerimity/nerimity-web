import { runWithContext } from "@/common/runWithContext";
import { batch, from } from "solid-js";
import { ChannelType, RawChannel, RawCustomEmoji, RawPresence, RawServer, RawServerMember, RawServerRole, RawVoice } from "../RawData";
import useAccount from "../store/useAccount";
import useChannels, { Channel } from "../store/useChannels";
import useServerMembers from "../store/useServerMembers";
import useServerRoles from "../store/useServerRoles";
import useServers from "../store/useServers";
import useUsers from "../store/useUsers";
import { CHANNEL_PERMISSIONS, addBit, hasBit } from "../Bitwise";
import { useParams } from "solid-navigator";
import useVoiceUsers from "../store/useVoiceUsers";

interface ServerJoinedPayload {
  server: RawServer,
  members: RawServerMember[],
  channels: RawChannel[],
  roles: RawServerRole[];
  memberPresences: RawPresence[]
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
      const rawVoice = payload.voiceChannelUsers[i];
      voiceUsers.set(rawVoice);
    }
  });
};

export const onServerLeft = (payload: { serverId: string }) => runWithContext(() => {
  const serverMembers = useServerMembers();
  const servers = useServers();
  const channels = useChannels();
  const roles = useServerRoles();
  const voiceUsers = useVoiceUsers();

  const currentVoiceChannelId = voiceUsers.currentVoiceChannelId();

  batch(() => {
    servers.remove(payload.serverId);
    serverMembers.removeAllServerMembers(payload.serverId);
    channels.removeAllServerChannels(payload.serverId);
    roles.deleteAllByServerId(payload.serverId);

    if (currentVoiceChannelId) {
      voiceUsers.setCurrentVoiceChannelId(null);
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
  }
}


export const onServerMemberLeft = (payload: { userId: string, serverId: string }) => {
  const serverMembers = useServerMembers();
  serverMembers.remove(payload.serverId, payload.userId);
};


interface ServerMemberUpdated {
  serverId: string;
  userId: string;
  updated: {
    roleIds: string[];
  }
}

export const onServerMemberUpdated = (payload: ServerMemberUpdated) => {
  const serverMembers = useServerMembers();
  const member = serverMembers.get(payload.serverId, payload.userId);
  member?.update(payload.updated);
};

export const onServerEmojiAdd = (payload: {serverId: string, emoji: RawCustomEmoji}) => {
  const servers = useServers();
  const server = servers.get(payload.serverId);
  server?.update({
    customEmojis: [...server.customEmojis, payload.emoji]
  });
};

export const onServerEmojiUpdate = (payload: {serverId: string, emojiId: string, name: string}) => {
  const servers = useServers();
  const server = servers.get(payload.serverId);
  server?.update({
    customEmojis: server.customEmojis.map(e => e.id !== payload.emojiId ? e : {...e, name: payload.name})
  });
};

export const onServerEmojiRemove = (payload: {serverId: string, emojiId: string}) => {
  const servers = useServers();
  const server = servers.get(payload.serverId);
  server?.update({
    customEmojis: server.customEmojis.filter(e => e.id !== payload.emojiId)
  });
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
  }
}


export const onServerChannelUpdated = (payload: ServerChannelUpdated) => {
  const channels = useChannels();
  const channel = channels.get(payload.channelId);

  const isCategoryChannel = channel?.type === ChannelType.CATEGORY;
  const isPrivateCategory = hasBit(payload.updated.permissions || 0, CHANNEL_PERMISSIONS.PRIVATE_CHANNEL.bit);

  if (isCategoryChannel && isPrivateCategory) {
    const serverChannels = channels.getChannelsByServerId(payload.serverId);

    batch(() => {
      for (let i = 0; i < serverChannels.length; i++) {
        const channel = serverChannels[i];
        if (channel?.categoryId !== payload.channelId) continue;
        channel?.update({
          permissions: addBit(channel.permissions || 0, CHANNEL_PERMISSIONS.PRIVATE_CHANNEL.bit)
        });
      }
    });
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
  updated: Partial<RawServerRole>
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

export const onServerRoleDeleted = (payload: { serverId: string, roleId: string }) => {
  const serverRoles = useServerRoles();
  const serverMembers = useServerMembers();
  const members = serverMembers.array(payload.serverId);
  batch((() => {
    for (let i = 0; i < members.length; i++) {
      const member = members[i];
      if (!member?.roleIds.includes(payload.roleId)) continue;
      member.update({ roleIds: member.roleIds.filter(ids => ids !== payload.roleId) });
    }
    serverRoles.deleteRole(payload.serverId, payload.roleId);
  }));
};

interface ServerChannelOrderUpdatedPayload {
  serverId: string;
  categoryId?: string;
  orderedChannelIds: string[];
}


export const onServerChannelOrderUpdated = (payload: ServerChannelOrderUpdatedPayload) => {
  const channels = useChannels();
  const orderedChannels = channels.getSortedChannelsByServerId(payload.serverId);

  const categoryChannel = () => channels.get(payload.categoryId!)!;
  const isPrivateCategory = () => hasBit(categoryChannel().permissions || 0, CHANNEL_PERMISSIONS.PRIVATE_CHANNEL.bit);

  batch(() => {
    for (let i = 0; i < orderedChannels.length; i++) {
      const channel = orderedChannels[i];
      if (!channel) continue;

      const updateOrder = (payload.orderedChannelIds.includes(channel.id) ? { order: payload.orderedChannelIds.indexOf(channel.id) + 1 } : undefined);

      const updateOrAddCategoryId = (
        payload.categoryId && payload.categoryId !== channel.categoryId && payload.orderedChannelIds.includes(channel.id)
          ? {
            categoryId: payload.categoryId
          } : undefined
      );

      const removeCategoryId = (
        !payload.categoryId && channel.categoryId && payload.orderedChannelIds.includes(channel.id)
          ? {
            categoryId: undefined
          } : undefined
      );




      const updatePermissions = (payload.orderedChannelIds.includes(channel.id) && payload.categoryId && isPrivateCategory()) ? {
        permissions: addBit(channel.permissions || 0, CHANNEL_PERMISSIONS.PRIVATE_CHANNEL.bit)
      } : undefined;

      channel?.update({
        ...updatePermissions,
        ...updateOrder,
        ...updateOrAddCategoryId,
        ...removeCategoryId
      });
    }
  });
};