import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { ZodSchema } from 'zod';

type MaybePromise<T> = T | Promise<T>;

type RequestMeta = {
  retryCount?: number;
};

// Extend axios config to include metadata
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    metadata?: RequestMeta;
    _retry?: boolean;
  }
}

export type TokenSet = {
  accessToken: string;
  refreshToken?: string | null;
};

export type RefreshConfig = {
  endpoint: string;
  method?: 'post' | 'get';
  /** Build request body for refresh token exchange */
  buildBody?: (refreshToken: string) => unknown;
  /** Optional additional headers for refresh */
  headers?: Record<string, string>;
  /** Extract tokens from refresh response payload */
  parseTokens: (data: unknown) => TokenSet;
  withCredentials?: boolean;
};

export type RetryConfig = {
  attempts?: number;
  backoffMs?: number;
  maxBackoffMs?: number;
  retryOnStatuses?: number[];
  retryOnNetworkError?: boolean;
};

export type IdempotencyConfig = {
  enabled?: boolean;
  header?: string;
  generate?: () => string;
};

export type HttpClientOptions = {
  baseURL: string;
  timeoutMs?: number;
  defaultHeaders?: Record<string, string>;
  withCredentials?: boolean;
  getAccessToken?: () => MaybePromise<string | null | undefined>;
  getRefreshToken?: () => MaybePromise<string | null | undefined>;
  setTokens?: (tokens: TokenSet) => MaybePromise<void>;
  onLogout?: () => MaybePromise<void>;
  refresh?: RefreshConfig;
  retry?: RetryConfig;
  idempotency?: IdempotencyConfig;
};

const MUTATING_METHODS = ['post', 'put', 'patch', 'delete'];

const defaultRetryStatuses = [429, 500, 502, 503, 504];

/** Generates a unique idempotency key for deduplicating mutating HTTP requests. */
export function createIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const now = Date.now().toString(16);
  const rand = Math.random().toString(16).slice(2, 10);
  return `${now}-${rand}`;
}

/** Creates a configured Axios instance with auth token refresh, retry logic, and idempotency support. */
export function createHttpClient(options: HttpClientOptions): AxiosInstance {
  const {
    baseURL,
    timeoutMs = 30000,
    defaultHeaders,
    withCredentials,
    getAccessToken,
    getRefreshToken,
    setTokens,
    onLogout,
    refresh,
    retry,
    idempotency,
  } = options;

  const instance = axios.create({
    baseURL,
    timeout: timeoutMs,
    headers: {
      'Content-Type': 'application/json',
      ...defaultHeaders,
    },
    withCredentials,
  });

  let isRefreshing = false;
  const refreshQueue: Array<{ resolve: (token: string) => void; reject: (err: Error) => void }> =
    [];

  const enqueueRefresh = (resolve: (token: string) => void, reject: (err: Error) => void) => {
    refreshQueue.push({ resolve, reject });
  };

  const resolveQueue = (token: string) => {
    refreshQueue.splice(0).forEach(({ resolve }) => resolve(token));
  };

  const rejectQueue = (err: Error) => {
    refreshQueue.splice(0).forEach(({ reject }) => reject(err));
  };

  instance.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    const meta: RequestMeta = config.metadata || {};
    config.metadata = meta;

    if (getAccessToken) {
      const token = await getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    if (idempotency?.enabled !== false) {
      const header = idempotency?.header || 'Idempotency-Key';
      const method = (config.method || '').toLowerCase();
      if (MUTATING_METHODS.includes(method) && !config.headers[header]) {
        const key = idempotency?.generate ? idempotency.generate() : createIdempotencyKey();
        config.headers[header] = key;
      }
    }

    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const cfg = error.config as
        | (InternalAxiosRequestConfig & { _retry?: boolean; metadata?: RequestMeta })
        | undefined;
      const status = error.response?.status;

      // 401 handling with refresh
      const isRefreshRequest = cfg?.url === refresh?.endpoint;

      // Helper to generate fresh idempotency key for retry
      const regenerateIdempotencyKey = (config: InternalAxiosRequestConfig) => {
        if (idempotency?.enabled !== false) {
          const header = idempotency?.header || 'Idempotency-Key';
          const method = (config.method || '').toLowerCase();
          if (MUTATING_METHODS.includes(method)) {
            const key = idempotency?.generate ? idempotency.generate() : createIdempotencyKey();
            config.headers[header] = key;
          }
        }
      };

      if (
        status === 401 &&
        refresh &&
        cfg &&
        !cfg._retry &&
        !isRefreshRequest &&
        getRefreshToken &&
        setTokens
      ) {
        cfg._retry = true;
        const refreshToken = await getRefreshToken();
        if (!refreshToken) {
          if (onLogout) await onLogout();
          return Promise.reject(error);
        }

        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            enqueueRefresh((token) => {
              if (cfg.headers) cfg.headers.Authorization = `Bearer ${token}`;
              regenerateIdempotencyKey(cfg);
              resolve(instance(cfg));
            }, reject);
          });
        }

        isRefreshing = true;
        try {
          const refreshResponse = await instance.request({
            url: refresh.endpoint,
            method: refresh.method || 'post',
            data: refresh.buildBody
              ? refresh.buildBody(refreshToken)
              : { refresh_token: refreshToken },
            headers: refresh.headers,
            withCredentials: refresh.withCredentials ?? withCredentials,
          });

          const tokens = refresh.parseTokens(refreshResponse.data);
          await setTokens(tokens);

          isRefreshing = false;
          resolveQueue(tokens.accessToken);

          if (cfg.headers) cfg.headers.Authorization = `Bearer ${tokens.accessToken}`;
          regenerateIdempotencyKey(cfg);
          return instance(cfg);
        } catch (refreshErr) {
          isRefreshing = false;
          rejectQueue(refreshErr instanceof Error ? refreshErr : new Error('Refresh failed'));
          if (onLogout) await onLogout();
          return Promise.reject(refreshErr);
        }
      }

      // Retry logic
      const retryCfg = retry || {};
      const maxAttempts = retryCfg.attempts ?? 3;
      const backoff = retryCfg.backoffMs ?? 400;
      const maxBackoff = retryCfg.maxBackoffMs ?? 5000;
      const retryStatuses = retryCfg.retryOnStatuses || defaultRetryStatuses;
      const shouldRetryNetwork = retryCfg.retryOnNetworkError ?? true;

      if (cfg) {
        cfg.metadata = cfg.metadata || {};
        cfg.metadata.retryCount = cfg.metadata.retryCount ?? 0;
        const attempt = cfg.metadata.retryCount;

        const isNetworkError = !error.response;
        const retryableStatus = status ? retryStatuses.includes(status) : false;

        if (attempt < maxAttempts && (retryableStatus || (shouldRetryNetwork && isNetworkError))) {
          cfg.metadata.retryCount = attempt + 1;
          const delay = Math.min(backoff * Math.pow(2, attempt), maxBackoff);
          await sleep(delay);
          // Generate a fresh idempotency key for retry to avoid conflicts
          regenerateIdempotencyKey(cfg);
          return instance(cfg);
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
}

/** Validates an Axios response body against a Zod schema and returns the parsed result. */
export async function withZod<T>(
  promise: Promise<AxiosResponse<unknown>>,
  schema: ZodSchema<T>
): Promise<T> {
  const response = await promise;
  return schema.parse(response.data ?? null);
}

/** Extracts a structured error object (message, code, status) from an Axios error or generic Error. */
export function extractApiError(error: unknown): {
  message: string;
  code?: string;
  status?: number;
} {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = (error.response?.data || {}) as Record<string, unknown>;
    const message =
      (typeof data.message === 'string' && data.message) ||
      (typeof data.error === 'string' && data.error) ||
      error.message ||
      'Request failed';
    const code = typeof data.code === 'string' ? data.code : undefined;
    return { message, code, status };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: 'Request failed' };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
