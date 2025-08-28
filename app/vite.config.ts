import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 4000,
    proxy: {
      // 代理所有 /api 請求到 CodePush 伺服器
      "/api": {
        target: "https://codepush-gammon.gammonconstruction.com/",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),

      },
    },
  },
});
