import { RawChannel, RawFriend, RawInboxWithoutChannel, RawServer, RawServerMember } from '../RawData';

export interface AuthenticatedPayload {
  user: SelfUser;
  servers: RawServer[];
  serverMembers: RawServerMember[];
  messageMentions: MessageMention[]
  channels: RawChannel[];
  presences: Presence[];
  friends: RawFriend[];
  inbox: RawInboxWithoutChannel[];
  lastSeenServerChannelIds: Record<string, number>; // { [channelId]: timestamp }
}

interface MessageMention {
  mentionedById: string;
  count: number;
  serverId?: string;
  channelId: string
  createdAt: number;
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