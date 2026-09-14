import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    // izinkan host preview e2b.app
    allowedHosts: true,
    cors: true,
    hmr: { clientPort: 443, protocol: 'wss' },
  },
  preview: { host: '0.0.0.0', port: 5173, allowedHosts: true },
  build: { target: 'es2020', chunkSizeWarningLimit: 1200 },
});
