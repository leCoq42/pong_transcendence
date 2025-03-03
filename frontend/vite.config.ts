import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  css: {
    modules: {
      localsConvention: "camelCase",
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/socket.io": {
        target: "ws://localhost:3000",
        ws: true,
      },
    },
  },
});
