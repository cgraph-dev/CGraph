/**
 * Blog shared constants — category colors and slugs
 *
 * @since v0.9.26
 */

import type { CategoryColor } from './types';

/** Category badge colors used in both listing and article pages */
export const categoryColors: Record<string, CategoryColor> = {
  Engineering: { bg: 'rgba(99, 102, 241, 0.12)', text: '#818cf8' },
  Security: { bg: 'rgba(239, 68, 68, 0.12)', text: '#f87171' },
  Architecture: { bg: 'rgba(16, 185, 129, 0.12)', text: '#34d399' },
  Product: { bg: 'rgba(234, 179, 8, 0.12)', text: '#fbbf24' },
  Release: { bg: 'rgba(14, 165, 233, 0.12)', text: '#38bdf8' },
} as const;

/** Default fallback color for unknown categories */
export const defaultCategoryColor: CategoryColor = categoryColors.Engineering ?? {
  bg: 'rgba(99, 102, 241, 0.12)',
  text: '#818cf8',
};

/** Ordered list of all article slugs (newest first) */
export const articleSlugs = [
  'v1-release',
  'enterprise-ready',
  'creator-economy',
  'cosmetics-engine',
  'secret-chat-discovery',
  'the-great-delete',
  'architecture-refactor',
  'compliance-pass',
  'platform-parity',
  'architecture-transformation',
  'e2ee-test-suite',
  'store-consolidation',
  'code-simplification',
  'dual-app-architecture',
  'critical-security-fixes',
  'why-elixir',
  'introducing-cgraph',
] as const;

/** Available filter categories for the blog listing */
export const categories = [
  'All',
  'Engineering',
  'Security',
  'Architecture',
  'Product',
  'Release',
] as const;
