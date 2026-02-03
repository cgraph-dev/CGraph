/**
 * Crypto module barrel export
 *
 * Mobile uses its own E2EE implementation optimized for React Native.
 * Type definitions for cross-platform compatibility.
 */

// Mobile-specific E2EE implementation
export { default as e2ee } from './e2ee';
export * from './e2ee';

// React context for E2EE state
export { E2EEProvider, useE2EE, usePreKeyReplenishment } from './E2EEContext';
