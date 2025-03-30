import { Channel } from "@/chat-api/store/useChannels";
import { Message } from "@/chat-api/store/useMessages";
import useStore from "@/chat-api/store/useStore";
import { StorageKeys, getStorageBoolean } from "./localStorage";
import { MessageType, ServerNotificationPingMode } from "@/chat-api/RawData";
import env from "./env";
import { avatarUrl } from "@/chat-api/store/useUsers";
import { ROLE_PERMISSIONS } from "@/chat-api/Bitwise";
import { getSystemMessage } from "./SystemMessage";
import { t } from "i18next";

export function createDesktopNotification(message: Message) {
  const enabled = getStorageBoolean(
    StorageKeys.ENABLE_DESKTOP_NOTIFICATION,
    false
  );
  if (!enabled) return;
  const { channels, account, serverMembers } = useStore();
  const channel = channels.get(message.channelId);

  const serverId = channel?.serverId;
  const channelId = channel?.id;

  const notificationPing = !serverId
    ? undefined
    : account.getCombinedNotificationSettings(serverId, channelId)
        ?.notificationPingMode;

  if (notificationPing === ServerNotificationPingMode.MUTE) return;

  let showNotification = false;

  if (notificationPing === ServerNotificationPingMode.MENTIONS_ONLY) {
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
        member?.isServerCreator() ||
        member?.hasPermission(ROLE_PERMISSIONS.MENTION_EVERYONE);
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

  const username = member?.nickname || message.createdBy.username;

  if (!body && message.attachments?.length) {
    body = t("desktopNotifications.imageMessage");
  }
  const systemMessage = getSystemMessage(message.type);
  if (systemMessage) {
    body = `${username} ${systemMessage}`;
    title = `${server?.name} #${channel.name}`;
  }

  new Notification(title, {
    body,
    silent: true,
    tag: channel.id,
    renotify: true,

    icon: server?.avatarUrl() || undefined,
  });
}
function createDMDesktopNotification(message: Message) {

  const title = message.createdBy.username;
  let body = message.content;

  if (!body && message.attachments?.length) {
    body = t("desktopNotifications.imageMessage");
  }
  if (message.type === MessageType.CALL_STARTED) {
    body = `${message.createdBy.username}` + t("desktopNotifications.startedCall");
  }

  new Notification(title, {
    body,
    silent: true,
    tag: message.channelId,
    renotify: true,
    icon: avatarUrl(message.createdBy) || undefined,
  });
}
