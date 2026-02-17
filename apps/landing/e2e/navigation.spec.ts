/**
 * Navigation E2E — Routing & Link Behavior
 *
 * Verifies client-side routing works for all major pages
 * and navigation state updates correctly.
 */

import { test, expect } from '@playwright/test';

test.describe('Navigation & Routing', () => {
  test('navigates to About page and back', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /about/i }).first().click();
    await expect(page).toHaveURL('/about');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Navigate back home via logo
    await page.getByLabel('CGraph Home').first().click();
    await expect(page).toHaveURL('/');
  });

  test('navigates to legal pages', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page).toHaveTitle(/privacy/i);

    await page.goto('/terms');
    await expect(page).toHaveTitle(/terms/i);
  });

  test('navigates to resource pages', async ({ page }) => {
    await page.goto('/docs');
    await expect(page).toHaveURL('/docs');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await page.goto('/blog');
    await expect(page).toHaveURL('/blog');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('shows 404 page for unknown routes', async ({ page }) => {
    await page.goto('/this-does-not-exist');
    await expect(page.getByText('404').first()).toBeVisible();
    await expect(page.getByRole('link', { name: /back to home/i }).first()).toBeVisible();
  });

  test('mobile menu toggles on small screens', async ({ page }) => {
    // Emulate mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    // Open mobile menu
    const menuButton = page.getByLabel(/open menu/i);
    await expect(menuButton).toBeVisible();
    await menuButton.click();

    // Mobile links should appear
    await expect(page.locator('.gl-nav-unified__mobile-menu')).toBeVisible();

    // Close menu
    const closeButton = page.getByLabel(/close menu/i);
    await closeButton.click();
    await expect(page.locator('.gl-nav-unified__mobile-menu')).not.toBeVisible();
  });
});
