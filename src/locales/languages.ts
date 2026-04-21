import { StorageKeys, useLocalStorage } from "@/common/localStorage";

export interface Language {
  name: string; // Display name
  nativeName?: string; // (Optional) Native name
  emoji: string; // Some unicode flag emoji, idk
  contributors: string[]; // array of names
  rtl?: boolean; // (Optional) Right-to-left support (Placeholder)
}

export const languages: Record<string, Language> = {
  "en-gb": {
    name: "English (British)",
    emoji: "🇬🇧",
    contributors: [
      "https://github.com/SupertigerDev",
      "Asraye",
      "https://github.com/1enify"
    ]
  },
  "en-us": {
    name: "English (American)",
    emoji: "🇺🇸",
    contributors: [
      "https://github.com/SupertigerDev",
      "https://github.com/1enify"
    ]
  },
  "af-za": {
    name: "Afrikaans",
    emoji: "🇿🇦",
    contributors: ["https://github.com/mooocksadev"]
  },
  "ar-ps": {
    name: "Arabic",
    nativeName: "العربية",
    emoji: "🇵🇸",
    contributors: ["TrueLuna"],
    rtl: true // not really used since I manually implemented it in the code. But might be useful in the future.
  },
  "be-tarask": {
    name: "Belarusian (Traditional)",
    nativeName: "Беларуская (тарашкевіца)",
    emoji: "🇧🇾",
    contributors: ["https://github.com/1enify", "https://github.com/Dzi-Mieha"]
  },
  "pt-br": {
    name: "Brazilian Portuguese",
    nativeName: "Português (Brasil)",
    emoji: "🇧🇷",
    contributors: [
      "https://gitlab.com/Cirnos",
      "https://github.com/Jerkycat",
      "https://github.com/Mediixou"
    ]
  },
  "ca-ca": {
    name: "Catalan",
    nativeName: "Català",
    emoji: "🇦🇩",
    contributors: ["https://github.com/World170"]
  },
  "zh-hans": {
    name: "Chinese (Simplified)",
    nativeName: "简体中文",
    emoji: "🇨🇳",
    contributors: ["https://github.com/Coolsigh"]
  },
  "zh-hant": {
    name: "Chinese (Traditional)",
    nativeName: "繁體中文",
    emoji: "🇹🇼",
    contributors: ["Dsiahrz"]
  },
  "nl-nl": {
    name: "Dutch",
    nativeName: "Nederlands",
    emoji: "🇳🇱",
    contributors: ["Smoonium", "https://github.com/captainqdev"]
  },
  "fr-fr": {
    name: "French",
    nativeName: "Français",
    emoji: "🇫🇷",
    contributors: ["https://github.com/guiguitator"]
  },
  "de-de": {
    name: "German",
    nativeName: "Deutsch",
    emoji: "🇩🇪",
    contributors: [
      "https://github.com/F-iiral",
      "https://github.com/Deutscher775",
      "https://github.com/mathiiiiiis"
    ]
  },
  "it-it": {
    name: "Italian",
    nativeName: "Italiano",
    emoji: "🇮🇹",
    contributors: ["jerid616"]
  },
  "hu-hu": {
    name: "Hungarian",
    nativeName: "Magyar",
    emoji: "🇭🇺",
    contributors: ["https://github.com/andrasdaradici"]
  },
  "ja-jp": {
    name: "Japanese",
    nativeName: "日本語",
    emoji: "🇯🇵",
    contributors: ["https://github.com/ch3rryc0l4xd"]
  },
  "fil-ph": {
    name: "Filipino",
    emoji: "🇵🇭",
    contributors: ["https://github.com/serenemm"]
  },
  "pl-pl": {
    name: "Polish",
    nativeName: "Polski",
    emoji: "🇵🇱",
    contributors: ["https://github.com/Ciach0", "https://github.com/CyberL1"]
  },
  "ro-ro": {
    name: "Romanian",
    nativeName: "Română",
    emoji: "🇷🇴",
    contributors: ["GNU/Alex", "Laums0"]
  },
  "ru-ru": {
    name: "Russian",
    nativeName: "Русский",
    emoji: "🇷🇺",
    contributors: [
      "FAYSi223",
      "https://github.com/eshkq",
      "https://github.com/Effently"
    ]
  },
  "es-es": {
    name: "Spanish",
    nativeName: "Español",
    emoji: "🇪🇸",
    contributors: ["https://github.com/World170", "Linterna001"]
  },
  "es-latam": {
    name: "Spanish (Latin American)",
    nativeName: "Español (Latinoamérica)",
    emoji: "🇲🇽",
    contributors: ["https://github.com/lolyyyyu667890"]
  },
  "sv-sv": {
    name: "Swedish",
    nativeName: "Svenska",
    emoji: "🇸🇪",
    contributors: ["Hyruled", "reks"]
  },
  "th-th": {
    name: "Thai",
    nativeName: "ไทย",
    emoji: "🇹🇭",
    contributors: ["https://github.com/CCSleep"]
  },
  "tr-tr": {
    name: "Turkish",
    nativeName: "Türkçe",
    emoji: "🇹🇷",
    contributors: [
      "https://github.com/balitorius",
      "https://github.com/M0nsterKitty",
      "https://github.com/lexerotk",
      "https://github.com/slideglide"
    ]
  },
  "uk-ua": {
    name: "Ukrainian",
    nativeName: "Українська",
    emoji: "🇺🇦",
    contributors: [
      "rkxd",
      "https://github.com/1enify",
      "Shiroi karasu"
    ]
  },
  "uw-uw": {
    name: "UwU",
    emoji: "🐱",
    contributors: ["Berry", "Asraye"]
  }
};

const detectDefaultLanguage = (): string => {
  if (typeof navigator === "undefined") return "en-gb";

  const browserLocales =
    navigator.languages && navigator.languages.length
      ? navigator.languages
      : [navigator.language];

  const supportedKeys = Object.keys(languages);

  for (const locale of browserLocales) {
    const lang = locale.toLowerCase();

    if (lang === "zh-tw" || lang === "zh-hk" || lang.startsWith("zh-hant")) {
      return "zh-hant";
    }

    if (languages[lang]) {
      return lang;
    }

    const base = lang.split("-")[0];
    const partialMatch = supportedKeys.find((key) => key.startsWith(base!));
    if (partialMatch) return partialMatch;
  }

  return "en-gb";
};

const [_getCurrentLanguage, setCurrentLanguage] = useLocalStorage(
  StorageKeys.APP_LANGUAGE,
  detectDefaultLanguage(),
  true
);

export function getCurrentLanguage() {
  return _getCurrentLanguage()?.replace("-", "_");
}

export function getCurrentLanguageISO() {
  return _getCurrentLanguage()?.replace("_", "-");
}

export { setCurrentLanguage };

export function getLanguage(key: string) {
  if (!(languages as any)[key.replace("_", "-")]) return undefined;
  return import(`./list/${key.replace("_", "-")}.json?raw`).then(
    (res) => res.default
  );
}
