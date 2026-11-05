import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    base: "/admin/",
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("/@azure/msal-")) return "microsoft-auth";
            if (id.includes("/react-icons/")) return "icons";
            if (
              /\/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(
                id
              )
            )
              return "react";
          },
        },
      },
    },
    server: {
      port: 4000,
      proxy: {
        "/api": {
          target: env.API_PROXY_TARGET || "http://localhost:3000",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
  };
});
