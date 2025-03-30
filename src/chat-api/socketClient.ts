import io from "socket.io-client";
import env from "../common/env";
import { ServerEvents } from "./EventNames";
import {
  onAuthenticated,
  onAuthenticateError,
  onConnect,
  onDisconnect,
  onReconnectAttempt,
} from "./events/connectionEvents";
import {
  onFriendRemoved,
  onFriendRequestAccepted,
  onFriendRequestPending,
  onFriendRequestSent,
} from "./events/friendEvents";
import { onInboxClosed, onInboxOpened } from "./events/inboxEvents";
import {
  onMessageCreated,
  onMessageDeleted,
  onMessageDeletedBatch,
  onMessageMarkUnread,
  onMessageReactionAdded,
  onMessageReactionRemoved,
  onMessageUpdated,
} from "./events/messageEvents";
import {
  onServerChannelCreated,
  onServerChannelDeleted,
  onServerChannelOrderUpdated,
  onServerChannelPermissionsUpdated,
  onServerChannelUpdated,
  onServerEmojiAdd,
  onServerEmojiRemove,
  onServerEmojiUpdate,
  onServerJoined,
  onServerLeft,
  onServerMemberJoined,
  onServerMemberLeft,
  onServerMemberUpdated,
  onServerOrderUpdated,
  onServerRemoveScheduleDelete,
  onServerRoleCreated,
  onServerRoleDeleted,
  onServerRoleOrderUpdated,
  onServerRoleUpdated,
  onServerScheduleDelete,
  onServerUpdated,
} from "./events/serverEvents";
import {
  onNotificationDismissed,
  onUserBlocked,
  onUserConnectionAdded,
  onUserConnectionRemoved,
  onUserNoticeUpdated,
  onUserNotificationSettingsUpdate,
  onUserPresenceUpdate,
  onUserReminderAdd,
  onUserReminderRemove,
  onUserUnblocked,
  onUserUpdated,
  onUserUpdatedSelf,
} from "./events/userEvents";
import { onCleanup, onMount } from "solid-js";
import {
  onVoiceSignalReceived,
  onVoiceUserJoined,
  onVoiceUserLeft,
} from "./events/voiceEvents";

const socket = io(env.WS_URL || env.SERVER_URL, {
  transports: ["websocket"],
  autoConnect: false,
});

let token: undefined | string;

type ValueOf<T> = T[keyof T];

export default {
  login: (newToken?: string) => {
    token = newToken;
    socket.connect();
  },
  updateToken(newToken: string) {
    token = newToken;
  },
  id: () => socket.id,
  socket,

  useSocketOn: (name: ValueOf<typeof ServerEvents>, event: any) => {
    onMount(() => {
      socket.on(name, event);
      onCleanup(() => {
        socket.off(name, event);
      });
    });
  },
};

socket.io.on("reconnect_attempt", onReconnectAttempt);

socket.on(ServerEvents.CONNECT, () => onConnect(socket, token));
socket.on(ServerEvents.AUTHENTICATE_ERROR, onAuthenticateError);
socket.on("disconnect", onDisconnect);
socket.on(ServerEvents.USER_AUTHENTICATED, onAuthenticated);
socket.on(ServerEvents.USER_UPDATED_SELF, onUserUpdatedSelf);
socket.on(ServerEvents.USER_UPDATED, onUserUpdated);
socket.on(
  ServerEvents.USER_NOTIFICATION_SETTINGS_UPDATE,
  onUserNotificationSettingsUpdate
);
socket.on(ServerEvents.USER_NOTICE_CREATED, onUserNoticeUpdated);

socket.on(ServerEvents.USER_CONNECTION_ADDED, onUserConnectionAdded);
socket.on(ServerEvents.USER_CONNECTION_REMOVED, onUserConnectionRemoved);

socket.on(ServerEvents.USER_BLOCKED, onUserBlocked);
socket.on(ServerEvents.USER_UNBLOCKED, onUserUnblocked);

socket.on(ServerEvents.USER_PRESENCE_UPDATE, onUserPresenceUpdate);

socket.on(ServerEvents.USER_REMINDER_ADD, onUserReminderAdd);
socket.on(ServerEvents.USER_REMINDER_REMOVE, onUserReminderRemove);

socket.on(ServerEvents.FRIEND_REQUEST_SENT, onFriendRequestSent);
socket.on(ServerEvents.FRIEND_REQUEST_PENDING, onFriendRequestPending);
socket.on(ServerEvents.FRIEND_REQUEST_ACCEPTED, onFriendRequestAccepted);
socket.on(ServerEvents.FRIEND_REMOVED, onFriendRemoved);

socket.on(ServerEvents.INBOX_OPENED, onInboxOpened);
socket.on(ServerEvents.INBOX_CLOSED, onInboxClosed);
socket.on(ServerEvents.NOTIFICATION_DISMISSED, onNotificationDismissed);

socket.on(ServerEvents.MESSAGE_CREATED, onMessageCreated);
socket.on(ServerEvents.MESSAGE_UPDATED, onMessageUpdated);
socket.on(ServerEvents.MESSAGE_MARK_UNREAD, onMessageMarkUnread);
socket.on(ServerEvents.MESSAGE_DELETED, onMessageDeleted);
socket.on(ServerEvents.MESSAGE_DELETED_BATCH, onMessageDeletedBatch);

socket.on(ServerEvents.SERVER_JOINED, onServerJoined);
socket.on(ServerEvents.SERVER_LEFT, onServerLeft);
socket.on(ServerEvents.SERVER_UPDATED, onServerUpdated);
socket.on(ServerEvents.SERVER_ORDER_UPDATED, onServerOrderUpdated);
socket.on(ServerEvents.SERVER_ROLE_ORDER_UPDATED, onServerRoleOrderUpdated);
socket.on(
  ServerEvents.SERVER_CHANNEL_ORDER_UPDATED,
  onServerChannelOrderUpdated
);
socket.on(
  ServerEvents.SERVER_CHANNEL_PERMISSIONS_UPDATED,
  onServerChannelPermissionsUpdated
);

socket.on(ServerEvents.SERVER_ROLE_CREATED, onServerRoleCreated);
socket.on(ServerEvents.SERVER_ROLE_UPDATED, onServerRoleUpdated);
socket.on(ServerEvents.SERVER_ROLE_DELETED, onServerRoleDeleted);

socket.on(ServerEvents.SERVER_MEMBER_JOINED, onServerMemberJoined);
socket.on(ServerEvents.SERVER_MEMBER_LEFT, onServerMemberLeft);
socket.on(ServerEvents.SERVER_MEMBER_UPDATED, onServerMemberUpdated);

socket.on(ServerEvents.SERVER_EMOJI_ADD, onServerEmojiAdd);
socket.on(ServerEvents.SERVER_EMOJI_UPDATE, onServerEmojiUpdate);
socket.on(ServerEvents.SERVER_EMOJI_REMOVE, onServerEmojiRemove);

socket.on(ServerEvents.SERVER_SCHEDULE_DELETE, onServerScheduleDelete);
socket.on(
  ServerEvents.SERVER_REMOVE_SCHEDULE_DELETE,
  onServerRemoveScheduleDelete
);

socket.on(ServerEvents.SERVER_CHANNEL_CREATED, onServerChannelCreated);
socket.on(ServerEvents.SERVER_CHANNEL_UPDATED, onServerChannelUpdated);
socket.on(ServerEvents.SERVER_CHANNEL_DELETED, onServerChannelDeleted);
socket.on(ServerEvents.MESSAGE_REACTION_ADDED, onMessageReactionAdded);
socket.on(ServerEvents.MESSAGE_REACTION_REMOVED, onMessageReactionRemoved);
socket.on(ServerEvents.VOICE_USER_JOINED, onVoiceUserJoined);
socket.on(ServerEvents.VOICE_USER_LEFT, onVoiceUserLeft);
socket.on(ServerEvents.VOICE_SIGNAL_RECEIVED, onVoiceSignalReceived);
