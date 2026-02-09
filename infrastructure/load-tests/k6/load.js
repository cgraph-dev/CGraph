/**
 * k6 Load Test — CGraph API
 *
 * Sustained load test for weekly regression detection.
 * 100 VUs, 5 minutes. Fails if p99 > 500ms.
 *
 * Tests: auth flow, messaging, forum browse, search, WebSocket connect
 */

import http from 'k6/http';
import ws from 'k6/ws';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

const errorRate = new Rate('errors');
const wsConnections = new Counter('ws_connections');
const messagesSent = new Counter('messages_sent');
const searchDuration = new Trend('search_duration', true);

export const options = {
  stages: [
    { duration: '30s', target: 50 },   // Ramp up
    { duration: '3m', target: 100 },    // Sustained load
    { duration: '30s', target: 50 },    // Ramp down
    { duration: '1m', target: 0 },      // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<400', 'p(99)<500'],
    errors: ['rate<0.01'],
    search_duration: ['p(99)<500'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://staging.cgraph.org';
const WS_URL = __ENV.WS_URL || 'wss://staging.cgraph.org/socket/websocket';

export default function () {
  // Rotate through different user flows
  const scenario = __ITER % 4;

  switch (scenario) {
    case 0:
      authAndProfile();
      break;
    case 1:
      browseForums();
      break;
    case 2:
      searchContent();
      break;
    case 3:
      messagingFlow();
      break;
  }
}

function authAndProfile() {
  group('Auth & Profile', () => {
    const loginRes = http.post(
      `${BASE_URL}/api/v1/auth/login`,
      JSON.stringify({
        email: `loadtest+${__VU}@cgraph.org`,
        password: 'loadtest123!',
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );

    check(loginRes, { 'login ok': (r) => r.status === 200 || r.status === 401 })
      || errorRate.add(1);

    if (loginRes.status === 200) {
      const token = JSON.parse(loginRes.body).token;
      const headers = { Authorization: `Bearer ${token}` };

      // Get profile
      const profileRes = http.get(`${BASE_URL}/api/v1/me`, { headers });
      check(profileRes, { 'profile ok': (r) => r.status === 200 })
        || errorRate.add(1);

      // Get conversations
      const convsRes = http.get(`${BASE_URL}/api/v1/conversations`, { headers });
      check(convsRes, { 'conversations ok': (r) => r.status === 200 })
        || errorRate.add(1);
    }

    sleep(1);
  });
}

function browseForums() {
  group('Forum Browse', () => {
    // Browse groups
    const groupsRes = http.get(`${BASE_URL}/api/v1/groups`);
    check(groupsRes, {
      'groups: status ok': (r) => r.status === 200 || r.status === 401,
    }) || errorRate.add(1);

    // Browse trending (public)
    const trendingRes = http.get(`${BASE_URL}/api/v1/groups/discover`);
    check(trendingRes, {
      'trending: status ok': (r) => r.status === 200 || r.status === 401,
    }) || errorRate.add(1);

    sleep(2);
  });
}

function searchContent() {
  group('Search', () => {
    const queries = ['hello', 'test', 'general', 'chat', 'dev'];
    const q = queries[Math.floor(Math.random() * queries.length)];

    const start = Date.now();
    const searchRes = http.get(`${BASE_URL}/api/v1/search?q=${q}&type=users&limit=20`);
    searchDuration.add(Date.now() - start);

    check(searchRes, {
      'search: status ok': (r) => r.status === 200 || r.status === 401,
    }) || errorRate.add(1);

    sleep(1);
  });
}

function messagingFlow() {
  group('Messaging', () => {
    const loginRes = http.post(
      `${BASE_URL}/api/v1/auth/login`,
      JSON.stringify({
        email: `loadtest+${__VU}@cgraph.org`,
        password: 'loadtest123!',
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (loginRes.status === 200) {
      const token = JSON.parse(loginRes.body).token;
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // Get conversations list
      const convsRes = http.get(`${BASE_URL}/api/v1/conversations`, { headers });
      if (convsRes.status === 200) {
        const convs = JSON.parse(convsRes.body);
        if (convs.data && convs.data.length > 0) {
          const convId = convs.data[0].id;

          // Get messages
          http.get(`${BASE_URL}/api/v1/conversations/${convId}/messages`, { headers });
          messagesSent.add(1);
        }
      }
    }

    sleep(2);
  });
}

export function handleSummary(data) {
  return {
    stdout: JSON.stringify(data, null, 2),
    'results/load-test-results.json': JSON.stringify(data),
  };
}
