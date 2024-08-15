// vite.config.ts
import path from "path";
import { defineConfig } from "file:///home/lousydropout/src/astar/keyvault/browser-extension/node_modules/.pnpm/vite@5.0.12_@types+node@20.11.16_terser@5.31.3/node_modules/vite/dist/node/index.js";
import react from "file:///home/lousydropout/src/astar/keyvault/browser-extension/node_modules/.pnpm/@vitejs+plugin-react@4.2.1_vite@5.0.12_@types+node@20.11.16_terser@5.31.3_/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { resolve } from "path";
import copy from "file:///home/lousydropout/src/astar/keyvault/browser-extension/node_modules/.pnpm/rollup-plugin-copy@3.5.0/node_modules/rollup-plugin-copy/dist/index.commonjs.js";
var __vite_injected_original_dirname = "/home/lousydropout/src/astar/keyvault/browser-extension";
var vite_config_default = defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  plugins: [
    react(),
    copy({
      targets: [
        { src: "public/manifest.json", dest: "dist" },
        { src: "src/contentScript.ts", dest: "dist" }
      ],
      hook: "writeBundle"
    })
  ],
  build: {
    rollupOptions: {
      input: {
        side_panel: resolve(__vite_injected_original_dirname, "side_panel/index.html")
      },
      output: {
        entryFileNames: `assets/[name].js`
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9sb3VzeWRyb3BvdXQvc3JjL2FzdGFyL2tleXZhdWx0L2Jyb3dzZXItZXh0ZW5zaW9uXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9sb3VzeWRyb3BvdXQvc3JjL2FzdGFyL2tleXZhdWx0L2Jyb3dzZXItZXh0ZW5zaW9uL3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL2xvdXN5ZHJvcG91dC9zcmMvYXN0YXIva2V5dmF1bHQvYnJvd3Nlci1leHRlbnNpb24vdml0ZS5jb25maWcudHNcIjtpbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcbmltcG9ydCByZWFjdCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3RcIjtcbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IGNvcHkgZnJvbSBcInJvbGx1cC1wbHVnaW4tY29weVwiO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxuICAgIH0sXG4gIH0sXG4gIHBsdWdpbnM6IFtcbiAgICByZWFjdCgpLFxuICAgIGNvcHkoe1xuICAgICAgdGFyZ2V0czogW1xuICAgICAgICB7IHNyYzogXCJwdWJsaWMvbWFuaWZlc3QuanNvblwiLCBkZXN0OiBcImRpc3RcIiB9LFxuICAgICAgICB7IHNyYzogXCJzcmMvY29udGVudFNjcmlwdC50c1wiLCBkZXN0OiBcImRpc3RcIiB9LFxuICAgICAgXSxcbiAgICAgIGhvb2s6IFwid3JpdGVCdW5kbGVcIixcbiAgICB9KSxcbiAgXSxcbiAgYnVpbGQ6IHtcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBpbnB1dDoge1xuICAgICAgICBzaWRlX3BhbmVsOiByZXNvbHZlKF9fZGlybmFtZSwgXCJzaWRlX3BhbmVsL2luZGV4Lmh0bWxcIiksXG4gICAgICB9LFxuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIGVudHJ5RmlsZU5hbWVzOiBgYXNzZXRzL1tuYW1lXS5qc2AsXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBdVYsT0FBTyxVQUFVO0FBQ3hXLFNBQVMsb0JBQW9CO0FBQzdCLE9BQU8sV0FBVztBQUNsQixTQUFTLGVBQWU7QUFDeEIsT0FBTyxVQUFVO0FBSmpCLElBQU0sbUNBQW1DO0FBTXpDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxJQUN0QztBQUFBLEVBQ0Y7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLEtBQUs7QUFBQSxNQUNILFNBQVM7QUFBQSxRQUNQLEVBQUUsS0FBSyx3QkFBd0IsTUFBTSxPQUFPO0FBQUEsUUFDNUMsRUFBRSxLQUFLLHdCQUF3QixNQUFNLE9BQU87QUFBQSxNQUM5QztBQUFBLE1BQ0EsTUFBTTtBQUFBLElBQ1IsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLGVBQWU7QUFBQSxNQUNiLE9BQU87QUFBQSxRQUNMLFlBQVksUUFBUSxrQ0FBVyx1QkFBdUI7QUFBQSxNQUN4RDtBQUFBLE1BQ0EsUUFBUTtBQUFBLFFBQ04sZ0JBQWdCO0FBQUEsTUFDbEI7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
