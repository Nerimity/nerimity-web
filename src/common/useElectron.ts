interface WindowAPI {
  isElectron: boolean
}

export function electronWindowAPI(): WindowAPI | undefined {
  return (window as any).WindowAPI
}

