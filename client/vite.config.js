import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  base: process.env.VITE_BASE_PATH || '/work/projects/smartsphere/app/',
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/dochub': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/folders': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/cloud': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/ai': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/stats': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
