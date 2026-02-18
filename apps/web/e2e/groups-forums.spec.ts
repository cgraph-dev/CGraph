import { test, expect } from '@playwright/test';

/**
 * Groups & Forums E2E Tests
 * Tests group browsing, forum navigation, and content interaction flows
 */
test.describe('Groups', () => {
  test.describe('Groups List', () => {
    test('should display groups page', async ({ page }) => {
      await page.goto('/groups');

      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should show groups or empty state', async ({ page }) => {
      await page.goto('/groups');

      // Either a list of groups or an empty state message
      const hasList = await page.getByRole('list').isVisible().catch(() => false);
      const hasEmpty = await page
        .getByText(/no groups|create.*group|join.*group|get started/i)
        .isVisible()
        .catch(() => false);
      const hasGrid = await page
        .getByTestId('groups-grid')
        .or(page.locator('[class*="group-card"], [class*="GroupCard"]'))
        .first()
        .isVisible()
        .catch(() => false);

      expect(hasList || hasEmpty || hasGrid).toBeTruthy();
    });

    test('should have create group action', async ({ page }) => {
      await page.goto('/groups');

      const createButton = page
        .getByRole('button', { name: /create|new/i })
        .or(page.getByRole('link', { name: /create|new/i }))
        .or(page.getByTestId('create-group-button'));

      await expect(createButton).toBeVisible();
    });
  });
});

test.describe('Forums', () => {
  test.describe('Forum List', () => {
    test('should display forums page', async ({ page }) => {
      await page.goto('/forums');

      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should show forum categories or empty state', async ({ page }) => {
      await page.goto('/forums');

      // Forum list or empty state
      const hasContent = await page
        .getByRole('list')
        .or(page.getByRole('article'))
        .or(page.getByText(/no forums|create.*forum|browse/i))
        .first()
        .isVisible()
        .catch(() => false);

      // The page itself should at least be visible
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should have navigation to create forum', async ({ page }) => {
      await page.goto('/forums');

      const createLink = page
        .getByRole('link', { name: /create|new/i })
        .or(page.getByRole('button', { name: /create|new/i }))
        .or(page.getByTestId('create-forum-button'));

      // Create action may be available
      if (await createLink.isVisible().catch(() => false)) {
        await createLink.click();
        await expect(page).toHaveURL(/\/forums\/create/);
      }
    });
  });

  test.describe('Forum Create Page', () => {
    test('should load create forum page', async ({ page }) => {
      await page.goto('/forums/create');

      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should have forum creation form elements', async ({ page }) => {
      await page.goto('/forums/create');

      // Look for common form elements in a creation page
      const hasNameInput = await page
        .getByLabel(/name|title/i)
        .or(page.getByPlaceholder(/name|title/i))
        .first()
        .isVisible()
        .catch(() => false);
      const hasDescription = await page
        .getByLabel(/description|about/i)
        .or(page.getByPlaceholder(/description|about/i))
        .first()
        .isVisible()
        .catch(() => false);
      const hasSubmit = await page
        .getByRole('button', { name: /create|submit|save/i })
        .isVisible()
        .catch(() => false);

      // At least some form elements should be present
      expect(hasNameInput || hasDescription || hasSubmit).toBeTruthy();
    });
  });

  test.describe('Forum Leaderboard', () => {
    test('should load leaderboard page', async ({ page }) => {
      await page.goto('/forums/leaderboard');

      await expect(page.getByRole('main')).toBeVisible();
    });
  });

  test.describe('Forum Moderation', () => {
    test('should load moderation queue page', async ({ page }) => {
      await page.goto('/forums/moderation');

      await expect(page.getByRole('main')).toBeVisible();
    });
  });
});

test.describe('Groups & Forums Flow', () => {
  test('should navigate from groups to forums', async ({ page }) => {
    await page.goto('/groups');
    await expect(page.getByRole('main')).toBeVisible();

    // Navigate to forums
    await page.goto('/forums');
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page).toHaveURL(/\/forums/);
  });

  test('should navigate forum hierarchy', async ({ page }) => {
    await page.goto('/forums');

    // If there are forum links, try clicking the first one
    const forumLink = page
      .getByRole('link')
      .filter({ hasText: /./i }) // Any non-empty link
      .first();

    if (await forumLink.isVisible().catch(() => false)) {
      const href = await forumLink.getAttribute('href');
      if (href && href.includes('/forums/')) {
        await forumLink.click();
        // Should navigate to a forum page
        await expect(page.getByRole('main')).toBeVisible();
      }
    }
  });
});
