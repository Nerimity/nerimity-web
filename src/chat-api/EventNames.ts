export const ClientEvents = {
  AUTHENTICATE: 'user:authenticate',
  NOTIFICATION_DISMISS: 'notification:dismiss',
}

export const ServerEvents = {
  CONNECT: 'connect',
  USER_AUTHENTICATED: 'user:authenticated',

  USER_PRESENCE_UPDATE: 'user:presence_update',

  FRIEND_REQUEST_SENT: 'friend:request_sent',
  FRIEND_REQUEST_PENDING: 'friend:request_pending',
  FRIEND_REQUEST_ACCEPTED: 'friend:request_accepted',
  FRIEND_REMOVED: 'friend:removed',
  INBOX_OPENED: 'inbox:opened',
  NOTIFICATION_DISMISSED: 'notification:dismissed',

  SERVER_JOINED: 'server:joined',
  SERVER_UPDATED: 'server:updated',
  SERVER_MEMBER_JOINED: 'server:member_joined',
  SERVER_CHANNEL_CREATED: 'server:channel_created',


  MESSAGE_CREATED: 'message:created',
  MESSAGE_DELETED: 'message:deleted',
}