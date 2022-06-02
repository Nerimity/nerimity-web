export const ClientEvents = {
  AUTHENTICATE: 'user:authenticate'
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

  SERVER_JOINED: 'server:joined',
  SERVER_MEMBER_JOINED: 'server:member_joined',

  MESSAGE_CREATED: 'message:created',
  MESSAGE_DELETED: 'message:deleted',
}