// k6/load.js — Combined load test importing all scenarios
//
// Runs all API flows concurrently to simulate realistic production traffic.
// Usage: k6 run k6/load.js
// With custom URL: K6_BASE_URL=https://cgraph-backend.fly.dev k6 run k6/load.js

import { BASE_URL } from './config.js';
import { default as authLogin } from './auth-login.js';
import { default as forumBrowse } from './forum-browse.js';
import { default as search } from './search.js';
import { default as smoke } from './smoke.js';

export const options = {
  scenarios: {
    // Health checks — constant low rate
    smoke: {
      executor: 'constant-vus',
      exec: 'smokeTest',
      vus: 1,
      duration: '5m',
      tags: { scenario: 'smoke' },
    },

    // Auth flow — moderate traffic
    auth: {
      executor: 'ramping-vus',
      exec: 'authTest',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 5 },
        { duration: '2m', target: 20 },
        { duration: '1m', target: 30 },
        { duration: '1m', target: 10 },
        { duration: '30s', target: 0 },
      ],
      tags: { scenario: 'auth' },
    },

    // Forum browsing — highest traffic (read-heavy)
    forums: {
      executor: 'ramping-vus',
      exec: 'forumTest',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '2m', target: 50 },
        { duration: '1m', target: 80 },
        { duration: '1m', target: 30 },
        { duration: '30s', target: 0 },
      ],
      tags: { scenario: 'forums' },
    },

    // Search — moderate traffic
    search: {
      executor: 'ramping-vus',
      exec: 'searchTest',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 5 },
        { duration: '2m', target: 25 },
        { duration: '1m', target: 40 },
        { duration: '1m', target: 15 },
        { duration: '30s', target: 0 },
      ],
      tags: { scenario: 'search' },
    },
  },

  thresholds: {
    // Global thresholds
    http_req_duration: ['p(95)<500', 'p(99)<1500'],
    http_req_failed: ['rate<0.02'],

    // Per-scenario thresholds
    'http_req_duration{scenario:smoke}': ['p(95)<200'],
    'http_req_duration{scenario:auth}': ['p(95)<300'],
    'http_req_duration{scenario:forums}': ['p(95)<500'],
    'http_req_duration{scenario:search}': ['p(95)<400'],
  },
};

// Scenario executor functions
export function smokeTest() { smoke(); }
export function authTest() { authLogin(); }
export function forumTest() { forumBrowse(); }
export function searchTest() { search(); }

// Log configuration at start
export function setup() {
  console.log(`Load test targeting: ${BASE_URL}`);
  console.log('Scenarios: smoke, auth, forums, search');
  console.log('Duration: ~5 minutes');
  return {};
}

export function teardown(data) {
  console.log('Load test complete.');
}
