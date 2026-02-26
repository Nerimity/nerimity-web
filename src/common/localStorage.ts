import { createSignal } from "solid-js";

export const StorageKeys = {
  USER_TOKEN: "userToken",
  SEEN_APP_VERSION: "seenAppVersion",
  INBOX_DRAWER_SELECTED_INDEX: "inboxDrawerSelectedIndex",
  APP_LANGUAGE: "appLanguage",
  FIRST_TIME: "firstTime", // After registering, this is set to true.
  ARE_NOTIFICATIONS_MUTED: "areNotificationsMuted",
  IN_APP_NOTIFICATIONS_PREVIEW: "inAppNotificationsPreview",
  NOTIFICATION_VOLUME: "notificationVolume",
  ENABLE_DESKTOP_NOTIFICATION: "enableDesktopNotification",
  LAST_SELECTED_SERVER_CHANNELS: "lastSelectedServerChannels",
  LAST_SEEN_CHANNEL_NOTICES: "lastSeenChannelNotices",
  PROGRAM_ACTIVITY_STATUS: "programActivityStatus",
  BLUR_EFFECT_ENABLED: "blurEffectEnabled",
  REDUCE_MOTION_MODE: "reduceMotionMode",
  ENABLED_EXPERIMENTS: "enabledExperiments",
  DISABLED_ADVANCED_MARKUP: "disabledAdvancedMarkup",
  NOTIFICATION_SOUNDS: "notificationSounds",
  CUSTOM_CSS: "customCss",
  CUSTOM_COLORS: "customColors",
  inputDeviceId: "inputDeviceId",
  outputDeviceId: "outputDeviceId",
  voiceInputMode: "voiceInputMode",
  voiceMicConstraints: "voiceMicConstraints",
  voiceUseTurnServers: "useTurnServers",
  PTTBoundKeys: "pttBoundKeys",
  USE_TWITTER_EMBED: "useTwitterEmbed",
  DISCORD_USER_ID: "discordUserId",
  LASTFM: "lastfm",
  SIDEBAR_WIDTH: "sidebarWidth",
  LEFT_DRAWER_WIDTH: "leftDrawerWidth",
  RIGHT_DRAWER_WIDTH: "rightDrawerWidth",
  COLLAPSED_SERVER_CATEGORIES: "collapsedServerCategories",
  ANNOUNCEMENTS_CACHE: "announcementsCache",
  HIDDEN_ANNOUNCEMENT_IDS: "hiddenAnnouncementIds",
  CHAT_BAR_OPTIONS: "chatBarOptions",
  MENTION_REPLIES: "mentionReplies",
  TIME_FORMAT: "timeFormat",
  DASHBOARD_POST_SORT: "dashboardPostSort",
  rightDrawerMode: "rightDrawerMode",
  FAVORITE_GIFS: "favoriteGifs"
} as const;

export type StorageKeys = (typeof StorageKeys)[keyof typeof StorageKeys];

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
  try {
    const value = getStorageString(key, null);
    if (value === null) {
      return defaultValue;
    }
    return JSON.parse(value);
  } catch {
    return defaultValue;
  }
}

export function setStorageObject<T>(key: StorageKeys, value: T) {
  setStorageString(key, JSON.stringify(value));
}

export function removeStorage(key: StorageKeys) {
  localStorage.removeItem(key);
}

export function useLocalStorage<T>(
  key: StorageKeys,
  defaultValue: T,
  stringMode = false
) {
  const [value, setValue] = createSignal<T>(defaultValue);

  const storedValue = stringMode
    ? getStorageString(key, defaultValue)
    : getStorageObject<T>(key, defaultValue);
  setValue(() => storedValue as T);

  const setCustomValue = (value: T) => {
    setValue(() => value);
    if (stringMode) return setStorageString(key, value as string);
    setStorageString(key, JSON.stringify(value));
  };

  return [value, setCustomValue] as const;
}

type VoiceInputMode = "OPEN" | "VOICE_ACTIVITY" | "PTT";
const voiceInputMode = useLocalStorage<VoiceInputMode>(
  StorageKeys.voiceInputMode,
  "VOICE_ACTIVITY"
);

const collapsedServerCategories = useLocalStorage<string[]>(
  StorageKeys.COLLAPSED_SERVER_CATEGORIES,
  []
);

export const useCollapsedServerCategories = () => collapsedServerCategories;

export const useVoiceInputMode = () => voiceInputMode;

export const useChatBarOptions = () => {
  return useLocalStorage(StorageKeys.CHAT_BAR_OPTIONS, [
    "vm",
    "gif",
    "emoji",
    "send"
  ] as const);
};

type RightDrawerMode = "SWIPE" | "HEADER_CLICK";
export const rightDrawerMode = useLocalStorage<RightDrawerMode>(
  StorageKeys.rightDrawerMode,
  "SWIPE"
);
