/**
 * k6 WebSocket Load Test — CGraph Real-Time Messaging
 *
 * Tests WebSocket connection stability, message throughput, and presence
 * under sustained load. Models real-world usage patterns.
 *
 * Run: k6 run --env BASE_URL=https://staging.cgraph.org websocket.js
 */

import ws from 'k6/ws';
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

// Custom metrics
const wsConnectDuration = new Trend('ws_connect_duration', true);
const wsMessageLatency = new Trend('ws_message_latency', true);
const wsErrors = new Rate('ws_errors');
const wsConnections = new Gauge('ws_active_connections');
const messagesReceived = new Counter('ws_messages_received');
const messagesSent = new Counter('ws_messages_sent');
const reconnections = new Counter('ws_reconnections');

export const options = {
  scenarios: {
    // Sustained connections — models users idling in channels
    idle_connections: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },
        { duration: '3m', target: 200 },
        { duration: '1m', target: 200 },
        { duration: '30s', target: 0 },
      ],
      exec: 'idleConnection',
    },
    // Active chatters — models users actively messaging
    active_chatters: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '3m', target: 50 },
        { duration: '1m', target: 50 },
        { duration: '30s', target: 0 },
      ],
      exec: 'activeChatter',
    },
    // Presence updates — models join/leave patterns
    presence_churn: {
      executor: 'constant-arrival-rate',
      rate: 20,
      timeUnit: '1s',
      duration: '4m',
      preAllocatedVUs: 30,
      exec: 'presenceChurn',
    },
  },
  thresholds: {
    ws_connect_duration: ['p(95)<2000', 'p(99)<5000'],
    ws_message_latency: ['p(95)<200', 'p(99)<500'],
    ws_errors: ['rate<0.05'],
    ws_active_connections: ['value>0'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://staging.cgraph.org';
const WS_URL = __ENV.WS_URL || 'wss://staging.cgraph.org/socket/websocket';

function getAuthToken() {
  const loginRes = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({
      email: `loadtest+${__VU}@cgraph.org`,
      password: 'loadtest123!',
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  if (loginRes.status !== 200) {
    wsErrors.add(1);
    return null;
  }

  return JSON.parse(loginRes.body).token;
}

// Phoenix Socket protocol helpers
function phxJoin(socket, topic, ref) {
  const msg = JSON.stringify([ref.toString(), ref.toString(), topic, 'phx_join', {}]);
  socket.send(msg);
}

function phxPush(socket, topic, event, payload, ref) {
  const msg = JSON.stringify([ref.toString(), ref.toString(), topic, event, payload]);
  socket.send(msg);
}

function phxHeartbeat(socket, ref) {
  const msg = JSON.stringify([null, ref.toString(), 'phoenix', 'heartbeat', {}]);
  socket.send(msg);
}

/**
 * Idle Connection — connect, join a channel, receive messages passively
 */
export function idleConnection() {
  const token = getAuthToken();
  if (!token) return;

  const url = `${WS_URL}?token=${token}&vsn=2.0.0`;
  let msgRef = 1;
  const connectStart = Date.now();

  const res = ws.connect(url, {}, function (socket) {
    wsConnections.add(1);
    wsConnectDuration.add(Date.now() - connectStart);

    socket.on('open', () => {
      // Join user's general channel
      phxJoin(socket, `user:${__VU}`, msgRef++);
      phxJoin(socket, 'presence:lobby', msgRef++);
    });

    socket.on('message', (msg) => {
      messagesReceived.add(1);
      try {
        const parsed = JSON.parse(msg);
        // Track message delivery latency if timestamp present
        if (parsed[4] && parsed[4].sent_at) {
          const latency = Date.now() - new Date(parsed[4].sent_at).getTime();
          wsMessageLatency.add(latency);
        }
      } catch (_) {
        // Non-JSON message or heartbeat
      }
    });

    socket.on('error', () => {
      wsErrors.add(1);
    });

    socket.on('close', () => {
      wsConnections.add(-1);
    });

    // Send heartbeats every 30s (Phoenix default)
    socket.setInterval(() => {
      phxHeartbeat(socket, msgRef++);
    }, 30000);

    // Stay connected for 2-4 minutes (simulating idle user)
    sleep(120 + Math.random() * 120);
    socket.close();
  });

  check(res, { 'ws connected': (r) => r && r.status === 101 });
}

/**
 * Active Chatter — connect, join channels, send messages at realistic rate
 */
export function activeChatter() {
  const token = getAuthToken();
  if (!token) return;

  const url = `${WS_URL}?token=${token}&vsn=2.0.0`;
  let msgRef = 1;
  const connectStart = Date.now();

  const res = ws.connect(url, {}, function (socket) {
    wsConnections.add(1);
    wsConnectDuration.add(Date.now() - connectStart);

    socket.on('open', () => {
      phxJoin(socket, `user:${__VU}`, msgRef++);
      // Join a few chat channels
      phxJoin(socket, 'chat:general', msgRef++);
      phxJoin(socket, 'chat:random', msgRef++);
    });

    socket.on('message', (msg) => {
      messagesReceived.add(1);
    });

    socket.on('error', () => {
      wsErrors.add(1);
    });

    socket.on('close', () => {
      wsConnections.add(-1);
    });

    // Heartbeats
    socket.setInterval(() => {
      phxHeartbeat(socket, msgRef++);
    }, 30000);

    // Send messages every 3-10 seconds (active chatter pattern)
    socket.setInterval(
      () => {
        const channel = Math.random() > 0.5 ? 'chat:general' : 'chat:random';

        // Send typing indicator
        phxPush(socket, channel, 'typing', {}, msgRef++);

        // Send message after brief delay
        sleep(0.5 + Math.random() * 2);
        phxPush(
          socket,
          channel,
          'new_message',
          {
            body: `Load test message ${Date.now()} from VU ${__VU}`,
            sent_at: new Date().toISOString(),
          },
          msgRef++
        );
        messagesSent.add(1);
      },
      3000 + Math.random() * 7000
    );

    // Stay connected for 1-3 minutes
    sleep(60 + Math.random() * 120);
    socket.close();
  });

  check(res, { 'ws connected': (r) => r && r.status === 101 });
}

/**
 * Presence Churn — rapid connect/join/leave to stress presence tracking
 */
export function presenceChurn() {
  const token = getAuthToken();
  if (!token) return;

  const url = `${WS_URL}?token=${token}&vsn=2.0.0`;
  let msgRef = 1;
  const connectStart = Date.now();

  const res = ws.connect(url, {}, function (socket) {
    wsConnectDuration.add(Date.now() - connectStart);

    socket.on('open', () => {
      // Join presence channel
      phxJoin(socket, 'presence:lobby', msgRef++);
    });

    socket.on('message', (msg) => {
      messagesReceived.add(1);
    });

    // Stay briefly then disconnect (simulates rapid join/leave)
    sleep(5 + Math.random() * 15);
    socket.close();
  });

  check(res, { 'ws connected': (r) => r && r.status === 101 });
}
