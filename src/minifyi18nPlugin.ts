import * as path from "path";
import { sha256 } from "js-sha256";
import { Plugin } from "vite";
import MagicString from "magic-string";
import fs from "fs";

export const minifyi18nPlugin = (localeDir: string): Plugin => {
  const absoluteLocaleDir = path.resolve(process.cwd(), localeDir);

  const normalizedLocaleDir = path.normalize(absoluteLocaleDir + path.sep);

  const UNIT_SEPARATOR = "\u001F";

  function generateMessageId(msg: string, context = "") {
    return hexToBase64(sha256(msg + UNIT_SEPARATOR + (context || ""))).slice(
      0,
      6
    );
  }

  function hexToBase64(hexStr: string) {
    const base64: string[] = [];

    for (let i = 0; i < hexStr.length; i++) {
      base64.push(
        !((i - 1) & 1)
          ? String.fromCharCode(parseInt(hexStr.substring(i - 1, i + 1), 16))
          : ""
      );
    }

    return btoa(base64.join(""));
  }

  function localeToCodedFlat(
    locale: Record<string, unknown>,
    prefix: string = ""
  ): Record<string, string> {
    let result: Record<string, string> = {};

    for (const [key, value] of Object.entries(locale)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (typeof value === "string") {
        result[generateMessageId(fullKey)] = value;
      } else if (value && typeof value === "object" && !Array.isArray(value)) {
        const nested = localeToCodedFlat(
          value as Record<string, unknown>,
          fullKey
        );

        result = {
          ...result,
          ...nested,
        };
      }
    }

    return result;
  }
  const translationKeyRegex = /\b(t\(\s*["'])([^"']*?)(["']\s*[^)]*\))/g;
  const transComponentKeyRegex =
    /(<Trans\s+[^>]*key=["'])([^"']*)(["'][^>]*>)/g;
  const unescapedTransComponentKeyRegex =
    /(<UnescapedTrans\s+[^>]*key=["'])([^"']*)(["'][^>]*>)/g;

  return {
    name: "minifyi18n",
    enforce: "pre",
    transform(code, id) {
      const normalizedId = path.normalize(id);

      // --- 1. Handle Locale Files (JSON) ---
      if (normalizedId.startsWith(normalizedLocaleDir)) {
        const locales = JSON.parse(
          fs.readFileSync(id.split("?raw")?.[0]!, "utf-8")
        );
        const transformedCode = JSON.stringify(localeToCodedFlat(locales));

        return {
          code: "export default " + transformedCode,
          map: null,
        };
      }

      // --- 2. Handle Source Files (TS/TSX) ---
      if (!id.endsWith(".ts") && !id.endsWith(".tsx")) return null;

      const s = new MagicString(code);

      const replaceInCode = (regex: RegExp) => {
        let match: RegExpExecArray | null;
        regex.lastIndex = 0;

        while ((match = regex.exec(code)) !== null) {
          const [, prefix, key] = match as unknown as [
            string, // Full Match (Skipped by first comma)
            string, // Prefix
            string, // Key
            string // Suffix (Skipped by last comma)
          ];

          const originalKey = key.trim();
          const newKey = generateMessageId(originalKey);

          const startOfKey = match.index + prefix.length;
          const endOfKey = startOfKey + key.length;

          s.overwrite(startOfKey, endOfKey, newKey);
        }
      };

      replaceInCode(translationKeyRegex);
      replaceInCode(transComponentKeyRegex);
      replaceInCode(unescapedTransComponentKeyRegex);

      if (!s.hasChanged()) return null;

      return {
        code: s.toString(),
        map: s.generateMap({ hires: true }),
      };
    },
  };
};
