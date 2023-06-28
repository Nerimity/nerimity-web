interface WindowAPI {
  isElectron: boolean;
  minimize(): void;
  toggleMaximize(): void;
  close(): void;

  getAutostart(): Promise<boolean>;
  setAutostart(value: boolean): void;
  
  getAutostartMinimized(): Promise<boolean>;
  setAutostartMinimized(value: boolean): void;
}

export function electronWindowAPI(): WindowAPI | undefined {
  return (window as any).WindowAPI
}

