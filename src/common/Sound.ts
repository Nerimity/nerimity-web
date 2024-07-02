import { getStorageBoolean, getStorageNumber, getStorageObject, StorageKeys } from "./localStorage";
import useStore from "@/chat-api/store/useStore";
import { UserStatus } from "@/chat-api/store/useUsers";
import { RawMessage, ServerNotificationSoundMode } from "@/chat-api/RawData";
import { ROLE_PERMISSIONS } from "@/chat-api/Bitwise";

export const Sounds = [
  "nerimity-mute",
  "default",
  "a-sudden-appearance",
  "button",
  "ding",
  "infographic-pop",
  "jug-pop",
  "level-up",
  "marimba-bloop",
  "message",
  "minimal-pop",
  "multi-pop",
  "music-box",
  "plinkaphone",
  "soft-notice",
  "start",
  "system-notification",
  "the-notification-email"
] as const;



const audio = new Audio();
export function playSound(name: typeof Sounds[number] = "default") {
  if (name === "nerimity-mute") return;
  audio.src = `/assets/sounds/${name}.mp3`;
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
  if (opts?.force) return playSound(getCustomSound("MESSAGE"));
  if (getStorageBoolean(StorageKeys.ARE_NOTIFICATIONS_MUTED, false)) return;
  const {account, users, serverMembers} = useStore();
  const userId = account.user()?.id;
  const user = users.get(userId!);
  if (user?.presence()?.status === UserStatus.DND) return;

  const notificationSoundMode = !opts?.serverId ? undefined : account.getCombinedNotificationSettings(opts.serverId, opts.message?.channelId)?.notificationSoundMode;

  if (notificationSoundMode === ServerNotificationSoundMode.MUTE) return;
  
  if (opts?.message) {
    const mentionedMe = opts.message.mentions?.find(m => m.id === account.user()?.id);
    if (mentionedMe) {
      return playSound(getCustomSound("MESSAGE_MENTION"));
    }

    const quoteMention = opts.message.quotedMessages?.find(m => m.createdBy?.id === userId);

    const replyMention = opts.message.mentionReplies && opts.message.replyMessages.find(m => m.replyToMessage?.createdBy?.id === userId);

    if (quoteMention || replyMention) {
      return playSound(getCustomSound("MESSAGE_MENTION"));
    }

    
    const everyoneMentioned = opts.message.content?.includes("[@:e]");
    if (everyoneMentioned && opts.serverId) {
      const member = serverMembers.get(opts.serverId, opts.message.createdBy.id);
      const hasPerm = member?.isServerCreator() || member?.hasPermission(ROLE_PERMISSIONS.MENTION_EVERYONE);
      if (hasPerm) {
        return playSound(getCustomSound("MESSAGE_MENTION"));
      }
    }
  }
  
  if (notificationSoundMode === ServerNotificationSoundMode.MENTIONS_ONLY) return;

  playSound(getCustomSound("MESSAGE"));
}

function getCustomSound (type: "MESSAGE" | "MESSAGE_MENTION") {
  const storage = getStorageObject<{[key: string]: typeof Sounds[number] | undefined}>(StorageKeys.NOTIFICATION_SOUNDS, {});
  return storage[type];
}