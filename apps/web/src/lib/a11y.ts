/**
 * Accessibility (a11y) utilities for CGraph
 *
 * WCAG 2.1 AA compliance helpers:
 * - Focus management
 * - Screen reader announcements
 * - Keyboard navigation
 * - Color contrast
 * - Reduced motion
 */

// ============================================================================
// Focus Management
// ============================================================================

/**
 * Trap focus within an element (for modals, dialogs)
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusableElements = container.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  };

  container.addEventListener('keydown', handleKeyDown);
  firstElement?.focus();

  return () => container.removeEventListener('keydown', handleKeyDown);
}

/**
 * Return focus to the previously focused element
 */
export function restoreFocus(previousElement: HTMLElement | null): void {
  if (previousElement && typeof previousElement.focus === 'function') {
    previousElement.focus();
  }
}

/**
 * Save current focus for later restoration
 */
export function saveFocus(): HTMLElement | null {
  return document.activeElement as HTMLElement | null;
}

// ============================================================================
// Screen Reader Announcements
// ============================================================================

let announcer: HTMLElement | null = null;

/**
 * Initialize the screen reader announcer element
 */
function getAnnouncer(): HTMLElement {
  if (announcer) return announcer;

  announcer = document.createElement('div');
  announcer.setAttribute('role', 'status');
  announcer.setAttribute('aria-live', 'polite');
  announcer.setAttribute('aria-atomic', 'true');
  announcer.className = 'sr-only';
  announcer.style.cssText = `
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  `;
  document.body.appendChild(announcer);

  return announcer;
}

/**
 * Announce a message to screen readers
 */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const el = getAnnouncer();
  el.setAttribute('aria-live', priority);
  el.textContent = '';

  // Force reflow for screen readers to pick up the change
  void el.offsetHeight;
  el.textContent = message;
}

/**
 * Announce an error message (assertive)
 */
export function announceError(message: string): void {
  announce(message, 'assertive');
}

// ============================================================================
// Keyboard Navigation
// ============================================================================

/**
 * Handle arrow key navigation within a list
 */
export function handleArrowNavigation(
  e: KeyboardEvent,
  items: HTMLElement[],
  currentIndex: number,
  orientation: 'horizontal' | 'vertical' = 'vertical'
): number {
  const prevKey = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft';
  const nextKey = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';

  let newIndex = currentIndex;

  switch (e.key) {
    case prevKey:
      e.preventDefault();
      newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
      break;
    case nextKey:
      e.preventDefault();
      newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
      break;
    case 'Home':
      e.preventDefault();
      newIndex = 0;
      break;
    case 'End':
      e.preventDefault();
      newIndex = items.length - 1;
      break;
  }

  items[newIndex]?.focus();
  return newIndex;
}

/**
 * Create keyboard handler for custom component
 */
export function createKeyboardHandler(
  onEnter?: () => void,
  onSpace?: () => void,
  onEscape?: () => void
): (e: KeyboardEvent) => void {
  return (e: KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
        onEnter?.();
        break;
      case ' ':
        e.preventDefault(); // Prevent page scroll
        onSpace?.();
        break;
      case 'Escape':
        onEscape?.();
        break;
    }
  };
}

// ============================================================================
// Color Contrast
// ============================================================================

/**
 * Calculate relative luminance of a color
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  const parseColor = (color: string): [number, number, number] => {
    const hex = color.replace('#', '');
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
    ];
  };

  const l1 = getLuminance(...parseColor(color1));
  const l2 = getLuminance(...parseColor(color2));

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG standards
 */
export function meetsContrastRequirement(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA',
  isLargeText = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  const thresholds = {
    AA: isLargeText ? 3 : 4.5,
    AAA: isLargeText ? 4.5 : 7,
  };
  return ratio >= thresholds[level];
}

// ============================================================================
// Reduced Motion
// ============================================================================

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Subscribe to reduced motion preference changes
 */
export function onReducedMotionChange(callback: (prefersReduced: boolean) => void): () => void {
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const handler = (e: MediaQueryListEvent) => callback(e.matches);

  mediaQuery.addEventListener('change', handler);
  return () => mediaQuery.removeEventListener('change', handler);
}

/**
 * Get animation duration based on user preference
 */
export function getAnimationDuration(normalDuration: number): number {
  return prefersReducedMotion() ? 0 : normalDuration;
}

// ============================================================================
// ARIA Helpers
// ============================================================================

/**
 * Generate unique ID for ARIA relationships
 */
let idCounter = 0;
export function generateId(prefix = 'cgraph'): string {
  return `${prefix}-${++idCounter}`;
}

/**
 * Create ARIA label from content
 */
export function createAriaLabel(
  content: string,
  context?: { index?: number; total?: number; type?: string }
): string {
  let label = content;

  if (context?.type) {
    label = `${context.type}: ${label}`;
  }

  if (context?.index !== undefined && context?.total !== undefined) {
    label += `. Item ${context.index + 1} of ${context.total}`;
  }

  return label;
}

// ============================================================================
// Skip Links
// ============================================================================

/**
 * Create skip link for main content
 */
export function createSkipLink(targetId: string, label = 'Skip to main content'): HTMLElement {
  const link = document.createElement('a');
  link.href = `#${targetId}`;
  link.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-md';
  link.textContent = label;

  link.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.tabIndex = -1;
      target.focus();
    }
  });

  return link;
}

// ============================================================================
// Export default object for convenience
// ============================================================================

export const a11y = {
  trapFocus,
  restoreFocus,
  saveFocus,
  announce,
  announceError,
  handleArrowNavigation,
  createKeyboardHandler,
  getContrastRatio,
  meetsContrastRequirement,
  prefersReducedMotion,
  onReducedMotionChange,
  getAnimationDuration,
  generateId,
  createAriaLabel,
  createSkipLink,
};

export default a11y;
