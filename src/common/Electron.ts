export interface ElectronCaptureSource {
  id: string;
  name: string;
  thumbnailUrl: string;
}

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
}


export function electronWindowAPI(): WindowAPI | undefined {
  return (window as any).WindowAPI
}

