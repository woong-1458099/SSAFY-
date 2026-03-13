import { cpSync, existsSync } from "fs";
import { resolve } from "path";
import { defineConfig, type Plugin, type ResolvedConfig } from "vite";

function copyRuntimeAssets(): Plugin {
  let config: ResolvedConfig;

  return {
    name: "copy-runtime-assets",
    apply: "build",
    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },
    closeBundle() {
      const sourceDir = resolve(__dirname, "assets", "game");
      const targetDir = resolve(__dirname, config.build.outDir, "assets", "game");

      if (!existsSync(sourceDir)) {
        return;
      }

      cpSync(sourceDir, targetDir, { recursive: true, force: true });
    }
  };
}

export default defineConfig({
  server: {
    port: 5173
  },
  plugins: [copyRuntimeAssets()],
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
