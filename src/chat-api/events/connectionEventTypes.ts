import { RawChannel, RawFriend, RawInboxWithoutChannel, RawPresence, RawServer, RawServerMember, RawServerRole, RawUser } from '../RawData';

export interface AuthenticatedPayload {
  user: SelfUser;
  servers: RawServer[];
  serverMembers: RawServerMember[];
  messageMentions: MessageMention[]
  channels: RawChannel[];
  serverRoles: RawServerRole[];
  presences: RawPresence[];
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




interface SelfUser {
  id: string;
  username: string;
  hexColor: string;
  avatar?: string;
  tag: string;
}