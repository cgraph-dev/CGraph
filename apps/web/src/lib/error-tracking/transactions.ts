/**
 * Performance Transaction Tracking
 *
 * Lightweight performance monitoring with named transactions
 * and nested spans. Reports slow transactions as warnings.
 *
 * @module lib/error-tracking/transactions
 */

import type { Transaction } from './types';
import { CONFIG } from './config';
import { captureMessage } from './queue';

/** Active performance transactions */
const activeTransactions = new Map<string, Transaction>();

/** Start a performance transaction */
export function startTransaction(name: string): string {
  const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  activeTransactions.set(txId, {
    name,
    startTime: performance.now(),
    spans: [],
  });
  return txId;
}

/** Add a span to an active transaction */
export function startSpan(txId: string, spanName: string): void {
  const tx = activeTransactions.get(txId);
  if (!tx) return;
  tx.spans.push({ name: spanName, startTime: performance.now() });
}

/** End the current span in a transaction */
export function endSpan(txId: string): void {
  const tx = activeTransactions.get(txId);
  if (!tx) return;
  const currentSpan = tx.spans[tx.spans.length - 1];
  if (currentSpan && !currentSpan.endTime) {
    currentSpan.endTime = performance.now();
  }
}

/** Finish a transaction and optionally report slow ones */
export function finishTransaction(txId: string, report = false): void {
  const tx = activeTransactions.get(txId);
  if (!tx) return;

  const duration = performance.now() - tx.startTime;

  if (CONFIG.debug) {
    // eslint-disable-next-line no-console
    console.debug('[ErrorTracking] Transaction finished:', {
      name: tx.name,
      duration: `${duration.toFixed(2)}ms`,
      spans: tx.spans.map((s) => ({
        name: s.name,
        duration: s.endTime ? `${(s.endTime - s.startTime).toFixed(2)}ms` : 'incomplete',
      })),
    });
  }

  if (report && CONFIG.enabled && duration > 3000) {
    captureMessage(`Slow transaction: ${tx.name}`, 'warning', {
      component: 'performance',
      metadata: { duration, spanCount: tx.spans.length },
      tags: { type: 'slow_transaction' },
    });
  }

  activeTransactions.delete(txId);
}
