import { http, HttpResponse } from 'msw';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const handlers = [
  http.post(`${API_BASE}/api/v1/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { identifier?: string; password?: string };
    const idempotencyKey = request.headers.get('idempotency-key');

    if (!body?.identifier || !body?.password) {
      return HttpResponse.json({ error: 'missing_credentials' }, { status: 400 });
    }

    if (!idempotencyKey) {
      return HttpResponse.json({ error: 'missing_idempotency' }, { status: 400 });
    }

    return HttpResponse.json({
      data: {
        tokens: {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
        },
        user: {
          id: 'user-1',
          email: `${body.identifier}@example.com`,
        },
      },
    });
  }),

  http.get(`${API_BASE}/api/v1/users/me`, () => {
    return HttpResponse.json({
      data: {
        id: 'user-1',
        email: 'demo@example.com',
        username: 'demo',
      },
    });
  }),
];