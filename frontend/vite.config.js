import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const JAVA = process.env.JAVA_API ?? 'http://127.0.0.1:8081';
const PYTHON = process.env.PYTHON_API ?? 'http://127.0.0.1:8082';
const proxy = {
  '/api/java': JAVA,
  '/api/progress': JAVA,
  '/api/roadmap': JAVA,
  '/api/python': PYTHON,
};

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy },
  preview: { port: 4173, proxy },
  build: {
    chunkSizeWarningLimit: 4000,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        sandbox: resolve(import.meta.dirname, 'sandbox.html'),
        verify: resolve(import.meta.dirname, 'verify.html'),
      },
    },
  },
});
