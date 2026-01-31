/**
 * Token Service - Decoupled Token Access Layer
 *
 * ARCHITECTURE:
 * =============
 * This module provides a decoupled interface for accessing authentication tokens,
 * breaking the circular dependency between api.ts and authStore.ts.
 *
 * PROBLEM SOLVED:
 * - authStore.ts imports api.ts for HTTP requests
 * - api.ts imports authStore.ts for token access
 * - This creates a circular dependency that causes "Cannot access before initialization"
 *   errors in production builds (minified as 'Ct' or similar)
 *
 * SOLUTION:
 * - This module provides getter/setter functions that are initialized lazily
 * - api.ts imports from tokenService (no direct authStore dependency)
 * - authStore.ts registers itself with tokenService on initialization
 * - No circular dependency, works with any bundler/minifier
 *
 * SECURITY:
 * - Tokens are never stored in this module (stateless)
 * - All access goes through the registered callbacks
 * - Maintains the same security model as direct store access
 */

import { createLogger } from '@/lib/logger';

const logger = createLogger('TokenService');

type TokenGetter = () => string | null | undefined;
type TokenSetter = (tokens: { accessToken: string; refreshToken?: string | null }) => void;
type LogoutHandler = () => void | Promise<void>;

interface TokenServiceConfig {
  getAccessToken: TokenGetter;
  getRefreshToken: TokenGetter;
  setTokens: TokenSetter;
  onLogout: LogoutHandler;
}

/**
 * Registry for token access callbacks
 * Initialized to null - authStore registers itself on load
 */
let tokenConfig: TokenServiceConfig | null = null;

/**
 * Pending promises waiting for registration
 * Used when api.ts initializes before authStore
 */
let registrationResolvers: Array<(config: TokenServiceConfig) => void> = [];

/**
 * Register the auth store's token access functions
 * Called by authStore.ts during initialization
 *
 * @param config - Token access configuration
 */
export function registerTokenHandlers(config: TokenServiceConfig): void {
  tokenConfig = config;
  // Resolve any pending registrations
  registrationResolvers.forEach((resolve) => resolve(config));
  registrationResolvers = [];

  if (import.meta.env.DEV) {
    logger.debug('Handlers registered successfully');
  }
}

/**
 * Check if token handlers are registered
 */
export function isRegistered(): boolean {
  return tokenConfig !== null;
}

/**
 * Wait for registration (used internally for async initialization)
 * Exported for advanced use cases where async token access is needed
 */
export function waitForRegistration(): Promise<TokenServiceConfig> {
  if (tokenConfig) {
    return Promise.resolve(tokenConfig);
  }
  return new Promise((resolve) => {
    registrationResolvers.push(resolve);
  });
}

/**
 * Get the current access token
 * Returns null if not registered (api.ts should handle gracefully)
 */
export function getAccessToken(): string | null {
  if (!tokenConfig) {
    // Not registered yet - return null, request will proceed without auth
    // This is expected during initial load before store hydration
    return null;
  }
  return tokenConfig.getAccessToken() ?? null;
}

/**
 * Get the current refresh token
 * Returns null if not registered
 */
export function getRefreshToken(): string | null {
  if (!tokenConfig) {
    return null;
  }
  return tokenConfig.getRefreshToken() ?? null;
}

/**
 * Set new tokens after refresh
 * No-op if not registered
 */
export function setTokens(tokens: { accessToken: string; refreshToken?: string | null }): void {
  if (!tokenConfig) {
    logger.warn('Cannot set tokens - handlers not registered');
    return;
  }
  tokenConfig.setTokens(tokens);
}

/**
 * Trigger logout
 * No-op if not registered
 */
export async function triggerLogout(): Promise<void> {
  if (!tokenConfig) {
    logger.warn('Cannot logout - handlers not registered');
    return;
  }
  await tokenConfig.onLogout();
}

/**
 * Create a bound token accessor for HTTP client initialization
 * This returns an object with methods that will work even if called
 * before the store is fully initialized
 */
export function createTokenAccessor() {
  return {
    getAccessToken,
    getRefreshToken,
    setTokens,
    onLogout: triggerLogout,
  };
}
