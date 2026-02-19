/**
 * Base HTTP client — fetch-based, works on both web and React Native.
 *
 * Handles auth token injection, cursor pagination, and consistent
 * error handling per Rule 15 (API Contract & Versioning).
 */

import { createAuthEndpoints } from './endpoints/auth';
import type { AuthEndpoints } from './endpoints/auth';
import { createMessagesEndpoints } from './endpoints/messages';
import type { MessagesEndpoints } from './endpoints/messages';
import { createForumsEndpoints } from './endpoints/forums';
import type { ForumsEndpoints } from './endpoints/forums';
import { createGroupsEndpoints } from './endpoints/groups';
import type { GroupsEndpoints } from './endpoints/groups';
import { createFriendsEndpoints } from './endpoints/friends';
import type { FriendsEndpoints } from './endpoints/friends';
import { createGamificationEndpoints } from './endpoints/gamification';
import type { GamificationEndpoints } from './endpoints/gamification';
import { withResilience } from './resilience';
import type { ResilienceConfig } from './resilience';

// --- Types ---

/** API response envelope — matches Rule 15 success shape. */
export interface ApiResponse<T> {
  readonly data: T;
  readonly meta?: {
    readonly cursor?: string;
    readonly has_more?: boolean;
  };
}

/** Paginated response with cursor metadata. */
export type PaginatedResponse<T> = ApiResponse<T[]>;

/** API error envelope — matches Rule 15 error shape. */
export interface ApiError {
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly details?: unknown;
  };
}

/** Cursor pagination parameters. */
export interface PaginationParams {
  readonly cursor?: string;
  readonly limit?: number;
}

/** Client configuration. */
export interface ApiClientConfig {
  /** Base URL for API requests (e.g. https://api.cgraph.org). */
  readonly baseUrl: string;
  /** Optional token getter — called on each request for fresh token. */
  readonly getToken?: () => string | null;
  /** Optional custom fetch implementation (for React Native / testing). */
  readonly fetchImpl?: typeof fetch;
  /** Resilience configuration (retry, circuit breaker, timeout). */
  readonly resilience?: ResilienceConfig;
}

/** The unified API client surface. */
export interface ApiClient {
  readonly auth: AuthEndpoints;
  readonly messages: MessagesEndpoints;
  readonly forums: ForumsEndpoints;
  readonly groups: GroupsEndpoints;
  readonly friends: FriendsEndpoints;
  readonly gamification: GamificationEndpoints;
  /** Set bearer token for all subsequent requests. */
  setToken(token: string | null): void;
  /** Raw request method for custom endpoints. */
  request<T>(method: string, path: string, options?: RequestOptions): Promise<ApiResponse<T>>;
}

/** Options for raw request method. */
export interface RequestOptions {
  readonly body?: unknown;
  readonly params?: Record<string, string | number | boolean | undefined>;
  readonly headers?: Record<string, string>;
  readonly signal?: AbortSignal;
}

// --- Implementation ---

class ApiClientError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;
  readonly requestId?: string;

  constructor(status: number, error: ApiError['error'], requestId?: string) {
    super(error.message);
    this.name = 'ApiClientError';
    this.code = error.code;
    this.status = status;
    this.details = error.details;
    this.requestId = requestId;
  }
}

/** Creates a typed API client instance. */
export function createApiClient(config: ApiClientConfig): ApiClient {
  let token: string | null = null;
  const baseFetch = config.fetchImpl ?? fetch;

  // Wrap fetch with retry, circuit breaker, and timeout
  const fetchFn =
    config.resilience !== undefined ? withResilience(baseFetch, config.resilience) : baseFetch;

  function getAuthToken(): string | null {
    if (config.getToken) {
      return config.getToken();
    }
    return token;
  }

  async function request<T>(
    method: string,
    path: string,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    const url = new URL(path, config.baseUrl);

    // Append query params
    if (options?.params) {
      for (const [key, value] of Object.entries(options.params)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options?.headers,
    };

    const currentToken = getAuthToken();
    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    }

    const response = await fetchFn(url.toString(), {
      method,
      headers,
      body: options?.body ? JSON.stringify(options.body) : undefined,
      signal: options?.signal,
    });

    if (response.status === 204) {
      return { data: undefined as T };
    }

    const body: unknown = await response.json();

    // Extract request ID for correlation between frontend errors and backend logs
    const requestId = response.headers.get('x-request-id') ?? undefined;

    if (!response.ok) {
      const errorBody = body as { error?: ApiError['error'] };
      throw new ApiClientError(
        response.status,
        errorBody.error ?? {
          code: 'unknown_error',
          message: `HTTP ${response.status}`,
        },
        requestId
      );
    }

    const result = body as ApiResponse<T>;
    if (requestId && result.meta) {
      (result.meta as Record<string, unknown>).requestId = requestId;
    }
    return result;
  }

  /** GET helper. */
  async function get<T>(
    path: string,
    params?: Record<string, string | number | boolean | undefined>
  ): Promise<ApiResponse<T>> {
    return request<T>('GET', path, { params });
  }

  /** POST helper. */
  async function post<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return request<T>('POST', path, { body });
  }

  /** PUT helper. */
  async function put<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return request<T>('PUT', path, { body });
  }

  /** PATCH helper. */
  async function patch<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return request<T>('PATCH', path, { body });
  }

  /** DELETE helper. */
  async function del<T>(path: string): Promise<ApiResponse<T>> {
    return request<T>('DELETE', path);
  }

  const http = { get, post, put, patch, del, request };

  return {
    auth: createAuthEndpoints(http),
    messages: createMessagesEndpoints(http),
    forums: createForumsEndpoints(http),
    groups: createGroupsEndpoints(http),
    friends: createFriendsEndpoints(http),
    gamification: createGamificationEndpoints(http),
    setToken(t: string | null) {
      token = t;
    },
    request,
  };
}

/** HTTP helpers type passed to endpoint factories. */
export type HttpHelpers = {
  get<T>(
    path: string,
    params?: Record<string, string | number | boolean | undefined>
  ): Promise<ApiResponse<T>>;
  post<T>(path: string, body?: unknown): Promise<ApiResponse<T>>;
  put<T>(path: string, body?: unknown): Promise<ApiResponse<T>>;
  patch<T>(path: string, body?: unknown): Promise<ApiResponse<T>>;
  del<T>(path: string): Promise<ApiResponse<T>>;
  request<T>(method: string, path: string, options?: RequestOptions): Promise<ApiResponse<T>>;
};
