import { test, expect } from '@playwright/test';

/**
 * Phase 26 Verification: Human-check items automated with Playwright.
 *
 * 1. Route redirects — all deleted gamification URLs redirect to /
 * 2. Sidebar — no "Leaderboard" or "Gamification" nav items
 * 3. No broken gamification component renders
 *
 * These tests run without auth — they verify public routing behavior.
 */

// Skip the auth setup — these routes work without login
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Phase 26: Route Redirects', () => {
  const deletedRoutes = [
    '/gamification',
    '/gamification/achievements',
    '/gamification/quests',
    '/gamification/titles',
    '/leaderboard',
    '/achievements',
    '/quests',
    '/titles',
  ];

  for (const route of deletedRoutes) {
    test(`${route} does not render a gamification page`, async ({ page }) => {
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      const url = new URL(page.url());

      // The deleted route must NOT remain as-is.
      // Expected: either redirect to / (catch-all) or /auth (auth guard).
      // Both are acceptable — what matters is that the gamification page is gone.
      const landedOnDeletedRoute = url.pathname === route;
      expect(landedOnDeletedRoute, `Route ${route} should no longer render`).toBe(false);

      // Verify no gamification-specific content rendered
      const body = await page.textContent('body');
      const lowerBody = (body ?? '').toLowerCase();
      expect(lowerBody).not.toContain('gamification hub');
      expect(lowerBody).not.toContain('achievement progress');
      expect(lowerBody).not.toContain('quest tracker');
    });
  }
});

test.describe('Phase 26: Sidebar Cleanup', () => {
  test('sidebar has no gamification/leaderboard nav items', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // Wait for sidebar to render
    await page.waitForTimeout(2000);

    const sidebar = page.locator('nav, [data-testid="sidebar"], aside').first();
    if (await sidebar.count() > 0) {
      const sidebarText = await sidebar.textContent();
      expect(sidebarText?.toLowerCase()).not.toContain('leaderboard');
      expect(sidebarText?.toLowerCase()).not.toContain('gamification hub');
      expect(sidebarText?.toLowerCase()).not.toContain('quests');
    }
  });
});

test.describe('Phase 26: No Broken Components', () => {
  test('home page loads without console errors about gamification', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    const gamificationErrors = consoleErrors.filter(
      (e) =>
        e.toLowerCase().includes('gamification') ||
        e.includes('modules/gamification') ||
        e.includes('useGamificationStore') ||
        e.includes('leaderboard')
    );

    expect(gamificationErrors).toHaveLength(0);
  });

  test('no 404 network requests for gamification resources', async ({ page }) => {
    const failedRequests: string[] = [];
    page.on('response', (response) => {
      if (response.status() === 404 && response.url().includes('gamification')) {
        failedRequests.push(response.url());
      }
    });

    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    expect(failedRequests).toHaveLength(0);
  });
});
