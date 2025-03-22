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
import { createStore, reconcile } from "solid-js/store";

interface InAppPreviewNotification {
  title: string;
  body: string;
  icon?: string;
  color?: string;
  message?: Message;
  channel?: Channel;
  onClick?: () => void;
}

const [notifications, setNotifications] = createStore<
  InAppPreviewNotification[]
>([]);

const pushNotification = (notification: InAppPreviewNotification) => {
  if (!document.hasFocus()) return;
  if (notifications.length >= 2) {
    setNotifications(reconcile([notifications[0]!, notification]));
  }
  setNotifications([...notifications, notification]);
};
const removeNotification = (notification: InAppPreviewNotification) => {
  setNotifications(notifications.filter((n) => n !== notification));
};

const clearNotifications = () => {
  setNotifications(reconcile([]));
};

const buildMessageNotification = (
  message: Message,
  mentioned: boolean,
  channel?: Channel
) => {
  const { servers, serverMembers, users } = useStore();
  const server = servers.get(channel?.serverId!);
  const member = serverMembers.get(channel?.serverId!, message.createdBy.id);
  const nickname = member?.nickname;
  const displayName = nickname || message.createdBy.username;

  pushNotification({
    title: `${displayName} ${
      server ? `(#${channel?.name} ${server?.name})` : ""
    }`,
    body: message.content || "Attachment",
    color: mentioned ? "var(--alert-color)" : undefined,
    channel,
    message,
    onClick: () => {
      if (channel?.serverId) return;
      if (channel?.recipient()?.inboxChannelId) return;
      users.openDM(message.createdBy.id);
    },
  });
};

export const pushMessageNotification = (message: Message) => {
  if (message.silent) return;
  let mode = getStorageObject(
    StorageKeys.IN_APP_NOTIFICATIONS_PREVIEW,
    "INHERIT"
  );
  if (mode === "OFF") return;

  const { channels, account } = useStore();
  const channel = channels.get(message.channelId);
  const serverId = channel?.serverId;
  const channelId = channel?.id;
  const mentioned = !!isMentioned(message, serverId);

  if (mode === "ALL") {
    return buildMessageNotification(message, mentioned, channel);
  }

  if (mode === "INHERIT") {
    if (!serverId) return buildMessageNotification(message, mentioned, channel);
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
      return buildMessageNotification(message, mentioned, channel);
    }
    return;
  }
  return buildMessageNotification(message, mentioned, channel);
};

const obj = {
  notifications: () => notifications,
  pushNotification,
  removeNotification,
  pushMessageNotification,
  clearNotifications,
};
export const useInAppNotificationPreviews = () => {
  return obj;
};
