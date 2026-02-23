/**
 * E2E tests for post flows: create, delete via options sheet, report
 */
import { test, expect } from '@playwright/test';
import { createTestUser, adminCreateUser, adminDeleteUser } from './helpers/cognito';
import type { TestUser } from './helpers/cognito';

const API_BASE = 'https://api.woofapp.fi';
const AUTH_LINK = '.header-icons .auth-link';

let testUser: TestUser;

/** Log in via UI and return the auth token from localStorage.
 *  Also waits for POST /api/auth/sync to complete so the backend user record
 *  exists before the test makes any API calls (avoids owner_id FK failures). */
async function loginUser(page: import('@playwright/test').Page, user: TestUser): Promise<string> {
    adminCreateUser(user);
    await page.goto('/');
    // Wait for app to be ready
    await page.waitForFunction(() => {
        const link = document.querySelector('.header-icons .auth-link');
        return link && link.innerHTML.includes('<i ');
    }, { timeout: 10_000 });
    await page.click(AUTH_LINK);
    await page.fill('#auth-email', user.email);
    await page.fill('#auth-password', user.password);
    await page.click('#auth-submit');
    await expect(page.locator('#auth-modal')).toBeHidden({ timeout: 15_000 });
    await expect(page.locator(AUTH_LINK)).toContainText('Logout');
    const token = (await page.evaluate(() => localStorage.getItem('auth_token'))) ?? '';
    // Explicitly sync the user so the backend DB record exists before API calls
    await page.request.post(`${API_BASE}/api/auth/sync`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return token;
}

test.beforeEach(() => {
    testUser = createTestUser();
});

test.afterEach(async ({ page }) => {
    try {
        const token = await page.evaluate(() => localStorage.getItem('auth_token'));
        if (token) {
            await page.request.delete(`${API_BASE}/api/auth/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
        }
    } catch { /* ignore */ }
    adminDeleteUser(testUser.email);
});

test.describe('Post options sheet', () => {
    test('create post via API, delete it via options sheet', async ({ page }) => {
        const token = await loginUser(page, testUser);

        // Create a dog via API
        const dogRes = await page.request.post(`${API_BASE}/api/dogs`, {
            headers: { Authorization: `Bearer ${token}` },
            data: { name: 'E2E PostDog', breed: 'Test Breed', age: 2, location: 'Helsinki' },
        });
        expect(dogRes.ok()).toBeTruthy();
        const dogData = await dogRes.json();
        const dogId: string = dogData.dog.id;

        // Create a post via API
        const postRes = await page.request.post(`${API_BASE}/api/posts`, {
            headers: { Authorization: `Bearer ${token}` },
            data: { caption: 'E2E delete test post', dog_id: dogId, image_url: 'https://woofapp.fi/images/logo.png' },
        });
        expect(postRes.ok()).toBeTruthy();

        // Reload the page so the feed fetches the new post
        await page.reload();
        await page.waitForSelector('.post', { timeout: 15_000 });

        // Find our post by caption
        const postCard = page.locator('.post').filter({ hasText: 'E2E delete test post' }).first();
        await expect(postCard).toBeVisible({ timeout: 10_000 });

        // Open the options sheet
        await postCard.locator('.post-options-btn').click();
        await expect(page.locator('.action-sheet')).toBeVisible({ timeout: 5_000 });

        // Should show "Delete post" (own post)
        await expect(page.locator('.action-sheet')).toContainText('Delete post');

        // Click "Delete post" → goes to confirmation view
        await page.locator('.action-sheet button').filter({ hasText: 'Delete post' }).click();
        await expect(page.locator('.action-sheet')).toContainText("Delete this post?");

        // Confirm deletion
        await page.locator('.action-sheet-delete-btn.danger').click();

        // Sheet should close
        await expect(page.locator('.action-sheet')).toBeHidden({ timeout: 10_000 });

        // Post should be gone from feed
        await expect(postCard).toBeHidden({ timeout: 10_000 });
    });

    test('post options sheet shows Report for another user\'s post', async ({ page }) => {
        // Create the "author" user with a post
        const author = createTestUser();
        const authorToken = await loginUser(page, author);

        // Create dog + post as author via API
        const dogRes = await page.request.post(`${API_BASE}/api/dogs`, {
            headers: { Authorization: `Bearer ${authorToken}` },
            data: { name: 'E2E AuthorDog', breed: 'Test', age: 1, location: 'Helsinki' },
        });
        const dogData = await dogRes.json();
        await page.request.post(`${API_BASE}/api/posts`, {
            headers: { Authorization: `Bearer ${authorToken}` },
            data: { caption: 'E2E report target post', dog_id: dogData.dog.id, image_url: 'https://woofapp.fi/images/logo.png' },
        });

        // Logout author, login as reporter (testUser)
        await page.evaluate(() => localStorage.clear());
        await page.reload();

        const reporterToken = await loginUser(page, testUser);

        // Reload feed
        await page.reload();
        await page.waitForSelector('.post', { timeout: 15_000 });

        // Find the author's post
        const targetCard = page.locator('.post').filter({ hasText: 'E2E report target post' }).first();
        await expect(targetCard).toBeVisible({ timeout: 10_000 });

        // Open options sheet
        await targetCard.locator('.post-options-btn').click();
        await expect(page.locator('.action-sheet')).toBeVisible({ timeout: 5_000 });

        // Should show Report (not Delete post)
        await expect(page.locator('.action-sheet')).toContainText('Report');
        await expect(page.locator('.action-sheet')).not.toContainText('Delete post');

        // Close sheet
        await page.locator('.action-sheet button.cancel').click();
        await expect(page.locator('.action-sheet')).toBeHidden({ timeout: 5_000 });

        // Cleanup author user
        try {
            await page.request.delete(`${API_BASE}/api/auth/me`, {
                headers: { Authorization: `Bearer ${authorToken}` },
            });
        } catch { /* ignore */ }
        adminDeleteUser(author.email);
    });

    test('bookmark toggle works from options sheet', async ({ page }) => {
        // Create author user with a post
        const author = createTestUser();
        const authorToken = await loginUser(page, author);

        const dogRes = await page.request.post(`${API_BASE}/api/dogs`, {
            headers: { Authorization: `Bearer ${authorToken}` },
            data: { name: 'E2E BookmarkDog', breed: 'Test', age: 1, location: 'Helsinki' },
        });
        const dogData = await dogRes.json();
        await page.request.post(`${API_BASE}/api/posts`, {
            headers: { Authorization: `Bearer ${authorToken}` },
            data: { caption: 'E2E bookmark test post', dog_id: dogData.dog.id, image_url: 'https://woofapp.fi/images/logo.png' },
        });

        // Log in as reporter (testUser)
        await page.evaluate(() => localStorage.clear());
        await page.reload();
        const reporterToken = await loginUser(page, testUser);

        await page.reload();
        await page.waitForSelector('.post', { timeout: 15_000 });

        const targetCard = page.locator('.post').filter({ hasText: 'E2E bookmark test post' }).first();
        await expect(targetCard).toBeVisible({ timeout: 10_000 });

        // Open options sheet
        await targetCard.locator('.post-options-btn').click();
        await expect(page.locator('.action-sheet')).toBeVisible({ timeout: 5_000 });

        // Should show "Add to favourites"
        await expect(page.locator('.action-sheet')).toContainText('Add to favourites');

        // Click it
        await page.locator('.action-sheet button').filter({ hasText: 'Add to favourites' }).click();

        // Should show success toast
        await expect(page.locator('.toast')).toBeVisible({ timeout: 5_000 });
        await expect(page.locator('.toast')).toContainText(/favourites/i);

        // Cleanup
        try {
            await page.request.delete(`${API_BASE}/api/auth/me`, {
                headers: { Authorization: `Bearer ${authorToken}` },
            });
        } catch { /* ignore */ }
        adminDeleteUser(author.email);
    });
});
