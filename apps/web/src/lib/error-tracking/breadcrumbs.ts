/**
 * Breadcrumb Management
 *
 * Maintains a circular buffer of navigation/action breadcrumbs
 * for debugging context in error reports.
 *
 * @module lib/error-tracking/breadcrumbs
 */

import type { Breadcrumb } from './types';
import { CONFIG } from './config';

/** In-memory breadcrumb trail */
const breadcrumbs: Breadcrumb[] = [];

/** Add a breadcrumb to the trail */
export function addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
  const crumb: Breadcrumb = { ...breadcrumb, timestamp: Date.now() };
  breadcrumbs.push(crumb);

  if (breadcrumbs.length > CONFIG.maxBreadcrumbs) {
    breadcrumbs.shift();
  }

  if (CONFIG.debug) {
    console.debug('[ErrorTracking] Breadcrumb:', crumb);
  }
}

/** Clear all breadcrumbs */
export function clearBreadcrumbs(): void {
  breadcrumbs.length = 0;
}

/** Get a snapshot of current breadcrumbs */
export function getBreadcrumbs(): Breadcrumb[] {
  return [...breadcrumbs];
}
