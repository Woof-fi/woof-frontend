import { test, expect } from '@playwright/test';
import { createTestUser, adminDeleteUser } from './helpers/cognito';
import { adminLoginOnly } from './helpers/auth';
import type { TestUser } from './helpers/cognito';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_IMAGE = path.join(__dirname, 'fixtures', 'test-dog.png');
const API_BASE = 'https://api.woofapp.fi';

let testUser: TestUser;

test.beforeEach(() => {
  testUser = createTestUser();
});

test.afterEach(async ({ page }) => {
  // Delete the DB user record (cascades to dogs, posts, comments, likes, follows, etc.)
  try {
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    if (token) {
      await page.request.delete(`${API_BASE}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
    }
  } catch (e) {
    console.error('DB cleanup failed:', e);
  }

  // Always delete the Cognito user
  adminDeleteUser(testUser.email);
});

test.describe('Dog CRUD', () => {
  test('create a dog profile and verify it appears', async ({ page }) => {
    testUser = await adminLoginOnly(page, testUser);

    // After login with no dogs, nav drawer should show "Add a Pet"
    const addPetBtn = page.locator('.nav-drawer-links button.nav-btn', { hasText: 'Add a Pet' });
    await expect(addPetBtn).toBeVisible({ timeout: 10_000 });

    // Click "Add a Pet" to open create dog modal
    await addPetBtn.click();
    await expect(page.locator('#create-dog-modal')).toBeVisible();

    // Fill the form
    await page.fill('#dog-name', 'E2E TestDog');

    // Breed autocomplete: type, wait for dropdown, select first match
    await page.fill('#dog-breed', 'Miniature Schnauzer');
    await page.waitForSelector('#dog-breed-listbox [role="option"]', { timeout: 5_000 });
    await page.click('#dog-breed-listbox [role="option"]:first-child');

    await page.fill('#dog-age', '3');

    // Territory autocomplete: type, wait for dropdown, select first match
    await page.fill('#dog-territory', 'Helsinki');
    await page.waitForSelector('[role="listbox"] [role="option"]', { timeout: 5_000 });
    await page.click('[role="listbox"] [role="option"]:first-child');

    await page.fill('#dog-bio', 'A good dog created by E2E tests');

    // Upload photo
    await page.setInputFiles('#dog-photo', TEST_IMAGE);

    // Submit
    await page.click('#create-dog-form button[type="submit"]');

    // Modal should close
    await expect(page.locator('#create-dog-modal')).toBeHidden({ timeout: 15_000 });

    // Nav drawer should now show the dog's name instead of "Add a Pet"
    const dogNavLink = page.locator('.nav-drawer-links a', { hasText: 'E2E TestDog' });
    await expect(dogNavLink).toContainText('E2E TestDog', { timeout: 10_000 });

    // Click the dog profile link to view the profile
    await dogNavLink.first().click();

    // Profile page should show the dog's info
    await expect(page.locator('body')).toContainText('E2E TestDog', { timeout: 10_000 });
    await expect(page.locator('body')).toContainText('Miniature Schnauzer');
  });
});
