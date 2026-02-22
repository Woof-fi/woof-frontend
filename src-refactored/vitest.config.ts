import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default defineConfig({
  plugins: [svelte()],
  publicDir: false, // Disable public directory (there's a file named 'public' causing conflicts)
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/__tests__/setup.ts'],
    include: [
      'src/__tests__/**/*.{test,spec}.{ts,js}',
      'src/__tests__/components/**/*.{test,spec}.{ts,js}',
    ],
    exclude: ['node_modules', 'dist', 'e2e', 'tests'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        '**/*.config.{js,ts}',
        '**/dist/',
      ],
    },
  },
  resolve: {
    conditions: ['browser'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
