import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import copy from "rollup-plugin-copy";

export default defineConfig({
  plugins: [
    react(),
    copy({
      targets: [
        { src: "public/manifest.json", dest: "dist" },
        // { src: "public/background.js", dest: "dist" },
        { src: "src/contentScript.ts", dest: "dist" },
        // Add other static files here as needed
      ],
      hook: "writeBundle",
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        // popup: resolve(__dirname, "popup/index.html"),
        side_panel: resolve(__dirname, "side_panel/index.html"),
        // background: resolve(__dirname, "public/background.js"),
        // contentScript: resolve(__dirname, "public/contentScript.js"),
      },
      output: {
        entryFileNames: `assets/[name].js`,
      },
    },
  },
});
