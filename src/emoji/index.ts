import twemoji from 'twemoji';
import shortcodeToUnicode from './shortcodes-to-unicode.json';
import unicodeToShortcode from './unicode-to-shortcodes.json';

export function emojiShortcodeToUnicode(shortcode: string): string {
  return (shortcodeToUnicode as Record<string, string>)[shortcode];
}
export function emojiUnicodeToShortcode(unicode: string): string {
  return (unicodeToShortcode as Record<string, string>)[unicode];
}

const U200D = String.fromCharCode(0x200d);
const UFE0Fg = /\uFE0F/g;

export const unicodeToTwemojiUrl = (unicode: string) => {
  const codePoint = twemoji.convert.toCodePoint(
    unicode.indexOf(U200D) < 0 ? unicode.replace(UFE0Fg, "") : unicode
  );

  return `https://twemoji.maxcdn.com/v/latest/svg/${codePoint}.svg`;
}