import { getUserDetailsRequest } from "@/chat-api/services/UserService";
import useStore from "@/chat-api/store/useStore";

export function createPreloader<T, U extends unknown[]>(
  fun: (...args: U) => Promise<T>
) {
  let timeout: NodeJS.Timeout | null = null;

  let currentPromise: Promise<T> | null = null;

  let cache: { data: T; savedAt: number; key: string } | null = null;
  const CACHE_TTL = 10000;

  const run = (...args: U): Promise<T> => {
    const newArgsStr = JSON.stringify(args);

    if (cache && cache.key === newArgsStr) {
      if (Date.now() - cache.savedAt < CACHE_TTL) {
        return Promise.resolve(cache.data);
      }
      cache = null;
    }

    if (currentPromise && lastArgsStr === newArgsStr) {
      return currentPromise;
    }

    lastArgsStr = newArgsStr;

    const thisPromise = fun(...args)
      .then((newData) => {
        if (lastArgsStr === newArgsStr) {
          cache = {
            data: newData,
            savedAt: Date.now(),
            key: newArgsStr, // Store the key with the data
          };
        }
        return newData;
      })
      .catch((error) => {
        if (currentPromise === thisPromise) {
          currentPromise = null;
        }
        throw error;
      });

    currentPromise = thisPromise;
    return currentPromise;
  };

  let lastArgsStr: string | null = null;

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
