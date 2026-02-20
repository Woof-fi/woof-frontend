import { test, expect } from '@playwright/test';
import { createTestUser, adminDeleteUser } from './helpers/cognito';
import { registerAndLogin } from './helpers/auth';
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
  // Clean up all dogs (and their posts) created by this test user
  try {
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    if (token) {
      // Get all dogs owned by this user
      const dogsRes = await page.request.get(`${API_BASE}/api/dogs/my/dogs`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (dogsRes.ok()) {
        const dogsData = await dogsRes.json();
        const dogs = Array.isArray(dogsData) ? dogsData : (dogsData.dogs || []);
        for (const dog of dogs) {
          // Delete all posts by this dog first
          const postsRes = await page.request.get(`${API_BASE}/api/posts?dogId=${dog.id}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (postsRes.ok()) {
            const postsData = await postsRes.json();
            const posts = postsData.posts || postsData;
            if (Array.isArray(posts)) {
              for (const post of posts) {
                await page.request.delete(`${API_BASE}/api/posts/${post.id}`, {
                  headers: { 'Authorization': `Bearer ${token}` },
                });
              }
            }
          }
          // Delete the dog
          await page.request.delete(`${API_BASE}/api/dogs/${dog.id}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
        }
      }
    }
  } catch (e) {
    console.error('Cleanup failed:', e);
  }

  // Always delete the Cognito user
  adminDeleteUser(testUser.email);
});

test.describe('Dog CRUD', () => {
  test('create a dog profile and verify it appears', async ({ page }) => {
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
  });
});
