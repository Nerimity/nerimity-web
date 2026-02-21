import { getLatestRelease, getLatestSha, Release } from "@/github-api";
import { createSignal } from "solid-js";
import env from "./env";
import {
  getStorageString,
  setStorageString,
  StorageKeys
} from "./localStorage";
import { log } from "./logger";

const [updateAvailable, setUpdateAvailable] = createSignal(false);
const [latestRelease, setLatestRelease] = createSignal<Release | null>(null);

const showChangelog = () => {
  if (env.DEV_MODE || !env.APP_VERSION) {
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
};

const checkForUpdate = async () => {
  log("UPDATER", "Checking...");
  if (!env.APP_VERSION) {
    log("UPDATER", "Skipping (reason: No App Version)");
  }
  if (env.DEV_MODE) {
    log("UPDATER", "Skipping (reason: Dev Mode)");
    return;
  }

  let hasUpdate = false;

  // NOT latest.nerimity.com
  const isRelease = env.APP_VERSION?.startsWith("v");

  const appVersion = env.APP_VERSION;
  let latestVersion = "";

  if (isRelease) {
    const latestRelease = await getLatestRelease();
    latestVersion = latestRelease.tag_name;
    setLatestRelease(latestRelease);
    hasUpdate = latestVersion !== appVersion;
  } else {
    const sha = await getLatestSha();
    latestVersion = sha;
    hasUpdate = sha !== appVersion;
  }

  log("UPDATER", `Current: ${appVersion} Latest: ${latestVersion}`);

  setUpdateAvailable(hasUpdate);

  if (hasUpdate) log("UPDATER", "Update available!");
  if (!hasUpdate) log("UPDATER", "No update available.");
};

export function useAppVersion() {
  return { latestRelease, updateAvailable, showChangelog, checkForUpdate };
}
