const BASE_URL = "https://translate.googleapis.com/translate_a/single";

export interface TranslateRes {
  src: string;
  sentences: {
    trans: string;
  }[];
  translationString: string;
}

const GOOGLE_LANGUAGE_MAP: Record<string, string> = {
  "en-gb": "en",
  "af-za": "af",
  "ar-ps": "ar",
  "be-xo": "be",
  "pt-br": "pt",
  "zh-hans": "zh-CN",
  "zn-hant": "zh-TW",
  "nl-nl": "nl",
  "fr-fr": "fr",
  "de-de": "de",
  "hu-hu": "hu",
  "fil-ph": "tl",
  "pl-pl": "pl",
  "ro-ro": "ro",
  "ru-ru": "ru",
  "es-es": "es",
  "th-th": "th",
  "tr-tr": "tr",
  "uw-uw": "en",
};

function getActiveLanguageCode() {
  try {
    const stored = localStorage.getItem("appLanguage");
    return stored?.replace("_", "-").toLowerCase() || "en-gb";
  } catch {
    return "en-gb";
  }
}

const UrlBuilder = (query: string) => {
  const activeLang = getActiveLanguageCode();
  const targetLang = GOOGLE_LANGUAGE_MAP[activeLang] ?? "en";

  const url = new URL(BASE_URL);

  url.searchParams.set("client", "gtx");
  url.searchParams.set("sl", "auto");
  url.searchParams.set("tl", targetLang);
  url.searchParams.set("dt", "t");
  url.searchParams.set("dj", "1");
  url.searchParams.set("source", "input");
  url.searchParams.set("q", query);

  return url.href;
};

const MAX_CACHE_SIZE = 20;
const translateCache = new Map<string, TranslateRes>();

const addToCache = (key: string, value: TranslateRes) => {
  if (translateCache.size >= MAX_CACHE_SIZE) {
    translateCache.delete(translateCache.keys().next().value!);
  }
  translateCache.set(key, value);
};

export const fetchTranslation = async (query: string) => {
  const activeLang = getActiveLanguageCode();
  const cacheKey = `${activeLang}:${query}`;

  if (translateCache.has(cacheKey)) {
    return translateCache.get(cacheKey)!;
  }

  const url = UrlBuilder(query);
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error("Translation request failed");
  }

  const json = (await res.json()) as TranslateRes;

  const sentences = Array.isArray(json.sentences) ? json.sentences : [];

  const translationString = sentences
    .map((s) => s?.trans || "")
    .filter(Boolean)
    .join("");

  json.translationString = translationString;
  json.src = json.src?.toLowerCase?.() ?? json.src ?? "auto";

  addToCache(cacheKey, json);

  return json;
};
