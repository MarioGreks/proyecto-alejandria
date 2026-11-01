import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// @ts-expect-error type error without @types/node package
import process from "node:process";
// @ts-expect-error type error without @types/node package
import { rmSync } from "node:fs";
const host = process.env.TAURI_DEV_HOST;

// Los fixtures de public/_prototipo solo sirven a las páginas de pruebas de desarrollo: no deben ir dentro de la app.
const sinPrototipo = {
  name: "sin-prototipo",
  apply: "build" as const,
  closeBundle: () => rmSync("dist/_prototipo", { recursive: true, force: true }),
};

// https://vite.dev/config/
export default defineConfig(() => ({
  plugins: [react(), sinPrototipo],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
