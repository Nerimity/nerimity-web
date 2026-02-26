import { createStore, reconcile } from "solid-js/store";
import {
  addBit,
  CHANNEL_PERMISSIONS,
  hasBit,
  ROLE_PERMISSIONS
} from "../Bitwise";
import { RawServerMember } from "../RawData";
import useServerRoles, { ServerRole } from "./useServerRoles";
import useServers from "./useServers";
import useUsers from "./useUsers";
import useVoiceUsers from "./useVoiceUsers";
import useChannels from "./useChannels";

export type ServerMember = Omit<RawServerMember, "user"> & {
  userId: string;
};

const [serverMembers, setMember] = createStore<
  Record<string, Record<string, ServerMember | undefined> | undefined>
>({});

const set = (member: RawServerMember) => {
  const users = useUsers();
  users.set(member.user);

  if (!serverMembers[member.serverId]) {
    setMember(member.serverId, {});
  }

  const newMember: ServerMember = {
    ...member,
    userId: member.user.id
  };

  (newMember as unknown as { user: unknown }).user = undefined;

  setMember(member.serverId, member.user.id, reconcile(newMember));
};

function update(member: ServerMember, update: Partial<ServerMember>) {
  setMember(member.serverId, member.userId, update);
}
function isServerCreator(member: ServerMember | undefined) {
  const servers = useServers();
  const server = servers.get(member?.serverId!);
  if (!server) return;
  return server.createdById === member?.userId;
}
function hasRole(member: ServerMember | undefined, roleId: string) {
  const servers = useServers();
  const server = servers.get(member?.serverId!);

  if (!server) return;
  if (server?.defaultRoleId === roleId) return true;
  return member?.roleIds.includes(roleId);
}
function topRole(member: ServerMember | undefined) {
  const servers = useServers();
  const serverRoles = useServerRoles();

  const sortedRoles = roles(member).sort((a, b) => b?.order! - a?.order!);
  const defaultRoleId = () => servers.get(member?.serverId!)?.defaultRoleId;
  const defaultRole = () =>
    serverRoles.get(member?.serverId!, defaultRoleId()!);

  return sortedRoles[0] || defaultRole()!;
}

function topRoleWithIcon(member: ServerMember | undefined) {
  const servers = useServers();
  const serverRoles = useServerRoles();

  const sortedRoles = roles(member)
    .filter((r) => r?.icon)
    .sort((a, b) => b?.order! - a?.order!);
  const defaultRoleId = () => servers.get(member?.serverId!)?.defaultRoleId;
  const defaultRole = () =>
    serverRoles.get(member?.serverId!, defaultRoleId()!);

  if (sortedRoles[0]?.icon) {
    return sortedRoles[0];
  }
  const dRole = defaultRole();
  return dRole?.icon ? dRole : undefined;
}

interface Color {
  hexColor: string;
  gradient?: string;
}
function topRoleWithColor(member: ServerMember | undefined): {
  hexColor: string;
  gradient?: string;
} {
  const highestRole = roles(member).reduce(
    (best, current) => {
      if (!current?.hexColor) return best;

      if (!best || (current.order ?? 0) > (best.order ?? 0)) {
        return current;
      }

      return best;
    },
    null as ServerRole | null
  );

  if (highestRole?.hexColor) {
    return highestRole as Color;
  }

  const servers = useServers();
  const serverRoles = useServerRoles();

  const defaultRoleId = servers.get(member?.serverId!)?.defaultRoleId;

  if (defaultRoleId) {
    const defaultRole = serverRoles.get(member?.serverId!, defaultRoleId);
    if (defaultRole?.hexColor) {
      return defaultRole as Color;
    }
  }

  return { hexColor: "#fff" };
}

function unhiddenRole(member: ServerMember | undefined) {
  const memberRoles = roles(member);
  const sortedRoles = memberRoles.sort((a, b) => b?.order! - a?.order!);
  return sortedRoles.find((role) => !role?.hideRole);
}
function permissions(member: ServerMember | undefined) {
  const servers = useServers();
  const serverRoles = useServerRoles();

  const defaultRoleId = servers.get(member?.serverId!)?.defaultRoleId;
  const defaultRole = serverRoles.get(member?.serverId!, defaultRoleId!);

  let currentPermissions = defaultRole?.permissions || 0;

  const memberRoles = roles(member);
  for (let i = 0; i < memberRoles.length; i++) {
    const role = memberRoles[i];
    currentPermissions = addBit(currentPermissions, role?.permissions || 0);
  }

  return currentPermissions;
}
function hasPermission(
  member: ServerMember | undefined,
  bitwise: { bit: number },
  ignoreAdmin = false,
  ignoreCreator = false
) {
  const memberPermissions = permissions(member);
  const servers = useServers();
  if (!ignoreCreator) {
    const server = servers.get(member?.serverId!);
    if (server?.createdById === member?.userId) return true;
  }
  if (!ignoreAdmin) {
    if (hasBit(memberPermissions, ROLE_PERMISSIONS.ADMIN.bit)) return true;
  }
  return hasBit(memberPermissions, bitwise.bit);
}

function canViewChannel(member: ServerMember | undefined, channelId: string) {
  const channel = useChannels().get(channelId);
  if (!channel) return false;
  if (hasPermission(member, ROLE_PERMISSIONS.ADMIN)) return true;

  return channel.hasPermission(
    CHANNEL_PERMISSIONS.PUBLIC_CHANNEL,
    false,
    member?.userId
  );
}

function roles(member: ServerMember | undefined, sorted = false) {
  const serverRoles = useServerRoles();
  const roles =
    member?.roleIds.map((id) => serverRoles.get(member.serverId, id)!) || [];
  if (!sorted) return roles;
  return roles.sort((a, b) => b?.order! - a?.order!);
}

const remove = (serverId: string, userId: string) => {
  const users = useUsers();
  const channels = useChannels();
  const voiceUsers = useVoiceUsers();
  const user = users.get(userId);

  const voiceChannelId = user?.voiceChannelId;
  if (voiceChannelId) {
    const channel = channels.get(voiceChannelId);
    if (serverId === channel?.serverId) {
      voiceUsers.removeVoiceUser(voiceChannelId, userId);
    }
  }

  setMember(serverId, userId, undefined);
};

const removeAllServerMembers = (serverId: string) => {
  setMember(serverId, undefined);
};

const array = (serverId: string) =>
  Object.values(serverMembers?.[serverId] || []);
const get = (serverId: string, userId: string) =>
  serverMembers[serverId]?.[userId];

const reset = () => {
  setMember(reconcile({}));
};

export default function useServerMembers() {
  return {
    reset,
    array,
    set,
    remove,
    removeAllServerMembers,
    get,
    update,
    topRole,
    topRoleWithIcon,
    topRoleWithColor,
    canViewChannel,
    unhiddenRole,
    hasRole,
    isServerCreator,
    roles,
    hasPermission
  };
}
