import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Correcao do __dirname para ESM.
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
        // Backend espera o prefixo /api.
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            // Ajusta o Origin para evitar problemas de CORS no backend local.
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
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined;
          }

          if (
            id.includes('reactflow') ||
            id.includes('@antv/x6') ||
            id.includes('dagre') ||
            id.includes('react-d3-tree') ||
            id.includes('recharts') ||
            id.includes('swiper')
          ) {
            return 'visual-vendor';
          }

          if (id.includes('html2pdf.js') || id.includes('html2canvas')) {
            return 'export-vendor';
          }

          if (
            id.includes('react-router-dom') ||
            id.includes('/react/') ||
            id.includes('/react-dom/')
          ) {
            return 'react-vendor';
          }

          if (
            id.includes('@fortawesome') ||
            id.includes('react-icons') ||
            id.includes('react-toastify') ||
            id.includes('react-confirm-alert') ||
            id.includes('bootstrap')
          ) {
            return 'ui-vendor';
          }

          if (
            id.includes('axios') ||
            id.includes('jwt-decode') ||
            id.includes('qs') ||
            id.includes('zod') ||
            id.includes('@hookform') ||
            id.includes('react-hook-form')
          ) {
            return 'form-vendor';
          }

          const packagePath = id.split('node_modules/')[1];

          if (!packagePath) {
            return 'vendor';
          }

          const segments = packagePath.split('/');
          const packageName = segments[0].startsWith('@')
            ? `${segments[0].replace('@', '')}-${segments[1]}`
            : segments[0];

          if (packageName === 'set-cookie-parser') {
            return undefined;
          }

          return `vendor-${packageName}`;
        },
      },
    },
  },
});
