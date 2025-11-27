import { t } from "@nerimity/i18lite";

export interface Bitwise {
  name: () => string;
  description?: () => string;
  bit: number;
  icon?: string;
  textColor?: string;
  showSettings?: boolean; // determine should this permission reveal the "settings" option context menu
}

const USER_BADGE_BITS = {
  FOUNDER: 1,
  ADMIN: 2,
  CONTRIBUTOR: 4,
  SUPPORTER: 8,
  PALESTINE: 16,
  BOT: 32,
  MOD: 64,
  EMO_SUPPORTER: 128,

  CAT_EARS_WHITE: 256,
  CAT_EARS_BLUE: 512,

  FOX_EARS_GOLD: 1024,
  FOX_EARS_BROWN: 2048,
} as const;

export interface UserBadge {
  name: () => string;
  bit: (typeof USER_BADGE_BITS)[keyof typeof USER_BADGE_BITS];
  color: string;
  overlay?: boolean;
  description: () => string;
  textColor?: string;
  credit?: string;
}
export const USER_BADGES = {
  // overlays
  CAT_EARS_BLUE: {
    name: () => "Kitty",
    bit: USER_BADGE_BITS.CAT_EARS_BLUE,
    color: "linear-gradient(90deg, #78a5ff 0%, #ffffff 100%);",
    overlay: true,
    description: () => "Blue Ears Kitty",
  },
  CAT_EARS_WHITE: {
    name: () => "Kitty",
    bit: USER_BADGE_BITS.CAT_EARS_WHITE,
    color: "linear-gradient(90deg, #ffa761 0%, #ffffff 100%)",
    overlay: true,
    description: () => "White Ears Kitty",
  },
  FOX_EARS_GOLD: {
    name: () => "Foxy",
    bit: USER_BADGE_BITS.FOX_EARS_GOLD,
    color: "linear-gradient(90deg, #ffb100 0%, #ffffff 100%);",
    overlay: true,
    description: () => "Gold Ears Fox",
  },
  FOX_EARS_BROWN: {
    name: () => "Foxy",
    bit: USER_BADGE_BITS.FOX_EARS_BROWN,
    color: "linear-gradient(90deg, #bb7435 0%, #ffffff 100%);",
    overlay: true,
    description: () => "Brown Ears Fox",
  },

  FOUNDER: {
    name: () => "Founder",
    bit: USER_BADGE_BITS.FOUNDER,
    description: () => "Creator of Nerimity",
    color: "linear-gradient(90deg, #4fffbd 0%, #4a5efc 100%);",
    credit: "Avatar Border by upklyak on Freepik",
  },
  ADMIN: {
    name: () => "Admin",
    bit: USER_BADGE_BITS.ADMIN,
    description: () => "Admin of Nerimity",
    color:
      "linear-gradient(90deg, rgba(224,26,185,1) 0%, rgba(64,122,255,1) 100%);",
    credit: "Avatar Border by upklyak on Freepik",
  },
  MOD: {
    name: () => "Moderator",
    bit: USER_BADGE_BITS.MOD,
    description: () => "Moderator of Nerimity",
    color: "linear-gradient(90deg, #57acfa 0%, #1485ed 100%)",
    credit: "Avatar Border by upklyak on Freepik",
  },
  EMO_SUPPORTER: {
    name: () => "Emo Supporter",
    description: () => "Supported this project by donating money",
    bit: USER_BADGE_BITS.EMO_SUPPORTER,
    textColor: "rgba(255,255,255,0.8)",
    color: "linear-gradient(90deg, #424242 0%, #303030 100%)",
    credit: "Avatar Border by upklyak on Freepik",
  },
  SUPPORTER: {
    name: () => "Supporter",
    description: () => "Supported this project by donating money",
    bit: USER_BADGE_BITS.SUPPORTER,
    color:
      "linear-gradient(90deg, rgba(235,78,209,1) 0%, rgba(243,189,247,1) 100%)",
    credit: "Avatar Border by upklyak on Freepik",
  },

  CONTRIBUTOR: {
    name: () => "Contributor",
    description: () => "Helped with this project in some way",
    bit: USER_BADGE_BITS.CONTRIBUTOR,
    color: "#ffffff",
  },
  PALESTINE: {
    name: () => "Palestine",
    description: () =>
      "[Click To Help](https://arab.org/click-to-help/palestine/)",
    bit: USER_BADGE_BITS.PALESTINE,
    credit: "Avatar Border by upklyak on Freepik, edited by Supertiger",
    color: "linear-gradient(90deg, red, white, green);",
  },
  BOT: {
    name: () => "Bot User",
    description: () => "Bot User",
    bit: USER_BADGE_BITS.BOT,
    color: "var(--primary-color)",
  },
} satisfies Record<string, UserBadge>;

export const USER_BADGES_VALUES = Object.values(USER_BADGES) as UserBadge[];

export const CHANNEL_PERMISSIONS = {
  PUBLIC_CHANNEL: {
    name: () => t("servers.channelPermissions.publicChannel"),
    description: () => t("servers.channelPermissions.publicChannelDescription"),
    bit: 1,
    icon: "public",
  },
  SEND_MESSAGE: {
    name: () => t("servers.channelPermissions.sendMessage"),
    description: () => t("servers.channelPermissions.sendMessageDescription"),
    bit: 2,
    icon: "mail",
  },
  JOIN_VOICE: {
    name: () => t("servers.channelPermissions.joinVoice"),
    description: () => t("servers.channelPermissions.joinVoiceDescription"),
    bit: 4,
    icon: "call",
  },
};

export const ROLE_PERMISSIONS = {
  ADMIN: {
    name: () => t("servers.rolePermissions.admin"),
    description: () => t("servers.rolePermissions.adminDescription"),
    bit: 1,
    // icon: 'mail',  // looks good even without icon
    showSettings: true,
  },
  SEND_MESSAGE: {
    name: () => t("servers.rolePermissions.sendMessage"),
    description: () => t("servers.rolePermissions.sendMessageDescription"),
    bit: 2,
    icon: "mail",
  },
  MANAGE_ROLES: {
    name: () => t("servers.rolePermissions.manageRoles"),
    description: () => t("servers.rolePermissions.manageRolesDescription"),
    icon: "leaderboard",
    bit: 4,
    showSettings: true,
  },
  MANAGE_CHANNELS: {
    name: () => t("servers.rolePermissions.manageChannels"),
    description: () => t("servers.rolePermissions.manageChannelsDescription"),
    icon: "storage",
    bit: 8,
    showSettings: true,
  },
  KICK: {
    name: () => t("servers.rolePermissions.kick"),
    description: () => t("servers.rolePermissions.kickDescription"),
    bit: 16,
    icon: "logout",
    showSettings: true,
  },
  BAN: {
    name: () => t("servers.rolePermissions.ban"),
    description: () => t("servers.rolePermissions.banDescription"),
    bit: 32,
    showSettings: true,
    icon: "block",
  },
  MENTION_EVERYONE: {
    name: () => t("servers.rolePermissions.mentionEveryone"),
    description: () => t("servers.rolePermissions.mentionEveryoneDescription"),
    bit: 64,
    icon: "alternate_email",
  },
  NICKNAME_MEMBER: {
    name: () => t("servers.rolePermissions.nicknameMember"),
    description: () => t("servers.rolePermissions.nicknameMemberDescription"),
    bit: 128,
    icon: "edit",
  },
  MENTION_ROLES: {
    name: () => "Mention Roles",
    bit: 256,
    description: () => "Allow users to mention roles",
    icon: "alternate_email",
  },
};

export const APPLICATION_SCOPES = {
  USER_INFO: {
    name: () => "User Info",
    bit: 1,
    icon: "person",
  },
  USER_EMAIL: {
    name: () => "User Email",
    bit: 2,
    icon: "mail",
  },
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

export const getAllPermissions = (
  permissionList: Record<string, Bitwise>,
  permissions: number
) => {
  return Object.values(permissionList).map((permission) => {
    const hasPerm = hasBit(permissions, permission.bit);
    return {
      ...permission,
      hasPerm,
    };
  });
};
