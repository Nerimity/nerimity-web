import { StorageKeys, getStorageString } from "@/common/localStorage"

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

export function getLanguage(key: string) {
  if (!(languages as any)[key]) return undefined;
  return import(`${key}.json`);
}