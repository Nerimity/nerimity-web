import { runWithContext } from "@/common/runWithContext";
import { useNavigate, useParams } from "@solidjs/router";
import { batch } from "solid-js";
import { RawChannel, RawServer, RawServerMember } from "../RawData";
import useChannels from "../store/useChannels";
import useServerMembers from "../store/useServerMembers";
import useServers from "../store/useServers";
import useTabs from "../store/useTabs";

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

export const onServerLeft = (payload: {serverId: string}) => runWithContext(() => {
  const serverMembers = useServerMembers();
  const servers = useServers();
  const channels = useChannels();


  batch(() => {
    servers.remove(payload.serverId);
    serverMembers.removeAllServerMembers(payload.serverId);
    channels.removeAllServerChannels(payload.serverId);
  })
});



interface ServerMemberJoinedPayload {
  serverId: string;
  member: RawServerMember;
}


export const onServerMemberJoined = (payload: ServerMemberJoinedPayload) => {
  const serverMembers = useServerMembers();
  serverMembers.set(payload.member);
}
interface ServerUpdated {
  serverId: string;
  updated: {
    name?: string;
    defaultChannelId: string;
  }
}


export const onServerMemberLeft = (payload: {userId: string, serverId: string}) => {
  const serverMembers = useServerMembers();
  serverMembers.remove(payload.serverId, payload.userId);
}



export const onServerUpdated = (payload: ServerUpdated) => {
  const servers = useServers();
  const server = servers.get(payload.serverId);
  server?.update(payload.updated);
}


interface ServerChannelCreated {
  serverId: string;
  channel: RawChannel;
}

export const onServerChannelCreated = (payload: ServerChannelCreated) => {
  const channels = useChannels();
  channels.set(payload.channel);
}

interface ServerChannelUpdated {
  serverId: string;
  channelId: string;
  updated: {
    name?: string;
  }
}


export const onServerChannelUpdated = (payload: ServerChannelUpdated) => {
  const channels = useChannels();
  const channel = channels.get(payload.channelId);
  channel?.update(payload.updated);
}

interface ServerChannelDeleted {
  serverId: string;
  channelId: string;
}

export const onServerChannelDeleted = (payload: ServerChannelDeleted) => {
  const channels = useChannels();

  channels.deleteChannel(payload.channelId, payload.serverId);
};