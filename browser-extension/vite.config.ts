import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import copy from "rollup-plugin-copy";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [
    react(),
    copy({
      targets: [
        { src: "public/manifest.json", dest: "dist" },
        { src: "src/contentScript.ts", dest: "dist" },
      ],
      hook: "writeBundle",
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        side_panel: resolve(__dirname, "side_panel/index.html"),
      },
      output: {
        entryFileNames: `assets/[name].js`,
      },
    },
  },
});
