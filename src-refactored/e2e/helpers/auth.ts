/**
 * Auth helpers for E2E tests.
 * Provides login/register shortcuts to avoid repeating UI steps.
 */

import { Page, expect } from '@playwright/test';
import { createTestUser, adminConfirmUser, adminCreateUser } from './cognito';
import type { TestUser } from './cognito';

/** The nav drawer footer auth button (Login/Logout) */
const AUTH_LINK = '.nav-drawer-footer .nav-drawer-row';

/** Wait for the Woof app to fully initialize */
export async function waitForAppReady(page: Page) {
  await page.waitForFunction(() => {
    const btn = document.querySelector('.nav-drawer-footer .nav-drawer-row');
    // Icon may be <i> (pre-FA dom.watch) or <svg> (post dom.watch replacement)
    return btn && (btn.innerHTML.includes('<i ') || btn.innerHTML.includes('<svg'));
  }, { timeout: 10_000 });
}

/** On mobile viewports the nav drawer is behind the hamburger menu — open it first */
export async function ensureDrawerVisible(page: Page) {
  const viewport = page.viewportSize();
  if (viewport && viewport.width < 768) {
    // Check if drawer is already open
    const drawerOpen = page.locator('.nav-drawer.open');
    const isOpen = await drawerOpen.count() > 0;
    if (!isOpen) {
      // Open hamburger menu to reveal nav drawer
      const hamburger = page.locator('button[aria-label="Open menu"]');
      if (await hamburger.isVisible()) {
        await hamburger.click();
        await page.waitForTimeout(300); // drawer animation
      }
    }
  }
  // Scroll the auth button into view before clicking
  await page.locator(AUTH_LINK).scrollIntoViewIfNeeded();
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
  await ensureDrawerVisible(page);
  await page.click(AUTH_LINK);
  await page.fill('#auth-email', testUser.email);
  await page.fill('#auth-password', testUser.password);
  await page.click('#auth-submit');
  await expect(page.locator('#auth-modal')).toBeHidden({ timeout: 15_000 });
  await ensureDrawerVisible(page);
  await expect(page.locator(AUTH_LINK)).toContainText('Logout');

  return testUser;
}

/** Register a user via UI, admin-confirm, then login via UI */
export async function registerAndLogin(page: Page, user?: TestUser): Promise<TestUser> {
  const testUser = user || createTestUser();

  await page.goto('/');
  await waitForAppReady(page);

  // Register
  await ensureDrawerVisible(page);
  await page.click(AUTH_LINK);
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
  await ensureDrawerVisible(page);
  await expect(page.locator(AUTH_LINK)).toContainText('Logout');

  return testUser;
}
