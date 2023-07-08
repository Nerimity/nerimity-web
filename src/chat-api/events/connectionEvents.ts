import { Socket } from "socket.io-client";
import { batch } from "solid-js";
import { LocalCacheKey, saveCache } from "../../common/localCache";
import { ClientEvents } from "../EventNames";
import useAccount from "../store/useAccount";
import useStore from "../store/useStore";
import { AuthenticatedPayload } from "./connectionEventTypes";


export const onConnect = (socket: Socket, token?: string) => {
  const account = useAccount();
  account.setSocketDetails({
    socketId: socket.id,
    socketConnected: true,
    socketAuthenticated: false
  })
  socket.emit(ClientEvents.AUTHENTICATE, { token });
}

export const onDisconnect = () => {
  const account = useAccount();
  account.setSocketDetails({
    socketId: null,
    socketConnected: false,
    socketAuthenticated: false
  })
}

export const onAuthenticateError = (error: { message: string, data: any }) => {
  const account = useAccount();
  account.setSocketDetails({
    socketId: null,
    socketConnected: false,
    socketAuthenticated: false,
    authenticationError: error,
  })
}

export const onReconnectAttempt = () => {
  const account = useAccount();
  account.setSocketDetails({
    socketId: null,
    socketConnected: false,
    socketAuthenticated: false
  })
}




export const onAuthenticated = (payload: AuthenticatedPayload) => {
  const { account, servers, users, channels, serverMembers, friends, inbox, mentions, serverRoles, voiceUsers } = useStore();
  console.log('[WS] Authenticated.');

  saveCache(LocalCacheKey.Account, payload.user);


  //emitNotificationDismiss

  account.setUser(payload.user);
  account.setSocketDetails({
    socketConnected: true,
    socketAuthenticated: true
  })
  users.set(payload.user)

  batch(() => {
    for (let i = 0; i < payload.serverRoles.length; i++) {
      const role = payload.serverRoles[i];
      serverRoles.set(role.serverId, role);
    }
  });

  batch(() => {
    for (let i = 0; i < payload.servers.length; i++) {
      const server = payload.servers[i];
      servers.set(server);
    }
  })

  batch(() => {
    for (let i = 0; i < payload.channels.length; i++) {
      const channel = payload.channels[i];
      channels.set(channel);
    }
  });

  batch(() => {
    for (let i = 0; i < payload.serverMembers.length; i++) {
      const serverMember = payload.serverMembers[i];
      serverMembers.set(serverMember);
    }
  })

  for (let i = 0; i < payload.inbox.length; i++) {
    const item = payload.inbox[i];
    if (item.lastSeen) {
      channels.get(item.channelId)!.updateLastSeen(item.lastSeen);
    }
    inbox.set(item);
  }

  for (let i = 0; i < payload.friends.length; i++) {
    const friend = payload.friends[i];
    friends.set(friend);
  }

  batch(() => {
    for (let i = 0; i < payload.presences.length; i++) {
      const presence = payload.presences[i];
      users.setPresence(presence.userId, presence);
    }
  })

  batch(() => {
    for (let i = 0; i < payload.serverSettings.length; i++) {
      const serverSetting = payload.serverSettings[i];
      account.setServerSettings(serverSetting.serverId, serverSetting);
    }
  })

  batch(() => {
    for (let channelId in payload.lastSeenServerChannelIds) {
      const timestamp = payload.lastSeenServerChannelIds[channelId];
      channels.get(channelId)!.updateLastSeen(timestamp);
    }
  })

  for (let i = 0; i < payload.messageMentions.length; i++) {
    const mention = payload.messageMentions[i];
    const channel = channels.get(mention.channelId);
    batch(() => {
      if (!mention.serverId) {
        channel?.updateLastSeen(mention.createdAt)
      }

      const user = users.get(mention.mentionedById);
      if (!user) {
        users.set(mention.mentionedBy);
      }

      mentions.set({
        channelId: mention.channelId,
        userId: mention.mentionedById,
        count: mention.count,
        serverId: mention.serverId,
      });

    })
  }

  batch(() => {
    for (let i = 0; i < payload.voiceChannelUsers.length; i++) {
      const voiceChannelUser = payload.voiceChannelUsers[i];
      voiceUsers.set(voiceChannelUser);      
    }
  })
}