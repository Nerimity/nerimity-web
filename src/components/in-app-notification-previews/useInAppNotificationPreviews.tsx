import { ROLE_PERMISSIONS } from "@/chat-api/Bitwise";
import { ServerNotificationPingMode } from "@/chat-api/RawData";
import { Channel } from "@/chat-api/store/useChannels";
import { Message } from "@/chat-api/store/useMessages";
import useStore from "@/chat-api/store/useStore";
import { isExperimentEnabled } from "@/common/experiments";
import {
  getStorageBoolean,
  getStorageNumber,
  getStorageObject,
  getStorageString,
  StorageKeys,
} from "@/common/localStorage";
import { isMentioned } from "@/common/Sound";
import { createStore } from "solid-js/store";

interface InAppPreviewNotification {
  title: string;
  body: string;
  icon?: string;
  color?: string;
  avatar?: string;
}

const [notifications, setNotifications] = createStore<
  InAppPreviewNotification[]
>([]);

const pushNotification = (notification: InAppPreviewNotification) => {
  setNotifications([...notifications, notification]);
};
const removeNotification = (notification: InAppPreviewNotification) => {
  setNotifications(notifications.filter((n) => n !== notification));
};

const buildMessageNotification = (
  message: Message,
  channel: Channel,
  mentioned: boolean
) => {
  pushNotification({
    title: message.createdBy.username,
    body: message.content || "Attachment",
    color: mentioned ? "var(--alert-color)" : undefined,
  });
};
const inAppNotificationPreviewsEnabled = isExperimentEnabled(
  "IN_APP_NOTIFICATION_PREVIEWS"
);
export const pushMessageNotification = (message: Message) => {
  if (!inAppNotificationPreviewsEnabled()) return;
  if (message.silent) return;
  let mode = getStorageObject(
    StorageKeys.IN_APP_NOTIFICATIONS_PREVIEW,
    '"INHERIT"'
  );
  console.log(mode);
  if (mode === "OFF") return;

  const { channels, account, serverMembers } = useStore();
  const channel = channels.get(message.channelId);
  if (!channel) return;
  const serverId = channel.serverId;
  const channelId = channel.id;
  const mentioned = !!isMentioned(message, serverId);

  if (mode === "ALL") {
    return buildMessageNotification(message, channel, mentioned);
  }

  if (mode === "INHERIT") {
    if (!serverId) return buildMessageNotification(message, channel, mentioned);
    const pingMode = account.getCombinedNotificationSettings(
      serverId,
      channelId
    )?.notificationPingMode;

    if (pingMode === ServerNotificationPingMode.MUTE) return;
    if (pingMode === ServerNotificationPingMode.MENTIONS_ONLY) {
      mode = "MENTIONS_ONLY";
    }
  }

  if (mode === "MENTIONS_ONLY") {
    if (mentioned) {
      return buildMessageNotification(message, channel, mentioned);
    }
    return;
  }
  return buildMessageNotification(message, channel, mentioned);
};

const obj = {
  notifications: () => notifications,
  pushNotification,
  removeNotification,
  pushMessageNotification,
};
export const useInAppNotificationPreviews = () => {
  return obj;
};
