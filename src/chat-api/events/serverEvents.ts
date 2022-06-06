import { RawChannel, RawServer, RawServerMember } from "../RawData";
import useChannels from "../store/useChannels";
import useServerMembers from "../store/useServerMembers";
import useServers from "../store/useServers";
import useUsers from "../store/useUsers";
interface ServerJoinedPayload {
  server: RawServer,
  members: RawServerMember[],
  channels: RawChannel[],
}


const serverMembers = useServerMembers();
const servers = useServers();
const channels = useChannels();

export const onServerJoined = (payload: ServerJoinedPayload) => {


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
  console.log(payload.member)
  serverMembers.set(payload.member);
}