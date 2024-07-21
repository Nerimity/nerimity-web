import { onCleanup, onMount } from "solid-js";

interface CustomEventMap {
  audioLoaded: { url: string; duration: number; position: number };
  audioLoading: { url: string };
}

type EventByType<T extends CustomEventMap> = {
  [K in keyof T]: T[K] & { type: K };
};

interface WindowAPI {
  isReactNative: boolean;
  playVideo(url: string): void;
  playAudio(url?: string): void;
  pauseAudio(): void;
  seekAudio(time: number): void;

  on<K extends keyof CustomEventMap>(
    event: K,
    callback: (data: CustomEventMap[K]) => void
  ): void;
  off<K extends keyof CustomEventMap>(
    event: K,
    callback: (data: CustomEventMap[K]) => void
  ): void;
}

export function reactNativeAPI(): WindowAPI | undefined {
  return (window as any).reactNative;
}

export function useReactNativeEvent<K extends keyof CustomEventMap>(
  name: K[],
  callback: (event: EventByType<CustomEventMap>[K]) => void
) {
  if (!reactNativeAPI()?.isReactNative) return;
  onMount(() => {
    const makeCallback = (name: K) => (data: any) => {
      callback({ ...data, type: name });
    };

    const callbacks: Record<string, (data: CustomEventMap[K]) => void> = {};

    name.forEach((n) => {
      const cb = makeCallback(n);
      callbacks[n] = cb;
      reactNativeAPI()?.on(n, cb);
    });

    onCleanup(() => {
      name.forEach((n) => {
        const cb = callbacks[n]!;
        reactNativeAPI()?.off(n, cb);
      });
    });
  });
}
