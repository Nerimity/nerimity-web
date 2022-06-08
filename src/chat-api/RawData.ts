export interface RawServer {
  _id: string;
  name: string;
  hexColor: string;
  defaultChannel: string;
  createdBy: string;
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
  _id: string;
  channel: string;
  content?: string;
  createdBy: RawUser;
  type: MessageType;
  createdAt: number;
  editedAt?: number;
}

export interface RawUser {
  _id: string;
  avatar?: string;
  username: string;
  hexColor: string;
  tag: string;
  joinedAt?: number;
}

export interface RawServerMember {
  server: string;
  user: RawUser;
  joinedAt: number;
}

export interface RawChannel {
  name: string
  _id: string;
  createdBy: string;
  server?: string;
  type: number;
  createdAt: number
  recipients?: RawUser[];
}

export enum FriendStatus {
  SENT = 0,
  PENDING = 1,
  FRIENDS = 2,
}

export interface RawFriend {
  status: FriendStatus,
  createdAt: number
  user: string;
  recipient: RawUser;
}
export interface RawInboxWithoutChannel {
  _id: string;
  createdAt: number;
  user: string;
  channel: string;
  closed: boolean
}