import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import path from "path";
import dns from 'dns'

import { VitePWA } from 'vite-plugin-pwa'
// https://vitejs.dev/config/server-options.html#server-host
dns.setDefaultResultOrder('verbatim')


export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    }
  },
  plugins: [
    solidPlugin(),
    VitePWA({ 
      manifest: {
        name: 'Nerimity',
        short_name: 'Nerimity',
        theme_color: '#77a8f3',
        description: 'A modern and sleek chat app.',
        id: '/app',
        start_url: '/app',
        background_color: 'hsl(216deg 9% 8%)',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png', // <== don't add slash, for testing
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png', // <== don't remove slash, for testing
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      registerType: 'autoUpdate',
      devOptions: {
        enabled: false,
      }
    })
  ],
  build: {
    target: 'esnext',
  },
  server: {
    host: true,
    port: 3000
  }
});
