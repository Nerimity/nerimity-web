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
  "en-gb": {
    name: "English",
    emoji: "🇬🇧",
    contributors: ["https://github.com/SupertigerDev"],
  },
  "zn-hant": {
    name: "Chinese (Traditional)",
    emoji: "🇨🇳",
    contributors: ["https://github.com/SupertigerDev"],   // made by Dsiahrz without github
  },
  "nl-nl": {
    name: "Dutch",
    emoji: "🇳🇱",
    contributors: ["https://github.com/captainqdev"],
  },
  "fr-FR": {
    name: "French",
    emoji: "🇫🇷",
    contributors: ["https://github.com/guiguitator"],
  },
  "de-de": {
    name: "German",
    emoji: "🇩🇪",
    contributors: ["https://github.com/F-iiral"],
  },
  "hu-hu": {
    name: "Hungarian",
    emoji: "🇭🇺",
    contributors: ["https://github.com/andrasdaradici"],
  },
  "pt-br": {
    name: "Brazilian Portuguese",
    emoji: "🇧🇷",
    contributors: ["https://github.com/Jerkycat"],
  },
  "pl-pl": {
    name: "Polish",
    emoji: "🇵🇱",
    contributors: ["https://github.com/Ciach0", "https://github.com/CyberL1"],
  },
  "es-es": {
    name: "Spanish",
    emoji: "🇪🇸",
    contributors: ["https://github.com/SupertigerDev"],   // made by Linterna001 without github
  },
  "tr-tr": {
    name: "Turkish",
    emoji: "🇹🇷",
    contributors: ["https://github.com/sutnax"],
  }
}

export function getCurrentLanguage() {
  return getStorageString(StorageKeys.APP_LANGUAGE, null)?.replace("-", "_");
}
export function setCurrentLanguage(key: string) {
  return setStorageString(StorageKeys.APP_LANGUAGE, key);
}

export function getLanguage(key: string) {
  if (!(languages as any)[key.replace("_", "-")]) return undefined;
  return import(`./list/${key.replace("_", "-")}.json`);
}
