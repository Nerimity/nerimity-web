import { getLatestRelease, Release } from "@/github-api";
import { createSignal } from "solid-js";
import env from "./env";
import { getStorageString, setStorageString, StorageKeys } from "./localStorage";


const [updateAvailable, setUpdateAvailable] = createSignal(false);
const [latestRelease, setLatestRelease] = createSignal<Release | null>(null);


const showChangelog = () => {
  if (env.DEV_MODE) {
    return false;
  }
  const appVersion = env.APP_VERSION;
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
  
const checkForUpdate = async () => {
  console.log("[UPDATE] Checking...");
  // if (env.DEV_MODE) {
  //   console.log("[UPDATE] Skipping (reason: Dev Mode)");
  //   return;
  // }

  const appVersion = env.APP_VERSION;
  const latestRelease = await getLatestRelease();
  const latestVersion = latestRelease.tag_name;
  setLatestRelease(latestRelease);

  console.log(`[UPDATE] Current: ${appVersion} Latest: ${latestVersion}`)

  const hasUpdate = latestVersion !== appVersion;
  setUpdateAvailable(hasUpdate)

  if (hasUpdate) console.log("[UPDATE] Update available!")
  if (!hasUpdate) console.log("[UPDATE] No update available.")
}

export function useAppVersion () {
  return {latestRelease, updateAvailable, showChangelog, checkForUpdate}
}