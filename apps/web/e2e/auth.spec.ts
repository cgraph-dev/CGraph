import { test, expect } from '@playwright/test';

/**
 * Authentication Flow E2E Tests
 * Tests login, register, logout, and password reset flows
 */
test.describe('Authentication Flows', () => {
  test.describe('Login', () => {
    test('should show validation errors for empty form', async ({ page }) => {
      await page.goto('/login');

      // Click submit without filling form
      await page.getByRole('button', { name: /sign in|log in/i }).click();

      // Should show validation errors
      await expect(page.getByText(/email.*required|enter.*email/i)).toBeVisible();
      await expect(page.getByText(/password.*required|enter.*password/i)).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');

      await page.getByLabel(/email/i).fill('invalid@test.com');
      await page.getByLabel(/password/i).fill('wrongpassword');
      await page.getByRole('button', { name: /sign in|log in/i }).click();

      // Should show error message
      await expect(
        page.getByText(/invalid.*credentials|incorrect.*password|not found/i)
      ).toBeVisible({ timeout: 10000 });
    });

    test('should show password visibility toggle', async ({ page }) => {
      await page.goto('/login');

      const passwordInput = page.getByLabel(/password/i);
      await passwordInput.fill('testpassword');

      // Initially password should be hidden
      await expect(passwordInput).toHaveAttribute('type', 'password');

      // Look for visibility toggle
      const toggleButton = page.getByRole('button', { name: /show|toggle|visibility/i });
      if (await toggleButton.isVisible()) {
        await toggleButton.click();
        await expect(passwordInput).toHaveAttribute('type', 'text');
      }
    });

    test('should have link to forgot password', async ({ page }) => {
      await page.goto('/login');

      const forgotLink = page.getByRole('link', { name: /forgot.*password/i });
      await expect(forgotLink).toBeVisible();
      await forgotLink.click();

      await expect(page).toHaveURL(/\/(forgot-password|reset)/);
    });

    test('should have link to register', async ({ page }) => {
      await page.goto('/login');

      const registerLink = page.getByRole('link', { name: /sign up|register|create.*account/i });
      await expect(registerLink).toBeVisible();
      await registerLink.click();

      await expect(page).toHaveURL(/\/register/);
    });
  });

  test.describe('Registration', () => {
    test('should show validation errors for empty form', async ({ page }) => {
      await page.goto('/register');

      await page.getByRole('button', { name: /sign up|register|create/i }).click();

      // Should show validation errors
      await expect(page.getByText(/email.*required|enter.*email/i)).toBeVisible();
      await expect(page.getByText(/password.*required|enter.*password/i)).toBeVisible();
    });

    test('should validate email format', async ({ page }) => {
      await page.goto('/register');

      await page.getByLabel(/email/i).fill('notanemail');
      await page.getByLabel(/email/i).blur();

      await expect(page.getByText(/valid.*email|invalid.*email/i)).toBeVisible();
    });

    test('should validate password strength', async ({ page }) => {
      await page.goto('/register');

      // Fill in weak password
      await page.getByLabel(/^password$/i).fill('123');
      await page.getByLabel(/^password$/i).blur();

      // Should show password requirements
      await expect(page.getByText(/8.*characters|too.*short|stronger/i)).toBeVisible();
    });

    test('should have link to login', async ({ page }) => {
      await page.goto('/register');

      const loginLink = page.getByRole('link', { name: /sign in|log in|already.*account/i });
      await expect(loginLink).toBeVisible();
      await loginLink.click();

      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Logout', () => {
    test('should logout successfully', async ({ page }) => {
      await page.goto('/dashboard');

      // Find and click user menu
      const userMenu = page
        .getByRole('button', { name: /menu|profile|account/i })
        .or(page.getByTestId('user-avatar'));

      if (await userMenu.isVisible()) {
        await userMenu.click();

        // Click logout
        const logoutButton = page
          .getByRole('menuitem', { name: /log.*out|sign.*out/i })
          .or(page.getByRole('button', { name: /log.*out|sign.*out/i }));

        if (await logoutButton.isVisible()) {
          await logoutButton.click();

          // Should redirect to login or landing
          await expect(page).toHaveURL(/(\/login|\/$)/);
        }
      }
    });
  });

  test.describe('Password Reset', () => {
    test('should show forgot password form', async ({ page }) => {
      await page.goto('/forgot-password');

      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /reset|send|submit/i })).toBeVisible();
    });

    test('should validate email on password reset', async ({ page }) => {
      await page.goto('/forgot-password');

      await page.getByRole('button', { name: /reset|send|submit/i }).click();

      await expect(page.getByText(/email.*required|enter.*email/i)).toBeVisible();
    });
  });
});
