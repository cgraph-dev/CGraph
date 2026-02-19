/**
 * CGraph API Client — typed HTTP client for both web and mobile.
 *
 * Provides a platform-agnostic fetch-based client with:
 * - Typed request/response for all endpoints
 * - Automatic auth token injection
 * - Cursor-based pagination helpers
 * - Consistent error handling matching Rule 15 API contract
 *
 * @example
 *   const api = createApiClient({ baseUrl: 'https://api.cgraph.org' });
 *   api.setToken(jwt);
 *   const { data } = await api.auth.me();
 */

export { createApiClient } from './client';
export type { ApiClient, ApiClientConfig, ApiError, PaginatedResponse, ApiResponse } from './client';

// Resilience layer
export { withResilience, CircuitBreaker, CircuitOpenError, RequestTimeoutError } from './resilience';
export type { ResilienceConfig, RetryConfig, CircuitBreakerConfig, CircuitState } from './resilience';

// Endpoint modules (re-exported via client instance)
export type { AuthEndpoints } from './endpoints/auth';
export type { MessagesEndpoints } from './endpoints/messages';
export type { ForumsEndpoints } from './endpoints/forums';
export type { GroupsEndpoints } from './endpoints/groups';
export type { FriendsEndpoints } from './endpoints/friends';
export type { GamificationEndpoints } from './endpoints/gamification';
