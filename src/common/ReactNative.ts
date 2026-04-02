/* eslint-disable @typescript-eslint/no-explicit-any */
import { onCleanup, onMount } from "solid-js";

interface CustomEventMap {
  audioLoaded: { url: string; duration: number; position: number };
  audioLoading: { url: string };
  registerFCM: { token: string };

  openChannel: { userId: string; channelId: string; serverId?: string };
  sio_event: { event: string; payload: any };
}

type EventByType<T extends CustomEventMap> = {
  [K in keyof T]: T[K] & { type: K };
};

interface WindowAPI {
  isReactNative: boolean;
  version?: string;
  playVideo(url: string): void;
  playAudio(url?: string): void;
  pauseAudio(): void;
  seekAudio(time: number): void;

  authenticated(userId: string): string;
  logout(): void;
  post(event: string, payload: any): void;

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

export class ReactSocketIO {
  url: string;
  id?: string;
  handlers: Record<string, Set<(data: any, ...args: any) => void>> = {};

  io = {
    on: (event: string, callback: (data: any) => void) => {
      this.on(event, callback);
    },
    off: (event: string, callback: (data: any) => void) => {
      this.off(event, callback);
    }
  };

  constructor(url: string) {
    this.url = url;

    reactNativeAPI()?.on(
      "sio_event",
      (data: { event: string; payload: any; type?: "binary" }) => {
        if (data.event === "connect") {
          this.id = data.payload.id;
        }
        if (data.event === "disconnect") {
          const handlers = this.handlers[data.event];
          if (handlers) {
            handlers.forEach((handler) =>
              handler(data.payload.reason, data.payload.description)
            );
          }
          return;
        }
        if (data.event === "reconnect_attempt") {
          const handlers = this.handlers[data.event];
          if (handlers) {
            handlers.forEach((handler) => handler(data.payload.attempt));
          }
          return;
        }

        if (data.type === "binary") {
          data.payload = new Uint8Array(data.payload).buffer;
        }

        const handlers = this.handlers[data.event];
        if (handlers) {
          handlers.forEach((handler) => handler(data.payload));
        }
      }
    );
  }
  connect() {
    reactNativeAPI()?.post("sio_connect", { url: this.url });
  }
  on(event: string, callback: (data: any) => void) {
    if (!this.handlers[event]) this.handlers[event] = new Set();
    this.handlers[event]?.add(callback);
  }
  off(event: string, callback: (data: any) => void) {
    this.handlers[event]?.delete(callback);
  }
  emit(event: string, data: any) {
    reactNativeAPI()?.post("sio_emit", { event, payload: data });
  }
}
