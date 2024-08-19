import react from "@vitejs/plugin-react";
import path from "path";
import copy from "rollup-plugin-copy";
import { defineConfig } from "vite";

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
        side_panel: path.resolve(__dirname, "side_panel/index.html"),
      },
      output: {
        entryFileNames: `assets/[name].js`,
      },
    },
  },
});
