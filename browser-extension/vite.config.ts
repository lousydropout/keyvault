import react from "@vitejs/plugin-react";
import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import copy from "rollup-plugin-copy";
import { defineConfig } from "vite";

// Plugin to inline ES module imports in background.js and contentScript.js for Chrome
// Chrome service workers and content scripts cannot use ES module imports
const inlineImportsInChromeScripts = (buildMode: string) => {
  return {
    name: "inline-imports-in-chrome-scripts",
    writeBundle() {
      if (buildMode !== "chrome") return;
      
      const distDir = path.resolve(__dirname, "dist");
      const scriptsToProcess = [
        path.resolve(distDir, "background.js"),
        path.resolve(distDir, "contentScript.js"),
      ];
      
      scriptsToProcess.forEach((scriptPath) => {
        try {
          if (!existsSync(scriptPath)) {
            return; // Skip if file doesn't exist
          }
          
          let code = readFileSync(scriptPath, "utf-8");
        
        // Match import statements (including minified format like: import{l as t}from"./assets/logger-D8olJ9C2.js")
        const importRegex = /import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"];?/g;
        let match;
        
        while ((match = importRegex.exec(code)) !== null) {
          const [fullMatch, imports, importPath] = match;
          
          // Resolve the import path relative to dist directory
          const resolvedPath = path.resolve(distDir, importPath);
          
          try {
            // Read the imported module
            let importedCode = readFileSync(resolvedPath, "utf-8");
            
            // Extract the exported symbols (handle both named and default exports)
            // For minified code like: export{t as l}; we need to extract what 'l' exports
            // The imports might be like: {l as t} which means import l and rename to t
            const importMap: Record<string, string> = {};
            const importParts = imports.split(",").map(p => p.trim());
            
            importParts.forEach(part => {
              if (part.includes(" as ")) {
                const [original, renamed] = part.split(" as ").map(s => s.trim());
                importMap[renamed] = original;
              } else {
                importMap[part] = part;
              }
            });
            
            // Extract exports from the imported file
            // Look for: export{t as l} or export{...}
            const exportRegex = /export\s*\{([^}]+)\}/;
            const exportMatch = importedCode.match(exportRegex);
            
            if (exportMatch) {
              const exports = exportMatch[1];
              // Parse exports like: t as l
              const exportParts = exports.split(",").map(p => p.trim());
              const exportMap: Record<string, string> = {};
              
              exportParts.forEach(part => {
                if (part.includes(" as ")) {
                  const [original, exported] = part.split(" as ").map(s => s.trim());
                  exportMap[exported] = original;
                } else {
                  exportMap[part] = part;
                }
              });
              
              // Replace the import with the actual code
              // Wrap the imported code in an IIFE to avoid variable name conflicts
              // and extract only what we need
              
              // Remove the export statement from imported code
              importedCode = importedCode.replace(/export\s*\{[^}]+\};?/g, "");
              
              // Build the IIFE that returns the exports we need
              // importMap: {renamed: original} - e.g., {t: 'l'} means import 'l' as 't'
              // exportMap: {exported: internal} - e.g., {l: 't'} means export internal 't' as 'l'
              const returnProps: string[] = [];
              const destructureParts: string[] = [];
              
              Object.entries(importMap).forEach(([renamed, original]) => {
                // original is what we import (e.g., 'l')
                // exportedName is the internal variable name (e.g., 't')
                const exportedName = exportMap[original] || original;
                
                // Return the exported name mapped to the internal variable
                // e.g., return {l: t} where 'l' is exported and 't' is internal
                returnProps.push(`${original}:${exportedName}`);
                
                // Destructure: import 'l' and rename to 't'
                // e.g., {l: t}
                if (original === renamed) {
                  destructureParts.push(original);
                } else {
                  destructureParts.push(`${original}:${renamed}`);
                }
              });
              
              // Wrap in IIFE and extract exports
              const iifeCode = `(function(){\n${importedCode}\nreturn {${returnProps.join(",")}};\n})()`;
              
              const replacement = `const {${destructureParts.join(",")}} = ${iifeCode};`;
              code = code.replace(fullMatch, replacement);
            } else {
              // Fallback: just remove the import (will cause errors, but better than nothing)
              code = code.replace(fullMatch, "");
            }
          } catch (importError) {
            console.warn(`Could not inline import from ${importPath}:`, importError);
            // Remove the import statement as fallback
            code = code.replace(fullMatch, "");
          }
        }
        
          // Also remove any remaining import statements
          code = code.replace(/import\s+.*?from\s+['"].*?['"];?\s*/g, "");
          code = code.replace(/import\s*\([^)]+\)/g, "");
          
          writeFileSync(scriptPath, code, "utf-8");
        } catch (error) {
          const scriptName = path.basename(scriptPath);
          console.warn(`Could not process ${scriptName}:`, error);
        }
      });
    },
  };
};

export default defineConfig(({ mode }) => ({
  base: "./",
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
    inlineImportsInChromeScripts(mode),
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
        // Ensure background and contentScript don't share chunks with side_panel
        manualChunks: (id) => {
          // Keep background script dependencies separate
          if (id.includes("background") || id.includes("contentScript")) {
            return null; // Inline into the entry file
          }
        },
      },
    },
  },
}));
