import { Channel } from "@/chat-api/store/useChannels";
import { Message } from "@/chat-api/store/useMessages";
import useStore from "@/chat-api/store/useStore";
import { StorageKeys, getStorageBoolean } from "./localStorage";
import { MessageType } from "@/chat-api/RawData";
import env from "./env";
import { avatarUrl } from "@/chat-api/store/useUsers";

export function createDesktopNotification(message: Message) {
  const enabled = getStorageBoolean(StorageKeys.ENABLE_DESKTOP_NOTIFICATION, false);
  if (!enabled) return;

  const {channels} = useStore();
  const channel = channels.get(message.channelId);
  if (channel?.serverId) return createServerDesktopNotification(message, channel);
  else return createDMDesktopNotification(message);

}

function createServerDesktopNotification(message: Message, channel: Channel) {
  const {servers} = useStore();
  const server = servers.get(channel.serverId!);
  let title = `${message.createdBy.username} (${server?.name} #${channel.name})`;
  let body = message.content;

  if (!body && message.attachments?.length) {
    body = "Image Message"
  }
  if (message.type === MessageType.BAN_USER) {
    body = `${message.createdBy.username} has been banned.`,
    title = `${server?.name} #${channel.name}`
  }
  if (message.type === MessageType.KICK_USER) {
    body = `${message.createdBy.username} has been kicked.`,
    title = `${server?.name} #${channel.name}`
  }
  if (message.type === MessageType.JOIN_SERVER) {
    body = `${message.createdBy.username} joined the server.`,
    title = `${server?.name} #${channel.name}`
  }
  if (message.type === MessageType.LEAVE_SERVER) {
    body = `${message.createdBy.username} left the server.`,
    title = `${server?.name} #${channel.name}`
  }
  if (message.type === MessageType.CALL_STARTED) {
    body = `${message.createdBy.username} started a call.`,
    title = `${server?.name} #${channel.name}`
  }


  new Notification(title, {
    body,
    silent: true,
    tag: channel.id,
    renotify: true,

    icon: server?.avatarUrl() || undefined
  })
}
function createDMDesktopNotification(message: Message) {
  const title = message.createdBy.username;
  let body = message.content;

  if (!body && message.attachments?.length) {
    body = "Image Message"
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
  })
}