export interface RawServer {
  id: string;
  name: string;
  hexColor: string;
  defaultChannelId: string;
  createdById: string;
  createdAt: number;
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
  createdAt: number;
  editedAt?: number;
}

export interface RawUser {
  id: string;
  avatar?: string;
  username: string;
  hexColor: string;
  tag: string;
  joinedAt?: number;
}

export interface RawServerMember {
  serverId: string;
  user: RawUser;
  joinedAt: number;
}

export interface RawChannel {
  name: string
  id: string;
  createdById?: string;
  serverId?: string;
  type: number;
  permissions?: number
  createdAt: number
  lastMessagedAt?: number;
}

export enum FriendStatus {
  SENT = 0,
  PENDING = 1,
  FRIENDS = 2,
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
}