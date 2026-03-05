// k6/search.js — Search query load test

import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, authHeaders, defaultThresholds, standardStages } from './config.js';

export const options = {
  stages: standardStages,
  thresholds: {
    ...defaultThresholds,
    http_req_duration: ['p(95)<400', 'p(99)<800'],  // Search can be slightly slower
  },
  tags: { scenario: 'search' },
};

// Sample search queries to rotate through
const searchQueries = [
  'hello',
  'react native',
  'bug fix',
  'deployment',
  'websocket',
  'authentication',
  'database',
  'performance',
  'testing',
  'community',
];

export default function () {
  const headers = authHeaders();
  const query = searchQueries[Math.floor(Math.random() * searchQueries.length)];

  // GET /api/v1/search?q=...
  const searchRes = http.get(`${BASE_URL}/api/v1/search?q=${encodeURIComponent(query)}&limit=20`, {
    headers,
    tags: { name: 'GET /search' },
  });

  check(searchRes, {
    'search returns 200': (r) => r.status === 200,
    'search has results': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data !== undefined;
      } catch { return false; }
    },
  });

  // Search with type filter
  const types = ['users', 'posts', 'groups'];
  const type = types[Math.floor(Math.random() * types.length)];

  const filteredRes = http.get(
    `${BASE_URL}/api/v1/search?q=${encodeURIComponent(query)}&type=${type}&limit=10`,
    { headers, tags: { name: `GET /search?type=${type}` } }
  );

  check(filteredRes, {
    'filtered search returns 200': (r) => r.status === 200,
  });

  sleep(1 + Math.random() * 2);  // 1-3s think time
}
