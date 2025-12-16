import { StorageKeys, useLocalStorage } from "@/common/localStorage";

export interface Language {
  name: string; // Display name
  nativeName?: string; // (Optional) Native name
  emoji: string; // Some unicode flag emoji, idk
  contributors: string[]; // array of names
  rtl?: boolean; // (Optional) Right-to-left support (Placeholder)
}

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
  "ar-ps": {
    name: "Arabic",
    nativeName: "العربية",
    emoji: "🇵🇸",
    contributors: ["https://github.com/TrueLuna"],
    rtl: true, // not really used since I manually implemented it in the code. But might be useful in the future.
  },
  "be-xo": {
    name: "Belarusian (Traditional)",
    nativeName: "Беларуская (традыцыйная)",
    emoji: "🇧🇾",
    contributors: ["https://github.com/Dzi-Mieha", "https://github.com/1enify"],
  },
  "pt-br": {
    name: "Brazilian Portuguese",
    nativeName: "Português (Brasil)",
    emoji: "🇧🇷",
    contributors: ["https://github.com/Jerkycat", "https://gitlab.com/Cirnos"],
  },
  "zh-hans": {
    name: "Chinese (Simplified)",
    nativeName: "简体中文",
    emoji: "🇨🇳",
    contributors: ["https://github.com/Coolsigh"],
  },
  "zn-hant": {
    name: "Chinese (Traditional)",
    nativeName: "繁體中文",
    emoji: "🇹🇼",
    contributors: ["Dsiahrz"],
  },
  "nl-nl": {
    name: "Dutch",
    nativeName: "Nederlands",
    emoji: "🇳🇱",
    contributors: ["https://github.com/captainqdev"],
  },
  "fr-FR": {
    name: "French",
    nativeName: "Français",
    emoji: "🇫🇷",
    contributors: ["https://github.com/guiguitator"],
  },
  "de-de": {
    name: "German",
    nativeName: "Deutsch",
    emoji: "🇩🇪",
    contributors: [
      "https://github.com/F-iiral",
      "https://github.com/Deutscher775",
      "https://github.com/mathiiiiiis",
    ],
  },
  "hu-hu": {
    name: "Hungarian",
    nativeName: "Magyar",
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
    nativeName: "Polski",
    emoji: "🇵🇱",
    contributors: ["https://github.com/Ciach0", "https://github.com/CyberL1"],
  },
  "ro-ro": {
    name: "Romanian",
    nativeName: "Română",
    emoji: "🇷🇴",
    contributors: ["GNU/Alex"],
  },
  "ru-ru": {
    name: "Russian",
    nativeName: "Русский",
    emoji: "🇷🇺",
    contributors: [
      "https://github.com/FAYSi223",
      "https://github.com/eshkq",
      "https://github.com/Effently",
    ],
  },
  "es-es": {
    name: "Spanish",
    nativeName: "Español",
    emoji: "🇪🇸",
    contributors: ["https://github.com/World170", "Linterna001"],
  },
  "th-th": {
    name: "Thai",
    nativeName: "ไทย",
    emoji: "🇹🇭",
    contributors: ["ccsleep"],
  },
  "tr-tr": {
    name: "Turkish",
    nativeName: "Türkçe",
    emoji: "🇹🇷",
    contributors: [
      "https://github.com/M0nsterKitty",
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
