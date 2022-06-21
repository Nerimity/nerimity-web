import { ClientEvents } from "../EventNames";
import socketClient from "../socketClient";

export function dismissChannelNotification(channelId: string) {
  socketClient.socket.emit(ClientEvents.NOTIFICATION_DISMISS, { channelId });
}