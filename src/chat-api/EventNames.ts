export const ClientEvents = {
  AUTHENTICATE: "user:authenticate",
  NOTIFICATION_DISMISS: "notification:dismiss",

  VOICE_SIGNAL_SEND: "voice:signal_send",
  UPDATE_ACTIVITY: "user:update_activity",
};

export const ServerEvents = {
  CONNECT: "connect",
  AUTHENTICATE_ERROR: "user:authenticate_error",
  USER_UPDATED_SELF: "user:updatedSelf",
  USER_UPDATED: "user:updated",
  USER_NOTICE_CREATED: "user:notice_created",

  USER_CONNECTION_ADDED: "user:connection_added",
  USER_CONNECTION_REMOVED: "user:connection_removed",

  USER_NOTIFICATION_SETTINGS_UPDATE: "user:notification_settings_update",

  USER_AUTH_QUEUE_POSITION: "user:auth_queue_position",
  USER_AUTHENTICATED: "user:authenticated",

  USER_PRESENCE_UPDATE: "user:presence_update",

  USER_BLOCKED: "user:blocked",
  USER_UNBLOCKED: "user:unblocked",

  USER_REMINDER_ADD: "user:reminder_add",
  USER_REMINDER_REMOVE: "user:reminder_remove",

  FRIEND_REQUEST_SENT: "friend:request_sent",
  FRIEND_REQUEST_PENDING: "friend:request_pending",
  FRIEND_REQUEST_ACCEPTED: "friend:request_accepted",
  FRIEND_REMOVED: "friend:removed",
  INBOX_OPENED: "inbox:opened",
  INBOX_CLOSED: "inbox:closed",
  NOTIFICATION_DISMISSED: "notification:dismissed",

  SERVER_JOINED: "server:joined",
  SERVER_LEFT: "server:left",
  SERVER_UPDATED: "server:updated",
  SERVER_ROLE_CREATED: "server:role_created",
  SERVER_ROLE_UPDATED: "server:role_updated",
  SERVER_ROLE_ORDER_UPDATED: "server:role_order_updated",
  SERVER_CHANNEL_ORDER_UPDATED: "server:channel_order_updated",

  SERVER_ROLE_DELETED: "server:role_deleted",

  SERVER_MEMBER_JOINED: "server:member_joined",
  SERVER_MEMBER_LEFT: "server:member_left",
  SERVER_MEMBER_UPDATED: "server:member_updated",
  SERVER_CHANNEL_CREATED: "server:channel_created",
  SERVER_CHANNEL_UPDATED: "server:channel_updated",
  SERVER_CHANNEL_DELETED: "server:channel_deleted",
  SERVER_ORDER_UPDATED: "server:order_updated",
  SERVER_CHANNEL_PERMISSIONS_UPDATED: "server:channel_permissions_updated",

  SERVER_EMOJI_ADD: "server:emoji_add",
  SERVER_EMOJI_REMOVE: "server:emoji_remove",
  SERVER_EMOJI_UPDATE: "server:emoji_update",

  SERVER_SCHEDULE_DELETE: "server:schedule_delete",
  SERVER_REMOVE_SCHEDULE_DELETE: "server:remove_schedule_delete",

  CHANNEL_TYPING: "channel:typing",
  MESSAGE_CREATED: "message:created",
  MESSAGE_UPDATED: "message:updated",
  MESSAGE_DELETED: "message:deleted",
  MESSAGE_DELETED_BATCH: "message:deleted_batch",
  MESSAGE_MARK_UNREAD: "message:mark_unread",

  MESSAGE_REACTION_ADDED: "message:reaction_added",
  MESSAGE_REACTION_REMOVED: "message:reaction_removed",

  MESSAGE_BUTTON_CLICKED_CALLBACK: "message:button_clicked_callback",

  VOICE_USER_JOINED: "voice:user_joined",
  VOICE_USER_LEFT: "voice:user_left",
  VOICE_SIGNAL_RECEIVED: "voice:signal_received",
} as const;
