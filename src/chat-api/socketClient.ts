import io from 'socket.io-client';
import env from '../common/env';
import { ServerEvents } from './EventNames';
import { onAuthenticated, onAuthenticateError, onConnect, onDisconnect, onReconnectAttempt } from './events/connectionEvents';
import { onFriendRemoved, onFriendRequestAccepted, onFriendRequestPending, onFriendRequestSent } from './events/friendEvents';
import { onInboxOpened } from './events/inboxEvents';
import { onMessageCreated, onMessageDeleted } from './events/messageEvents';
import { onServerChannelCreated, onServerChannelDeleted, onServerChannelUpdated, onServerJoined, onServerLeft, onServerMemberJoined, onServerMemberLeft, onServerMemberUpdated, onServerRoleCreated, onServerRoleUpdated, onServerUpdated } from './events/serverEvents';
import { onNotificationDismissed, onUserPresenceUpdate } from './events/userEvents';


const socket = io(env.SERVER_URL, { transports: ['websocket'], autoConnect: false});

let token: undefined | string;

export default {
  login: (newToken?: string) => {
    token = newToken;
    socket.connect()
  },
  id: () => socket.id,
  socket
}


socket.io.on("reconnect_attempt", onReconnectAttempt)


socket.on(ServerEvents.CONNECT, () => onConnect(socket, token))

socket.on(ServerEvents.AUTHENTICATE_ERROR, onAuthenticateError)

socket.on("disconnect", onDisconnect)

socket.on(ServerEvents.USER_AUTHENTICATED, onAuthenticated);


socket.on(ServerEvents.USER_PRESENCE_UPDATE, onUserPresenceUpdate)

socket.on(ServerEvents.FRIEND_REQUEST_SENT, onFriendRequestSent)
socket.on(ServerEvents.FRIEND_REQUEST_PENDING, onFriendRequestPending)
socket.on(ServerEvents.FRIEND_REQUEST_ACCEPTED, onFriendRequestAccepted)
socket.on(ServerEvents.FRIEND_REMOVED, onFriendRemoved)

socket.on(ServerEvents.INBOX_OPENED, onInboxOpened)
socket.on(ServerEvents.NOTIFICATION_DISMISSED, onNotificationDismissed)

socket.on(ServerEvents.MESSAGE_CREATED, onMessageCreated);
socket.on(ServerEvents.MESSAGE_DELETED, onMessageDeleted);


socket.on(ServerEvents.SERVER_JOINED, onServerJoined)
socket.on(ServerEvents.SERVER_LEFT, onServerLeft)
socket.on(ServerEvents.SERVER_UPDATED, onServerUpdated)

socket.on(ServerEvents.SERVER_ROLE_CREATED, onServerRoleCreated)
socket.on(ServerEvents.SERVER_ROLE_UPDATED, onServerRoleUpdated)

socket.on(ServerEvents.SERVER_MEMBER_JOINED, onServerMemberJoined)
socket.on(ServerEvents.SERVER_MEMBER_LEFT, onServerMemberLeft)
socket.on(ServerEvents.SERVER_MEMBER_UPDATED, onServerMemberUpdated)

socket.on(ServerEvents.SERVER_CHANNEL_CREATED, onServerChannelCreated)
socket.on(ServerEvents.SERVER_CHANNEL_UPDATED, onServerChannelUpdated)
socket.on(ServerEvents.SERVER_CHANNEL_DELETED, onServerChannelDeleted)