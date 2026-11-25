/*
 * Vite (replaces Create React App + react-app-rewired, 23-11-2026).
 *   envPrefix REACT_APP_ : the two variables keep their names
 *                          (REACT_APP_BASE_API_URL, REACT_APP_DEFAULT_LANGUAGE_ID),
 *                          so .env files and the infrastructure README stay valid.
 *   outDir build         : the output folder keeps the CRA name, so the
 *                          deployment (Vercel / static server) does not change.
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  envPrefix: "REACT_APP_",
  build: {
    outDir: "build",
    sourcemap: false,
    chunkSizeWarningLimit: 2000,
  },
  server: { port: 3000 },
});
