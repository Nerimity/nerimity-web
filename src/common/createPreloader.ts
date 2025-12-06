import { getUserDetailsRequest } from "@/chat-api/services/UserService";
import useStore from "@/chat-api/store/useStore";

export function createPreloader<T, U extends unknown[]>(
  fun: (...args: U) => Promise<T>
) {
  let timeout: NodeJS.Timeout | null = null;

  let currentPromise: Promise<T> | null = null;
  let lastArgsStr: string | null = null;
  let cache: { data: T; savedAt: number } | null = null;
  const CACHE_TTL = 10000; // 10 seconds

  const run = (...args: U): Promise<T> => {
    const newArgsStr = JSON.stringify(args);

    if (cache && lastArgsStr === newArgsStr) {
      if (Date.now() - cache.savedAt < CACHE_TTL) {
        return Promise.resolve(cache.data);
      }
      cache = null;
    }

    if (currentPromise && lastArgsStr === newArgsStr) {
      return currentPromise;
    }

    lastArgsStr = newArgsStr;

    currentPromise = fun(...args)
      .then((newData) => {
        if (lastArgsStr === newArgsStr) {
          cache = { data: newData, savedAt: Date.now() };
        }
        return newData;
      })
      .catch((error) => {
        if (currentPromise === currentPromise) {
          currentPromise = null;
        }

        throw error;
      });

    return currentPromise;
  };

  const preload = (...args: U) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      run(...args).catch(() => {});
    }, 200);
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
