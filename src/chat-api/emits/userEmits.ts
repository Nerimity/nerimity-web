import { ClientEvents } from "../EventNames";
import { ActivityStatus } from "../RawData";
import socketClient from "../socketClient";

export function dismissChannelNotification(channelId: string) {
  socketClient.socket.emit(ClientEvents.NOTIFICATION_DISMISS, { channelId });
}

export function emitActivityStatus(activity: ActivityStatus | null) {
  socketClient.socket.emit(ClientEvents.UPDATE_ACTIVITY, activity);
}