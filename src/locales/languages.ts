import { StorageKeys, getStorageString, setStorageString } from "@/common/localStorage"

export interface Language {
  name: string,
  emoji: string,
  contributors: string[],
}

// name: Display name
// emoji: Some unicode flag emoji, idk
// contributors: array of names

export const languages = {
  en: {
    name: "English",
    emoji: "🇬🇧",
    contributors: ["Supertigerr"],
  }
}

export function getCurrentLanguage() {
  return getStorageString(StorageKeys.APP_LANGUAGE, null);
}
export function setCurrentLanguage(key: string) {
  return setStorageString(StorageKeys.APP_LANGUAGE, key);
}

export function getLanguage(key: string) {
  if (!(languages as any)[key]) return undefined;
  return import(`./list/${key}.json`);
}
