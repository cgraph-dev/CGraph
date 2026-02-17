/**
 * Core Web Vitals Monitoring
 *
 * Measures CLS, FCP, INP, LCP, and TTFB using the web-vitals library (v5).
 * Reports metrics to:
 *   1. Console (development only)
 *   2. Plausible Analytics custom events (production)
 *
 * @see https://web.dev/articles/vitals
 */

import type { Metric } from 'web-vitals';

/** Metric rating thresholds for console coloring */
const RATING_COLORS = {
  good: '#0cce6b',
  'needs-improvement': '#ffa400',
  poor: '#ff4e42',
} as const;

/**
 * Send a web-vitals metric to Plausible Analytics as a custom event.
 */
function sendToAnalytics(metric: Metric): void {
  const body = {
    name: metric.name,
    value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    rating: metric.rating,
    delta: Math.round(metric.delta),
    id: metric.id,
    navigationType: metric.navigationType,
  };

  // Development: log to console with color coding
  if (import.meta.env.DEV) {
    const color = RATING_COLORS[metric.rating];
    console.log(
      `%c[Web Vitals] ${metric.name}: ${metric.value.toFixed(metric.name === 'CLS' ? 3 : 0)} (${metric.rating})`,
      `color: ${color}; font-weight: bold`
    );
    return;
  }

  // Production: report to Plausible custom events
  // Plausible's script exposes window.plausible() for custom events
  const plausible = (window as unknown as Record<string, unknown>).plausible as
    | ((event: string, options: { props: Record<string, unknown> }) => void)
    | undefined;

  if (typeof plausible === 'function') {
    plausible('Web Vitals', {
      props: {
        metric: body.name,
        value: body.value,
        rating: body.rating,
      },
    });
  }
}

/**
 * Initialize Core Web Vitals monitoring.
 * Dynamically imports web-vitals to avoid impacting initial bundle size.
 */
export function initWebVitals(): void {
  // Dynamic import keeps web-vitals out of the critical path
  import('web-vitals')
    .then(({ onCLS, onFCP, onINP, onLCP, onTTFB }) => {
      onCLS(sendToAnalytics);
      onFCP(sendToAnalytics);
      onINP(sendToAnalytics);
      onLCP(sendToAnalytics);
      onTTFB(sendToAnalytics);
    })
    .catch(() => {
      // Silently ignore — web-vitals is non-critical
    });
}
