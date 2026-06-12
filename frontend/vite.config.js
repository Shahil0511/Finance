import { defineConfig } from 'vite';
import react       from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const basePath = process.env.VITE_BASE_PATH || '/finance-gst-tracker';
const backendTarget = process.env.VITE_BACKEND_URL || "http://127.0.0.1:4000";
const normalizedBasePath = `/${basePath.replace(/^\/+|\/+$/g, "")}`;

export default defineConfig({
  base: `${normalizedBasePath}/`,
  define: {
    "import.meta.env.VITE_BASE_PATH": JSON.stringify(normalizedBasePath),
  },
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      [`${normalizedBasePath}/api`]: {
        target: backendTarget,
        changeOrigin: true,
      },
      "/api": {
        target: backendTarget,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "../backend/public",
    emptyOutDir: true,
  },
});
