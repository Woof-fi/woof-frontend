import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  root: '.',
  publicDir: 'assets',

  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    emptyOutDir: true,

    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        // Content-based hashing for cache busting
        entryFileNames: 'js/[name]-[hash].js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const ext = info[info.length - 1] || '';

          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/css/i.test(ext)) {
            return `css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        }
      }
    },

    // Chunk splitting for better caching
    chunkSizeWarningLimit: 1000,

    minify: 'esbuild',
    target: 'es2020'
  },

  server: {
    port: 8000,
    strictPort: false,
    open: true,

    // Proxy API requests to backend
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  },

  preview: {
    port: 8000,
    strictPort: false,
    open: true
  },

  resolve: {
    alias: {
      '@': resolve(__dirname, 'js'),
      '@types': resolve(__dirname, 'types'),
      '@css': resolve(__dirname, 'css'),
      '@assets': resolve(__dirname, 'assets')
    }
  },

  // Enable environment variable loading
  envPrefix: 'VITE_',

  // Optimize dependencies
  optimizeDeps: {
    include: []
  }
});
