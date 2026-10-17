import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8090",
        changeOrigin: true,
      },
      "/_/": {
        target: "http://127.0.0.1:8090",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
});
