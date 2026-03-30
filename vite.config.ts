
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
    return {
      server: {
        port: 3000,
        host: true, // Allow access from network (0.0.0.0)
      },
      plugins: [react()],
      root: '.',
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        }
      },
      build: {
        outDir: 'dist',
        chunkSizeWarningLimit: 1600, // Increased limit to suppress warnings for large dependencies
        rollupOptions: {
          input: {
            main: path.resolve(__dirname, 'index.html'),
          },
          output: {
            manualChunks: {
                vendor: ['react', 'react-dom'],
                db: ['dexie', 'dexie-react-hooks'],
                ai: ['@google/genai'],
                icons: ['@heroicons/react'],
                pdf: ['jspdf', 'html2canvas']
            }
          }
        },
      }
    };
});
