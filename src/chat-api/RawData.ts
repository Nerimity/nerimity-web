export interface RawServer {
  id: string;
  name: string;
  hexColor: string;
  defaultChannelId: string;
  systemChannelId?: string;
  defaultRoleId: string;
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
  badges: number;
  joinedAt?: number;
}

export interface RawServerMember {
  serverId: string;
  user: RawUser;
  joinedAt: number;
  roleIds: string[];
}

export interface RawChannel {
  id: string;
  name: string
  createdById?: string;
  serverId?: string;
  type: number;
  permissions?: number
  createdAt: number
  lastMessagedAt?: number;
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

export interface RawPresence {
  userId: string;
  custom?: string;
  status: number;
}