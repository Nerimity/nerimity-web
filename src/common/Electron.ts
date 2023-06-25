interface WindowAPI {
  isElectron: boolean;
  minimize(): void;
  toggleMaximize(): void;
  close(): void;
}

export function electronWindowAPI(): WindowAPI | undefined {
  return (window as any).WindowAPI
}

