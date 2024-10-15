import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import path from "path";
import dns from "dns";
import autoprefixer from "autoprefixer";

// https://vitejs.dev/config/server-options.html#server-host
dns.setDefaultResultOrder("verbatim");

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [solidPlugin()],
  css: {
    preprocessorOptions: {
      scss: {
        api: "modern-compiler",
      },
    },
    postcss: {
      plugins: [autoprefixer()],
    },
  },
  build: {
    target: "esnext",
    sourcemap: true,
  },
  server: {
    host: true,
    port: 80,
    open: true,
    proxy: {
      "/cdn": {
        target: "http://localhost:8003",
        rewrite: (path) => path.replace(/^\/cdn/,""),
      },
    },
  },
});
