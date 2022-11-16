import env from "./env";
import { getStorageString, setStorageString, StorageKeys } from "./localStorage";

export function useAppVersion () {
  
  
  const showChangelog = () => {
    const appVersion = env.VITE_APP_VERSION;
    if (!appVersion) return false;
    const seenVersion = getStorageString(StorageKeys.SEEN_APP_VERSION, undefined);

    if (!seenVersion) {
      setStorageString(StorageKeys.SEEN_APP_VERSION, appVersion);
      return false;
    }
    if (seenVersion !== appVersion) {
      setStorageString(StorageKeys.SEEN_APP_VERSION, appVersion);
      return true;
    }
    return false;
  }

}