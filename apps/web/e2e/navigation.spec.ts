import { test, expect } from '@playwright/test';

/**
 * Core Navigation E2E Tests
 * Verifies main app navigation flows work correctly
 */
test.describe('Navigation', () => {
  test('should load landing page', async ({ page }) => {
    await page.goto('/');

    // Verify landing page elements
    await expect(page).toHaveTitle(/CGraph/i);
    await expect(page.getByRole('link', { name: /sign in|log in/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /sign up|register/i })).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /sign in|log in/i }).click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: /sign in|log in/i })).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /sign up|register|get started/i }).click();

    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByRole('heading', { name: /sign up|register|create/i })).toBeVisible();
  });
});

test.describe('Authenticated Navigation', () => {
  test('should access dashboard when authenticated', async ({ page }) => {
    await page.goto('/dashboard');

    // Should not redirect to login if authenticated
    await expect(page).not.toHaveURL(/\/login/);

    // Should show dashboard content
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('should navigate to conversations', async ({ page }) => {
    await page.goto('/conversations');

    await expect(page).toHaveURL(/\/conversations/);
    // Verify conversation list or empty state
    await expect(page.getByRole('list').or(page.getByText(/no conversations/i))).toBeVisible();
  });

  test('should navigate to groups', async ({ page }) => {
    await page.goto('/groups');

    await expect(page).toHaveURL(/\/groups/);
    await expect(page.getByRole('list').or(page.getByText(/no groups/i))).toBeVisible();
  });

  test('should navigate to settings', async ({ page }) => {
    await page.goto('/settings');

    await expect(page).toHaveURL(/\/settings/);
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
  });

  test('should navigate to profile', async ({ page }) => {
    await page.goto('/profile');

    await expect(page).toHaveURL(/\/profile/);
    await expect(page.getByRole('heading', { name: /profile/i })).toBeVisible();
  });
});

test.describe('Responsive Navigation', () => {
  test('mobile menu should work on small screens', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');

    // Look for mobile menu button
    const menuButton = page
      .getByRole('button', { name: /menu/i })
      .or(page.getByTestId('mobile-menu-button'));

    if (await menuButton.isVisible()) {
      await menuButton.click();

      // Navigation items should appear
      await expect(page.getByRole('navigation')).toBeVisible();
    }
  });
});
