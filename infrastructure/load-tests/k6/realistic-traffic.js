/**
 * k6 Realistic Traffic Load Test — CGraph User Journey Simulation
 *
 * Models realistic user behavior as a state machine:
 *   login → browse conversations → open WebSocket → message burst →
 *   search → idle → disconnect
 *
 * Includes proper think times, mixed HTTP + WebSocket traffic,
 * and varying behavior patterns per virtual user.
 *
 * Run:
 *   k6 run --env BASE_URL=https://staging.cgraph.org realistic-traffic.js
 *
 * @see infrastructure/load-tests/results/SCALE_RESULTS.md
 */

import ws from 'k6/ws';
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Trend, Rate } from 'k6/metrics';

// ── Custom Metrics ──────────────────────────────────────────────────────

const loginDuration = new Trend('login_duration', true);
const browseDuration = new Trend('browse_duration', true);
const messageDuration = new Trend('message_send_duration', true);
const searchDuration = new Trend('search_duration', true);
const wsConnectDuration = new Trend('ws_connect_duration', true);
const wsMessageLatency = new Trend('ws_message_latency', true);
const journeyErrors = new Counter('journey_errors');
const journeyCompletions = new Counter('journey_completions');
const stateTransitions = new Counter('state_transitions');
const errorRate = new Rate('journey_error_rate');

// ── Test Configuration ──────────────────────────────────────────────────

export const options = {
  scenarios: {
    realistic_users: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 50 },     // Warm up
        { duration: '3m', target: 200 },    // Ramp to 200
        { duration: '5m', target: 500 },    // Ramp to 500
        { duration: '5m', target: 500 },    // Hold at 500
        { duration: '2m', target: 200 },    // Cool down
        { duration: '1m', target: 0 },      // Ramp down
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    login_duration: ['p(95)<2000'],
    browse_duration: ['p(95)<1000'],
    message_send_duration: ['p(95)<500'],
    search_duration: ['p(95)<1000'],
    ws_connect_duration: ['p(95)<3000'],
    ws_message_latency: ['p(95)<200', 'p(99)<500'],
    journey_error_rate: ['rate<0.05'],
    http_req_duration: ['p(95)<2000'],
  },
};

// ── Environment ──────────────────────────────────────────────────────────

const BASE_URL = __ENV.BASE_URL || 'https://staging.cgraph.org';
const WS_URL = __ENV.WS_URL || BASE_URL.replace('https://', 'wss://').replace('http://', 'ws://') + '/socket/websocket';

// ── Helpers ──────────────────────────────────────────────────────────────

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function authHeaders(token) {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
}

// Phoenix protocol helpers
function phxJoin(socket, topic, ref) {
  socket.send(JSON.stringify([ref.toString(), ref.toString(), topic, 'phx_join', {}]));
}

function phxPush(socket, topic, event, payload, ref) {
  socket.send(JSON.stringify([ref.toString(), ref.toString(), topic, event, payload]));
}

function phxHeartbeat(socket, ref) {
  socket.send(JSON.stringify([null, ref.toString(), 'phoenix', 'heartbeat', {}]));
}

// ── User Journey State Machine ───────────────────────────────────────────

/**
 * Default exported function — each VU runs one complete user journey.
 */
export default function () {
  let token = null;
  let conversationId = null;

  // ────────────────────────────────────────────────────────────────────
  // State 1: LOGIN
  // ────────────────────────────────────────────────────────────────────
  group('1_login', () => {
    stateTransitions.add(1);
    const start = Date.now();

    const loginRes = http.post(
      `${BASE_URL}/api/v1/auth/login`,
      JSON.stringify({
        email: `loadtest+${__VU}@cgraph.org`,
        password: 'loadtest123!',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        tags: { name: 'login' },
      }
    );

    loginDuration.add(Date.now() - start);

    const loginOk = check(loginRes, {
      'login: status 200': (r) => r.status === 200,
    });

    if (!loginOk) {
      journeyErrors.add(1);
      errorRate.add(1);
      return;
    }
    errorRate.add(0);

    try {
      const body = JSON.parse(loginRes.body);
      token = body.token || body.data?.access_token || body.data?.token;
    } catch {
      journeyErrors.add(1);
      return;
    }
  });

  if (!token) return;
  sleep(randomBetween(1, 3)); // Think time after login

  // ────────────────────────────────────────────────────────────────────
  // State 2: BROWSE CONVERSATIONS
  // ────────────────────────────────────────────────────────────────────
  group('2_browse', () => {
    stateTransitions.add(1);
    const start = Date.now();

    const convRes = http.get(
      `${BASE_URL}/api/v1/conversations`,
      {
        ...authHeaders(token),
        tags: { name: 'list_conversations' },
      }
    );

    browseDuration.add(Date.now() - start);

    check(convRes, {
      'browse: conversations loaded': (r) => r.status === 200 || r.status === 304,
    });

    // Pick a conversation to interact with
    try {
      const body = JSON.parse(convRes.body);
      const conversations = body.data?.conversations || body.data || [];
      if (conversations.length > 0) {
        conversationId = conversations[Math.floor(Math.random() * conversations.length)].id;
      }
    } catch {
      conversationId = 1;
    }
  });

  sleep(randomBetween(2, 5)); // Think time browsing

  // ────────────────────────────────────────────────────────────────────
  // State 3: OPEN WEBSOCKET + MESSAGE BURST
  // ────────────────────────────────────────────────────────────────────
  group('3_messaging', () => {
    stateTransitions.add(1);
    const wsUrl = `${WS_URL}?token=${token}&vsn=2.0.0`;
    let msgRef = 1;
    const connectStart = Date.now();

    const res = ws.connect(wsUrl, {}, function (socket) {
      wsConnectDuration.add(Date.now() - connectStart);

      const topic = `conversation:${conversationId || 1}`;

      socket.on('open', () => {
        phxJoin(socket, `user:${__VU}`, msgRef++);
        phxJoin(socket, topic, msgRef++);
      });

      socket.on('message', (msg) => {
        try {
          const parsed = JSON.parse(msg);
          if (parsed[4] && parsed[4].sent_at) {
            const latency = Date.now() - new Date(parsed[4].sent_at).getTime();
            if (latency > 0 && latency < 30000) {
              wsMessageLatency.add(latency);
            }
          }
        } catch (_) {}
      });

      socket.on('error', () => journeyErrors.add(1));

      // Heartbeat
      socket.setInterval(() => phxHeartbeat(socket, msgRef++), 30000);

      // Message burst: send 3-5 messages over ~30 seconds
      const burstCount = Math.floor(randomBetween(3, 6));
      for (let i = 0; i < burstCount; i++) {
        // Typing indicator
        phxPush(socket, topic, 'typing', {}, msgRef++);
        sleep(randomBetween(1, 3));

        const sendStart = Date.now();
        phxPush(
          socket,
          topic,
          'new_message',
          {
            body: `Realistic traffic msg ${i} from VU ${__VU}`,
            sent_at: new Date().toISOString(),
          },
          msgRef++
        );
        messageDuration.add(Date.now() - sendStart);
        sleep(randomBetween(3, 10));
      }

      // ──────────────────────────────────────────────────────────────
      // State 4: SEARCH (while still connected via WebSocket)
      // ──────────────────────────────────────────────────────────────
      const searchStart = Date.now();
      const searchRes = http.get(
        `${BASE_URL}/api/v1/search/messages?q=hello&conversation_id=${conversationId || 1}`,
        {
          ...authHeaders(token),
          tags: { name: 'search_messages' },
        }
      );
      searchDuration.add(Date.now() - searchStart);
      stateTransitions.add(1);

      check(searchRes, {
        'search: completed': (r) => r.status === 200 || r.status === 404,
      });

      sleep(randomBetween(2, 5));

      // ──────────────────────────────────────────────────────────────
      // State 5: IDLE (1-3 minutes, just staying connected)
      // ──────────────────────────────────────────────────────────────
      stateTransitions.add(1);
      sleep(randomBetween(60, 180));

      // ──────────────────────────────────────────────────────────────
      // State 6: DISCONNECT
      // ──────────────────────────────────────────────────────────────
      stateTransitions.add(1);
      socket.close();
    });

    check(res, {
      'messaging: ws connected': (r) => r && r.status === 101,
    });
  });

  journeyCompletions.add(1);
}
