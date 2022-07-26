import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import path from "path";
import dns from 'dns'

// https://vitejs.dev/config/server-options.html#server-host
dns.setDefaultResultOrder('verbatim')

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    }
  },
  plugins: [solidPlugin()],
  build: {
    target: 'esnext',
  },
  server: {
    port: 3000
  }
});
