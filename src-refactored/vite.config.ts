import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Build metadata injected at build time
const gitCommit = execSync('git rev-parse --short HEAD').toString().trim();
const buildTime = new Date().toISOString();

export default defineConfig({
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      // Include icon files from assets/icons/ in the service worker precache
      includeAssets: ['icons/*.png', 'favicon.png'],
      manifest: {
        name: 'Woof',
        short_name: 'Woof',
        description: 'The social network for dogs',
        theme_color: '#C9403F',
        background_color: '#FAFAF8',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        // Precache app shell (JS/CSS bundles handled automatically)
        globPatterns: ['**/*.{js,css,html}'],
        // Serve index.html for all SPA navigation requests (non-API, non-asset)
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        // Runtime cache for CDN images — cache-first, 7 day max-age
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdn\.woofapp\.fi\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'woof-images',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              }
            }
          }
        ]
      }
    })
  ],
  root: '.',
  publicDir: 'assets',

  // Polyfill Node's `global` for browser-targeting packages (e.g. amazon-cognito-identity-js)
  define: {
    global: 'globalThis',
    __BUILD_COMMIT__: JSON.stringify(gitCommit),
    __BUILD_TIME__: JSON.stringify(buildTime),
  },

  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
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
        target: 'https://api.woofapp.fi',
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
