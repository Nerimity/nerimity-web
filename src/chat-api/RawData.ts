export interface RawServer {
  id: string;
  name: string;
  hexColor: string;
  defaultChannelId: string;
  createdById: string;
  createdAt: string;
}



export enum MessageType {
  CONTENT = 0,
  JOIN_SERVER = 1,
  LEAVE_SERVER = 2,
  KICK_USER = 3,
  BAN_USER = 4
}

export interface RawMessage {
  id: string;
  channelId: string;
  content?: string;
  createdBy: RawUser;
  type: MessageType;
  createdAt: string;
  editedAt?: string;
}

export interface RawUser {
  id: string;
  avatar?: string;
  username: string;
  hexColor: string;
  tag: string;
  joinedAt?: string;
}

export interface RawServerMember {
  serverId: string;
  user: RawUser;
  joinedAt: string;
}

export interface RawChannel {
  id: string;
  name: string
  createdById?: string;
  serverId?: string;
  type: number;
  permissions?: number
  createdAt: string
  lastMessagedAt?: string;
}
export interface RawServerRole {
  id: string;
  name: string
  order: number;
  hexColor: string;
  createdById: string;
  permissions: number;
  serverId: string;
  defaultRole?: boolean
  botRole?: boolean;
}

export enum FriendStatus {
  SENT = 0,
  PENDING = 1,
  FRIENDS = 2,
}

export interface RawFriend {
  status: FriendStatus,
  createdAt: string
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
}