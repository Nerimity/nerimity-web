import { createSignal } from "solid-js";

export interface ElectronCaptureSource {
  id: string;
  name: string;
  thumbnailUrl: string;
}

export interface Program {
  name: string;
  filename: string;
}
export type ProgramWithExtras = Program & {
  action: string;
  emoji?: string;
};

export interface RPC {
  name: string;
  action: string;
  imgSrc?: string;
  title?: string;
  subtitle?: string;
  link?: string;
  startedAt?: number;
  endsAt?: number;
  speed?:number;
  updatedAt?: number;
}

export const [spellcheckSuggestions, setSpellcheckSuggestions] = createSignal<
  string[]
>([]);

type KeyState = "DOWN" | "UP";

interface GlobalKeyEvent {
  event: {
    name: string;
    vKey: number;
    state: KeyState;
  };
  down: Record<string, boolean>;
}

interface WindowAPI {
  isElectron: boolean;
  minimize(): void;
  toggleMaximize(): void;
  close(): void;

  getAutostart(): Promise<boolean>;
  setAutostart(value: boolean): void;

  getHardwareAccelerationDisabled(): Promise<boolean>;
  setHardwareAccelerationDisabled(value: boolean): void;

  getCustomTitlebarDisabled(): Promise<boolean>;
  setCustomTitlebarDisabled(value: boolean): void;

  getAutostartMinimized(): Promise<boolean>;
  setAutostartMinimized(value: boolean): void;

  setNotification(value: boolean, count?: number): void;
  getDesktopCaptureSources(): Promise<ElectronCaptureSource[]>;
  setDesktopCaptureSourceId(sourceId: string): Promise<true>;

  getRunningPrograms(ignoredPrograms?: Program[]): Promise<Program[]>;
  restartActivityStatus(listenToPrograms: Program[]): void;
  activityStatusChanged(
    callback: (window: { filename: string; createdAt: number } | false) => void
  ): void;

  restartRPCServer(): void;
  rpcChanged(callback: (data: RPC | false) => void): void;
  relaunchApp(): void;

  onSpellcheck(callback: (suggestions: string[]) => void): void;
  replaceMisspelling(word: string): void;

  clipboardPaste(): void;
  clipboardCopy(text: string): void;
  clipboardCut(): void;

  startGlobalKeyListener: () => void;
  stopGlobalKeyListener: () => void;
  onGlobalKey: (callback: (event: GlobalKeyEvent) => void) => void;

  appLoopbackStart: (captureSourceId: string) => void;
  appLoopbackReset: () => void;
  appLoopbackData: (callback: (data: Uint8Array) => void) => void;
  getAppVersion: () => Promise<string>;
}

export function electronWindowAPI(): WindowAPI | undefined {
  return (window as any).WindowAPI;
}

electronWindowAPI()?.onSpellcheck?.((suggestions) => {
  setSpellcheckSuggestions(suggestions);
});

electronWindowAPI()?.appLoopbackReset?.();
