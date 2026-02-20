/**
 * Auth helpers for E2E tests.
 * Provides login/register shortcuts to avoid repeating UI steps.
 */

import { Page, expect } from '@playwright/test';
import { createTestUser, adminConfirmUser } from './cognito';
import type { TestUser } from './cognito';

/** Wait for the Woof app to fully initialize */
export async function waitForAppReady(page: Page) {
  await page.waitForFunction(() => {
    const link = document.querySelector('.auth-link');
    return link && link.innerHTML.includes('<i ');
  }, { timeout: 10_000 });
}

/** Register a user via UI, admin-confirm, then login via UI */
export async function registerAndLogin(page: Page, user?: TestUser): Promise<TestUser> {
  const testUser = user || createTestUser();

  await page.goto('/');
  await waitForAppReady(page);

  // Register
  await page.click('.auth-link');
  await page.click('.auth-tab[data-tab="register"]');
  await page.fill('#auth-email', testUser.email);
  await page.fill('#auth-password', testUser.password);
  await page.fill('#auth-name', testUser.name);
  await page.click('#auth-submit');
  await expect(page.locator('#auth-modal-title')).toHaveText('Verify Email', { timeout: 15_000 });

  // Admin-confirm (bypasses email code)
  adminConfirmUser(testUser.email);

  // Login
  await page.click('#back-to-login-btn');
  await page.fill('#auth-email', testUser.email);
  await page.fill('#auth-password', testUser.password);
  await page.click('#auth-submit');
  await expect(page.locator('#auth-modal')).toBeHidden({ timeout: 15_000 });
  await expect(page.locator('.auth-link')).toContainText('Logout');

  return testUser;
}
