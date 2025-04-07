import { createStore, reconcile } from "solid-js/store";
import { addBit, Bitwise, hasBit, ROLE_PERMISSIONS } from "../Bitwise";
import { RawServerMember } from "../RawData";
import useServerRoles, { ServerRole } from "./useServerRoles";
import useServers, { Server } from "./useServers";
import useUsers, { User } from "./useUsers";
import useVoiceUsers from "./useVoiceUsers";
import useChannels from "./useChannels";

export type ServerMember = Omit<RawServerMember, "user"> & {
  userId: string;
  user: () => User;
  server: () => Server;
  roles: (sorted?: boolean) => ServerRole[];
  update: (this: ServerMember, update: Partial<ServerMember>) => void;
  hasRole: (this: ServerMember, roleId: string) => boolean | undefined;
  permissions: () => number;
  hasPermission: (
    this: ServerMember,
    bitwise: Bitwise,
    ignoreAdmin?: boolean,
    ignoreCreator?: boolean
  ) => boolean | void;
  topRole: () => ServerRole;
  topRoleWithIcon: () => ServerRole | undefined;
  roleColor: () => string;
  unhiddenRole: () => ServerRole | undefined;
  isServerCreator: () => boolean | undefined;
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
    userId: member.user.id,
    server,
    user,
    update,
    roles,
    hasRole,
    isServerCreator,
    topRole,
    topRoleWithIcon,
    roleColor,
    unhiddenRole,
    permissions,
    hasPermission,
  };

  setMember(member.serverId, member.user.id, reconcile(newMember));
};

function user(this: ServerMember) {
  const users = useUsers();
  return users.get(this.userId);
}
function server(this: ServerMember) {
  const servers = useServers();
  return servers.get(this.serverId)!;
}
function update(this: ServerMember, update: Partial<ServerMember>) {
  setMember(this.serverId, this.userId, update);
}
function isServerCreator(this: ServerMember) {
  const servers = useServers();
  const server = servers.get(this.serverId);
  if (!server) return;
  return server.createdById === this.userId;
}
function hasRole(this: ServerMember, roleId: string) {
  const servers = useServers();
  const server = servers.get(this.serverId);

  if (!server) return;
  if (server.defaultRoleId === roleId) return true;
  return this.roleIds.includes(roleId);
}
function topRole(this: ServerMember) {
  const servers = useServers();
  const roles = useServerRoles();

  const sortedRoles = this.roles().sort((a, b) => b?.order! - a?.order!);
  const defaultRoleId = () => servers.get(this.serverId)?.defaultRoleId;
  const defaultRole = () => roles.get(this.serverId, defaultRoleId()!);

  return sortedRoles[0] || defaultRole()!;
}

function topRoleWithIcon(this: ServerMember) {
  const servers = useServers();
  const roles = useServerRoles();

  const sortedRoles = this.roles()
    .filter((r) => r?.icon)
    .sort((a, b) => b?.order! - a?.order!);
  const defaultRoleId = () => servers.get(this.serverId)?.defaultRoleId;
  const defaultRole = () => roles.get(this.serverId, defaultRoleId()!);

  if (sortedRoles[0]?.icon) {
    return sortedRoles[0];
  }
  const dRole = defaultRole();
  return dRole?.icon ? dRole : undefined;
}

function roleColor(this: ServerMember) {
  return this.topRole().hexColor || "white";
}
function unhiddenRole(this: ServerMember) {
  const sortedRoles = this.roles().sort((a, b) => b?.order! - a?.order!);
  return sortedRoles.find((role) => !role?.hideRole);
}
function permissions(this: ServerMember) {
  const servers = useServers();
  const roles = useServerRoles();

  const defaultRoleId = servers.get(this.serverId)?.defaultRoleId;
  const defaultRole = roles.get(this.serverId, defaultRoleId!);

  let currentPermissions = defaultRole?.permissions || 0;

  const memberRoles = this.roles();
  for (let i = 0; i < memberRoles.length; i++) {
    const role = memberRoles[i];
    currentPermissions = addBit(currentPermissions, role?.permissions || 0);
  }

  return currentPermissions;
}
function hasPermission(
  this: ServerMember,
  bitwise: Bitwise,
  ignoreAdmin = false,
  ignoreCreator = false
) {
  if (!ignoreCreator) {
    if (this.server().createdById === this.userId) return true;
  }
  if (!ignoreAdmin) {
    if (hasBit(this.permissions(), ROLE_PERMISSIONS.ADMIN.bit)) return true;
  }
  return hasBit(this.permissions(), bitwise.bit);
}

function roles(this: ServerMember, sorted = false) {
  const serverRoles = useServerRoles();
  const roles =
    this.roleIds.map((id) => serverRoles.get(this.serverId, id)!) || [];
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
  };
}
