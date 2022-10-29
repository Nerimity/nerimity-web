
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
    name: 'Private Channel',
    description: 'Disable access to the channel. Server admins can still access the channel.',
    bit: 1,
    icon: 'lock'
  },
  SEND_MESSAGE: {
    name: 'Send Message',
    description: 'Enable sending messages in the channel. Server admins can still send messages.',
    bit: 2,
    icon: 'mail'
  }
}
export const ROLE_PERMISSIONS = {
  ADMIN: {
    name: 'Admin',
    description: 'Enables all permissions.',
    bit: 1,
    // icon: 'mail'
  },
  SEND_MESSAGE: {
    name: 'Send Message',
    description: 'Enable sending messages in this server. Server admins can still send messages.',
    bit: 2,
    icon: 'mail'
  },
  MANAGE_ROLES: {
    name: 'Manage Roles',
    description: 'Permission for updating or deleting roles.',
    // icon: 'mail',
    bit: 4,
  },
  MANAGE_CHANNELS: {
    name: 'Manage Channels',
    description: 'Permission for updating or deleting channels.',
    // icon: 'mail',
    bit: 8,
  },
  KICK: {
    name: 'Kick',
    description: 'Permission to kick users',
    bit: 16,
    // icon: 'mail'
  },
  BAN: {
    name: 'Ban',
    description: 'Permission to ban users.',
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