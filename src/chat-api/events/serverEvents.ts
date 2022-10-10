import { runWithContext } from "@/common/runWithContext";
import { batch } from "solid-js";
import { RawChannel, RawPresence, RawServer, RawServerMember, RawServerRole } from "../RawData";
import useChannels from "../store/useChannels";
import useServerMembers from "../store/useServerMembers";
import useServerRoles from "../store/useServerRoles";
import useServers from "../store/useServers";
import useUsers from "../store/useUsers";

interface ServerJoinedPayload {
  server: RawServer,
  members: RawServerMember[],
  channels: RawChannel[],
  roles: RawServerRole[];
  memberPresences: RawPresence[]
}



export const onServerJoined = (payload: ServerJoinedPayload) => {
  const serverMembers = useServerMembers();
  const users = useUsers();
  const servers = useServers();
  const channels = useChannels();
  const roles = useServerRoles();


  servers.set(payload.server);
  
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
}

export const onServerLeft = (payload: {serverId: string}) => runWithContext(() => {
  const serverMembers = useServerMembers();
  const servers = useServers();
  const channels = useChannels();
  const roles = useServerRoles();


  batch(() => {
    servers.remove(payload.serverId);
    serverMembers.removeAllServerMembers(payload.serverId);
    channels.removeAllServerChannels(payload.serverId);
    roles.deleteAllByServerId(payload.serverId);
  })
});



interface ServerMemberJoinedPayload {
  serverId: string;
  member: RawServerMember;
}


export const onServerMemberJoined = (payload: ServerMemberJoinedPayload) => {
  const serverMembers = useServerMembers();
  serverMembers.set(payload.member);
}
interface ServerUpdated {
  serverId: string;
  updated: {
    name?: string;
    defaultChannelId: string;
  }
}


export const onServerMemberLeft = (payload: {userId: string, serverId: string}) => {
  const serverMembers = useServerMembers();
  serverMembers.remove(payload.serverId, payload.userId);
}


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
}



export const onServerUpdated = (payload: ServerUpdated) => {
  const servers = useServers();
  const server = servers.get(payload.serverId);
  server?.update(payload.updated);
}


interface ServerChannelCreated {
  serverId: string;
  channel: RawChannel;
}

export const onServerChannelCreated = (payload: ServerChannelCreated) => {
  const channels = useChannels();
  channels.set(payload.channel);
}

interface ServerChannelUpdated {
  serverId: string;
  channelId: string;
  updated: {
    name?: string;
  }
}


export const onServerChannelUpdated = (payload: ServerChannelUpdated) => {
  const channels = useChannels();
  const channel = channels.get(payload.channelId);
  channel?.update(payload.updated);
}

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
}


interface ServerRoleUpdated {
  serverId: string;
  roleId: string;
  updated: Partial<RawServerRole>
}
export const onServerRoleUpdated = (payload: ServerRoleUpdated) => {
  const serverRoles = useServerRoles();
  const role = serverRoles.get(payload.serverId, payload.roleId);
  role?.update(payload.updated);
}

export const onServerRoleDeleted = (payload: {serverId: string, roleId: string}) => {
  const serverRoles = useServerRoles();
  const serverMembers = useServerMembers();
  const members = serverMembers.array(payload.serverId);
  batch((() => {
    for (let i = 0; i < members.length; i++) {
      const member = members[i];
      if (!member?.roleIds.includes(payload.roleId)) continue;
      member.update({roleIds: member.roleIds.filter(ids => ids !== payload.roleId)})
    }
    serverRoles.deleteRole(payload.serverId, payload.roleId);
  }))
}