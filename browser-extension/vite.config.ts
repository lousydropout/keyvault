import react from "@vitejs/plugin-react";
import path from "path";
import copy from "rollup-plugin-copy";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [
    react(),
    copy({
      targets: [
        {
          src:
            mode === "firefox"
              ? "manifests/manifest.firefox.json"
              : "manifests/manifest.chrome.json",
          dest: "dist",
          rename: "manifest.json",
        },
      ],
      hook: "writeBundle",
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        // Define the HTML entry point for side panel
        side_panel: path.resolve(__dirname, "side_panel/index.html"),
        background: path.resolve(
          __dirname,
          `src/scripts/background.${mode}.ts`
        ),
        contentScript: path.resolve(
          __dirname,
          `src/scripts/contentScript.${mode}.js`
        ),
      },
      output: {
        format: "es",
        dir: "dist",
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === "background") return "background.js";
          if (chunkInfo.name === "contentScript") return "contentScript.js";
          return `assets/[name].js`;
        },
      },
    },
  },
}));
