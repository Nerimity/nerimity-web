import env from "@/common/env";

import { createSignal } from "solid-js";

export const [shortcodesToUnicode, setShortcodesToUnicode] = createSignal<
  Record<string, string>
>({});
export const [unicodesToShortcode, setUnicodesToShortcode] = createSignal<
  Record<string, string>
>({});

export function emojiShortcodeToUnicode(shortcode: string) {
  return shortcodesToUnicode()[shortcode];
}
export function emojiUnicodeToShortcode(unicode: string) {
  return unicodesToShortcode()[unicode];
}

const U200D = String.fromCharCode(0x200d);
const UFE0Fg = /\uFE0F/g;

export const unicodeToTwemojiUrl = (unicode: string) => {
  const codePoint = toCodePoint(
    unicode.indexOf(U200D) < 0 ? unicode.replace(UFE0Fg, "") : unicode
  );

  if (env.EMOJI_URL) {
    return `${env.EMOJI_URL}/${codePoint}.svg`;
  }

  return `https://twemoji.maxcdn.com/v/latest/svg/${codePoint}.svg`;
};

function toCodePoint(
  unicodeSurrogates: string,
  separator: string = "-"
): string {
  const codePoints: string[] = [];
  let lead = 0;
  let index = 0;

  while (index < unicodeSurrogates.length) {
    const current = unicodeSurrogates.charCodeAt(index++);

    if (lead) {
      const combined = 0x10000 + ((lead - 0xd800) << 10) + (current - 0xdc00);
      codePoints.push(combined.toString(16));
      lead = 0;
    } else if (current >= 0xd800 && current <= 0xdbff) {
      lead = current;
    } else {
      codePoints.push(current.toString(16));
    }
  }

  return codePoints.join(separator);
}

export const [emojis, setEmojis] = createSignal<typeof import("./emojis.json")>(
  []
);
export const lazyLoadEmojis = async () => {
  if (emojis().length) return;
  const res = await import("./emojis.json");
  setEmojis(res.default);

  const _shortcodesToUnicode = await import("./shortcodes-to-unicode.json");
  const _unicodesToShortcode = await import("./unicode-to-shortcodes.json");

  setShortcodesToUnicode(_shortcodesToUnicode.default);
  setUnicodesToShortcode(_unicodesToShortcode.default);
};
