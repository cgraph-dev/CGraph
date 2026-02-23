/**
 * API Response Extractors
 *
 * Provides type-safe helper functions for parsing API responses
 * and ensuring consistent data extraction across the application.
 */

// ==================== TYPE GUARDS ====================

function isNumber(v: unknown): v is number {
  return typeof v === 'number';
}

function isBoolean(v: unknown): v is boolean {
  return typeof v === 'boolean';
}

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

/** Safely extract a string from an unknown value */
export function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

/** Safely extract a number from an unknown value */
export function asNumber(v: unknown, fallback = 0): number {
  return typeof v === 'number' ? v : fallback;
}

/** Safely extract a boolean from an unknown value */
export function asBool(v: unknown, fallback = false): boolean {
  return typeof v === 'boolean' ? v : fallback;
}

/** Safely extract an optional string (returns undefined if not a string) */
export function asOptionalString(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined;
}

/** Safely extract an optional number (returns undefined if not a number) */
export function asOptionalNumber(v: unknown): number | undefined {
  return typeof v === 'number' ? v : undefined;
}

/**
 * Safely extract a typed array from an unknown value.
 * Each element is validated with the provided guard function.
 */
export function asArray<T>(
  v: unknown,
  guard: (x: unknown) => x is T
): T[] {
  if (!Array.isArray(v)) return [];
  return v.filter(guard);
}

/**
 * Type-safe Object.keys that returns (keyof T)[] instead of string[].
 * Use only when T is a known, closed interface.
 */
export function typedKeys<T extends object>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
}

/**
 * Extract a typed value from multiple possible keys.
 * Returns the first valid value found, or the fallback.
 */
function extractValue<T>(
  meta: Record<string, unknown>,
  keys: string[],
  typeCheck: (v: unknown) => v is T,
  fallback: T
): T {
  for (const key of keys) {
    if (typeCheck(meta[key])) {
      return meta[key];
    }
  }
  return fallback;
}

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
    return data as T[]; // safe: Array.isArray verified; T is caller's responsibility
  }

  // Handle object with keys
  if (isRecord(data)) {
    const obj = data;

    // Try the specified key first
    if (key && Array.isArray(obj[key])) {
      return obj[key] as T[]; // safe: Array.isArray verified; T is caller's responsibility
    }

    // Try common wrapper keys
    const commonKeys = ['data', 'items', 'results', 'list', 'records'];
    for (const k of commonKeys) {
      if (Array.isArray(obj[k])) {
        return obj[k] as T[]; // safe: Array.isArray verified; T is caller's responsibility
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
export function ensureObject<T extends object>(data: unknown, key?: string): T | null {
  // Handle null/undefined
  if (data == null) {
    return null;
  }

  // Handle direct object (not array)
  if (isRecord(data) && !Array.isArray(data)) {
    const obj = data;

    // Try the specified key first
    if (key && obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      return obj[key] as T; // safe: object verified; T is caller's responsibility
    }

    // Try 'data' wrapper
    if (obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data)) {
      return obj.data as T; // safe: object verified; T is caller's responsibility
    }

    // Return as-is if it looks like the target object (has properties beyond just 'data')
    const keys = Object.keys(obj);
    if (keys.length > 0 && !keys.every((k) => ['data', 'meta', 'status', 'message'].includes(k))) {
      return obj as unknown as T; // safe: structural heuristic; T is caller's responsibility
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

  if (!isRecord(data)) {
    return defaults;
  }

  const obj = data;
  const rawMeta = obj.meta || obj.pagination || obj;
  const meta = isRecord(rawMeta) ? rawMeta : obj;

  return {
    page: extractValue(meta, ['page'], isNumber, defaults.page),
    perPage: extractValue(meta, ['per_page', 'perPage', 'limit'], isNumber, defaults.perPage),
    total: extractValue(meta, ['total', 'total_count'], isNumber, defaults.total),
    totalPages: extractValue(meta, ['total_pages', 'totalPages'], isNumber, defaults.totalPages),
    hasMore: extractValue(meta, ['has_more', 'hasMore'], isBoolean, defaults.hasMore),
  };
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
  if (isRecord(error)) {
    const err = error;

    // Try response.data.error
    if (isRecord(err.response)) {
      const response = err.response;
      if (isRecord(response.data)) {
        const data = response.data;
        if (typeof data.error === 'string') return data.error;
        // Handle error object with message property: {"error": {"message": "...", "code": "..."}}
        if (isRecord(data.error)) {
          const errorObj = data.error;
          if (typeof errorObj.message === 'string') return errorObj.message;
        }
        if (typeof data.message === 'string') return data.message;
        if (Array.isArray(data.errors) && data.errors.length > 0) {
          return data.errors
            .map((e: unknown) =>
              typeof e === 'string'
                ? e
                : isRecord(e) && typeof e.message === 'string'
                  ? e.message
                  : ''
            )
            .filter(Boolean)
            .join(', ');
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
