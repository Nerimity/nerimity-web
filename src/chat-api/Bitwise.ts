
export interface Bitwise {
  name: string;
  description?: string;
  bit: number;
  icon?: string
  showSettings?: boolean; // determine should this permission reveal the "settings" option context menu
}

export const USER_BADGES = {
  FOUNDER: {
    name: "Founder",
    bit: 1,
    description: "Creator of Nerimity",
    color: "linear-gradient(90deg, #4fffbd 0%, #4a5efc 100%);",
    credit: "Avatar Border by upklyak on Freepik"
  },
  ADMIN: {
    name: "Admin",
    bit: 2,
    description: "Admin of Nerimity",
    color: "linear-gradient(90deg, rgba(224,26,185,1) 0%, rgba(64,122,255,1) 100%);",
    credit: "Avatar Border by upklyak on Freepik"
  },
  SUPPORTER: {
    name: "Supporter",
    description: "Supported this project by donating money",
    bit: 8,
    color: "linear-gradient(90deg, rgba(235,78,209,1) 0%, rgba(243,189,247,1) 100%)",
    credit: "Avatar Border by upklyak on Freepik"
  },
  CONTRIBUTOR: {
    name: "Contributor",
    description: "Helped with this project in some way",
    bit: 4,
    color: "#ffffff"
  },
  PALESTINE: {
    name: "Palestine",
    description: "[Click To Help](https://arab.org/click-to-help/palestine/)",
    bit: 16,
    credit: "Avatar Border by upklyak on Freepik, edited by Supertiger",
    color: "linear-gradient(90deg, red, white, green);" 
  }
};

export const CHANNEL_PERMISSIONS = {
  PRIVATE_CHANNEL: {
    name: "servers.channelPermissions.privateChannel",
    description: "servers.channelPermissions.privateChannelDescription",
    bit: 1,
    icon: "lock"
  },
  SEND_MESSAGE: {
    name: "servers.channelPermissions.sendMessage",
    description: "servers.channelPermissions.sendMessageDescription",
    bit: 2,
    icon: "mail"
  },
  JOIN_VOICE: {
    name: "servers.channelPermissions.joinVoice",
    description: "servers.channelPermissions.joinVoiceDescription",
    bit: 4,
    icon: "call"
  }
};

export const ROLE_PERMISSIONS = {
  ADMIN: {
    name: "servers.rolePermissions.admin",
    description: "servers.rolePermissions.adminDescription",
    bit: 1,
    // icon: 'mail',  // looks good even without icon
    showSettings: true
  },
  SEND_MESSAGE: {
    name: "servers.rolePermissions.sendMessage",
    description: "servers.rolePermissions.sendMessageDescription",
    bit: 2,
    icon: "mail"
  },
  MANAGE_ROLES: {
    name: "servers.rolePermissions.manageRoles",
    description: "servers.rolePermissions.manageRolesDescription",
    icon: "leaderboard",
    bit: 4,
    showSettings: true
  },
  MANAGE_CHANNELS: {
    name: "servers.rolePermissions.manageChannels",
    description: "servers.rolePermissions.manageChannelsDescription",
    icon: "storage",
    bit: 8,
    showSettings: true
  },
  KICK: {
    name: "servers.rolePermissions.kick",
    description: "servers.rolePermissions.kickDescription",
    bit: 16,
    icon: "logout",
    showSettings: true
  },
  BAN: {
    name: "servers.rolePermissions.ban",
    description: "servers.rolePermissions.banDescription",
    bit: 32,
    showSettings: true,
    icon: "block"
  },
  MENTION_EVERYONE: {
    name: "servers.rolePermissions.mentionEveryone",
    description: "servers.rolePermissions.mentionEveryoneDescription",
    bit: 64,
    icon: "alternate_email"
  },
  NICKNAME_MEMBER: {
    name: "servers.rolePermissions.nicknameMember",
    description: "servers.rolePermissions.nicknameMemberDescription",
    bit: 128,
    icon: "edit"
  }
};

export const hasBit = (permissions: number, bit: number) => {
  return (permissions & bit) === bit;
};

export const addBit = (permissions: number, bit: number) => {
  return permissions | bit;
};
export const removeBit = (permissions: number, bit: number) => {
  return permissions & ~bit;
};

export const getAllPermissions = (permissionList: Record<string, Bitwise>, permissions: number) => {
  return Object.values(permissionList).map(permission => {
    const hasPerm = hasBit(permissions, permission.bit);
    return {
      ...permission,
      hasPerm
    };
  });
};
