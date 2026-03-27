import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: process.env.VITE_API_PROXY_TARGET ?? "http://localhost:8080",
        changeOrigin: true
      }
    }
  },
  resolve: {
    alias: {
      "@app": resolve(__dirname, "src/app"),
      "@core": resolve(__dirname, "src/core"),
      "@shared": resolve(__dirname, "src/shared"),
      "@features": resolve(__dirname, "src/features"),
      "@scenes": resolve(__dirname, "src/scenes"),
      "@infra": resolve(__dirname, "src/infra")
    }
  }
});
