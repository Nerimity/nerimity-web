export interface ElectronCaptureSource {
  id: string;
  name: string;
  thumbnailUrl: string;
}

export interface Program {
  name: string, 
  filename: string
}
export type ProgramWithAction = Program & {
  action: string
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
  
  getRunningPrograms(ignoredPrograms?: Program[]): Promise<Program[]>;
  restartActivityStatus(listenToPrograms: Program[]): void;
  activityStatusChanged(callback: (window: {filename: string, createdAt: number} | false) => void): void;
}


export function electronWindowAPI(): WindowAPI | undefined {
  return (window as any).WindowAPI;
}

