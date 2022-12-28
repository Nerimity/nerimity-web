
export interface Bitwise {
  name: string;
  description?: string;
  bit: number;
  icon?: string
}

export const USER_BADGES = {
  CREATOR: {
    name: 'Creator',
    bit: 1
  },
  ADMIN: {
    name: 'Admin',
    bit: 2
  }
};

export const CHANNEL_PERMISSIONS = {
  PRIVATE_CHANNEL: {
    name: 'servers.channelPermissions.privateChannel',
    description: 'servers.channelPermissions.privateChannelDescription',
    bit: 1,
    icon: 'lock'
  },
  SEND_MESSAGE: {
    name: 'servers.channelPermissions.sendMessage',
    description: 'servers.channelPermissions.sendMessageDescription',
    bit: 2,
    icon: 'mail'
  }
}
export const ROLE_PERMISSIONS = {
  ADMIN: {
    name: 'servers.rolePermissions.admin',
    description: 'servers.rolePermissions.adminDescription',
    bit: 1,
    // icon: 'mail'
  },
  SEND_MESSAGE: {
    name: 'servers.rolePermissions.sendMessage',
    description: 'servers.rolePermissions.sendMessageDescription',
    bit: 2,
    icon: 'mail'
  },
  MANAGE_ROLES: {
    name: 'servers.rolePermissions.manageRoles',
    description: 'servers.rolePermissions.manageRolesDescription',
    // icon: 'mail',
    bit: 4,
  },
  MANAGE_CHANNELS: {
    name: 'servers.rolePermissions.manageChannels',
    description: 'servers.rolePermissions.manageChannelsDescription',
    // icon: 'mail',
    bit: 8,
  },
  KICK: {
    name: 'servers.rolePermissions.kick',
    description: 'servers.rolePermissions.kickDescription',
    bit: 16,
    // icon: 'mail'
  },
  BAN: {
    name: 'servers.rolePermissions.ban',
    description: 'servers.rolePermissions.banDescription',
    bit: 32,
    // icon: 'mail'
  }
}

export const hasBit = (permissions: number, bit: number) => {
  return (permissions & bit) === bit
}

export const addBit = (permissions: number, bit: number) => {
  return permissions | bit
}
export const removeBit = (permissions: number, bit: number) => {
  return permissions & ~bit
}

export const getAllPermissions = (permissionList: Record<string, Bitwise>, permissions: number) => {
  return Object.values(permissionList).map(permission => {
    const hasPerm = hasBit(permissions, permission.bit)
    return {
      ...permission,
      hasPerm
    }
  })
}