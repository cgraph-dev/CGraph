/**
 * @cgraph/api-client — Resilient API client for CGraph
 *
 * Production-grade resilience layer with:
 * - Retry with exponential backoff + jitter
 * - Circuit breaker (closed → open → half-open)
 * - Request timeout via AbortController
 * - Composable `withResilience()` wrapper for any fetch-compatible function
 *
 * @module @cgraph/api-client
 * @version 0.9.31
 */

// ---------------------------------------------------------------------------
// Resilience primitives
// ---------------------------------------------------------------------------
export {
  CircuitBreaker,
  CircuitOpenError,
  RequestTimeoutError,
  withResilience,
  withRetry,
  withTimeout,
} from './resilience';

export type {
  CircuitBreakerConfig,
  CircuitBreakerState,
  CircuitBreakerStats,
  RetryConfig,
  ResilienceConfig,
} from './resilience';

// ---------------------------------------------------------------------------
// API client factory
// ---------------------------------------------------------------------------
export { createApiClient } from './client';

export type { ApiClientConfig, ApiClient, ApiRequestOptions } from './client';

// ---------------------------------------------------------------------------
// Typed endpoint constants
// ---------------------------------------------------------------------------
export type { HttpVerb, EndpointDef } from './endpoints';
export {
  HEALTH,
  WEBHOOKS,
  TELEMETRY,
  AUTH,
  OAUTH,
  WALLET_AUTH,
  TWO_FACTOR,
  TIERS,
  EXPLORE,
  ME,
  SETTINGS,
  USERS,
  CONVERSATIONS,
  MESSAGES,
  GROUPS,
  INVITES,
  NODES,
  SHOP,
  AVATAR_BORDERS,
  PROFILE_THEMES,
  CHAT_EFFECTS,
  FORUMS,
  POSTS,
  PULSE,
  DISCOVERY,
  CREATOR,
  AI,
  SYNC,
  ANIMATIONS,
  SEARCH,
  NOTIFICATIONS,
  FRIENDS,
  TITLES,
  ACHIEVEMENTS,
  PREMIUM,
  IAP,
  BILLING,
} from './endpoints';

// ---------------------------------------------------------------------------
// Typed API methods — Nodes
// ---------------------------------------------------------------------------
export { getWallet, getTransactions, getBundles, tipUser, unlockContent, withdraw } from './nodes';

// ---------------------------------------------------------------------------
// Typed API methods — Cosmetics
// ---------------------------------------------------------------------------
export {
  getInventory,
  equipItem,
  unequipItem,
  getBadges,
  getUserBadges,
  getNameplates,
  getUserNameplates,
  getProfileEffects,
  getProfileFrames,
  getNameStyles,
} from './cosmetics';
