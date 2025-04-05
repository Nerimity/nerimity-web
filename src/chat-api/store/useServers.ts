import env from "@/common/env";
import { createStore } from "solid-js/store";
import {
  RawBotCommand,
  ChannelType,
  RawCustomEmoji,
  RawServer,
  ServerNotificationPingMode,
} from "../RawData";
import {
  deleteServer,
  getServerBotCommands,
  leaveServer,
} from "../services/ServerService";
import useAccount from "./useAccount";
import useChannels from "./useChannels";
import useMention from "./useMention";
import { createEffect, createMemo, createRoot } from "solid-js";
import { emojiShortcodeToUnicode } from "@/emoji";
import { CHANNEL_PERMISSIONS } from "../Bitwise";

export type Server = RawServer & {
  hasNotifications: () => boolean;
  isCurrentUserCreator: () => boolean | undefined;
  update: (this: Server, update: Partial<RawServer>) => void;
  leave: () => Promise<RawServer>;
  mentionCount: () => number;
  avatarUrl(this: Server): string | null;
  botCommands?: RawBotCommand[];
};
const [servers, setServers] = createStore<Record<string, Server | undefined>>(
  {}
);

export const avatarUrl = (item: { avatar?: string }): string | null =>
  item?.avatar ? env.NERIMITY_CDN + item?.avatar : null;
export const bannerUrl = (item: { banner?: string }): string | null =>
  item?.banner ? env.NERIMITY_CDN + item?.banner : null;

const set = (server: RawServer) => {
  const newServer: Server = {
    ...server,
    isCurrentUserCreator,
    update,
    leave,
    hasNotifications,
    mentionCount,
    avatarUrl: function () {
      return avatarUrl(this);
    },
  };

  setServers(server.id, newServer);
};

function hasNotifications(this: Server) {
  const channels = useChannels();

  const account = useAccount();

  return channels.getChannelsByServerId(this.id).some((channel) => {
    const notificationPingMode = account.getCombinedNotificationSettings(
      this.id,
      channel.id
    )?.notificationPingMode;
    if (notificationPingMode === ServerNotificationPingMode.MUTE) return false;
    const hasNotification = channel!.hasNotifications();
    if (
      hasNotification !== "mention" &&
      notificationPingMode === ServerNotificationPingMode.MENTIONS_ONLY
    )
      return false;
    return hasNotification && channel?.type === ChannelType.SERVER_TEXT;
  });
}

function mentionCount(this: Server) {
  const mention = useMention();
  const channels = useChannels();
  let count = 0;
  const mentions = mention
    .array()
    .filter((mention) => mention!.serverId === this.id);
  for (let i = 0; i < mentions.length; i++) {
    const mention = mentions[i];
    const channel = channels.get(mention?.channelId!);
    if (!channel?.hasPermission(CHANNEL_PERMISSIONS.PUBLIC_CHANNEL)) continue;
    count += mention?.count || 0;
  }
  return count;
}

function leave(this: Server) {
  return leaveServer(this.id);
}
function update(this: Server, update: Partial<RawServer>) {
  setServers(this.id, update);
}

const remove = (serverId: string) => {
  setServers(serverId, undefined);
};

function isCurrentUserCreator(this: Server) {
  const account = useAccount();
  if (!account.user()) return;
  return this.createdById === account.user()?.id;
}

const get = (serverId: string) => servers[serverId];

const array = () => Object.values(servers) as Server[];

const orderedArray = () => {
  const account = useAccount();
  const serverIdsArray = account.user()?.orderedServerIds;
  const order: Record<string, number> = {};
  serverIdsArray?.forEach((a, i) => {
    order[a] = i;
  });

  return array()
    .sort((a, b) => a.createdAt - b.createdAt)
    .sort((a, b) => {
      const orderA = order[a.id];
      const orderB = order[b.id];
      if (orderA === undefined) {
        return -1;
      }
      if (orderB === undefined) {
        return 1;
      }
      return orderA - orderB;
    });
};

const hasAllNotifications = () => {
  return array().find((s) => s?.hasNotifications());
};
const emojis = createRoot(() =>
  createMemo(() =>
    orderedArray()
      .map((s) => s.customEmojis.map((emoji) => ({ ...emoji, serverId: s.id })))
      .flat()
  )
);

const emojisUpdatedDupName = createRoot(() =>
  createMemo(() => {
    const uniqueNamedEmojis: RawCustomEmoji[] = [];
    const counts: { [key: string]: number } = {};

    for (let i = 0; i < emojis().length; i++) {
      const emoji = emojis()[i];
      let count = counts[emoji.name] || 0;
      const hasEmojiShortcode = emojiShortcodeToUnicode(emoji.name);
      if (hasEmojiShortcode) count++;
      const newName = count ? `${emoji.name}-${count}` : emoji.name;
      if (!hasEmojiShortcode) count++;
      counts[emoji.name] = count;
      uniqueNamedEmojis.push({ ...emoji, name: newName });
    }
    return uniqueNamedEmojis;
  })
);

const customEmojiNamesToEmoji = createRoot(() =>
  createMemo(() => {
    const obj: { [key: string]: RawCustomEmoji } = {};

    for (let index = 0; index < emojisUpdatedDupName().length; index++) {
      const emoji = emojisUpdatedDupName()[index];
      obj[emoji.name] = emoji;
    }
    return obj;
  })
);

const fetchAndStoreServerBotCommands = async (serverId: string) => {
  const server = servers[serverId];
  if (server?.botCommands) return;
  const result = await getServerBotCommands(serverId).catch(() => ({
    commands: [],
  }));

  setServers(serverId, "botCommands", result.commands);
};

export default function useServers() {
  return {
    emojis,
    emojisUpdatedDupName,
    customEmojiNamesToEmoji,
    array,
    get,
    set,
    hasNotifications: hasAllNotifications,
    orderedArray,
    remove,
    fetchAndStoreServerBotCommands,
  };
}
