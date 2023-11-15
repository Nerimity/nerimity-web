
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
  BOT: {
    name: 'Bot',      // I really recommend having this even if it is unused
    description: 'An bot account (currently unused)',
    bit: 8,
    color: '#4c93ff'  // this is the primary color, not sure how to scope to that properly :(
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
  },
  JOIN_VOICE: {
    name: 'servers.channelPermissions.joinVoice',
    description: 'servers.channelPermissions.joinVoiceDescription',
    bit: 4,
    icon: 'call'
  }
}

export const ROLE_PERMISSIONS = {
  ADMIN: {
    name: 'servers.rolePermissions.admin',
    description: 'servers.rolePermissions.adminDescription',
    bit: 1,
    // icon: 'mail',  // looks good even without icon
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
    icon: 'leaderboard',
    bit: 4,
    showSettings: true,
  },
  MANAGE_CHANNELS: {
    name: 'servers.rolePermissions.manageChannels',
    description: 'servers.rolePermissions.manageChannelsDescription',
    icon: 'storage',
    bit: 8,
    showSettings: true,
  },
  KICK: {
    name: 'servers.rolePermissions.kick',
    description: 'servers.rolePermissions.kickDescription',
    bit: 16,
    icon: 'logout',
    showSettings: true,
  },
  BAN: {
    name: 'servers.rolePermissions.ban',
    description: 'servers.rolePermissions.banDescription',
    bit: 32,
    showSettings: true,
    icon: 'block'
  },
  MENTION_EVERYONE: {
    name: 'servers.rolePermissions.mentionEveryone',
    description: 'servers.rolePermissions.mentionEveryoneDescription',
    bit: 64,
    icon: 'alternate_email'
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
