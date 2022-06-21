import { RawChannel, RawServer, RawServerMember } from "../RawData";
import useChannels from "../store/useChannels";
import useServerMembers from "../store/useServerMembers";
import useServers from "../store/useServers";

interface ServerJoinedPayload {
  server: RawServer,
  members: RawServerMember[],
  channels: RawChannel[],
}



export const onServerJoined = (payload: ServerJoinedPayload) => {
  const serverMembers = useServerMembers();
  const servers = useServers();
  const channels = useChannels();


  servers.set(payload.server);

  for (let index = 0; index < payload.channels.length; index++) {
    const channel = payload.channels[index];
    channels.set(channel);
  }

  for (let i = 0; i < payload.members.length; i++) {
    const serverMember = payload.members[i];
    serverMembers.set(serverMember);
  }
}



interface ServerMemberJoinedPayload {
  serverId: string;
  member: RawServerMember;
}


export const onServerMemberJoined = (payload: ServerMemberJoinedPayload) => {
  const serverMembers = useServerMembers();
  serverMembers.set(payload.member);
}