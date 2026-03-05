// k6/config.js — Shared configuration for all k6 load tests
//
// Usage: import { BASE_URL, defaultHeaders, authHeaders } from './config.js';

// Base URL — override via K6_BASE_URL environment variable
export const BASE_URL = __ENV.K6_BASE_URL || 'http://localhost:4000';

// Default thresholds applied to all scenarios
export const defaultThresholds = {
  http_req_duration: ['p(95)<500', 'p(99)<1000'],
  http_req_failed: ['rate<0.01'],       // <1% error rate
  http_req_waiting: ['p(95)<400'],
};

// Stricter thresholds for auth endpoints
export const authThresholds = {
  http_req_duration: ['p(95)<300', 'p(99)<600'],
  http_req_failed: ['rate<0.01'],
};

// Default HTTP headers
export const defaultHeaders = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// Test user credentials (override via environment variables)
export const TEST_USER = {
  email: __ENV.K6_TEST_EMAIL || 'loadtest@example.com',
  password: __ENV.K6_TEST_PASSWORD || 'LoadTest123!',
  username: __ENV.K6_TEST_USERNAME || 'loadtester',
};

/**
 * Authenticate and return headers with JWT token.
 * Caches the token for the VU lifetime.
 */
import http from 'k6/http';
import { check } from 'k6';

let _cachedToken = null;

export function getAuthToken() {
  if (_cachedToken) return _cachedToken;

  const res = http.post(`${BASE_URL}/api/v1/auth/login`, JSON.stringify({
    email: TEST_USER.email,
    password: TEST_USER.password,
  }), { headers: defaultHeaders });

  const ok = check(res, {
    'login status 200': (r) => r.status === 200,
    'login has token': (r) => {
      try { return JSON.parse(r.body).data.access_token !== undefined; }
      catch { return false; }
    },
  });

  if (ok) {
    _cachedToken = JSON.parse(res.body).data.access_token;
  }

  return _cachedToken;
}

export function authHeaders() {
  const token = getAuthToken();
  return {
    ...defaultHeaders,
    'Authorization': `Bearer ${token}`,
  };
}

// Standard load profile stages
export const standardStages = [
  { duration: '30s', target: 20 },   // Ramp up
  { duration: '1m', target: 50 },    // Sustain
  { duration: '2m', target: 100 },   // Peak
  { duration: '1m', target: 50 },    // Ramp down
  { duration: '30s', target: 0 },    // Cool down
];

// Smoke test stages (quick validation)
export const smokeStages = [
  { duration: '10s', target: 2 },
  { duration: '20s', target: 2 },
  { duration: '10s', target: 0 },
];
