import { Channel } from "@/chat-api/store/useChannels";
import { Message } from "@/chat-api/store/useMessages";
import useStore from "@/chat-api/store/useStore";
import { StorageKeys, getStorageBoolean } from "./localStorage";
import {
  MessageType,
  RawMessage,
  ServerNotificationPingMode
} from "@/chat-api/RawData";
import env from "./env";
import { avatarUrl, UserStatus } from "@/chat-api/store/useUsers";
import { ROLE_PERMISSIONS } from "@/chat-api/Bitwise";
import { getSystemMessage } from "./SystemMessage";
import { Trans } from "@nerimity/solid-i18lite";
import { getResource, t } from "@nerimity/i18lite";

export function createDesktopNotification(message: Message) {
  const enabled = getStorageBoolean(
    StorageKeys.ENABLE_DESKTOP_NOTIFICATION,
    false
  );
  if (!enabled) return;
  const { channels, account, users, serverMembers } = useStore();
  const channel = channels.get(message.channelId);

  const user = () => users.get(account.user()?.id!);

  if (user()?.presence()?.status === UserStatus.DND) return;

  const serverId = channel?.serverId;
  const channelId = channel?.id;

  const notificationPing = !serverId
    ? undefined
    : account.getCombinedNotificationSettings(serverId, channelId)
        ?.notificationPingMode;

  if (notificationPing === ServerNotificationPingMode.MUTE) return;

  let showNotification = true;

  if (notificationPing === ServerNotificationPingMode.MENTIONS_ONLY) {
    showNotification = false;
    const mentionedMe = message.mentions?.find(
      (m) => m.id === account.user()?.id
    );
    if (mentionedMe) {
      showNotification = true;
    }

    const everyoneMentioned = message.content?.includes("[@:e]");
    if (!showNotification && everyoneMentioned && serverId) {
      const member = serverMembers.get(serverId, message.createdBy.id);
      const hasPerm =
        serverMembers.isServerCreator(member!) ||
        serverMembers.hasPermission(member!, ROLE_PERMISSIONS.MENTION_EVERYONE);
      if (hasPerm) {
        showNotification = true;
      }
    }
  }
  if (!serverId) {
    showNotification = true;
  }

  if (!showNotification) return;

  if (channel?.serverId)
    return createServerDesktopNotification(message, channel);
  else return createDMDesktopNotification(message);
}

function createServerDesktopNotification(message: Message, channel: Channel) {
  const { servers, serverMembers } = useStore();
  const server = servers.get(channel.serverId!);
  const member = serverMembers.get(server?.id || "", message.createdBy.id);
  let title = `${message.createdBy.username} (${server?.name} #${channel.name})`;
  let body = message.content;

  if (body) {
    body = formatMessage(message);
  }

  const username = member?.nickname || message.createdBy.username;

  if (!body && message.attachments?.length) {
    body = t("message.imageMessage");
  }
  const systemMessage = getSystemMessage(message.type);

  if (systemMessage) {
    const message = t(systemMessage.message)
      .replace("<User/>", username)
      .replace("<2>", "")
      .replace("</2>", "");

    body = message;
    title = `${server?.name} #${channel.name}`;
  }

  new Notification(title, {
    body,
    silent: true,
    tag: channel.id,
    renotify: true,

    icon: server?.avatarUrl() || undefined
  });
}
function createDMDesktopNotification(message: Message) {
  const title = message.createdBy.username;
  let body = message.content;

  if (body) {
    body = formatMessage(message);
  }

  if (!body && message.attachments?.length) {
    body = t("message.imageMessage");
  }
  if (message.type === MessageType.CALL_STARTED) {
    body = `${message.createdBy.username} started a call.`;
  }

  new Notification(title, {
    body,
    silent: true,
    tag: message.channelId,
    renotify: true,
    icon: avatarUrl(message.createdBy) || undefined
  });
}

const UserMentionRegex = /\[@:(.*?)\]/g;
const RoleMentionRegex = /\[r:(.*?)\]/g;
const CustomEmojiRegex = /\[[a]?ce:(.*?):(.*?)\]/g;
const commandRegex = /^(\/[^:\s]*):\d+( .*)?$/m;

function formatMessage(message: RawMessage) {
  const content = message.content;
  if (!content) return;

  const mentionReplace = content.replace(UserMentionRegex, (_, id) => {
    const user = message.mentions?.find((m) => m.id === id);
    return user ? `@${user.username}` : _;
  });

  const roleReplace = mentionReplace.replace(RoleMentionRegex, (_, id) => {
    const role = message.roleMentions?.find((m) => m.id === id);
    return role ? `@${role.name}` : _;
  });

  const cEmojiReplace = roleReplace.replace(CustomEmojiRegex, (_, __, p2) => {
    return `:${p2}:`;
  });

  const commandReplace = cEmojiReplace.replace(commandRegex, "$1$2");

  return commandReplace;
}
