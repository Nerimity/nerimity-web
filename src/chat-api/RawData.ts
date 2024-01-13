
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
  CALL_STARTED = 5
}

export interface RawMessage {
  id: string;
  channelId: string;
  content?: string;
  createdBy: RawUser;
  type: MessageType;
  createdAt: number;
  editedAt?: number;
  mentions?: Array<RawUser>;
  attachments?: Array<RawAttachment>
  quotedMessages: Partial<RawMessage>[]
  reactions: RawMessageReaction[]
  embed?: RawEmbed | null;
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

  // for youtube
  uploadDate: string;
  channelName: string;
};

export interface RawMessageReaction {
  name: string;
  emojiId?: string | null;
  gif?: boolean;

  reacted: boolean
  count: number
}

export interface RawChannelNotice {
  content: string;
  updatedAt: number;
  channelId: string;
  userId: string;
}

export interface RawAttachment {
  id: string;

  provider?: "local" | "google_drive"
  fileId?: string
  mime?: string
  messageId?: string;
  path?: string;
  width?: number;
  height?: number;
  createdAt: number
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
}

export interface RawUserConnection {
  id: string;
  provider: "GOOGLE",
  connectedAt: number
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
export interface RawServerSettings {
  notificationSoundMode: ServerNotificationSoundMode,
  notificationPingMode: ServerNotificationPingMode,
  serverId: string
}

export interface RawServerMember {
  serverId: string;
  user: RawUser;
  joinedAt: number;
  roleIds: string[];
}


export enum ChannelType {
  DM_TEXT = 0,
  SERVER_TEXT = 1,
  CATEGORY = 2
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
  name: string
  icon?: string;
  createdById?: string;
  serverId?: string;
  type: ChannelType;
  permissions?: number
  createdAt: number
  lastMessagedAt?: number;
  order?: number;
  _count?: {attachments: number}
}

export interface RawCustomEmoji {
  id: string;
  name:string;
  gif: boolean;
  serverId?: string;
}

export interface RawServerRole {
  id: string;
  name: string
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
}

export interface RawFriend {
  status: FriendStatus,
  createdAt: number
  userId: string;
  recipient: RawUser;
}
export interface RawInboxWithoutChannel {
  id: string;
  createdAt: number;
  createdById: string;
  channelId: string;
  recipient: RawUser;
  closed: boolean
  lastSeen?: number;
}

export interface ActivityStatus {
  action: string;
  name: string;
  startedAt: number;
}
export interface RawPresence {
  userId: string;
  custom?: string;
  status: number;
  activity?: ActivityStatus;
}


export interface RawPublicServer {
  serverId: string;
  createdAt: number;
  bumpedAt: number;
  description: string;
  bumpCount: number;
  lifetimeBumpCount: number;
  server?: RawServer & {_count: {serverMembers: number}}
}


export interface RawPost {
  id: string;
  content?: string;
  attachments?: Array<RawAttachment>;
  deleted: boolean;
  block?: boolean;
  commentToId: string;
  commentTo?: RawPost;
  createdBy: RawUser
  createdAt: number;
  editedAt: number;
  likedBy: {id: string}[] // if you liked this post, array will not be empty
  _count: {likedBy: number, comments: number}
}


export enum PostNotificationType {
  LIKED = 0,
  REPLIED = 1,
  FOLLOWED = 2
}

export interface RawPostNotification {
  id: string,
  createdAt: number,
  type: PostNotificationType,
  by: RawUser,
  post?: RawPost
}