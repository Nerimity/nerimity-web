import { RawChannel, RawFriend, RawInboxWithoutChannel, RawServer, RawServerMember, RawServerRole, RawUser } from '../RawData';

export interface AuthenticatedPayload {
  user: SelfUser;
  servers: RawServer[];
  serverMembers: RawServerMember[];
  messageMentions: MessageMention[]
  channels: RawChannel[];
  serverRoles: RawServerRole[];
  presences: Presence[];
  friends: RawFriend[];
  inbox: RawInboxWithoutChannel[];
  lastSeenServerChannelIds: Record<string, string>; // { [channelId]: timestamp }
}

interface MessageMention {
  mentionedById: string;
  mentionedBy: RawUser;
  count: number;
  serverId?: string;
  channelId: string
  createdAt: string;
}


interface Presence {
  userId: string;
  custom?: string;
  status: number;
}

interface SelfUser {
  id: string;
  username: string;
  hexColor: string;
  avatar?: string;
  tag: string;
}