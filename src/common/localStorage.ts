import { createSignal, onMount } from "solid-js";

export enum StorageKeys {
  USER_TOKEN = "userToken",
  SEEN_APP_VERSION = "seenAppVersion",
  INBOX_DRAWER_SELECTED_INDEX = "inboxDrawerSelectedIndex",
  APP_LANGUAGE = "appLanguage",
  FIRST_TIME = "firstTime", // After registering, this is set to true.
  ARE_NOTIFICATIONS_MUTED = "areNotificationsMuted",
  IN_APP_NOTIFICATIONS_PREVIEW = "inAppNotificationsPreview",
  NOTIFICATION_VOLUME = "notificationVolume",
  ENABLE_DESKTOP_NOTIFICATION = "enableDesktopNotification",
  LAST_SELECTED_SERVER_CHANNELS = "lastSelectedServerChannels",
  LAST_SEEN_CHANNEL_NOTICES = "lastSeenChannelNotices",
  PROGRAM_ACTIVITY_STATUS = "programActivityStatus",
  BLUR_EFFECT_ENABLED = "blurEffectEnabled",
  ENABLED_EXPERIMENTS = "enabledExperiments",
  DISABLED_ADVANCED_MARKUP = "disabledAdvancedMarkup",
  NOTIFICATION_SOUNDS = "notificationSounds",
  CUSTOM_CSS = "customCss",
  CUSTOM_COLORS = "customColors",
  inputDeviceId = "inputDeviceId",
  outputDeviceId = "outputDeviceId",
  voiceInputMode = "voiceInputMode",
  PTTBoundKeys = "pttBoundKeys",
  USE_TWITTER_EMBED = "useTwitterEmbed",
}

export function getStorageBoolean(
  key: StorageKeys,
  defaultValue: boolean
): boolean {
  const value = localStorage.getItem(key);
  if (!value) return defaultValue;
  return JSON.parse(value);
}

export function setStorageBoolean(key: StorageKeys, value: boolean) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getStorageString<T>(key: StorageKeys, defaultValue: T) {
  return localStorage.getItem(key) || defaultValue;
}

export function setStorageString(key: StorageKeys, value: string) {
  localStorage.setItem(key, value);
}

export function getStorageNumber<T>(key: StorageKeys, defaultValue: T) {
  const value = localStorage.getItem(key);
  if (value === null) {
    return defaultValue;
  }
  return parseInt(value, 10);
}

export function setStorageNumber(key: StorageKeys, value: number) {
  localStorage.setItem(key, value.toString());
}

export function getStorageObject<T>(key: StorageKeys, defaultValue: T): T {
  const value = getStorageString(key, null);
  if (value === null) {
    return defaultValue;
  }
  return JSON.parse(value);
}

export function setStorageObject<T>(key: StorageKeys, value: T) {
  setStorageString(key, JSON.stringify(value));
}

export function removeStorage(key: StorageKeys) {
  localStorage.removeItem(key);
}

export function useReactiveLocalStorage<T>(key: StorageKeys, defaultValue: T) {
  const [value, setValue] = createSignal<T>(defaultValue);

  const storedValue = getStorageObject<T>(key, defaultValue);
  setValue(() => storedValue);

  const setCustomValue = (value: T) => {
    setValue(() => value);
    setStorageString(key, JSON.stringify(value));
  };

  return [value, setCustomValue] as const;
}

const voiceInputMode = useReactiveLocalStorage<
  "OPEN" | "VOICE_ACTIVITY" | "PTT"
>(StorageKeys.voiceInputMode, "VOICE_ACTIVITY");

export const useVoiceInputMode = () => voiceInputMode;
