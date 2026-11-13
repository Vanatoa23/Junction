import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// /api/* -> API server (prefix stripped; port from API_PORT, default 3001). The TEST page is served by the API itself at /test-notice.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": { target: `http://localhost:${process.env.API_PORT ?? 3001}`, changeOrigin: true, rewrite: (p) => p.replace(/^\/api/, "") },
    },
  },
});
