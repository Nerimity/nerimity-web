import { defineConfig, Plugin } from "vite";
import solidPlugin from "vite-plugin-solid";
import path from "path";
import dns from "dns";
import autoprefixer from "autoprefixer";
import postcssNested from "postcss-nested";
import { sha256 } from "js-sha256";

// https://vitejs.dev/config/server-options.html#server-host
dns.setDefaultResultOrder("verbatim");

const minifyi18nPlugin = (localeDir: string): Plugin => {
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
      if (normalizedId.startsWith(normalizedLocaleDir)) {
        const locales = JSON.parse(code);
        return JSON.stringify(localeToCodedFlat(locales));
      }

      const replaceKey = (
        _match: string,
        prefix: string,
        key: string,
        suffix: string
      ) => {
        const originalKey = key.trim();

        return prefix + generateMessageId(originalKey) + suffix;
      };

      const resultDynamic = code
        .replace(translationKeyRegex, replaceKey)
        .replace(transComponentKeyRegex, replaceKey)
        .replace(unescapedTransComponentKeyRegex, replaceKey);

      return resultDynamic;
    },
  };
};
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ["@codemirror/state", "@codemirror/view"],
  },
  plugins: [minifyi18nPlugin("./src/locales/list"), solidPlugin()],
  css: {
    postcss: {
      plugins: [autoprefixer(), postcssNested()],
    },
  },
  build: {
    target: "esnext",
    sourcemap: true,
  },
  server: {
    host: true,
    port: 3000,
    // open: true,
  },
});
