const BASE_URL = "https://translate.googleapis.com/translate_a/single";

export interface TranslateRes {
  src: string;
  sentences: {
      trans: string;
  }[];
  translationString: string
}

const UrlBuilder = (query: string) => {
  const url = new URL(BASE_URL);

  url.searchParams.set("client", "gtx");
  url.searchParams.set("sl", "auto");
  url.searchParams.set("tl", "en");
  url.searchParams.set("dt", "t");
  url.searchParams.set("dj", "1");
  url.searchParams.set("source", "input");
  url.searchParams.set("q", query);
  return url.href;
};


const translateCache = new Map<string, TranslateRes>();

const addToCache = (query: string, value: TranslateRes) => {
  // only keep 10 latest items
  if (translateCache.size >= 10) {
    translateCache.delete(translateCache.keys().next().value!);
  }
  translateCache.set(query, value);
};

export const fetchTranslation = async (query: string) => {
  if (translateCache.has(query)) {
    return translateCache.get(query)!;
  }
  const url = UrlBuilder(query);
  const res = await fetch(url);
  const json = await res.json() as TranslateRes;


  const translationString = json.sentences.
    map(s => s?.trans).
    filter(Boolean).
    join("");

  json.translationString = translationString;

  addToCache(query, json);
  return json;
};