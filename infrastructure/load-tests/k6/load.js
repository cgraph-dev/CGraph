/**
 * k6 Load Test — CGraph API
 *
 * Sustained load test for weekly regression detection.
 * 100 VUs, 5 minutes. Fails if p99 > 500ms.
 *
 * Tests: auth flow, messaging, forum browse, search, WebSocket connect
 *
 * Prerequisites: Run the load test seeder first:
 *   MIX_ENV=staging mix run priv/repo/seeds/load_test_users.exs
 */

import http from 'k6/http';
import ws from 'k6/ws';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

const errorRate = new Rate('errors');
const wsConnections = new Counter('ws_connections');
const wsErrors = new Counter('ws_errors');
const messagesSent = new Counter('messages_sent');
const searchDuration = new Trend('search_duration', true);
const authDuration = new Trend('auth_duration', true);
const wsDuration = new Trend('ws_duration', true);

export const options = {
  stages: [
    { duration: '30s', target: 50 }, // Ramp up
    { duration: '3m', target: 100 }, // Sustained load
    { duration: '30s', target: 50 }, // Ramp down
    { duration: '1m', target: 0 }, // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<400', 'p(99)<500'],
    errors: ['rate<0.01'],
    search_duration: ['p(99)<500'],
    auth_duration: ['p(99)<400'],
    ws_duration: ['p(99)<2000'],
    ws_errors: ['count<10'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://staging.cgraph.org';
const WS_URL = __ENV.WS_URL || 'wss://staging.cgraph.org/socket/websocket';
const TOTAL_USERS = 100;

// Each VU gets a deterministic user identity (matches seeder output)
function getUserCredentials(vuId) {
  const userId = ((vuId - 1) % TOTAL_USERS) + 1;
  return {
    email: `loadtest+${userId}@cgraph.org`,
    password: 'loadtest123!',
  };
}

export default function () {
  // Rotate through different user flows including WebSocket
  const scenario = __ITER % 5;

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
    case 4:
      webSocketFlow();
      break;
  }
}

function authAndProfile() {
  group('Auth & Profile', () => {
    const creds = getUserCredentials(__VU);
    const start = Date.now();
    const loginRes = http.post(`${BASE_URL}/api/v1/auth/login`, JSON.stringify(creds), {
      headers: { 'Content-Type': 'application/json' },
    });
    authDuration.add(Date.now() - start);

    if (!check(loginRes, { 'login ok': (r) => r.status === 200 || r.status === 401 })) {
      errorRate.add(1);
    }

    if (loginRes.status === 200) {
      const { token } = JSON.parse(loginRes.body);
      const headers = { Authorization: `Bearer ${token}` };

      // Get profile
      const profileRes = http.get(`${BASE_URL}/api/v1/me`, { headers });
      if (!check(profileRes, { 'profile ok': (r) => r.status === 200 })) {
        errorRate.add(1);
      }

      // Get conversations
      const convsRes = http.get(`${BASE_URL}/api/v1/conversations`, { headers });
      if (!check(convsRes, { 'conversations ok': (r) => r.status === 200 })) {
        errorRate.add(1);
      }
    }

    sleep(1);
  });
}

function browseForums() {
  group('Forum Browse', () => {
    // Browse groups
    const groupsRes = http.get(`${BASE_URL}/api/v1/groups`);
    if (
      !check(groupsRes, {
        'groups: status ok': (r) => r.status === 200 || r.status === 401,
      })
    ) {
      errorRate.add(1);
    }

    // Browse trending (public)
    const trendingRes = http.get(`${BASE_URL}/api/v1/groups/discover`);
    if (
      !check(trendingRes, {
        'trending: status ok': (r) => r.status === 200 || r.status === 401,
      })
    ) {
      errorRate.add(1);
    }

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

    if (
      !check(searchRes, {
        'search: status ok': (r) => r.status === 200 || r.status === 401,
      })
    ) {
      errorRate.add(1);
    }

    sleep(1);
  });
}

function messagingFlow() {
  group('Messaging', () => {
    const creds = getUserCredentials(__VU);
    const loginRes = http.post(`${BASE_URL}/api/v1/auth/login`, JSON.stringify(creds), {
      headers: { 'Content-Type': 'application/json' },
    });

    if (loginRes.status === 200) {
      const { token } = JSON.parse(loginRes.body);
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

function webSocketFlow() {
  group('WebSocket', () => {
    const creds = getUserCredentials(__VU);
    const loginRes = http.post(`${BASE_URL}/api/v1/auth/login`, JSON.stringify(creds), {
      headers: { 'Content-Type': 'application/json' },
    });

    if (loginRes.status === 200) {
      const { token } = JSON.parse(loginRes.body);
      const url = `${WS_URL}?token=${encodeURIComponent(token)}&vsn=2.0.0`;

      const start = Date.now();
      const res = ws.connect(url, {}, function (socket) {
        wsConnections.add(1);

        // Join user channel
        socket.send(JSON.stringify([null, null, `user:${token}`, 'phx_join', {}]));

        socket.on('message', function (msg) {
          // Parse Phoenix channel message
          try {
            const data = JSON.parse(msg);
            if (data[3] === 'phx_reply' && data[4]?.status === 'ok') {
              // Successfully joined
            }
          } catch (_e) {
            // Binary or non-JSON message
          }
        });

        socket.on('error', function (_e) {
          wsErrors.add(1);
        });

        // Keep connection alive for 3 seconds with heartbeats
        socket.setTimeout(function () {
          socket.send(JSON.stringify([null, null, 'phoenix', 'heartbeat', {}]));
        }, 1000);

        socket.setTimeout(function () {
          socket.send(JSON.stringify([null, null, 'phoenix', 'heartbeat', {}]));
        }, 2000);

        socket.setTimeout(function () {
          socket.close();
        }, 3000);
      });

      wsDuration.add(Date.now() - start);

      if (
        !check(res, {
          'ws: status 101': (r) => r && r.status === 101,
        })
      ) {
        wsErrors.add(1);
      }
    }

    sleep(1);
  });
}

export function handleSummary(data) {
  return {
    stdout: JSON.stringify(data, null, 2),
    'results/load-test-results.json': JSON.stringify(data),
  };
}
