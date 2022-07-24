import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import path from "path";
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
