import { getUserDetailsRequest } from "@/chat-api/services/UserService";
import useStore from "@/chat-api/store/useStore";

export function createPreloader<T, U extends unknown[]>(
  fun: (...args: U) => Promise<T>
) {
  let timeout: undefined | NodeJS.Timeout;
  const cache = new Map<string, { data: T; savedAt: number }>();
  const activeRequest = new Map<string, number>();

  const run = (...args: U) => {
    const key = JSON.stringify(args);
    const now = Date.now();
    const cached = cache.get(key);
    if (cached && now - cached.savedAt < 10000) {
      return Promise.resolve(cached.data);
    }

    const token = (activeRequest.get(key) || 0) + 1;
    activeRequest.set(key, token);

    return fun(...args).then((result) => {
      if (activeRequest.get(key) === token) {
        cache.set(key, { data: result, savedAt: Date.now() });
      }
      return result;
    });
  };

  const preload = (...args: U) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => run(...args), 200);
  };

  return { run, preload };
}

export const userDetailsPreloader = createPreloader(getUserDetailsRequest);

export const messagesPreloader = createPreloader(async (channelId: string) => {
  const store = useStore();

  const messages = store.messages.getMessagesByChannelId(channelId);

  if (!messages) {
    store.channelProperties.update(channelId, {
      scrollTop: 9999,
      moreTopToLoad: true,
      moreBottomToLoad: false,
      isScrolledBottom: true,
    });
  }

  await store.messages.fetchAndStoreMessages(channelId);
  return true;
});
