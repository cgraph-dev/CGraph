/**
 * Devtools middleware wrapper for Zustand stores.
 *
 * Thin wrapper around Zustand's built-in devtools middleware
 * that applies CGraph-specific defaults (store naming, action
 * tracking, production disable).
 *
 * @module @cgraph/state/with-devtools
 */

import { devtools, type DevtoolsOptions } from 'zustand/middleware';
import type { StateCreator, StoreMutatorIdentifier } from 'zustand';

interface CGraphDevtoolsOptions extends DevtoolsOptions {
  /** Store name shown in Redux DevTools */
  readonly name: string;
  /** Whether to enable in production (default: false) */
  readonly enableInProduction?: boolean;
}

/**
 * Wraps a Zustand store creator with devtools middleware.
 *
 * Automatically disables devtools in production unless
 * `enableInProduction` is set to true.
 *
 * @example
 * ```ts
 * const useStore = create(
 *   withDevtools(
 *     (set) => ({ count: 0 }),
 *     { name: 'CountStore' },
 *   ),
 * );
 * ```
 */
export function withDevtools<
  T extends object,
  Mps extends Array<[StoreMutatorIdentifier, unknown]> = [],
  Mcs extends Array<[StoreMutatorIdentifier, unknown]> = [],
>(
  creator: StateCreator<T, Mps, Mcs>,
  options: CGraphDevtoolsOptions
): StateCreator<T, Mps, [['zustand/devtools', never], ...Mcs]> {
  const { enableInProduction = false, ...rest } = options;

  const enabled =
    enableInProduction || typeof process === 'undefined' || process.env.NODE_ENV !== 'production';

  return devtools(creator, { ...rest, enabled }) as StateCreator<
    T,
    Mps,
    [['zustand/devtools', never], ...Mcs]
  >;
}
