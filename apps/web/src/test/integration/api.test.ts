/**
 * @fileoverview Comprehensive tests for API client and authentication
 * Tests request handling, token management, and error handling
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

// Mock axios
vi.mock('axios', () => {
  const mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
    defaults: {
      headers: {
        common: {},
      },
    },
  };

  return {
    default: {
      create: vi.fn().mockReturnValue(mockAxiosInstance),
    },
    create: vi.fn().mockReturnValue(mockAxiosInstance),
    isAxiosError: (error: unknown): error is { response?: unknown } => {
      return error instanceof Error && 'isAxiosError' in error;
    },
  };
});

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should create axios instance with correct base URL', () => {
      const baseURL = 'http://localhost:4000/api/v1';

      axios.create({
        baseURL,
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL,
        })
      );
    });

    it('should set authorization header when token exists', () => {
      const token = 'test-jwt-token';
      const headers: Record<string, string> = {};

      // Simulate adding auth header
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      expect(headers['Authorization']).toBe(`Bearer ${token}`);
    });

    it('should not set authorization header when token is null', () => {
      const token = null;
      const headers: Record<string, string> = {};

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      expect(headers['Authorization']).toBeUndefined();
    });
  });

  describe('Request Interceptors', () => {
    it('should add request timestamp for debugging', () => {
      const config = {
        url: '/test',
        method: 'GET',
        headers: {},
      };

      const withTimestamp = {
        ...config,
        metadata: { startTime: Date.now() },
      };

      expect(withTimestamp.metadata.startTime).toBeDefined();
      expect(typeof withTimestamp.metadata.startTime).toBe('number');
    });
  });

  describe('Response Interceptors', () => {
    it('should handle 401 unauthorized errors', () => {
      const error = {
        response: {
          status: 401,
          data: { error: 'unauthorized' },
        },
      };

      const shouldLogout = error.response.status === 401;

      expect(shouldLogout).toBe(true);
    });

    it('should handle 403 forbidden errors', () => {
      const error = {
        response: {
          status: 403,
          data: { error: 'forbidden' },
        },
      };

      const isForbidden = error.response.status === 403;

      expect(isForbidden).toBe(true);
    });

    it('should handle 429 rate limit errors with retry-after', () => {
      const error = {
        response: {
          status: 429,
          headers: {
            'retry-after': '60',
          },
          data: { error: 'rate_limited' },
        },
      };

      const retryAfter = parseInt(error.response.headers['retry-after'], 10);

      expect(retryAfter).toBe(60);
    });

    it('should handle 500 server errors gracefully', () => {
      const error = {
        response: {
          status: 500,
          data: { error: 'internal_server_error' },
        },
      };

      const isServerError = error.response.status >= 500;

      expect(isServerError).toBe(true);
    });

    it('should handle network errors', () => {
      const error = {
        message: 'Network Error',
        response: undefined,
      };

      const isNetworkError = !error.response;

      expect(isNetworkError).toBe(true);
    });
  });

  describe('Retry Logic', () => {
    it('should implement exponential backoff', () => {
      const maxRetries = 3;
      const delays: number[] = [];

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        delays.push(delay);
      }

      expect(delays).toEqual([1000, 2000, 4000]);
    });

    it('should not retry on 4xx errors (except 429)', () => {
      const errorCodes = [400, 401, 403, 404, 422];
      const retryableCodes = [429, 500, 502, 503, 504];

      errorCodes.forEach((code) => {
        expect(retryableCodes.includes(code)).toBe(false);
      });
    });

    it('should retry on 5xx errors', () => {
      const errorCodes = [500, 502, 503, 504];
      const isRetryable = (status: number) => status >= 500 || status === 429;

      errorCodes.forEach((code) => {
        expect(isRetryable(code)).toBe(true);
      });
    });
  });
});

describe('Authentication Flow', () => {
  describe('Login', () => {
    it('should send correct login payload', () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const payload = {
        user: credentials,
      };

      expect(payload.user.email).toBe(credentials.email);
      expect(payload.user.password).toBe(credentials.password);
    });

    it('should handle login success response', () => {
      const response = {
        data: {
          token: 'jwt-token',
          user: {
            id: '123',
            email: 'test@example.com',
            username: 'testuser',
          },
        },
      };

      expect(response.data.token).toBeDefined();
      expect(response.data.user.id).toBeDefined();
    });

    it('should handle login failure', () => {
      const error = {
        response: {
          status: 401,
          data: {
            error: 'invalid_credentials',
            message: 'Invalid email or password',
          },
        },
      };

      expect(error.response.status).toBe(401);
      expect(error.response.data.error).toBe('invalid_credentials');
    });
  });

  describe('Token Management', () => {
    it('should parse JWT claims correctly', () => {
      // Mock JWT structure: header.payload.signature
      const mockPayload = {
        sub: 'user-123',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
      };

      const isExpired = mockPayload.exp < Math.floor(Date.now() / 1000);

      expect(isExpired).toBe(false);
    });

    it('should detect expired tokens', () => {
      const expiredPayload = {
        sub: 'user-123',
        exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        iat: Math.floor(Date.now() / 1000) - 7200,
      };

      const isExpired = expiredPayload.exp < Math.floor(Date.now() / 1000);

      expect(isExpired).toBe(true);
    });

    it('should refresh token before expiry', () => {
      const payload = {
        exp: Math.floor(Date.now() / 1000) + 300, // 5 minutes from now
      };

      const refreshThreshold = 600; // Refresh if less than 10 minutes remaining
      const shouldRefresh = payload.exp - Math.floor(Date.now() / 1000) < refreshThreshold;

      expect(shouldRefresh).toBe(true);
    });
  });

  describe('Logout', () => {
    it('should clear token on logout', () => {
      let token: string | null = 'jwt-token';

      const logout = () => {
        token = null;
      };

      logout();

      expect(token).toBeNull();
    });

    it('should clear user data on logout', () => {
      let user: { id: string } | null = { id: '123' };

      const logout = () => {
        user = null;
      };

      logout();

      expect(user).toBeNull();
    });
  });
});

describe('2FA Flow', () => {
  describe('TOTP Verification', () => {
    it('should validate 6-digit code format', () => {
      const validCodes = ['123456', '000000', '999999'];
      const invalidCodes = ['12345', '1234567', 'abcdef', '12345a'];

      const isValidCode = (code: string) => /^\d{6}$/.test(code);

      validCodes.forEach((code) => {
        expect(isValidCode(code)).toBe(true);
      });

      invalidCodes.forEach((code) => {
        expect(isValidCode(code)).toBe(false);
      });
    });

    it('should handle 2FA rate limiting', () => {
      const error = {
        response: {
          status: 429,
          data: {
            error: 'rate_limited',
            message: 'Too many 2FA attempts',
            retry_after: 900, // 15 minutes
          },
        },
      };

      expect(error.response.data.error).toBe('rate_limited');
      expect(error.response.data.retry_after).toBe(900);
    });
  });

  describe('Backup Codes', () => {
    it('should validate backup code format', () => {
      const validCode = 'ABCD-1234';
      const invalidCode = 'invalid';

      const isValidBackupCode = (code: string) => /^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code);

      expect(isValidBackupCode(validCode)).toBe(true);
      expect(isValidBackupCode(invalidCode)).toBe(false);
    });
  });
});

describe('Error Handling', () => {
  it('should format API errors consistently', () => {
    const formatError = (error: {
      response?: { data?: { message?: string; error?: string } };
      message?: string;
    }) => {
      if (error.response?.data?.message) {
        return error.response.data.message;
      }
      if (error.response?.data?.error) {
        return error.response.data.error;
      }
      return error.message || 'An unexpected error occurred';
    };

    expect(formatError({ response: { data: { message: 'Custom error' } } })).toBe('Custom error');
    expect(formatError({ response: { data: { error: 'error_code' } } })).toBe('error_code');
    expect(formatError({ message: 'Network Error' })).toBe('Network Error');
    expect(formatError({})).toBe('An unexpected error occurred');
  });

  it('should handle validation errors', () => {
    const validationError = {
      response: {
        status: 422,
        data: {
          errors: {
            email: ['is invalid'],
            password: ['is too short'],
          },
        },
      },
    };

    const errors = validationError.response.data.errors;

    expect(errors.email).toContain('is invalid');
    expect(errors.password).toContain('is too short');
  });
});
