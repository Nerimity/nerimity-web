import useAccount from "@/chat-api/store/useAccount";
import { getStorageBoolean, StorageKeys } from "./localStorage";
import { useWindowProperties } from "./useWindowProperties";
import useStore from "@/chat-api/store/useStore";
import { UserStatus } from "@/chat-api/store/useUsers";
export const MESSAGE_NOTIFICATION = "message-notification.mp3";

export function playSound(name: string) {
  const audio = new Audio(`/assets/${name}`);
  audio.volume = 0.2;
  audio.play();
}



export function playMessageNotification() {
  const {account, users} = useStore();
  if (getStorageBoolean(StorageKeys.ARE_NOTIFICATIONS_MUTED, false)) return;
  const userId = account.user()?.id;
  const user = users.get(userId!);
  if (user?.presence?.status === UserStatus.DND) return;

  playSound(MESSAGE_NOTIFICATION);
}