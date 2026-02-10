import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  publicDir: false, // Disable public directory (there's a file named 'public' causing conflicts)
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/__tests__/setup.ts'],
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
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
