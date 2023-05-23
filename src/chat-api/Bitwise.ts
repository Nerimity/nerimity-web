
export interface Bitwise {
  name: string;
  description?: string;
  bit: number;
  icon?: string
  showSettings?: boolean; // determine should this permission reveal the "settings" option context menu
}

export const USER_BADGES = {
  FOUNDER: {
    name: 'Founder',
    bit: 1,
    description: 'Creator of Nerimity',
    color: '#6fd894'
  },
  ADMIN: {
    name: 'Admin',
    bit: 2,
    description: 'Admin of Nerimity',
    color: '#d8a66f'
  },
  SUPPORTER: {
    name: 'Supporter',
    description: 'Supported this project by donating money',
    bit: 8,
    color: '#d86f6f'
  },
  CONTRIBUTOR: {
    name: 'Contributor',
    description: 'Helped with this project in some way',
    bit: 4,
    color: '#ffffff'
  },
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
    showSettings: true,
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
    showSettings: true,
  },
  MANAGE_CHANNELS: {
    name: 'servers.rolePermissions.manageChannels',
    description: 'servers.rolePermissions.manageChannelsDescription',
    // icon: 'mail',
    bit: 8,
    showSettings: true,
  },
  KICK: {
    name: 'servers.rolePermissions.kick',
    description: 'servers.rolePermissions.kickDescription',
    bit: 16,
    // icon: 'mail'
    showSettings: true,
  },
  BAN: {
    name: 'servers.rolePermissions.ban',
    description: 'servers.rolePermissions.banDescription',
    bit: 32,
    showSettings: true,
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