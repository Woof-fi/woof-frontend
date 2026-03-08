import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Auth tests must run sequentially
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  timeout: 30_000,

  use: {
    baseURL: process.env.E2E_BASE_URL || 'https://woofapp.fi',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Pre-set the site password gate cookie so E2E tests can access the app
    storageState: './e2e/gate-cookie.json',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
    },
  ],
});
