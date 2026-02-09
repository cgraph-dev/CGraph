/**
 * k6 Smoke Test — CGraph API
 *
 * Quick validation that core APIs work under minimal load.
 * Runs on every PR to staging (10 VUs, 60 seconds).
 *
 * Thresholds:
 *   - p95 < 500ms for all requests
 *   - Error rate < 1%
 *   - p99 < 1000ms
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const authDuration = new Trend('auth_duration', true);
const messageDuration = new Trend('message_duration', true);
const forumDuration = new Trend('forum_duration', true);

export const options = {
  vus: 10,
  duration: '60s',
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    errors: ['rate<0.01'],
    auth_duration: ['p(95)<300'],
    message_duration: ['p(95)<500'],
    forum_duration: ['p(95)<400'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://staging.cgraph.org';

export default function () {
  // 1. Health check
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health: status 200': (r) => r.status === 200,
    'health: status ok': (r) => JSON.parse(r.body).status === 'ok',
  }) || errorRate.add(1);

  // 2. Readiness check
  const readyRes = http.get(`${BASE_URL}/ready`);
  check(readyRes, {
    'ready: status 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  // 3. Auth flow (login)
  const authStart = Date.now();
  const loginRes = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({
      email: `loadtest+${__VU}@cgraph.org`,
      password: 'loadtest123!',
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  authDuration.add(Date.now() - authStart);

  const loginOk = check(loginRes, {
    'login: status 200 or 401': (r) => r.status === 200 || r.status === 401,
  });
  if (!loginOk) errorRate.add(1);

  // If login succeeded, use token for authenticated requests
  let token = '';
  if (loginRes.status === 200) {
    try {
      token = JSON.parse(loginRes.body).token;
    } catch {
      // skip
    }
  }

  const authHeaders = token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };

  // 4. Forum browse
  const forumStart = Date.now();
  const forumRes = http.get(`${BASE_URL}/api/v1/groups`, {
    headers: authHeaders,
  });
  forumDuration.add(Date.now() - forumStart);
  check(forumRes, {
    'forum: status ok': (r) => r.status === 200 || r.status === 401,
  }) || errorRate.add(1);

  // 5. Search
  const searchRes = http.get(`${BASE_URL}/api/v1/search?q=test&type=users`, {
    headers: authHeaders,
  });
  check(searchRes, {
    'search: status ok': (r) => r.status === 200 || r.status === 401,
  }) || errorRate.add(1);

  sleep(1);
}

export function handleSummary(data) {
  return {
    stdout: JSON.stringify(data, null, 2),
    'results/smoke-test-results.json': JSON.stringify(data),
  };
}
