import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createApiClient } from '../client';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

// ---------------------------------------------------------------------------
// createApiClient
// ---------------------------------------------------------------------------

describe('createApiClient', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
  });

  it('makes a GET request with correct URL', async () => {
    const mockFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValue(mockResponse({ id: 1, name: 'Test' }));
    globalThis.fetch = mockFetch;

    const api = createApiClient({
      baseUrl: 'https://api.example.com/v1',
      resilience: false,
    });

    const result = await api.get<{ id: number; name: string }>('/users/1');

    expect(result).toEqual({ id: 1, name: 'Test' });
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/v1/users/1',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('appends query params', async () => {
    const mockFetch = vi.fn<typeof fetch>().mockResolvedValue(mockResponse([]));
    globalThis.fetch = mockFetch;

    const api = createApiClient({ baseUrl: 'https://api.example.com', resilience: false });
    await api.get('/search', { params: { q: 'hello', limit: 10 } });

    const calledUrl = mockFetch.mock.calls[0]![0] as string;
    expect(calledUrl).toContain('q=hello');
    expect(calledUrl).toContain('limit=10');
  });

  it('sends JSON body on POST', async () => {
    const mockFetch = vi.fn<typeof fetch>().mockResolvedValue(mockResponse({ created: true }));
    globalThis.fetch = mockFetch;

    const api = createApiClient({ baseUrl: 'https://api.example.com', resilience: false });
    await api.post('/users', { body: { name: 'Alice' } });

    const [, init] = mockFetch.mock.calls[0]!;
    expect(init!.method).toBe('POST');
    expect(init!.body).toBe(JSON.stringify({ name: 'Alice' }));
    expect((init!.headers as Record<string, string>)['Content-Type']).toBe('application/json');
  });

  it('includes auth token when provided', async () => {
    const mockFetch = vi.fn<typeof fetch>().mockResolvedValue(mockResponse({}));
    globalThis.fetch = mockFetch;

    const api = createApiClient({
      baseUrl: 'https://api.example.com',
      getAuthToken: () => 'my-token-123',
      resilience: false,
    });
    await api.get('/me');

    const headers = mockFetch.mock.calls[0]![1]!.headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer my-token-123');
  });

  it('skips auth header when getAuthToken returns null', async () => {
    const mockFetch = vi.fn<typeof fetch>().mockResolvedValue(mockResponse({}));
    globalThis.fetch = mockFetch;

    const api = createApiClient({
      baseUrl: 'https://api.example.com',
      getAuthToken: () => null,
      resilience: false,
    });
    await api.get('/public');

    const headers = mockFetch.mock.calls[0]![1]!.headers as Record<string, string>;
    expect(headers['Authorization']).toBeUndefined();
  });

  it('handles 204 No Content', async () => {
    const mockFetch = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 204 }));
    globalThis.fetch = mockFetch;

    const api = createApiClient({ baseUrl: 'https://api.example.com', resilience: false });
    const result = await api.delete('/users/1');

    expect(result).toBeUndefined();
  });

  it('throws on HTTP error responses', async () => {
    const mockFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response('Not Found', { status: 404, statusText: 'Not Found' }));
    globalThis.fetch = mockFetch;

    const api = createApiClient({ baseUrl: 'https://api.example.com', resilience: false });

    await expect(api.get('/nonexistent')).rejects.toThrow('HTTP 404');
  });

  it('supports all HTTP methods', async () => {
    const mockFetch = vi
      .fn<typeof fetch>()
      .mockImplementation(() => Promise.resolve(mockResponse({ ok: true })));
    globalThis.fetch = mockFetch;

    const api = createApiClient({ baseUrl: 'https://api.example.com', resilience: false });

    await api.get('/r');
    await api.post('/r');
    await api.put('/r');
    await api.patch('/r');
    await api.delete('/r');

    const methods = mockFetch.mock.calls.map((call) => (call[1] as RequestInit).method);
    expect(methods).toEqual(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
  });

  it('exposes circuit breaker when resilience is enabled', () => {
    globalThis.fetch = vi.fn();
    const api = createApiClient({
      baseUrl: 'https://api.example.com',
      resilience: { timeout: 5000 },
    });

    expect(api.circuitBreaker).not.toBeNull();
  });

  it('circuit breaker is null when resilience is disabled', () => {
    globalThis.fetch = vi.fn();
    const api = createApiClient({
      baseUrl: 'https://api.example.com',
      resilience: false,
    });

    expect(api.circuitBreaker).toBeNull();
  });

  it('filters undefined query params', async () => {
    const mockFetch = vi.fn<typeof fetch>().mockResolvedValue(mockResponse({}));
    globalThis.fetch = mockFetch;

    const api = createApiClient({ baseUrl: 'https://api.example.com', resilience: false });
    await api.get('/search', { params: { q: 'hello', limit: undefined } });

    const calledUrl = mockFetch.mock.calls[0]![0] as string;
    expect(calledUrl).toContain('q=hello');
    expect(calledUrl).not.toContain('limit');
  });

  it('merges default and per-request headers', async () => {
    const mockFetch = vi.fn<typeof fetch>().mockResolvedValue(mockResponse({}));
    globalThis.fetch = mockFetch;

    const api = createApiClient({
      baseUrl: 'https://api.example.com',
      headers: { 'X-Client': 'cgraph-web' },
      resilience: false,
    });
    await api.get('/test', { headers: { 'X-Request-Id': '123' } });

    const headers = mockFetch.mock.calls[0]![1]!.headers as Record<string, string>;
    expect(headers['X-Client']).toBe('cgraph-web');
    expect(headers['X-Request-Id']).toBe('123');
  });
});
