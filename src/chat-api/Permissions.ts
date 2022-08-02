
export interface Permission {
  name: string;
  description: string;
  bit: number;
  icon: string
}

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

export const hasPermission = (permissions: number, bit: number) => {
  return (permissions & bit) === bit
}

export const addPermission = (permissions: number, bit: number) => {
  return permissions | bit
}

export const getAllPermissions = (permissionList: Record<string, Permission>, permissions: number) => {
  return Object.values(permissionList).map(permission => {
    const hasPerm = hasPermission(permissions, permission.bit)
    return {
      ...permission,
      hasPerm
    }
  })
}