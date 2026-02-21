/**
 * Auth helpers for E2E tests.
 * Provides login/register shortcuts to avoid repeating UI steps.
 */

import { Page, expect } from '@playwright/test';
import { createTestUser, adminConfirmUser, adminCreateUser } from './cognito';
import type { TestUser } from './cognito';

/** The header auth link (Login/Logout) */
const AUTH_LINK = '.header-icons .auth-link';

/** Wait for the Woof app to fully initialize */
export async function waitForAppReady(page: Page) {
  await page.waitForFunction(() => {
    const link = document.querySelector('.auth-link');
    return link && link.innerHTML.includes('<i ');
  }, { timeout: 10_000 });
}

/**
 * Create a user via admin API (no email sent) and login via UI.
 * Use this for tests that need an authenticated user but don't test registration.
 */
export async function adminLoginOnly(page: Page, user?: TestUser): Promise<TestUser> {
  const testUser = user || createTestUser();

  // Create user server-side (no email triggered)
  adminCreateUser(testUser);

  await page.goto('/');
  await waitForAppReady(page);

  // Login via UI
  await page.click(AUTH_LINK);
  await page.fill('#auth-email', testUser.email);
  await page.fill('#auth-password', testUser.password);
  await page.click('#auth-submit');
  await expect(page.locator('#auth-modal')).toBeHidden({ timeout: 15_000 });
  await expect(page.locator(AUTH_LINK)).toContainText('Logout');

  return testUser;
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
