import io from 'socket.io-client';
import env from '../common/env';
import { ClientEvents, ServerEvents } from './EventNames';
import { onAuthenticated } from './events/connectionEvents';
import { onMessageCreated, onMessageDeleted } from './events/messageEvents';


const socket = io(env.SERVER_URL, { transports: ['websocket'], autoConnect: false});

let token: undefined | string;

export default {
  login: (newToken?: string) => {
    token = newToken;
    socket.connect()
  },
  id: () => socket.id,
}


socket.on("connect", () => {
  socket.emit(ClientEvents.AUTHENTICATE, {token});
})

socket.on(ServerEvents.USER_AUTHENTICATED, onAuthenticated);
socket.on(ServerEvents.MESSAGE_CREATED, onMessageCreated);
socket.on(ServerEvents.MESSAGE_DELETED, onMessageDeleted);