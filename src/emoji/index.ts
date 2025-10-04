import env from "@/common/env";
import twemoji from "twemoji";
import shortcodesToUnicode from "./shortcodes-to-unicode.json";
import unicodesToShortcode from "./unicode-to-shortcodes.json";

export function emojiShortcodeToUnicode(shortcode: string) {
  return (shortcodesToUnicode as Record<string, string>)[shortcode];
}
export function emojiUnicodeToShortcode(unicode: string) {
  return (unicodesToShortcode as Record<string, string>)[unicode];
}

const U200D = String.fromCharCode(0x200d);
const UFE0Fg = /\uFE0F/g;

export const unicodeToTwemojiUrl = (unicode: string) => {
  const codePoint = twemoji.convert.toCodePoint(
    unicode.indexOf(U200D) < 0 ? unicode.replace(UFE0Fg, "") : unicode
  );

  if (env.EMOJI_URL) {
    return `${env.EMOJI_URL}/${codePoint}.svg`;
  }

  return `https://twemoji.maxcdn.com/v/latest/svg/${codePoint}.svg`;
};