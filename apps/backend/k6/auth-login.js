// k6/auth-login.js — Login flow load test
// Threshold: p95 < 300ms for auth endpoints

import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, defaultHeaders, authThresholds, TEST_USER, standardStages } from './config.js';

export const options = {
  stages: standardStages,
  thresholds: authThresholds,
  tags: { scenario: 'auth-login' },
};

export default function () {
  // POST /api/v1/auth/login
  const loginRes = http.post(`${BASE_URL}/api/v1/auth/login`, JSON.stringify({
    email: TEST_USER.email,
    password: TEST_USER.password,
  }), { headers: defaultHeaders, tags: { name: 'POST /auth/login' } });

  check(loginRes, {
    'login returns 200': (r) => r.status === 200,
    'login has access_token': (r) => {
      try { return JSON.parse(r.body).data.access_token !== undefined; }
      catch { return false; }
    },
    'login has refresh_token': (r) => {
      try { return JSON.parse(r.body).data.refresh_token !== undefined; }
      catch { return false; }
    },
  });

  // If login succeeded, test token refresh
  if (loginRes.status === 200) {
    try {
      const body = JSON.parse(loginRes.body);
      const token = body.data.access_token;

      // GET /api/v1/auth/me — verify token works
      const meRes = http.get(`${BASE_URL}/api/v1/auth/me`, {
        headers: {
          ...defaultHeaders,
          'Authorization': `Bearer ${token}`,
        },
        tags: { name: 'GET /auth/me' },
      });

      check(meRes, {
        'me returns 200': (r) => r.status === 200,
        'me has user data': (r) => {
          try { return JSON.parse(r.body).data.id !== undefined; }
          catch { return false; }
        },
      });
    } catch (_) { /* ignore parse errors */ }
  }

  sleep(1 + Math.random());  // 1-2s think time
}
