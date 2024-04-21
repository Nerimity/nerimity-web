import useAccount from "@/chat-api/store/useAccount";
import { getStorageBoolean, getStorageNumber, StorageKeys } from "./localStorage";
import { useWindowProperties } from "./useWindowProperties";
import useStore from "@/chat-api/store/useStore";
import { UserStatus } from "@/chat-api/store/useUsers";
import { RawMessage, ServerNotificationSoundMode } from "@/chat-api/RawData";

export const MESSAGE_NOTIFICATION = "message-notification.mp3";
export const MESSAGE_MENTION_NOTIFICATION = "message-notification.mp3";


const audio = new Audio();
export function playSound(name: string) {
  audio.src = `/assets/${name}`;
  audio.volume = getStorageNumber(StorageKeys.NOTIFICATION_VOLUME, 10) / 100;
  audio.load();
  audio.play();
}


interface MessageNotificationOpts {
  force?: boolean
  message?: RawMessage
  serverId?: string;
}

export function playMessageNotification(opts?: MessageNotificationOpts) {
  if (opts?.force) return playSound(MESSAGE_NOTIFICATION);
  if (getStorageBoolean(StorageKeys.ARE_NOTIFICATIONS_MUTED, false)) return;
  const {account, users} = useStore();
  const userId = account.user()?.id;
  const user = users.get(userId!);
  if (user?.presence()?.status === UserStatus.DND) return;

  const notificationSoundMode = !opts?.serverId ? undefined : account.getCombinedNotificationSettings(opts.serverId, opts.message?.channelId)?.notificationSoundMode;

  if (notificationSoundMode === ServerNotificationSoundMode.MUTE) return;
  
  if (opts?.message) {
    const mentionedMe = opts.message.mentions?.find(m => m.id === account.user()?.id);
    if (mentionedMe) {
      return playSound(MESSAGE_MENTION_NOTIFICATION);
    }
  }
  if (notificationSoundMode === ServerNotificationSoundMode.MENTIONS_ONLY) return;

  playSound(MESSAGE_NOTIFICATION);
}