import { getLanguageName } from "@/highlight-js-parser";
import hljs from "highlight.js/lib/core";

export async function register(langName: string) {
  const langFilename = getLanguageName(langName);
  if (!langFilename) return { hljs };
  const lang = await import(
    `../../node_modules/highlight.js/es/languages/${langFilename}.js`
  );
  hljs.registerLanguage(langFilename, lang.default);

  return { hljs, name: hljs.getLanguage(langName)?.name || "" };
}
