
export enum StorageKeys {
  USER_TOKEN = 'userToken',
  SEEN_APP_VERSION = 'seenAppVersion',
  INBOX_DRAWER_SELECTED_INDEX = 'inboxDrawerSelectedIndex',
  APP_LANGUAGE = 'appLanguage',
  FIRST_TIME = 'firstTime', // After registering, this is set to true.
  ARE_NOTIFICATIONS_MUTED = 'areNotificationsMuted',
  NOTIFICATION_VOLUME = 'notificationVolume',
  ENABLE_DESKTOP_NOTIFICATION = 'enableDesktopNotification'
}

export function getStorageBoolean(key: StorageKeys, defaultValue: boolean): boolean {
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

export function removeStorage(key: StorageKeys) {
    localStorage.removeItem(key);
}