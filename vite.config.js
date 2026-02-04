import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import scormManifest from "./plugins/vite-plugin-scorm-manifest.js";
import moduleConfig from "./module.config.js";

export default defineConfig({
  plugins: [preact(), scormManifest(moduleConfig)],
  root: "src",
  base: "./",
  publicDir: "../public",
  build: {
    outDir: "../dist/html",
    emptyOutDir: true,
    assetsDir: ".",
    rollupOptions: {
      output: {
        entryFileNames: "app.js",
        assetFileNames: "[name][extname]",
      },
    },
  },
});
