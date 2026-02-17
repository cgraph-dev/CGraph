/**
 * Visual Regression E2E — Screenshot Comparison Tests
 *
 * Uses Playwright's built-in toHaveScreenshot() for pixel-level
 * comparison against baseline snapshots.
 *
 * Baselines are stored in e2e/visual.spec.ts-snapshots/ and should
 * be committed to the repo. Run `pnpm e2e --update-snapshots` to
 * regenerate baselines after intentional visual changes.
 *
 * @see https://playwright.dev/docs/test-snapshots
 */

import { test, expect } from '@playwright/test';

test.describe('Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Disable animations for stable screenshots
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('homepage hero — desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/', { waitUntil: 'networkidle' });
    // Wait for fonts and images to settle
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('hero-desktop.png', {
      maxDiffPixelRatio: 0.01,
      fullPage: false,
    });
  });

  test('homepage hero — mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('hero-mobile.png', {
      maxDiffPixelRatio: 0.01,
      fullPage: false,
    });
  });

  test('navigation — desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    const nav = page.locator('nav').first();
    await expect(nav).toHaveScreenshot('nav-desktop.png', {
      maxDiffPixelRatio: 0.01,
    });
  });

  test('navigation — mobile with menu open', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);

    // Open mobile menu
    const menuButton = page.getByLabel(/open menu/i);
    await menuButton.click();
    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot('nav-mobile-open.png', {
      maxDiffPixelRatio: 0.01,
      fullPage: false,
    });
  });

  test('footer — desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/', { waitUntil: 'networkidle' });

    const footer = page.locator('footer');
    await footer.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    await expect(footer).toHaveScreenshot('footer-desktop.png', {
      maxDiffPixelRatio: 0.01,
    });
  });

  test('404 page', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/this-page-does-not-exist', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('404-page.png', {
      maxDiffPixelRatio: 0.02,
      fullPage: false,
    });
  });

  test('about page — above fold', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/about', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('about-desktop.png', {
      maxDiffPixelRatio: 0.01,
      fullPage: false,
    });
  });
});
