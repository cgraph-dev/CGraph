import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

/**
 * Authentication setup for E2E tests
 * Creates a test user session that other tests can reuse
 */
setup('authenticate', async ({ page }) => {
  // Check if we're in CI or need to skip auth
  const skipAuth = process.env.SKIP_AUTH === 'true';

  if (skipAuth) {
    // Create empty auth state for unauthenticated tests
    await page.context().storageState({ path: authFile });
    return;
  }

  // Navigate to login page
  await page.goto('/login');

  // Wait for login form
  await expect(page.getByRole('heading', { name: /sign in|log in/i })).toBeVisible();

  // Fill in test credentials
  const testEmail = process.env.TEST_USER_EMAIL || 'test@cgraph.dev';
  const testPassword = process.env.TEST_USER_PASSWORD || 'testpassword123';

  await page.getByLabel(/email/i).fill(testEmail);
  await page.getByLabel(/password/i).fill(testPassword);

  // Submit login form
  await page.getByRole('button', { name: /sign in|log in/i }).click();

  // Wait for successful login - should redirect to dashboard/home
  await expect(page).toHaveURL(/\/(dashboard|home|app)?/);

  // Verify user is logged in by checking for user menu or auth indicator
  await expect(
    page.getByRole('button', { name: /menu|profile|account/i }).or(page.getByTestId('user-avatar'))
  ).toBeVisible({ timeout: 10000 });

  // Save signed-in state
  await page.context().storageState({ path: authFile });
});
