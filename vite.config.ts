import { defineConfig, Plugin } from "vite";
import solidPlugin from "vite-plugin-solid";
import path from "path";
import dns from "dns";
import autoprefixer from "autoprefixer";
import postcssNested from "postcss-nested";
import { minifyi18nPlugin } from "./src/minifyi18nPlugin";
import MagicString from "magic-string";

// https://vitejs.dev/config/server-options.html#server-host
dns.setDefaultResultOrder("verbatim");

const excludeTextPage = (): Plugin => {
  let isDev: boolean;
  return {
    name: "exclude-text-page",
    enforce: "pre",
    configResolved(config) {
      isDev = config.command === "serve";
    },
    transform(code) {
      if (isDev) return;
      if (!code.includes("<DevTestRoutes />")) return;

      const s = new MagicString(code);
      const start = code.indexOf("<DevTestRoutes />");
      s.remove(start, start + "<DevTestRoutes />".length);

      return {
        code: s.toString(),
        map: s.generateMap({ hires: true })
      };
    }
  };
};

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  optimizeDeps: {
    include: ["@codemirror/state", "@codemirror/view"]
  },
  plugins: [
    excludeTextPage(),
    minifyi18nPlugin("./src/locales/list"),
    solidPlugin()
  ],
  css: {
    postcss: {
      plugins: [autoprefixer(), postcssNested()]
    }
  },
  build: {
    target: "esnext",
    sourcemap: true,
    // lightning css seems to strip out -webkit-background-clip: text;
    // which is needed for chrome 119
    cssMinify: "esbuild"
  },
  server: {
    host: true,
    allowedHosts: ["local.nerimity.com"],
    port: 3000
    // open: true,
  }
});
