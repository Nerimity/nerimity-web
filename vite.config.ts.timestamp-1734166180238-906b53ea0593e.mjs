// vite.config.ts
import { defineConfig } from "file:///E:/Projects/Nerimity/nerimity-web/node_modules/.pnpm/vite@5.4.8_@types+node@20.16.11_sass@1.79.4/node_modules/vite/dist/node/index.js";
import solidPlugin from "file:///E:/Projects/Nerimity/nerimity-web/node_modules/.pnpm/vite-plugin-solid@2.10.2_solid-js@1.9.2_vite@5.4.8_@types+node@20.16.11_sass@1.79.4_/node_modules/vite-plugin-solid/dist/esm/index.mjs";
import path from "path";
import dns from "dns";
import autoprefixer from "file:///E:/Projects/Nerimity/nerimity-web/node_modules/.pnpm/autoprefixer@10.4.20_postcss@8.4.47/node_modules/autoprefixer/lib/autoprefixer.js";
var __vite_injected_original_dirname = "E:\\Projects\\Nerimity\\nerimity-web";
dns.setDefaultResultOrder("verbatim");
var vite_config_default = defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  optimizeDeps: {
    include: ["@codemirror/state", "@codemirror/view"]
  },
  plugins: [solidPlugin()],
  css: {
    preprocessorOptions: {
      scss: {
        api: "modern-compiler"
      }
    },
    postcss: {
      plugins: [autoprefixer()]
    }
  },
  build: {
    target: "esnext",
    sourcemap: true
  },
  server: {
    host: true,
    port: 3e3,
    open: true
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJFOlxcXFxQcm9qZWN0c1xcXFxOZXJpbWl0eVxcXFxuZXJpbWl0eS13ZWJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkU6XFxcXFByb2plY3RzXFxcXE5lcmltaXR5XFxcXG5lcmltaXR5LXdlYlxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRTovUHJvamVjdHMvTmVyaW1pdHkvbmVyaW1pdHktd2ViL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHNvbGlkUGx1Z2luIGZyb20gXCJ2aXRlLXBsdWdpbi1zb2xpZFwiO1xyXG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQgZG5zIGZyb20gXCJkbnNcIjtcclxuaW1wb3J0IGF1dG9wcmVmaXhlciBmcm9tIFwiYXV0b3ByZWZpeGVyXCI7XHJcblxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL3NlcnZlci1vcHRpb25zLmh0bWwjc2VydmVyLWhvc3RcclxuZG5zLnNldERlZmF1bHRSZXN1bHRPcmRlcihcInZlcmJhdGltXCIpO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICByZXNvbHZlOiB7XHJcbiAgICBhbGlhczoge1xyXG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcclxuICAgIH0sXHJcbiAgfSxcclxuICBvcHRpbWl6ZURlcHM6IHtcclxuICAgIGluY2x1ZGU6IFtcIkBjb2RlbWlycm9yL3N0YXRlXCIsIFwiQGNvZGVtaXJyb3Ivdmlld1wiXSxcclxuICB9LFxyXG4gIHBsdWdpbnM6IFtzb2xpZFBsdWdpbigpXSxcclxuICBjc3M6IHtcclxuICAgIHByZXByb2Nlc3Nvck9wdGlvbnM6IHtcclxuICAgICAgc2Nzczoge1xyXG4gICAgICAgIGFwaTogXCJtb2Rlcm4tY29tcGlsZXJcIixcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgICBwb3N0Y3NzOiB7XHJcbiAgICAgIHBsdWdpbnM6IFthdXRvcHJlZml4ZXIoKV0sXHJcbiAgICB9LFxyXG4gIH0sXHJcbiAgYnVpbGQ6IHtcclxuICAgIHRhcmdldDogXCJlc25leHRcIixcclxuICAgIHNvdXJjZW1hcDogdHJ1ZSxcclxuICB9LFxyXG4gIHNlcnZlcjoge1xyXG4gICAgaG9zdDogdHJ1ZSxcclxuICAgIHBvcnQ6IDMwMDAsXHJcbiAgICBvcGVuOiB0cnVlLFxyXG4gIH0sXHJcbn0pO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTZSLFNBQVMsb0JBQW9CO0FBQzFULE9BQU8saUJBQWlCO0FBQ3hCLE9BQU8sVUFBVTtBQUNqQixPQUFPLFNBQVM7QUFDaEIsT0FBTyxrQkFBa0I7QUFKekIsSUFBTSxtQ0FBbUM7QUFPekMsSUFBSSxzQkFBc0IsVUFBVTtBQUVwQyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsSUFDdEM7QUFBQSxFQUNGO0FBQUEsRUFDQSxjQUFjO0FBQUEsSUFDWixTQUFTLENBQUMscUJBQXFCLGtCQUFrQjtBQUFBLEVBQ25EO0FBQUEsRUFDQSxTQUFTLENBQUMsWUFBWSxDQUFDO0FBQUEsRUFDdkIsS0FBSztBQUFBLElBQ0gscUJBQXFCO0FBQUEsTUFDbkIsTUFBTTtBQUFBLFFBQ0osS0FBSztBQUFBLE1BQ1A7QUFBQSxJQUNGO0FBQUEsSUFDQSxTQUFTO0FBQUEsTUFDUCxTQUFTLENBQUMsYUFBYSxDQUFDO0FBQUEsSUFDMUI7QUFBQSxFQUNGO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsSUFDUixXQUFXO0FBQUEsRUFDYjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLEVBQ1I7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
