/**
 * E2E tests for territory directory and territory detail pages.
 * All public (no auth required).
 *
 * Tests are consolidated to minimize API requests (60/15min unauth rate limit).
 */
import { test, expect } from '@playwright/test';

test.describe('Territory browsing', () => {
    test('directory loads, search shows hierarchy, click navigates to detail with tabs', async ({ page }) => {
        // 1. Directory page loads with municipalities
        await page.goto('/territories');
        await expect(page.locator('h1')).toHaveText('Territories', { timeout: 10_000 });
        await expect(page.locator('.territory-directory-search input')).toBeVisible();

        // Wait for municipality list to load (retry on rate limit — API may return 0 results)
        try {
            await expect(page.locator('.territory-alpha-item').first()).toBeVisible({ timeout: 10_000 });
        } catch {
            // Rate limit recovery: wait and reload
            await page.waitForTimeout(5_000);
            await page.reload();
            await expect(page.locator('.territory-alpha-item').first()).toBeVisible({ timeout: 15_000 });
        }
        const count = await page.locator('.territory-alpha-item').count();
        expect(count).toBeGreaterThan(100); // We have 307 municipalities

        // 2. Search for ambiguous name — verify hierarchy context
        await page.fill('.territory-directory-search input', 'keskusta');
        await expect(page.locator('.territory-alpha-item').first()).toBeVisible({ timeout: 10_000 });
        const resultCount = await page.locator('.territory-alpha-item').count();
        expect(resultCount).toBeGreaterThan(3); // Multiple cities have Keskusta

        // All results have hierarchy context
        const contexts = await page.locator('.territory-alpha-context').allTextContents();
        expect(contexts.length).toBe(resultCount);
        for (const ctx of contexts) {
            expect(ctx.length).toBeGreaterThan(0);
        }

        // Popular section hidden during search
        await expect(page.locator('.territory-popular-card')).toHaveCount(0);

        // 3. Search for sub_district, click to navigate
        await page.fill('.territory-directory-search input', 'patola');
        await expect(page.locator('.territory-alpha-name', { hasText: 'Patola' })).toBeVisible({ timeout: 10_000 });
        await expect(page.locator('.territory-alpha-context')).toContainText('Helsinki');

        await page.locator('.territory-alpha-item').first().click();

        // 4. Sub_district detail page — breadcrumb + tabs
        await expect(page.locator('.territory-sheet-name')).toHaveText('Patola', { timeout: 15_000 });

        // Full breadcrumb: Territories > Helsinki > Oulunkylä > Patola
        const breadcrumb = page.locator('.territory-breadcrumb');
        await expect(breadcrumb.locator('a', { hasText: 'Territories' })).toBeVisible();
        await expect(breadcrumb.locator('a', { hasText: 'Helsinki' })).toBeVisible();
        await expect(breadcrumb.locator('a', { hasText: 'Oulunkylä' })).toBeVisible();
        await expect(breadcrumb.locator('.territory-breadcrumb-current')).toHaveText('Patola');

        // Three tabs: Posts, Dogs, Dog Parks
        const tabs = page.locator('.tab-link');
        await expect(tabs).toHaveCount(3);
        await expect(tabs.nth(0)).toContainText('Posts');
        await expect(tabs.nth(1)).toContainText('Dogs');
        await expect(tabs.nth(2)).toContainText('Dog Parks');

        // Switch tabs
        await expect(tabs.nth(0)).toHaveClass(/active/);
        await tabs.nth(1).click();
        await expect(tabs.nth(1)).toHaveClass(/active/);
        await tabs.nth(2).click();
        await expect(tabs.nth(2)).toHaveClass(/active/);
    });

    test('breadcrumb navigation through territory hierarchy', async ({ page }) => {
        // Start at municipality (retry on rate limit)
        await page.goto('/territory/helsinki');
        try {
            await expect(page.locator('.territory-sheet-name')).toHaveText('Helsinki', { timeout: 10_000 });
        } catch {
            await page.waitForTimeout(5_000);
            await page.reload();
            await expect(page.locator('.territory-sheet-name')).toHaveText('Helsinki', { timeout: 15_000 });
        }

        // Breadcrumb: Territories > Helsinki
        await expect(page.locator('.territory-breadcrumb a', { hasText: 'Territories' })).toBeVisible();
        await expect(page.locator('.territory-breadcrumb-current')).toHaveText('Helsinki');

        // Should show districts section
        await expect(page.locator('h3', { hasText: 'Districts' })).toBeVisible();

        // Click into a district (Oulunkylä)
        await page.locator('a', { hasText: 'Oulunkylä' }).first().click();
        await expect(page.locator('.territory-sheet-name')).toHaveText('Oulunkylä', { timeout: 15_000 });

        // Breadcrumb: Territories > Helsinki > Oulunkylä
        await expect(page.locator('.territory-breadcrumb a', { hasText: 'Helsinki' })).toBeVisible();

        // Navigate back via breadcrumb to Helsinki
        await page.locator('.territory-breadcrumb a', { hasText: 'Helsinki' }).click();
        await expect(page.locator('.territory-sheet-name')).toHaveText('Helsinki', { timeout: 15_000 });

        // Navigate back via breadcrumb to directory
        await page.locator('.territory-breadcrumb a', { hasText: 'Territories' }).click();
        await expect(page.locator('h1')).toHaveText('Territories', { timeout: 15_000 });
        await expect(page.locator('.territory-directory-search input')).toBeVisible();
    });
});
