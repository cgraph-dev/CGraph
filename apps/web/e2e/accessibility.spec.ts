import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility E2E Tests — WCAG 2.1 AA compliance
 *
 * Uses axe-core via @axe-core/playwright to run automated a11y audits
 * on key pages. Covers:
 * - Color contrast (WCAG SC 1.4.3)
 * - ARIA attributes (WCAG SC 4.1.2)
 * - Keyboard navigation (WCAG SC 2.1.1)
 * - Form labels (WCAG SC 1.3.1)
 * - Image alt text (WCAG SC 1.1.1)
 *
 * Install: pnpm add -D @axe-core/playwright
 * Run:     pnpm exec playwright test e2e/accessibility.spec.ts
 */

// Pages to audit — covers all major entry points
const PAGES_TO_AUDIT = [
  { name: 'Login', path: '/login' },
  { name: 'Register', path: '/register' },
  { name: 'Forgot Password', path: '/forgot-password' },
];

// Authenticated pages (require login)
const AUTH_PAGES_TO_AUDIT = [
  { name: 'Messages', path: '/messages' },
  { name: 'Groups', path: '/groups' },
  { name: 'Forums', path: '/forums' },
  { name: 'Settings', path: '/settings' },
  { name: 'Premium', path: '/premium' },
  { name: 'Profile', path: '/profile' },
];

test.describe('Accessibility — Public Pages', () => {
  for (const page of PAGES_TO_AUDIT) {
    test(`${page.name} page passes axe WCAG 2.1 AA audit`, async ({ page: p }) => {
      await p.goto(page.path);
      await p.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page: p })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .exclude('[data-testid="loading-spinner"]') // Exclude dynamic loading states
        .analyze();

      // Log violations for debugging
      if (results.violations.length > 0) {
        console.log(`\n📋 A11y violations on ${page.name}:`);
        for (const violation of results.violations) {
          console.log(`  ❌ [${violation.impact}] ${violation.id}: ${violation.description}`);
          console.log(`     Help: ${violation.helpUrl}`);
          for (const node of violation.nodes.slice(0, 3)) {
            console.log(`     → ${node.html.substring(0, 100)}`);
          }
        }
      }

      // Allow known minor issues but flag serious/critical
      const serious = results.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );
      expect(serious, `${page.name} has ${serious.length} serious/critical a11y violations`).toHaveLength(0);
    });
  }
});

test.describe('Accessibility — Authenticated Pages', () => {
  test.use({ storageState: 'playwright/.auth/user.json' });

  for (const page of AUTH_PAGES_TO_AUDIT) {
    test(`${page.name} page passes axe WCAG 2.1 AA audit`, async ({ page: p }) => {
      await p.goto(page.path);
      await p.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page: p })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .exclude('[data-testid="loading-spinner"]')
        .analyze();

      if (results.violations.length > 0) {
        console.log(`\n📋 A11y violations on ${page.name}:`);
        for (const violation of results.violations) {
          console.log(`  ❌ [${violation.impact}] ${violation.id}: ${violation.description}`);
          for (const node of violation.nodes.slice(0, 3)) {
            console.log(`     → ${node.html.substring(0, 100)}`);
          }
        }
      }

      const serious = results.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );
      expect(serious, `${page.name} has ${serious.length} serious/critical a11y violations`).toHaveLength(0);
    });
  }
});

test.describe('Accessibility — Keyboard Navigation', () => {
  test('login form is fully keyboard-navigable', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Tab through form — should reach email, password, submit
    await page.keyboard.press('Tab');
    const firstFocused = await page.evaluate(() => document.activeElement?.tagName);
    expect(['INPUT', 'A', 'BUTTON']).toContain(firstFocused);

    // Should be able to tab through all interactive elements
    const focusableElements: string[] = [];
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      const tag = await page.evaluate(() => {
        const el = document.activeElement;
        return el ? `${el.tagName}:${el.getAttribute('type') || el.getAttribute('role') || ''}` : 'NONE';
      });
      focusableElements.push(tag);
    }

    // Verify we hit at least email input, password input, and submit button
    const hasInput = focusableElements.some(e => e.includes('INPUT'));
    const hasButton = focusableElements.some(e => e.includes('BUTTON'));
    expect(hasInput).toBeTruthy();
    expect(hasButton).toBeTruthy();
  });

  test('escape key closes modal dialogs', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // If there's a modal trigger, test escape closes it
    const modalTrigger = page.locator('[data-testid="modal-trigger"], [aria-haspopup="dialog"]').first();
    if (await modalTrigger.isVisible().catch(() => false)) {
      await modalTrigger.click();
      await page.keyboard.press('Escape');

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).not.toBeVisible();
    }
  });
});

test.describe('Accessibility — ARIA Landmarks', () => {
  test('login page has proper landmark structure', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Check for main landmark
    const main = page.locator('main, [role="main"]');
    const hasMain = await main.count();
    expect(hasMain).toBeGreaterThanOrEqual(1);
  });

  test('form inputs have associated labels', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    // All visible inputs should have labels (via label element, aria-label, or aria-labelledby)
    const inputs = page.locator('input:visible:not([type="hidden"])');
    const count = await inputs.count();

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const hasLabel = await input.evaluate((el: HTMLInputElement) => {
        const { id } = el;
        const hasLabelElement = id ? !!document.querySelector(`label[for="${id}"]`) : false;
        const hasAriaLabel = !!el.getAttribute('aria-label');
        const hasAriaLabelledBy = !!el.getAttribute('aria-labelledby');
        const hasPlaceholder = !!el.placeholder;
        const hasTitle = !!el.title;
        return hasLabelElement || hasAriaLabel || hasAriaLabelledBy || hasPlaceholder || hasTitle;
      });

      expect(hasLabel, `Input ${i} should have an accessible label`).toBeTruthy();
    }
  });
});
