import { test, expect, Page } from '@playwright/test';
import { createTestUser, adminConfirmUser, adminDeleteUser, adminGetUser } from './helpers/cognito';
import type { TestUser } from './helpers/cognito';

let testUser: TestUser;
let savedAuthToken: string | null = null;

/** The header auth link (Login/Logout) — specific to avoid sidebar .auth-link */
const AUTH_LINK = '.header-icons .auth-link';

/** Wait for the Woof app to fully initialize (auth link onclick handler set) */
async function waitForAppReady(page: Page) {
  // The app is ready when updateUIForAuth() has run — auth link gets an icon
  await page.waitForFunction(() => {
    const link = document.querySelector('.header-icons .auth-link');
    return link && link.innerHTML.includes('<i ');
  }, { timeout: 10_000 });
}

test.beforeEach(() => {
  testUser = createTestUser();
  savedAuthToken = null;
});

test.afterEach(async ({ page }) => {
  // Delete the DB user record (cascades to all associated data)
  // Use savedAuthToken if available (for tests that logout and clear localStorage)
  try {
    const token = savedAuthToken || await page.evaluate(() => localStorage.getItem('auth_token'));
    if (token) {
      await page.request.delete('https://api.woofapp.fi/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
    }
  } catch (e) {
    // DB user may not exist (e.g. test only registered, never logged in)
  }

  // Always delete the Cognito user
  adminDeleteUser(testUser.email);
});

test.describe('Auth flow', () => {
  test('register → admin confirm → login → logout', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);

    // 1. Open auth modal
    await page.click(AUTH_LINK);
    await expect(page.locator('#auth-modal')).toBeVisible();

    // 2. Switch to Register tab
    await page.click('.auth-tab[data-tab="register"]');
    await expect(page.locator('#auth-modal-title')).toHaveText('Register');
    await expect(page.locator('#auth-name-group')).toBeVisible();

    // 3. Fill registration form
    await page.fill('#auth-email', testUser.email);
    await page.fill('#auth-password', testUser.password);
    await page.fill('#auth-name', testUser.name);

    // 4. Submit — should switch to verify mode
    await page.click('#auth-submit');
    await expect(page.locator('#auth-modal-title')).toHaveText('Verify Email', { timeout: 15_000 });
    await expect(page.locator('#auth-verify-group')).toBeVisible();
    await expect(page.locator('#auth-email-group')).toBeHidden();
    await expect(page.locator('#auth-password-group')).toBeHidden();

    // 5. Verify user was created in Cognito as UNCONFIRMED
    const userBefore = adminGetUser(testUser.email);
    expect(userBefore).not.toBeNull();
    expect(userBefore!.status).toBe('UNCONFIRMED');

    // 6. Admin-confirm the user (bypasses email verification)
    adminConfirmUser(testUser.email);
    const userAfter = adminGetUser(testUser.email);
    expect(userAfter!.status).toBe('CONFIRMED');

    // 7. Go back to login
    await page.click('#back-to-login-btn');
    await expect(page.locator('#auth-modal-title')).toHaveText('Login');
    await expect(page.locator('#auth-email-group')).toBeVisible();
    await expect(page.locator('#auth-password-group')).toBeVisible();

    // 8. Login with the registered credentials
    await page.fill('#auth-email', testUser.email);
    await page.fill('#auth-password', testUser.password);
    await page.click('#auth-submit');

    // 9. Modal should close and nav should show Logout
    await expect(page.locator('#auth-modal')).toBeHidden({ timeout: 15_000 });
    await expect(page.locator(AUTH_LINK)).toContainText('Logout');

    // Save token before logout clears localStorage (needed for afterEach DB cleanup)
    savedAuthToken = await page.evaluate(() => localStorage.getItem('auth_token'));

    // 10. Logout
    page.on('dialog', (dialog) => dialog.accept());
    await page.click(AUTH_LINK);

    // 11. Should redirect to home and show Login again
    await expect(page.locator(AUTH_LINK)).toContainText('Login', { timeout: 10_000 });
  });

  test('login with wrong password shows error', async ({ page }) => {
    // Create and confirm a user first
    await page.goto('/');
    await waitForAppReady(page);
    await page.click(AUTH_LINK);
    await page.click('.auth-tab[data-tab="register"]');
    await page.fill('#auth-email', testUser.email);
    await page.fill('#auth-password', testUser.password);
    await page.fill('#auth-name', testUser.name);
    await page.click('#auth-submit');
    await expect(page.locator('#auth-modal-title')).toHaveText('Verify Email', { timeout: 15_000 });
    adminConfirmUser(testUser.email);

    // Go back to login and try wrong password
    await page.click('#back-to-login-btn');
    await page.fill('#auth-email', testUser.email);
    await page.fill('#auth-password', 'WrongPass1');
    await page.click('#auth-submit');

    // Should show error toast
    await expect(page.locator('.toast')).toBeVisible({ timeout: 10_000 });
  });

  test('register with existing email shows error', async ({ page }) => {
    // Register the user first
    await page.goto('/');
    await waitForAppReady(page);
    await page.click(AUTH_LINK);
    await page.click('.auth-tab[data-tab="register"]');
    await page.fill('#auth-email', testUser.email);
    await page.fill('#auth-password', testUser.password);
    await page.fill('#auth-name', testUser.name);
    await page.click('#auth-submit');
    await expect(page.locator('#auth-modal-title')).toHaveText('Verify Email', { timeout: 15_000 });
    adminConfirmUser(testUser.email);

    // Try to register again with the same email
    await page.click('#back-to-login-btn');
    await page.click('.auth-tab[data-tab="register"]');
    await page.fill('#auth-email', testUser.email);
    await page.fill('#auth-password', testUser.password);
    await page.fill('#auth-name', testUser.name);
    await page.click('#auth-submit');

    // Should show error toast about existing account
    await expect(page.locator('.toast')).toBeVisible({ timeout: 10_000 });
  });

  test('auth modal UI states are correct', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    await page.click(AUTH_LINK);

    // Login mode (default)
    await expect(page.locator('#auth-modal-title')).toHaveText('Login');
    await expect(page.locator('#auth-email-group')).toBeVisible();
    await expect(page.locator('#auth-password-group')).toBeVisible();
    await expect(page.locator('#auth-name-group')).toBeHidden();
    await expect(page.locator('#auth-verify-group')).toBeHidden();
    await expect(page.locator('#auth-forgot-link')).toBeVisible();
    await expect(page.locator('#auth-submit')).toHaveText('Sign In');

    // Register mode
    await page.click('.auth-tab[data-tab="register"]');
    await expect(page.locator('#auth-modal-title')).toHaveText('Register');
    await expect(page.locator('#auth-name-group')).toBeVisible();
    await expect(page.locator('#password-requirements')).toBeVisible();
    await expect(page.locator('#auth-forgot-link')).toBeHidden();
    await expect(page.locator('#auth-submit')).toHaveText('Sign Up');

    // Forgot password mode
    await page.click('.auth-tab[data-tab="login"]');
    await page.click('#forgot-password-btn');
    await expect(page.locator('#auth-modal-title')).toHaveText('Forgot Password');
    await expect(page.locator('#auth-email-group')).toBeVisible();
    await expect(page.locator('#auth-password-group')).toBeHidden();
    await expect(page.locator('#auth-back-group')).toBeVisible();
    await expect(page.locator('#auth-submit')).toHaveText('Send Reset Code');

    // Back to login
    await page.click('#back-to-login-btn');
    await expect(page.locator('#auth-modal-title')).toHaveText('Login');
  });

  test('modal closes on outside click', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    await page.click(AUTH_LINK);
    await expect(page.locator('#auth-modal')).toBeVisible();

    // Click the modal backdrop (outside the modal content)
    await page.locator('#auth-modal').click({ position: { x: 10, y: 10 } });
    await expect(page.locator('#auth-modal')).toBeHidden();
  });

  test('modal closes on X button', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    await page.click(AUTH_LINK);
    await expect(page.locator('#auth-modal')).toBeVisible();

    await page.locator('#auth-modal .modal-close').click();
    await expect(page.locator('#auth-modal')).toBeHidden();
  });
});
