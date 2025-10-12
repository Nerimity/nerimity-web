import { createSignal, createEffect } from "solid-js";
import { RawChannelNotice } from "../chat-api/RawData";
import { getChannelNotice } from "../chat-api/services/ChannelService";
import { StorageKeys, getStorageObject, setStorageObject } from "@/common/localStorage";
import { createStore } from "solid-js/store";

const [cachedNotices, setCachedNotices] = createStore<Record<string, RawChannelNotice | null>>({});

export const getCachedNotice = (channelId: () => string) => cachedNotices[channelId()];

export const useNotice = (channelId: () => string) => {

  const [notice, setNotice] = createSignal<RawChannelNotice | null>(null);

  createEffect(async () => {
    const id = channelId();
    if (!id) return;
    const cachedNotice = cachedNotices[id];
    if (cachedNotice !== undefined) {
      setNotice(cachedNotice);
      return;
    }
    const noticeRes = await getChannelNotice(id).catch(() => { });
    if (!noticeRes) {
      setCachedNotices(id, null);
      setNotice(null);
      return;
    }
    setCachedNotices(id, noticeRes.notice);
    setNotice(noticeRes.notice);
  });

  const hasAlreadySeenNotice = () => {
    if (!notice()) return;
    const lastSeenObj = getStorageObject<Record<string, number>>(StorageKeys.LAST_SEEN_CHANNEL_NOTICES, {});
    const lastSeen = lastSeenObj[channelId()];
    if (!lastSeen) return false;
    return lastSeen > notice()!.updatedAt;
  };
  const updateLastSeen = () => {
    if (!notice()) return;
    let lastSeenObj = getStorageObject<Record<string, number>>(StorageKeys.LAST_SEEN_CHANNEL_NOTICES, {});
    lastSeenObj[channelId()] = Date.now();
    // keep the top 50 last seen notices
    const sorted = Object.entries(lastSeenObj).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 50) {
      sorted.splice(50, sorted.length - 50);
    }
    lastSeenObj = Object.fromEntries(sorted);
    setStorageObject(StorageKeys.LAST_SEEN_CHANNEL_NOTICES, lastSeenObj);
  };

  return { notice, setNotice, hasAlreadySeenNotice, updateLastSeen };
};
