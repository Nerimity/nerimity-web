import {
  getStorageBoolean,
  getStorageNumber,
  getStorageObject,
  StorageKeys
} from "./localStorage";
import useStore from "@/chat-api/store/useStore";
import { UserStatus } from "@/chat-api/store/useUsers";
import { RawMessage, ServerNotificationSoundMode } from "@/chat-api/RawData";
import { ROLE_PERMISSIONS } from "@/chat-api/Bitwise";

export const Sounds = [
  "nerimity-mute",
  "default",
  "default-call-join",
  "default-call-leave",
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
export function playSound(name: (typeof Sounds)[number] = "default") {
  if (name === "nerimity-mute") return;
  audio.src = `/assets/sounds/${name}.mp3`;
  audio.volume = getStorageNumber(StorageKeys.NOTIFICATION_VOLUME, 10) / 100;
  audio.load();
  audio.play();
}

interface MessageNotificationOpts {
  force?: boolean;
  message?: RawMessage;
  serverId?: string;
}

export function playMessageNotification(opts?: MessageNotificationOpts) {
  if (opts?.message?.silent) return;
  if (opts?.force) return playSound(getCustomSound("MESSAGE"));
  if (getStorageBoolean(StorageKeys.ARE_NOTIFICATIONS_MUTED, false)) return;
  const { account, users, serverMembers } = useStore();
  const userId = account.user()?.id;
  const user = users.get(userId!);
  if (user?.presence()?.status === UserStatus.DND) return;

  const notificationSoundMode = !opts?.serverId
    ? undefined
    : account.getCombinedNotificationSettings(
        opts.serverId,
        opts.message?.channelId
      )?.notificationSoundMode;

  if (notificationSoundMode === ServerNotificationSoundMode.MUTE) return;

  if (opts?.message) {
    const mentioned = isMentioned(opts.message, opts.serverId);
    if (mentioned) {
      return playSound(getCustomSound("MESSAGE_MENTION"));
    }
  }

  if (notificationSoundMode === ServerNotificationSoundMode.MENTIONS_ONLY)
    return;

  playSound(getCustomSound("MESSAGE"));
}

const defaults: Record<
  "MESSAGE" | "MESSAGE_MENTION" | "REMINDER" | "CALL_JOIN" | "CALL_LEAVE",
  (typeof Sounds)[number]
> = {
  MESSAGE: "default",
  MESSAGE_MENTION: "default",
  REMINDER: "level-up",
  CALL_JOIN: "default-call-join",
  CALL_LEAVE: "default-call-leave"
};

export function getCustomSound(
  type: "MESSAGE" | "MESSAGE_MENTION" | "REMINDER" | "CALL_JOIN" | "CALL_LEAVE"
) {
  const storage = getStorageObject<{
    [key: string]: (typeof Sounds)[number] | undefined;
  }>(StorageKeys.NOTIFICATION_SOUNDS, {});
  return storage[type] || defaults[type];
}

export function isMentioned(message: RawMessage, serverId?: string) {
  const { account, serverMembers, servers } = useStore();
  const userId = account.user()?.id;

  const member = serverMembers.get(serverId!, message.createdBy.id);
  const selfMember = serverMembers.get(serverId!, userId!);
  const server = servers.get(serverId!);

  const mentionedMe = message.mentions?.find(
    (m) => m.id === account.user()?.id
  );
  if (mentionedMe) {
    return true;
  }

  const quoteMention = message.quotedMessages?.find(
    (m) => m.createdBy?.id === userId
  );

  const replyMention =
    message.mentionReplies &&
    message.replyMessages.find(
      (m) => m.replyToMessage?.createdBy?.id === userId
    );

  const isRoleMentioned =
    serverMembers.hasPermission(selfMember!, ROLE_PERMISSIONS.MENTION_ROLES) &&
    message.roleMentions.find(
      (r) =>
        r.id !== server?.defaultRoleId &&
        serverMembers.hasRole(selfMember!, r.id)
    );

  if (quoteMention || replyMention || isRoleMentioned) {
    return true;
  }

  const everyoneMentioned = message.content?.includes("[@:e]");
  if (everyoneMentioned && serverId) {
    const hasPerm =
      serverMembers.isServerCreator(member!) ||
      serverMembers.hasPermission(member!, ROLE_PERMISSIONS.MENTION_EVERYONE);
    if (hasPerm) {
      return true;
    }
  }
}
