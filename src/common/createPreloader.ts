import { getUserDetailsRequest } from "@/chat-api/services/UserService";
import useStore from "@/chat-api/store/useStore";

export function createPreloader<T, U extends unknown[]>(
  fun: (...args: U) => Promise<T>
) {
  let timeout: undefined | NodeJS.Timeout;
  let waiting: ((value: T | PromiseLike<T>) => void)[] = [];
  let argsStr: string | null = null;
  let data: T | null = null;
  let dataSavedAt: number | null = null;

  const preload = (...args: U) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      run(...args);
    }, 200);
  };

  const run = (...args: U) => {
    const newArgsStr = JSON.stringify(args);

    if (argsStr !== newArgsStr) {
      waiting = [];
      argsStr = newArgsStr;
      data = null;
    }

    return new Promise<T>((resolve) => {
      if (data && argsStr === newArgsStr) {
        if (Date.now() - dataSavedAt! < 10000) {
          resolve(data);
          return;
        }
        data = null;
      }
      if (waiting.length) {
        waiting.push(resolve);
        return;
      }
      waiting.push(resolve);

      fun(...args).then((newData) => {
        data = newData;
        dataSavedAt = Date.now();
        if (argsStr !== newArgsStr) return;
        waiting.forEach((resolve) => resolve(newData));
        waiting = [];
      });
    });
  };
  return { run, preload };
}

export const userDetailsPreloader = createPreloader(getUserDetailsRequest);

export const messagesPreloader = createPreloader(async (channelId: string) => {
  const { messages } = useStore();

  await messages.fetchAndStoreMessages(channelId);
  return true;
});
