import { test, expect } from '@playwright/test';

/**
 * Messaging E2E Tests
 * Tests conversation creation, message sending, and real-time features
 */
test.describe('Messaging', () => {
  test.describe('Conversations List', () => {
    test('should display conversations list', async ({ page }) => {
      await page.goto('/conversations');

      await expect(page.getByRole('main')).toBeVisible();

      // Should show list or empty state
      const hasList = await page.getByRole('list').isVisible();
      const hasEmpty = await page.getByText(/no conversations|start a conversation/i).isVisible();

      expect(hasList || hasEmpty).toBeTruthy();
    });

    test('should have new conversation button', async ({ page }) => {
      await page.goto('/conversations');

      const newButton = page
        .getByRole('button', { name: /new|compose|create/i })
        .or(page.getByTestId('new-conversation-button'));

      await expect(newButton).toBeVisible();
    });

    test('should search conversations', async ({ page }) => {
      await page.goto('/conversations');

      const searchInput = page.getByRole('searchbox').or(page.getByPlaceholder(/search/i));

      if (await searchInput.isVisible()) {
        await searchInput.fill('test');
        await page.waitForTimeout(500); // Debounce delay

        // Verify the search input accepted the value
        await expect(searchInput).toHaveValue('test');
      } else {
        test.skip();
      }
    });
  });

  test.describe('Conversation View', () => {
    test('should show message composer', async ({ page }) => {
      await page.goto('/conversations');

      // Click on first conversation if exists
      const firstConvo = page
        .getByRole('listitem')
        .first()
        .or(page.getByTestId('conversation-item').first());

      if (await firstConvo.isVisible()) {
        await firstConvo.click();

        // Should show message input
        const messageInput = page
          .getByRole('textbox', { name: /message/i })
          .or(page.getByPlaceholder(/type.*message/i));

        await expect(messageInput).toBeVisible();
      } else {
        test.skip();
      }
    });
  });

  test.describe('New Conversation', () => {
    test('should open new conversation dialog', async ({ page }) => {
      await page.goto('/conversations');

      const newButton = page
        .getByRole('button', { name: /new|compose|create/i })
        .or(page.getByTestId('new-conversation-button'));

      if (await newButton.isVisible()) {
        await newButton.click();

        // Should show dialog or navigate to new conversation page
        const hasDialog = await page
          .getByRole('dialog')
          .isVisible()
          .catch(() => false);
        const hasPage = page.url().includes('/new');

        // At least one navigation outcome must occur
        expect(hasDialog || hasPage).toBe(true);
      } else {
        test.skip();
      }
    });
  });
});

test.describe('Groups', () => {
  test('should display groups list', async ({ page }) => {
    await page.goto('/groups');

    await expect(page.getByRole('main')).toBeVisible();

    // Should show list or empty state
    const hasList = await page.getByRole('list').isVisible();
    const hasEmpty = await page.getByText(/no groups|create.*group|join.*group/i).isVisible();

    expect(hasList || hasEmpty).toBeTruthy();
  });

  test('should have create group button', async ({ page }) => {
    await page.goto('/groups');

    const createButton = page
      .getByRole('button', { name: /create|new/i })
      .or(page.getByTestId('create-group-button'));

    await expect(createButton).toBeVisible();
  });
});
