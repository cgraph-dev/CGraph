/**
 * API Response Utilities
 *
 * Provides type-safe helper functions for parsing API responses
 * and ensuring consistent data extraction across the application.
 */

/**
 * Safely extracts an array from API response data.
 * Handles various response formats:
 * - Direct array: []
 * - Wrapped in key: { friends: [], requests: [], data: [] }
 * - Nested data: { data: { items: [] } }
 *
 * @param data - The raw API response data
 * @param key - Optional primary key to look for (e.g., 'friends', 'requests')
 * @returns A type-safe array, or empty array if extraction fails
 *
 * @example
 * ```typescript
 * const response = await api.get('/api/v1/friends');
 * const friends = ensureArray<Friend>(response.data, 'friends');
 * ```
 */
export function ensureArray<T>(data: unknown, key?: string): T[] {
  // Handle null/undefined
  if (data == null) {
    return [];
  }

  // Handle direct array
  if (Array.isArray(data)) {
    return data as T[];
  }

  // Handle object with keys
  if (typeof data === 'object') {
    const obj = data as Record<string, unknown>;

    // Try the specified key first
    if (key && Array.isArray(obj[key])) {
      return obj[key] as T[];
    }

    // Try common wrapper keys
    const commonKeys = ['data', 'items', 'results', 'list', 'records'];
    for (const k of commonKeys) {
      if (Array.isArray(obj[k])) {
        return obj[k] as T[];
      }
    }
  }

  return [];
}

/**
 * Safely extracts a single object from API response data.
 * Handles various response formats:
 * - Direct object: { id: '1', name: 'test' }
 * - Wrapped: { data: { id: '1', name: 'test' } }
 * - Wrapped with key: { user: { id: '1', name: 'test' } }
 *
 * @param data - The raw API response data
 * @param key - Optional primary key to look for (e.g., 'user', 'group')
 * @returns The extracted object or null if extraction fails
 *
 * @example
 * ```typescript
 * const response = await api.get('/api/v1/users/123');
 * const user = ensureObject<User>(response.data, 'user');
 * ```
 */
export function ensureObject<T extends object>(
  data: unknown,
  key?: string
): T | null {
  // Handle null/undefined
  if (data == null) {
    return null;
  }

  // Handle direct object (not array)
  if (typeof data === 'object' && !Array.isArray(data)) {
    const obj = data as Record<string, unknown>;

    // Try the specified key first
    if (key && obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      return obj[key] as T;
    }

    // Try 'data' wrapper
    if (obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data)) {
      return obj.data as T;
    }

    // Return as-is if it looks like the target object (has properties beyond just 'data')
    const keys = Object.keys(obj);
    if (keys.length > 0 && !keys.every((k) => ['data', 'meta', 'status', 'message'].includes(k))) {
      return obj as unknown as T;
    }
  }

  return null;
}

/**
 * Extracts pagination metadata from API response.
 *
 * @param data - The raw API response data
 * @returns Pagination metadata or defaults
 */
export function extractPagination(data: unknown): {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
} {
  const defaults = {
    page: 1,
    perPage: 20,
    total: 0,
    totalPages: 1,
    hasMore: false,
  };

  if (data == null || typeof data !== 'object') {
    return defaults;
  }

  const obj = data as Record<string, unknown>;
  const meta = (obj.meta || obj.pagination || obj) as Record<string, unknown>;

  return {
    page: typeof meta.page === 'number' ? meta.page : defaults.page,
    perPage: typeof meta.per_page === 'number' ? meta.per_page :
             typeof meta.perPage === 'number' ? meta.perPage :
             typeof meta.limit === 'number' ? meta.limit : defaults.perPage,
    total: typeof meta.total === 'number' ? meta.total :
           typeof meta.total_count === 'number' ? meta.total_count : defaults.total,
    totalPages: typeof meta.total_pages === 'number' ? meta.total_pages :
                typeof meta.totalPages === 'number' ? meta.totalPages : defaults.totalPages,
    hasMore: typeof meta.has_more === 'boolean' ? meta.has_more :
             typeof meta.hasMore === 'boolean' ? meta.hasMore : defaults.hasMore,
  };
}

/**
 * Type guard to check if a value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Type guard to check if a value is a valid ID (non-empty string or number)
 */
export function isValidId(value: unknown): value is string | number {
  return (
    (typeof value === 'string' && value.trim().length > 0) ||
    (typeof value === 'number' && !isNaN(value))
  );
}

/**
 * Safely extracts an error message from an API error response
 */
export function extractErrorMessage(
  error: unknown,
  defaultMessage = 'An unexpected error occurred'
): string {
  if (error == null) {
    return defaultMessage;
  }

  // Handle axios-style errors
  if (typeof error === 'object') {
    const err = error as Record<string, unknown>;

    // Try response.data.error
    if (err.response && typeof err.response === 'object') {
      const response = err.response as Record<string, unknown>;
      if (response.data && typeof response.data === 'object') {
        const data = response.data as Record<string, unknown>;
        if (typeof data.error === 'string') return data.error;
        if (typeof data.message === 'string') return data.message;
        if (Array.isArray(data.errors) && data.errors.length > 0) {
          return data.errors.map((e: unknown) =>
            typeof e === 'string' ? e : (e as Record<string, unknown>)?.message || ''
          ).filter(Boolean).join(', ');
        }
      }
    }

    // Try direct message property
    if (typeof err.message === 'string') {
      return err.message;
    }
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  return defaultMessage;
}
