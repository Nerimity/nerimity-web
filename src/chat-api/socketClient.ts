import io from 'socket.io-client';
import env from '../common/env';
import { ClientEvents, ServerEvents } from './EventNames';
import { onAuthenticated } from './events/connectionEvents';


const socket = io(env.SERVER_URL, { transports: ['websocket'], autoConnect: false});

let token: undefined | string;

export default {
  login: (newToken?: string) => {
    token = newToken;
    socket.connect()
  }
}


socket.on("connect", () => {
  socket.emit(ClientEvents.AUTHENTICATE, {token});
})

socket.on(ServerEvents.USER_AUTHENTICATED, onAuthenticated);