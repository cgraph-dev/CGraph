/**
 * API client factory with optional resilience integration.
 *
 * Provides a typed, ergonomic wrapper around `fetch` with:
 * - Base URL management
 * - Default headers (auth tokens, content-type)
 * - Request/response interceptors
 * - Optional resilience layer (retry + circuit breaker + timeout)
 */

import { withResilience, type ResilienceConfig, type CircuitBreaker } from './resilience';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  /** JSON body (automatically serialized). */
  body?: unknown;
  /** Query parameters appended to the URL. */
  params?: Record<string, string | number | boolean | undefined>;
}

export interface ApiClientConfig {
  /** Base URL for all requests (e.g. `https://api.cgraph.io/v1`). */
  baseUrl: string;
  /** Default headers applied to every request. */
  headers?: Record<string, string>;
  /** Callback to provide auth token dynamically. */
  getAuthToken?: () => string | null | Promise<string | null>;
  /** Resilience config. Pass `false` to disable. Default: enabled with sensible defaults. */
  resilience?: ResilienceConfig | false;
}

export interface ApiClient {
  get<T = unknown>(path: string, options?: ApiRequestOptions): Promise<T>;
  post<T = unknown>(path: string, options?: ApiRequestOptions): Promise<T>;
  put<T = unknown>(path: string, options?: ApiRequestOptions): Promise<T>;
  patch<T = unknown>(path: string, options?: ApiRequestOptions): Promise<T>;
  delete<T = unknown>(path: string, options?: ApiRequestOptions): Promise<T>;

  /** Access the underlying circuit breaker (if resilience is enabled). */
  circuitBreaker: CircuitBreaker | null;
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

/**
 * Create a configured API client.
 *
 * @example
 * ```ts
 * const api = createApiClient({
 *   baseUrl: 'https://api.cgraph.io/v1',
 *   getAuthToken: () => localStorage.getItem('token'),
 *   resilience: { timeout: 10_000, retry: { maxRetries: 2 } },
 * });
 *
 * const user = await api.get<User>('/me');
 * ```
 */
export function createApiClient(config: ApiClientConfig): ApiClient {
  const { baseUrl, headers: defaultHeaders = {}, getAuthToken, resilience } = config;

  let fetchFn: typeof fetch = globalThis.fetch.bind(globalThis);
  let circuitBreaker: CircuitBreaker | null = null;

  if (resilience !== false) {
    const resilient = withResilience(fetchFn, resilience ?? {});
    fetchFn = resilient.fetch;
    circuitBreaker = resilient.circuitBreaker;
  }

  async function request<T>(method: string, path: string, options?: ApiRequestOptions): Promise<T> {
    const { body, params, headers: reqHeaders, ...fetchInit } = options ?? {};

    // Build URL with query params
    let url = `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
    if (params) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          searchParams.set(key, String(value));
        }
      }
      const qs = searchParams.toString();
      if (qs) url += `?${qs}`;
    }

    // Build headers
    const combinedHeaders: Record<string, string> = Object.assign(
      { 'Content-Type': 'application/json', Accept: 'application/json' },
      defaultHeaders,
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      reqHeaders as Record<string, string> | undefined
    );

    // Auth token
    if (getAuthToken) {
      const token = await getAuthToken();
      if (token) {
        combinedHeaders['Authorization'] = `Bearer ${token}`;
      }
    }

    // Don't set Content-Type for GET/HEAD (no body)
    if (['GET', 'HEAD'].includes(method.toUpperCase()) || body === undefined) {
      if (!body) delete combinedHeaders['Content-Type'];
    }

    const response = await fetchFn(url, {
      method: method.toUpperCase(),
      headers: combinedHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...fetchInit,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      const error: Error & { status?: number; body?: string; url?: string } = Object.assign(
        new Error(`HTTP ${response.status}: ${response.statusText}`),
        { status: response.status, body: errorBody, url }
      );
      throw error;
    }

    // Handle 204 No Content
    if (response.status === 204) {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      return undefined as T;
    }

    const contentType = response.headers.get('Content-Type') ?? '';
    if (contentType.includes('application/json')) {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      return (await response.json()) as T;
    }

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return (await response.text()) as T;
  }

  return {
    get: <T>(path: string, opts?: ApiRequestOptions) => request<T>('GET', path, opts),
    post: <T>(path: string, opts?: ApiRequestOptions) => request<T>('POST', path, opts),
    put: <T>(path: string, opts?: ApiRequestOptions) => request<T>('PUT', path, opts),
    patch: <T>(path: string, opts?: ApiRequestOptions) => request<T>('PATCH', path, opts),
    delete: <T>(path: string, opts?: ApiRequestOptions) => request<T>('DELETE', path, opts),
    circuitBreaker,
  };
}
