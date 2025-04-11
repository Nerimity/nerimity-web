export interface RawServer {
  id: string;
  name: string;
  hexColor: string;
  defaultChannelId: string;
  systemChannelId?: string;
  avatar?: string;
  banner?: string;
  defaultRoleId: string;
  createdById: string;
  createdAt: number;
  verified: boolean;
  customEmojis: RawCustomEmoji[];
  _count?: {
    welcomeQuestions: number;
  };
  scheduledForDeletion?: {
    scheduledAt: number;
  };
}

export interface RawVoice {
  serverId?: string;
  channelId: string;
  userId: string;
}

export enum MessageType {
  CONTENT = 0,
  JOIN_SERVER = 1,
  LEAVE_SERVER = 2,
  KICK_USER = 3,
  BAN_USER = 4,
  CALL_STARTED = 5,
  BUMP_SERVER = 6,
}

export interface HtmlEmbedItem {
  tag: string;
  attributes: Record<string, string>;
  content: (string | HtmlEmbedItem)[];
}
export interface RawMessage {
  id: string;
  channelId: string;
  silent?: boolean;
  content?: string;
  createdBy: RawUser;
  type: MessageType;
  createdAt: number;
  editedAt?: number;
  mentions?: Array<RawUser>;
  attachments?: Array<RawAttachment>;
  quotedMessages: Partial<RawMessage>[];
  reactions: RawMessageReaction[];
  htmlEmbed?: string;
  embed?: RawEmbed | null;
  mentionReplies?: boolean;
  replyMessages: {
    replyToMessage?: RawMessage;
  }[];

  buttons: RawMessageButton[];
  roleMentions: RawServerRole[];
}

export interface RawMessageButton {
  id: string;
  label: string;

  alert?: boolean;
}

export interface RawEmbed {
  title?: string;
  type?: string;
  description?: string;
  url: string;
  origUrl?: string;
  imageUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
  imageMime?: string;

  video?: boolean;
  largeImage?: boolean;

  // for youtube
  uploadDate: string;
  channelName: string;
  domain: string;
}

export interface RawMessageReaction {
  name: string;
  emojiId?: string | null;
  gif?: boolean;

  reacted: boolean;
  count: number;
}

export interface RawChannelNotice {
  content: string;
  updatedAt: number;
  channelId: string;
  userId: string;
}

export type AttachmentProviders = "local" | "google_drive";
export interface RawAttachment {
  id: string;

  provider?: AttachmentProviders;
  fileId?: string;
  mime?: string;
  messageId?: string;
  path?: string;
  width?: number;
  height?: number;
  createdAt?: number;

  filesize?: number;
  expireAt?: number;
}

export interface RawUser {
  id: string;
  avatar?: string;
  banner?: string;
  username: string;
  hexColor: string;
  tag: string;
  badges: number;
  joinedAt?: number;
  bot: boolean;
  lastOnlineStatus?: number;
  lastOnlineAt?: number;
}

export interface RawUserConnection {
  id: string;
  provider: "GOOGLE";
  connectedAt: number;
}

export enum ServerNotificationSoundMode {
  ALL = 0,
  MENTIONS_ONLY = 1,
  MUTE = 2,
}
export enum ServerNotificationPingMode {
  ALL = 0,
  MENTIONS_ONLY = 1,
  MUTE = 2,
}
export interface RawUserNotificationSettings {
  notificationSoundMode: ServerNotificationSoundMode;
  notificationPingMode: ServerNotificationPingMode;
  serverId?: string;
  channelId?: string;
}

export interface RawServerMember {
  serverId: string;
  user: RawUser;
  joinedAt: number;
  nickname?: string | null;
  roleIds: string[];
}

export enum ChannelType {
  DM_TEXT = 0,
  SERVER_TEXT = 1,
  CATEGORY = 2,
}

export enum TicketStatus {
  WAITING_FOR_MODERATOR_RESPONSE = 0,
  WAITING_FOR_USER_RESPONSE = 1,
  CLOSED_AS_DONE = 2,
  CLOSED_AS_INVALID = 3,
}

export const CloseTicketStatuses = [
  TicketStatus.CLOSED_AS_DONE,
  TicketStatus.CLOSED_AS_INVALID,
];

export interface RawTicket {
  id: string;
  title: string;
  category: TicketCategory;
  channelId: string;
  status: TicketStatus;
  lastUpdatedAt: number;
  openedById: string;
  openedBy?: RawUser;
  openedAt: Date;
  seen?: boolean;
}

export interface RawChannel {
  id: string;
  categoryId?: string;
  name: string;
  icon?: string;
  createdById?: string;
  serverId?: string;
  type: ChannelType;
  permissions?: ServerChannelPermissions[];
  createdAt: number;
  lastMessagedAt?: number;
  order?: number;
  slowModeSeconds?: number;

  _count?: { attachments: number };
}

interface ServerChannelPermissions {
  permissions: number;
  roleId: string;
}

export interface RawCustomEmoji {
  id: string;
  name: string;
  gif: boolean;
  serverId?: string;
}

export interface RawServerRole {
  id: string;
  name: string;
  icon?: string;
  order: number;
  hexColor: string;
  createdById: string;
  permissions: number;
  serverId: string;
  hideRole: boolean;
  botRole?: boolean;
}

export enum FriendStatus {
  SENT = 0,
  PENDING = 1,
  FRIENDS = 2,
  BLOCKED = 3,
}

export enum TicketCategory {
  QUESTION = 0,
  ACCOUNT = 1,
  ABUSE = 2,
  OTHER = 3,
  SERVER_VERIFICATION = 4,
}

export interface RawFriend {
  status: FriendStatus;
  createdAt: number;
  userId: string;
  recipient: RawUser;
}
export interface RawInboxWithoutChannel {
  id: string;
  createdAt: number;
  createdById: string;
  channelId: string;
  recipient: RawUser;
  closed: boolean;
  lastSeen?: number;
}

export interface ActivityStatus {
  action: string;
  name: string;
  startedAt: number;
  endsAt?: number;
  speed?: number;
  updatedAt?: number;

  imgSrc?: string;
  title?: string;
  subtitle?: string;
  link?: string;
  emoji?: string;
}
export interface RawPresence {
  userId: string;
  custom?: string;
  status: number;
  activity?: ActivityStatus;
}

export interface RawPublicServer {
  id: string;
  serverId: string;
  createdAt: number;
  bumpedAt: number;
  description: string;
  bumpCount: number;
  pinnedAt?: number;
  lifetimeBumpCount: number;
  server?: RawServer & {
    _count: { serverMembers: number };
    createdBy: RawUser;
  };
}

export interface RawBotCommand {
  name: string;
  description: string;
  args: string;
  botUserId: string;
}

export interface RawPost {
  id: string;
  content?: string;
  attachments?: Array<RawAttachment>;
  deleted: boolean;
  block?: boolean;
  commentToId: string;
  commentTo?: RawPost;
  createdBy: RawUser;
  embed?: RawEmbed;
  createdAt: number;
  mentions: RawUser[];
  editedAt: number;
  likedBy: { id: string }[]; // if you liked this post, array will not be empty
  reposts: { id: string; createdBy: { id: string; username: string } }[];
  repost?: RawPost;
  _count: { likedBy: number; comments: number; reposts: number };
  views: number;
  announcement: any;

  poll?: RawPostPoll;
}

export interface RawPostPoll {
  id: string;
  _count: { votedUsers: number };
  choices: RawPostChoice[];
  votedUsers:
    | [
        {
          pollChoiceId: string;
        }
      ]
    | [];
}
export interface RawPostChoice {
  id: string;
  content: string;
  _count: { votedUsers: number };
}

export enum PostNotificationType {
  LIKED = 0,
  REPLIED = 1,
  FOLLOWED = 2,
  REPOSTED = 3,
  MENTIONED = 4,
}

export interface RawPostNotification {
  id: string;
  createdAt: number;
  type: PostNotificationType;
  by: RawUser;
  post?: RawPost;
}

export interface RawApplication {
  id: string;
  name: string;
  description?: string;
  avatar?: string;

  botUserId?: string;
  botUser?: RawUser;

  creatorAccount?: {
    user: RawUser;
  };
  creatorAccountId: string;
  createdAt: number;
}

export interface RawServerWelcomeQuestion {
  id: string;
  title: string;
  multiselect: boolean;
  answers: RawServerWelcomeAnswer[];
  createdAt?: number;
  order: number;
}

export interface RawServerWelcomeAnswer {
  id: string;
  title: string;
  roleIds: string[];
  createdAt?: number;
  answered: boolean;
  questionId: string;
  order: number;
  _count: { answeredUsers: number };
}

export interface RawNotice {
  id: string;
  type: 0;
  title: null;
  content: string;
  createdAt: number;
  createdBy: { username: string };
}

export interface RawReminder {
  id: string;
  message?: RawMessage;
  post?: RawPost;
  channelId?: string;
  createdAt: number;
  remindAt: number;
}
