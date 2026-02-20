import { test, expect } from '@playwright/test';
import { createTestUser, adminConfirmUser, adminDeleteUser } from './helpers/cognito';
import { registerAndLogin } from './helpers/auth';
import type { TestUser } from './helpers/cognito';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_IMAGE = path.join(__dirname, 'fixtures', 'test-dog.png');

let testUser: TestUser;

test.beforeEach(() => {
  testUser = createTestUser();
});

test.afterEach(async ({ page }) => {
  adminDeleteUser(testUser.email);
});

test.describe('Dog CRUD', () => {
  test('create a dog profile and verify it appears', async ({ page }) => {
    // Login
    testUser = await registerAndLogin(page, testUser);

    // After login with no dogs, nav should show "Add a Pet"
    const addPetLink = page.locator('#add-pet-link, #profile-nav-item a:has-text("Add a Pet")');
    await expect(addPetLink.first()).toBeVisible({ timeout: 10_000 });

    // Click "Add a Pet" to open create dog modal
    await addPetLink.first().click();
    await expect(page.locator('#create-dog-modal')).toBeVisible();

    // Fill the form
    await page.fill('#dog-name', 'E2E TestDog');
    await page.fill('#dog-breed', 'Test Breed');
    await page.fill('#dog-age', '3');
    await page.fill('#dog-location', 'Helsinki, Finland');
    await page.fill('#dog-bio', 'A good dog created by E2E tests');

    // Upload photo
    await page.setInputFiles('#dog-photo', TEST_IMAGE);

    // Submit
    await page.click('#create-dog-form button[type="submit"]');

    // Modal should close
    await expect(page.locator('#create-dog-modal')).toBeHidden({ timeout: 15_000 });

    // Navigation should now show the dog profile link instead of "Add a Pet"
    await expect(page.locator('#profile-nav-item')).toContainText('E2E TestDog', { timeout: 10_000 });

    // Click the dog profile link to view the profile
    await page.locator('#profile-nav-item a').first().click();

    // Profile page should show the dog's info
    await expect(page.locator('body')).toContainText('E2E TestDog', { timeout: 10_000 });
    await expect(page.locator('body')).toContainText('Test Breed');

    // Clean up: delete the dog via API
    const dogId = page.url().split('/dog/')[1];
    if (dogId) {
      const token = await page.evaluate(() => localStorage.getItem('auth_token'));
      if (token) {
        const baseUrl = await page.evaluate(() => {
          // Read the API base URL from the page context
          return (window as any).__WOOF_CONFIG__?.API_BASE_URL || 'https://api.woofapp.fi';
        });
        await page.request.delete(`https://api.woofapp.fi/api/dogs/${dogId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
      }
    }
  });
});
