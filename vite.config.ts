import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Correção do __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, ''), // REMOVED: Backend expects /api prefix
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            // Remove o cabeçalho Origin original para evitar problemas de CORS no backend
            // ou defina como o próprio backend para simular mesma origem
            proxyReq.setHeader('Origin', 'http://localhost:8080');
          });
        },
      },
      '/public': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Origin', 'http://localhost:8080');
          });
        },
      },
    },
  },
});
