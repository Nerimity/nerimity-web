import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import path from "path";
import dns from "dns";
import autoprefixer from "autoprefixer";
import postcssNested from "postcss-nested";
import { minifyi18nPlugin } from "./src/minifyi18nPlugin";

// https://vitejs.dev/config/server-options.html#server-host
dns.setDefaultResultOrder("verbatim");

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
