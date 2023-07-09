import SimplePeer from "simple-peer";
import { ClientEvents } from "../EventNames";
import socketClient from "../socketClient";

export function emitVoiceSignal(channelId: string, toUserId: string, signal: SimplePeer.SignalData) {
  socketClient.socket.emit(ClientEvents.VOICE_SIGNAL_SEND, { channelId, toUserId, signal });
}