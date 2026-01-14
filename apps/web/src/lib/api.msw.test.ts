import { describe, it, expect } from 'vitest';
import { api } from './api';
import { server } from '../test/setup';
import { http, HttpResponse } from 'msw';

describe('api client (msw)', () => {
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
    const apiNoIdempotency = api.create({ headers: { 'Idempotency-Key': '' } });

    server.resetHandlers(
      http.post('http://localhost:4000/api/v1/auth/login', async ({ request }) => {
        const idempotencyKey = request.headers.get('idempotency-key');
        if (!idempotencyKey) {
          return HttpResponse.json({ error: 'missing_idempotency' }, { status: 400 });
        }
        return HttpResponse.json({ tokens: { access_token: 'ok' } });
      })
    );

    await expect(
      apiNoIdempotency.post('/api/v1/auth/login', { identifier: 'demo', password: 'secret' })
    ).rejects.toThrowError();
  });

  it('allows custom handlers override per test', async () => {
    server.resetHandlers(
      http.get('http://localhost:4000/api/v1/users/me', () =>
        HttpResponse.json({ data: { id: 'override', email: 'override@example.com' } })
      )
    );

    const res = await api.get('/api/v1/users/me');
    expect(res.data.data.id).toBe('override');
  });
});