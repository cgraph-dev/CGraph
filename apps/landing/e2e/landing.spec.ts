/**
 * Landing Page E2E — Critical User Flows
 *
 * Verifies the homepage loads, all major sections render,
 * navigation works, and CTAs point to correct destinations.
 */

import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads successfully with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/CGraph/);
  });

  test('renders hero section with primary CTA', async ({ page }) => {
    // Hero heading should be visible
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Primary CTA should exist and link to registration
    const cta = page.getByRole('link', { name: /get started/i }).first();
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', /register/);
  });

  test('renders all major sections', async ({ page }) => {
    // Features section
    await expect(page.locator('#features')).toBeAttached();

    // Security section
    await expect(page.locator('#security')).toBeAttached();

    // CTA section at bottom
    await expect(page.getByText(/ready to start/i).first()).toBeVisible();
  });

  test('navigation has correct links', async ({ page }) => {
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible();

    // Logo links to home
    await expect(nav.getByLabel('CGraph Home')).toHaveAttribute('href', '/');

    // Get Started CTA in nav
    const navCta = nav.getByText('Get Started');
    await expect(navCta).toBeVisible();
  });

  test('skip-to-content link exists for accessibility', async ({ page }) => {
    const skipLink = page.getByText('Skip to content');
    // Should exist in DOM (visually hidden until focused)
    await expect(skipLink).toBeAttached();
    await expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  test('main content landmark exists', async ({ page }) => {
    const main = page.locator('main#main-content');
    await expect(main).toBeVisible();
  });

  test('footer renders with navigation', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    // Footer should contain key links
    await expect(footer.getByText('Privacy Policy').first()).toBeVisible();
    await expect(footer.getByText('Terms of Service').first()).toBeVisible();
  });

  test('meta description is set', async ({ page }) => {
    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveAttribute('content', /.{20,}/);
  });

  test('open graph image is set', async ({ page }) => {
    const ogImage = page.locator('meta[property="og:image"]');
    await expect(ogImage).toHaveAttribute('content', /cgraph\.org/);
  });
});
