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

  BUNNY_EARS_BLACK: 4096,
  BUNNY_EARS_MAID: 8192,
  DOG_EARS_BROWN: 16384,
  DOG_SHIBA: 32768,

  WOLF_EARS: 65536,
  GOAT_EARS_WHITE: 131072,
  DEER_EARS_HORNS: 262144,
  GOAT_HORNS: 524288,
  DEER_EARS_HORNS_DARK: 1048576,
  CAT_EARS_MAID: 2097152,
  CAT_EARS_PURPLE: 4194304,
  DEER_EARS_WHITE: 8388608,
} as const;

export interface UserBadge {
  name: () => string;
  bit: (typeof USER_BADGE_BITS)[keyof typeof USER_BADGE_BITS];
  color: string;
  overlay?: boolean;
  description: () => string;
  textColor?: string;
  credit?: () => string;
}

export const USER_BADGES = {
  // overlays
  DEER_EARS_WHITE: {
    name: () => t("badges.deer.name"),
    bit: USER_BADGE_BITS.DEER_EARS_WHITE,
    color: "linear-gradient(273deg, #fb83a7, #ffffff)",
    textColor: "#2a1d1d",
    overlay: true,
    description: () => t("badges.deer.deerWhiteDescription"),
  },
  DEER_EARS_HORNS_DARK: {
    name: () => t("badges.deer.name"),
    bit: USER_BADGE_BITS.DEER_EARS_HORNS_DARK,
    color: "linear-gradient(267deg, #8f8f8f, #090a25)",
    textColor: "#ffffff",
    overlay: true,
    description: () => t("badges.deer.deerDarkDescription"),
  },
  DEER_EARS_HORNS: {
    name: () => t("badges.deer.name"),
    bit: USER_BADGE_BITS.DEER_EARS_HORNS,
    color: "linear-gradient(270deg, #aa4908, #ffd894)",
    textColor: "#321515",
    overlay: true,
    description: () => t("badges.deer.deerDescription"),
  },
  GOAT_HORNS: {
    name: () => t("badges.goat.name"),
    bit: USER_BADGE_BITS.GOAT_HORNS,
    color: "linear-gradient(268deg, #cb75d7, #390a8f)",
    overlay: true,
    description: () => t("badges.goat.goatHornDescription"),
  },
  GOAT_EARS_WHITE: {
    name: () => t("badges.goat.name"),
    bit: USER_BADGE_BITS.GOAT_EARS_WHITE,
    color: "linear-gradient(89deg, #ffecc2, #94e4ff)",
    textColor: "#503030",
    overlay: true,
    description: () => t("badges.goat.goatDescription"),
  },
  WOLF_EARS: {
    name: () => t("badges.wolf.name"),
    bit: USER_BADGE_BITS.WOLF_EARS,
    color: "linear-gradient(90deg, #585858ff 0%, #252525ff 100%)",
    textColor: "#ffffff",
    overlay: true,
    description: () => t("badges.wolf.wolfDescription"),
  },
  DOG_SHIBA: {
    name: () => t("badges.dog.name"),
    bit: USER_BADGE_BITS.DOG_SHIBA,
    color: "linear-gradient(261deg, #ffeeb3, #9e7aff)",
    textColor: "#2e1919",
    overlay: true,
    description: () => t("badges.dog.shibaDescription"),
  },
  DOG_EARS_BROWN: {
    name: () => t("badges.dog.name"),
    bit: USER_BADGE_BITS.DOG_EARS_BROWN,
    color: "linear-gradient(90deg, #bb7435 0%, #ffbd67ff 100%)",
    overlay: true,
    description: () => t("badges.dog.dogDescription"),
  },
  BUNNY_EARS_MAID: {
    name: () => t("badges.bunny.name"),
    bit: USER_BADGE_BITS.BUNNY_EARS_MAID,
    color: "linear-gradient(100deg, #ff94e2, #ffffff)",
    textColor: "#2a1d1d",
    overlay: true,
    description: () => t("badges.bunny.maidDescription"),
  },
  BUNNY_EARS_BLACK: {
    name: () => t("badges.bunny.name"),
    bit: USER_BADGE_BITS.BUNNY_EARS_BLACK,
    color: "linear-gradient(90deg, #585858ff 0%, #252525ff 100%)",
    textColor: "#ffffff",
    overlay: true,
    description: () => t("badges.bunny.bunnyDescription"),
  },
  CAT_EARS_MAID: {
    name: () => t("badges.kitty.name"),
    bit: USER_BADGE_BITS.CAT_EARS_MAID,
    color: "linear-gradient(100deg, #ff94e2, #ffffff)",
    textColor: "#2a1d1d",
    overlay: true,
    description: () => t("badges.kitty.maidDescription"),
  },
  CAT_EARS_PURPLE: {
    name: () => t("badges.kitty.name"),
    bit: USER_BADGE_BITS.CAT_EARS_PURPLE,
    color: "linear-gradient(268deg, #cb75d7, #390a8f)",
    textColor: "#ffffff",
    overlay: true,
    description: () => t("badges.kitty.purpleDescription"),
  },
  CAT_EARS_BLUE: {
    name: () => t("badges.kitty.name"),
    bit: USER_BADGE_BITS.CAT_EARS_BLUE,
    color: "linear-gradient(90deg, #78a5ff 0%, #ffffff 100%)",
    overlay: true,
    description: () => t("badges.kitty.blueDescription"),
  },

  CAT_EARS_WHITE: {
    name: () => t("badges.kitty.name"),
    bit: USER_BADGE_BITS.CAT_EARS_WHITE,
    color: "linear-gradient(90deg, #ffa761 0%, #ffffff 100%)",
    overlay: true,
    description: () => t("badges.kitty.whiteDescription"),
  },

  FOX_EARS_GOLD: {
    name: () => t("badges.foxy.name"),
    bit: USER_BADGE_BITS.FOX_EARS_GOLD,
    color: "linear-gradient(90deg, #ffb100 0%, #ffffff 100%)",
    overlay: true,
    description: () => t("badges.foxy.foxyGoldDescription"),
  },

  FOX_EARS_BROWN: {
    name: () => t("badges.foxy.name"),
    bit: USER_BADGE_BITS.FOX_EARS_BROWN,
    color: "linear-gradient(90deg, #bb7435 0%, #ffffff 100%)",
    overlay: true,
    description: () => t("badges.foxy.foxyBrownDescription"),
  },

  FOUNDER: {
    name: () => t("badges.founder.name"),
    bit: USER_BADGE_BITS.FOUNDER,
    description: () => t("badges.founder.description"),
    color: "linear-gradient(90deg, #4fffbd 0%, #4a5efc 100%)",
    credit: () =>
      t("badges.credit.avatarBorder", {
        author: "upklyak",
        platform: "Freepik",
      }),
  },

  ADMIN: {
    name: () => t("badges.admin.name"),
    bit: USER_BADGE_BITS.ADMIN,
    description: () => t("badges.admin.description"),
    color:
      "linear-gradient(90deg, rgba(224,26,185,1) 0%, rgba(64,122,255,1) 100%)",
    credit: () =>
      t("badges.credit.avatarBorderEdited", {
        author: "upklyak",
        platform: "Freepik",
        editor: "Supertiger",
      }),
  },

  MOD: {
    name: () => t("badges.mod.name"),
    bit: USER_BADGE_BITS.MOD,
    description: () => t("badges.mod.description"),
    color: "linear-gradient(90deg, #57acfa 0%, #1485ed 100%)",
    credit: () =>
      t("badges.credit.avatarBorder", {
        author: "upklyak",
        platform: "Freepik",
      }),
  },

  EMO_SUPPORTER: {
    name: () => t("badges.emoSupporter.name"),
    description: () => t("badges.emoSupporter.description"),
    bit: USER_BADGE_BITS.EMO_SUPPORTER,
    textColor: "rgba(255,255,255,0.8)",
    color: "linear-gradient(90deg, #424242 0%, #303030 100%)",
    credit: () =>
      t("badges.credit.avatarBorderEdited", {
        author: "upklyak",
        platform: "Freepik",
        editor: "Supertiger",
      }),
  },

  SUPPORTER: {
    name: () => t("badges.supporter.name"),
    description: () => t("badges.supporter.description"),
    bit: USER_BADGE_BITS.SUPPORTER,
    color:
      "linear-gradient(90deg, rgba(235,78,209,1) 0%, rgba(243,189,247,1) 100%)",
    credit: () =>
      t("badges.credit.avatarBorder", {
        author: "upklyak",
        platform: "Freepik",
      }),
  },

  CONTRIBUTOR: {
    name: () => t("badges.contributor.name"),
    description: () => t("badges.contributor.description"),
    bit: USER_BADGE_BITS.CONTRIBUTOR,
    color: "#ffffff",
  },

  PALESTINE: {
    name: () => t("badges.palestine.name"),
    description: () =>
      "[Click to help](https://arab.org/click-to-help/palestine/)",
    bit: USER_BADGE_BITS.PALESTINE,
    color: "linear-gradient(90deg, red, white, green)",
    credit: () =>
      t("badges.credit.avatarBorderEdited", {
        author: "upklyak",
        platform: "Freepik",
        editor: "Supertiger",
      }),
  },

  BOT: {
    name: () => t("badges.bot.name"),
    description: () => t("badges.bot.description"),
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
    description: () => "Access to your user information.",
    bit: 1,
    icon: "person",
  },
  USER_EMAIL: {
    name: () => "User Email",
    description: () => "Access to your email address",
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
