import { defineConfig } from "electron-vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  main: {
    build: {
      outDir: "out/main",
      lib: {
        entry: path.resolve("src/main/main.ts"),
      },
      rollupOptions: {
        output: {
          format: "cjs",
          entryFileNames: "[name].js",
        },
      },
    },
  },
  preload: {
    build: {
      outDir: "out/preload",
      lib: {
        entry: path.resolve("src/main/preload.ts"),
      },
      rollupOptions: {
        output: {
          format: "cjs",
          entryFileNames: "[name].js",
        },
      },
    },
  },
  renderer: {
    build: {
      rollupOptions: {
        input: path.resolve("src/renderer/index.html"),
      },
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve("src/renderer/src"),
        "@renderer": path.resolve("src/renderer/src")
      },
    },
  },
});
