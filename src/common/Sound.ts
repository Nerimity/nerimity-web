import useAccount from "@/chat-api/store/useAccount";
import { getStorageBoolean, getStorageNumber, StorageKeys } from "./localStorage";
import { useWindowProperties } from "./useWindowProperties";
import useStore from "@/chat-api/store/useStore";
import { UserStatus } from "@/chat-api/store/useUsers";
export const MESSAGE_NOTIFICATION = "message-notification.mp3";

export function playSound(name: string) {
  const audio = new Audio(`/assets/${name}`);
  audio.volume = getStorageNumber(StorageKeys.NOTIFICATION_VOLUME, 20) / 100;
  audio.play();
}



export function playMessageNotification(force = false) {
  if (force) return playSound(MESSAGE_NOTIFICATION);
  const {account, users} = useStore();
  if (getStorageBoolean(StorageKeys.ARE_NOTIFICATIONS_MUTED, false)) return;
  const userId = account.user()?.id;
  const user = users.get(userId!);
  if (user?.presence?.status === UserStatus.DND) return;

  playSound(MESSAGE_NOTIFICATION);
}