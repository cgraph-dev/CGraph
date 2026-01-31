import { describe, it, expect, beforeEach } from 'vitest';
import { api } from './api';
import { server } from '../test/setup';
import { http, HttpResponse } from 'msw';

describe('api client (msw)', () => {
  // Reset handlers after each test to ensure clean state
  beforeEach(() => {
    server.resetHandlers();
  });

  it('sends idempotency key and parses tokens on login', async () => {
    const res = await api.post('/api/v1/auth/login', {
      identifier: 'demo',
      password: 'secret',
    });

    const payload = res.data.data || res.data;
    const tokens = payload.tokens || payload;

    expect(tokens.access_token || tokens.token).toBe('mock-access-token');
    expect(tokens.refresh_token).toBe('mock-refresh-token');
  });

  it('surface missing idempotency as error when header absent', async () => {
    // Add handler for this specific test
    server.use(
      http.post('http://localhost:4000/api/v1/auth/login', async ({ request }) => {
        const idempotencyKey = request.headers.get('idempotency-key');
        if (!idempotencyKey) {
          return HttpResponse.json({ error: 'missing_idempotency' }, { status: 400 });
        }
        return HttpResponse.json({ tokens: { access_token: 'ok' } });
      })
    );

    // Test with empty idempotency key should fail
    const apiNoIdempotency = api.create({ headers: { 'Idempotency-Key': '' } });

    await expect(
      apiNoIdempotency.post('/api/v1/auth/login', { identifier: 'demo', password: 'secret' })
    ).rejects.toThrowError();
  });

  it('allows custom handlers to be added at runtime', async () => {
    // Add a new handler for a test-specific endpoint
    server.use(
      http.get('http://localhost:4000/api/v1/health', () =>
        HttpResponse.json({ status: 'healthy', timestamp: Date.now() })
      )
    );

    const res = await api.get('/api/v1/health');
    // Custom handler should return the expected response
    expect(res.data.status).toBe('healthy');
    expect(res.data.timestamp).toBeDefined();
  });
});
