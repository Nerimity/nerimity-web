import { Socket } from "socket.io-client";
import { batch } from "solid-js";
import { LocalCacheKey, saveCache } from "../../common/localCache";
import { ClientEvents } from "../EventNames";
import useAccount from "../store/useAccount";
import useStore from "../store/useStore";
import { AuthenticatedPayload } from "./connectionEventTypes";
import useVoiceUsers from "../store/useVoiceUsers";
import {
  StorageKeys,
  getStorageObject,
  useCollapsedServerCategories
} from "@/common/localStorage";
import { ProgramWithExtras, electronWindowAPI } from "@/common/Electron";
import { emitActivityStatus } from "../emits/userEmits";
import { localRPC } from "@/common/LocalRPC";
import { reactNativeAPI } from "@/common/ReactNative";
import useChannelProperties from "../store/useChannelProperties";
import { useDiscordActivityTracker } from "@/common/useDiscordActivityTracker";
import { useLastFmActivityTracker } from "@/common/useLastFmActivityTracker";
import { type DisconnectDescription } from "socket.io-client/build/esm/socket";
import { isExperimentEnabled } from "@/common/experiments";
import { decompressObject } from "@/common/zstd";
import { log } from "@/common/logger";

const partial = isExperimentEnabled("WEBSOCKET_PARTIAL_AUTH")();
const zstd = isExperimentEnabled("WEBSOCKET_ZSTD")();

export const onConnect = (socket: Socket, token?: string) => {
  const account = useAccount();
  account.setSocketDetails({
    socketId: socket.id,
    socketConnected: true,
    socketAuthenticated: false
  });
  socket.emit(ClientEvents.AUTHENTICATE, {
    token,
    ...(partial ? { partial: true } : {}),
    ...(zstd ? { compression: "zstd" } : {})
  });
};

export const onDisconnect = (
  reason: string,
  details: DisconnectDescription | undefined
) => {
  log("WebSocket", "Disconnected.", reason, details);

  const account = useAccount();
  const voiceUsers = useVoiceUsers();
  const channelProperties = useChannelProperties();
  account.setSocketDetails({
    socketId: null,
    socketConnected: false,
    socketAuthenticated: false
  });
  channelProperties.staleAll();
  voiceUsers.resetAll();
};

export const onAuthenticateError = (error: { message: string; data: any }) => {
  const account = useAccount();
  account.setSocketDetails({
    socketId: null,
    socketConnected: false,
    socketAuthenticated: false,
    authenticationError: error
  });
};

export const onReconnectAttempt = () => {
  const account = useAccount();
  account.setSocketDetails({
    socketId: null,
    socketConnected: false,
    socketAuthenticated: false
  });
};

electronWindowAPI()?.activityStatusChanged((window) => {
  if (!window) {
    return emitActivityStatus(null);
  }
  const programs = getStorageObject<ProgramWithExtras[]>(
    StorageKeys.PROGRAM_ACTIVITY_STATUS,
    []
  );
  const program = programs.find(
    (program) => program.filename === window?.filename
  );

  if (!program) {
    return emitActivityStatus(null);
  }

  emitActivityStatus({
    action: program.action || "Playing",
    name: program.name,
    startedAt: window.createdAt,
    emoji: program.emoji
  });
});

electronWindowAPI()?.rpcChanged((data) => {
  if (!data) {
    const programs = getStorageObject<ProgramWithExtras[]>(
      StorageKeys.PROGRAM_ACTIVITY_STATUS,
      []
    );
    electronWindowAPI()?.restartActivityStatus(programs);
    return;
  }
  emitActivityStatus({ startedAt: Date.now(), ...data });
});

localRPC.onUpdateRPC = (data) => {
  if (!data) {
    emitActivityStatus(null);
    const programs = getStorageObject<ProgramWithExtras[]>(
      StorageKeys.PROGRAM_ACTIVITY_STATUS,
      []
    );
    electronWindowAPI()?.restartActivityStatus(programs);
  }
  emitActivityStatus({ startedAt: Date.now(), ...data });
};

export const onAuthenticated = (payload: AuthenticatedPayload) => {
  if (payload instanceof ArrayBuffer) {
    const t = performance.now();
    payload = decompressObject<AuthenticatedPayload>(new Uint8Array(payload));
    log("WebSocket", "Decompression took", performance.now() - t, "ms");
  }

  const {
    account,
    servers,
    users,
    channels,
    serverMembers,
    friends,
    inbox,
    mentions,
    serverRoles,
    voiceUsers,
    tickets
  } = useStore();
  log("WebSocket", " Authenticated.");

  reactNativeAPI()?.authenticated(payload.user.id);

  const t0 = performance.now();

  batch(() => {
    users.reset();
    channels.reset();
    serverMembers.reset();

    saveCache(LocalCacheKey.Account, payload.user);

    //emitNotificationDismiss

    account.setUser(payload.user);
    account.setSocketDetails({
      socketConnected: true,
      socketAuthenticated: true,
      lastAuthenticatedAt: Date.now()
    });
    users.set(payload.user);
    tickets.fetchUpdated();

    for (let i = 0; i < payload.serverRoles.length; i++) {
      const role = payload.serverRoles[i];
      serverRoles.set(role.serverId, role);
    }

    for (let i = 0; i < payload.servers.length; i++) {
      const server = payload.servers[i];
      servers.set(server);
    }

    for (let i = 0; i < payload.channels.length; i++) {
      const channel = payload.channels[i];
      channels.set(channel);
    }

    for (let i = 0; i < payload.serverMembers.length; i++) {
      const serverMember = payload.serverMembers[i];
      serverMembers.set(serverMember);
    }

    for (let i = 0; i < payload.inbox.length; i++) {
      const item = payload.inbox[i];
      if (item.lastSeen) {
        channels.get(item.channelId)?.updateLastSeen(item.lastSeen);
      }
      inbox.set(item);
    }

    for (let i = 0; i < payload.friends.length; i++) {
      const friend = payload.friends[i];
      friends.set(friend);
    }

    for (let i = 0; i < payload.presences.length; i++) {
      const presence = payload.presences[i]!;
      users.setPresence(presence.userId, presence);
    }

    for (let i = 0; i < payload.notificationSettings.length; i++) {
      const notificationSetting = payload.notificationSettings[i]!;
      account.setNotificationSettings(
        notificationSetting.channelId || notificationSetting.serverId!,
        notificationSetting
      );
    }

    for (const channelId in payload.lastSeenServerChannelIds) {
      const timestamp = payload.lastSeenServerChannelIds[channelId];
      channels.get(channelId)?.updateLastSeen(timestamp);
    }

    for (let i = 0; i < payload.messageMentions.length; i++) {
      const mention = payload.messageMentions[i];
      const channel = channels.get(mention.channelId);

      if (!mention.serverId) {
        channel?.updateLastSeen(mention.createdAt);
      }

      const user = users.get(mention.mentionedById);
      if (!user) {
        users.set(mention.mentionedBy);
      }

      mentions.set({
        channelId: mention.channelId,
        userId: mention.mentionedById,
        count: mention.count,
        serverId: mention.serverId
      });
    }

    const previousVoiceUserChannelId = voiceUsers.currentUser()?.channelId;
    for (let i = 0; i < payload.voiceChannelUsers.length; i++) {
      const voiceChannelUser = payload.voiceChannelUsers[i]!;
      voiceUsers.createVoiceUser(
        voiceChannelUser,
        !!previousVoiceUserChannelId
      );
    }
  });

  const t1 = performance.now();
  log("WebSocket", `${t1 - t0} milliseconds.`);

  const programs = getStorageObject<ProgramWithExtras[]>(
    StorageKeys.PROGRAM_ACTIVITY_STATUS,
    []
  );
  electronWindowAPI()?.restartActivityStatus(programs);

  electronWindowAPI()?.restartRPCServer();
  localRPC.start();
  useDiscordActivityTracker().restart();
  useLastFmActivityTracker().restart();

  const [collapsedCategories, setCollapsedServerCategories] =
    useCollapsedServerCategories();
  const newCollapsedCategories = [...collapsedCategories()].filter((id) => {
    const exists = channels.get(id);
    return exists;
  });
  setCollapsedServerCategories(newCollapsedCategories);

  const previousVoiceUserChannelId = voiceUsers.currentUser()?.channelId;

  if (previousVoiceUserChannelId) {
    channels.get(previousVoiceUserChannelId)?.joinCall(true);
  }
};
