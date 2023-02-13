import { getStorageBoolean, StorageKeys } from "./localStorage";
import { useWindowProperties } from "./useWindowProperties";

export const MESSAGE_NOTIFICATION = "message-notification.mp3";

export function playSound(name: string) {
  const audio = new Audio(`/assets/${name}`);
  audio.volume = 0.3;
  audio.play();
}



export function playMessageNotification() {
  if (getStorageBoolean(StorageKeys.ARE_NOTIFICATIONS_MUTED, false)) return;
  playSound(MESSAGE_NOTIFICATION);
}