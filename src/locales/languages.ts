import {
  StorageKeys,
  getStorageString,
  setStorageString,
  useLocalStorage,
} from "@/common/localStorage";

export interface Language {
  name: string;
  emoji: string;
  contributors: string[];
}

// name: Display name
// emoji: Some unicode flag emoji, idk
// contributors: array of names

export const languages = {
  "en-gb": {
    name: "English",
    emoji: "🇬🇧",
    contributors: [
      "https://github.com/SupertigerDev",
      "https://github.com/Asraye",
    ],
  },
  "af-za": {
    name: "Afrikaans",
    emoji: "🇿🇦",
    contributors: ["https://github.com/mooocksadev"],
  },
  "be-xo": {
    name: "Belarusian (Traditional)",
    emoji: "🇧🇾",
    contributors: ["https://github.com/Dzi-Mieha", "https://github.com/1enify"],
  },
  "pt-br": {
    name: "Brazilian Portuguese",
    emoji: "🇧🇷",
    contributors: ["https://github.com/Jerkycat", "https://gitlab.com/Cirnos"],
  },
  "zh-hans": {
    name: "Chinese (Simplified)",
    emoji: "🇨🇳",
    contributors: ["https://github.com/Coolsigh"],
  },
  "zn-hant": {
    name: "Chinese (Traditional)",
    emoji: "🇹🇼",
    contributors: ["Dsiahrz"],
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
    contributors: [
      "https://github.com/F-iiral",
      "https://github.com/Deutscher775",
      "https://github.com/mathiiiiiis",
    ],
  },
  "hu-hu": {
    name: "Hungarian",
    emoji: "🇭🇺",
    contributors: ["https://github.com/andrasdaradici"],
  },
  "fil-ph": {
    name: "Filipino",
    emoji: "🇵🇭",
    contributors: ["https://github.com/serenemm"],
  },
  "pl-pl": {
    name: "Polish",
    emoji: "🇵🇱",
    contributors: ["https://github.com/Ciach0", "https://github.com/CyberL1"],
  },
  "ro-ro": {
    name: "Romanian",
    emoji: "🇷🇴",
    contributors: ["GNU/Alex"],
  },
  "ru-ru": {
    name: "Russian",
    emoji: "🇷🇺",
    contributors: [
      "https://github.com/FAYSi223",
      "https://github.com/eshkq",
      "https://github.com/Effently",
    ],
  },
  "es-es": {
    name: "Spanish",
    emoji: "🇪🇸",
    contributors: ["Linterna001"],
  },
  "th-th": {
    name: "Thai",
    emoji: "🇹🇭",
    contributors: ["ccsleep"],
  },
  "tr-tr": {
    name: "Turkish",
    emoji: "🇹🇷",
    contributors: [
      "https://github.com/lexerotk",
      "https://github.com/slideglide",
    ],
  },
  "uw-uw": {
    name: "UwU",
    emoji: "🐱",
    contributors: [
      "https://github.com/spookehneko123",
      "https://github.com/Asraye",
    ],
  },
};

const [_getCurrentLanguage, setCurrentLanguage] = useLocalStorage(
  StorageKeys.APP_LANGUAGE,
  "en-gb",
  true
);

export function getCurrentLanguage() {
  return _getCurrentLanguage()?.replace("-", "_");
}
export { setCurrentLanguage };

export function getLanguage(key: string) {
  if (!(languages as any)[key.replace("_", "-")]) return undefined;
  return import(`./list/${key.replace("_", "-")}.json?raw`).then(
    (res) => res.default
  );
}
