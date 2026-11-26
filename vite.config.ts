import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

const port = Number(process.env.PORT || 8443);

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  build: {
    sourcemap: mode === "development" ? "inline" : false,
    minify: mode !== "development",
  },
  server: { host: "0.0.0.0", port, strictPort: true },
  preview: { host: "0.0.0.0", port },
}));
