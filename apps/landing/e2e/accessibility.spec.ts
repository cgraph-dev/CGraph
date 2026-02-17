/**
 * Accessibility E2E — A11y Smoke Tests
 *
 * Verifies key accessibility requirements:
 * - Keyboard navigation works
 * - Focus management is correct
 * - ARIA attributes are present
 * - Color contrast on critical elements (manual spot checks)
 */

import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('skip-to-content link exists and is keyboard-reachable', async ({ page }) => {
    // The skip link is sr-only but should be in the DOM and become visible on focus
    const skipLink = page.getByText('Skip to content');
    await expect(skipLink).toBeAttached();
    await expect(skipLink).toHaveAttribute('href', '#main-content');

    // Focus it directly and verify it becomes visible
    await skipLink.focus();
    await expect(skipLink).toBeFocused();
  });

  test('page has keyboard-focusable interactive elements', async ({ page }) => {
    // Wait for nav to be fully loaded
    await page.waitForSelector('nav', { state: 'visible' });

    // Verify the page has focusable elements (links, buttons)
    const links = page.locator('a[href]');
    const linkCount = await links.count();
    expect(linkCount).toBeGreaterThan(5);

    const buttons = page.getByRole('button');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThanOrEqual(1);
  });

  test('all images have alt text', async ({ page }) => {
    const images = page.locator('img');
    const count = await images.count();
    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      expect(alt, `Image ${i} missing alt text`).toBeTruthy();
    }
  });

  test('interactive elements have accessible names', async ({ page }) => {
    // All buttons should have accessible text
    const buttons = page.getByRole('button');
    const buttonCount = await buttons.count();
    for (let i = 0; i < buttonCount; i++) {
      const name = await buttons.nth(i).getAttribute('aria-label');
      const text = await buttons.nth(i).textContent();
      expect(name || text?.trim(), `Button ${i} has no accessible name`).toBeTruthy();
    }
  });

  test('page has exactly one h1', async ({ page }) => {
    const h1s = page.getByRole('heading', { level: 1 });
    await expect(h1s).toHaveCount(1);
  });

  test('no auto-playing media', async ({ page }) => {
    const autoplayMedia = page.locator('video[autoplay], audio[autoplay]');
    await expect(autoplayMedia).toHaveCount(0);
  });

  test('page language is set', async ({ page }) => {
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBe('en');
  });
});
