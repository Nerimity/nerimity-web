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
export type ProgramWithAction = Program & {
  action: string;
};

export interface RPC {
  name: string;
  action: string;
  imgSrc?: string;
  title?: string;
  startedAt?: number;
}

export const [spellcheckSuggestions, setSpellcheckSuggestions] = createSignal<
  string[]
>([]);

interface WindowAPI {
  isElectron: boolean;
  minimize(): void;
  toggleMaximize(): void;
  close(): void;

  getAutostart(): Promise<boolean>;
  setAutostart(value: boolean): void;

  getAutostartMinimized(): Promise<boolean>;
  setAutostartMinimized(value: boolean): void;

  setNotification(value: boolean): void;
  getDesktopCaptureSources(): Promise<ElectronCaptureSource[]>;
  setDesktopCaptureSourceId(sourceId: string): void;

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
}

export function electronWindowAPI(): WindowAPI | undefined {
  return (window as any).WindowAPI;
}

electronWindowAPI()?.onSpellcheck?.((suggestions) => {
  setSpellcheckSuggestions(suggestions);
});
