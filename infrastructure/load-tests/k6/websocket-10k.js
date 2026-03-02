/**
 * k6 WebSocket 10K Load Test — CGraph Scale Validation
 *
 * Validates that CGraph can handle 10,000+ concurrent WebSocket connections
 * with realistic user behavior distribution:
 *   - 80% idle connections (connected but rarely send)
 *   - 15% active chatters (messages every 5-30s)
 *   - 5% heavy users (messages every 1-5s, channel switching)
 *
 * Thresholds:
 *   - p95 connect time < 3s
 *   - p95 message latency < 200ms
 *   - p99 message latency < 500ms
 *   - Total errors < 50
 *
 * Run:
 *   k6 run --env BASE_URL=https://staging.cgraph.org websocket-10k.js
 *   k6 run --env BASE_URL=wss://staging.cgraph.org websocket-10k.js
 *
 * @see infrastructure/load-tests/results/SCALE_RESULTS.md
 */

import ws from 'k6/ws';
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Trend, Gauge, Rate } from 'k6/metrics';

// ── Custom Metrics ──────────────────────────────────────────────────────

const wsConnectDuration = new Trend('ws_connect_duration', true);
const wsMessageLatency = new Trend('ws_message_latency', true);
const wsErrors = new Counter('ws_errors');
const wsReconnections = new Counter('ws_reconnections');
const wsActiveConnections = new Gauge('ws_active_connections');
const wsMessagesReceived = new Counter('ws_messages_received');
const wsMessagesSent = new Counter('ws_messages_sent');
const wsConnectionFailRate = new Rate('ws_connection_fail_rate');

// ── Test Configuration ──────────────────────────────────────────────────

export const options = {
  scenarios: {
    // 80% idle connections — connected but rarely send
    idle_users: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 2000 },   // Ramp up
        { duration: '3m', target: 8000 },   // Ramp to 8K idle
        { duration: '5m', target: 8000 },   // Hold at 8K
        { duration: '2m', target: 0 },      // Ramp down
      ],
      exec: 'idleUser',
      gracefulRampDown: '30s',
    },
    // 15% active chatters — send messages every 5-30s
    active_chatters: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 500 },
        { duration: '3m', target: 1500 },   // Ramp to 1.5K active
        { duration: '5m', target: 1500 },   // Hold
        { duration: '2m', target: 0 },
      ],
      exec: 'activeChatter',
      gracefulRampDown: '30s',
    },
    // 5% heavy users — send messages every 1-5s, join/leave channels
    heavy_users: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },
        { duration: '3m', target: 500 },    // Ramp to 500 heavy
        { duration: '5m', target: 500 },    // Hold
        { duration: '2m', target: 0 },
      ],
      exec: 'heavyUser',
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    ws_connect_duration: ['p(95)<3000', 'p(99)<5000'],
    ws_message_latency: ['p(95)<200', 'p(99)<500'],
    ws_errors: ['count<50'],
    ws_connection_fail_rate: ['rate<0.01'],
    http_req_duration: ['p(95)<1000'],
  },
};

// ── Environment ──────────────────────────────────────────────────────────

const BASE_URL = __ENV.BASE_URL || 'https://staging.cgraph.org';
const WS_URL = __ENV.WS_URL || BASE_URL.replace('https://', 'wss://').replace('http://', 'ws://') + '/socket/websocket';

// ── Helpers ──────────────────────────────────────────────────────────────

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function randomConversation() {
  return Math.floor(Math.random() * 100) + 1;
}

function getAuthToken() {
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

  if (loginRes.status !== 200) {
    wsErrors.add(1);
    return null;
  }

  try {
    const body = JSON.parse(loginRes.body);
    return body.token || body.data?.access_token || body.data?.token;
  } catch {
    wsErrors.add(1);
    return null;
  }
}

// Phoenix Socket V2 protocol helpers
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

function phxLeave(socket, topic, ref) {
  const msg = JSON.stringify([ref.toString(), ref.toString(), topic, 'phx_leave', {}]);
  socket.send(msg);
}

// ── Scenarios ────────────────────────────────────────────────────────────

/**
 * Idle User (80% of connections)
 * Connects, joins one channel, receives messages passively.
 * Stays connected 2-5 minutes, only sends heartbeats.
 */
export function idleUser() {
  const token = getAuthToken();
  if (!token) {
    wsConnectionFailRate.add(1);
    return;
  }

  const url = `${WS_URL}?token=${token}&vsn=2.0.0`;
  let msgRef = 1;
  const connectStart = Date.now();

  const res = ws.connect(url, {}, function (socket) {
    wsActiveConnections.add(1);
    wsConnectDuration.add(Date.now() - connectStart);
    wsConnectionFailRate.add(0);

    socket.on('open', () => {
      // Join user's general channel and one conversation
      phxJoin(socket, `user:${__VU}`, msgRef++);
      phxJoin(socket, `conversation:${randomConversation()}`, msgRef++);
    });

    socket.on('message', (msg) => {
      wsMessagesReceived.add(1);
      try {
        const parsed = JSON.parse(msg);
        if (parsed[4] && parsed[4].sent_at) {
          const latency = Date.now() - new Date(parsed[4].sent_at).getTime();
          if (latency > 0 && latency < 30000) {
            wsMessageLatency.add(latency);
          }
        }
      } catch (_) {
        // heartbeat or non-JSON
      }
    });

    socket.on('error', () => {
      wsErrors.add(1);
    });

    socket.on('close', () => {
      wsActiveConnections.add(-1);
    });

    // Heartbeats every 30s (Phoenix default)
    socket.setInterval(() => {
      phxHeartbeat(socket, msgRef++);
    }, 30000);

    // Idle: stay connected 2-5 minutes
    sleep(randomBetween(120, 300));
    socket.close();
  });

  const connected = check(res, {
    'idle: ws connected': (r) => r && r.status === 101,
  });
  if (!connected) {
    wsConnectionFailRate.add(1);
    wsReconnections.add(1);
  }
}

/**
 * Active Chatter (15% of connections)
 * Connects, joins 2-3 channels, sends messages every 5-30 seconds.
 * Sends typing indicators before messages.
 */
export function activeChatter() {
  const token = getAuthToken();
  if (!token) {
    wsConnectionFailRate.add(1);
    return;
  }

  const url = `${WS_URL}?token=${token}&vsn=2.0.0`;
  let msgRef = 1;
  const connectStart = Date.now();

  const res = ws.connect(url, {}, function (socket) {
    wsActiveConnections.add(1);
    wsConnectDuration.add(Date.now() - connectStart);
    wsConnectionFailRate.add(0);

    const channels = [
      `conversation:${randomConversation()}`,
      `conversation:${randomConversation()}`,
    ];

    socket.on('open', () => {
      phxJoin(socket, `user:${__VU}`, msgRef++);
      channels.forEach((ch) => phxJoin(socket, ch, msgRef++));
    });

    socket.on('message', (msg) => {
      wsMessagesReceived.add(1);
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

    socket.on('error', () => wsErrors.add(1));
    socket.on('close', () => wsActiveConnections.add(-1));

    // Heartbeats
    socket.setInterval(() => phxHeartbeat(socket, msgRef++), 30000);

    // Send messages every 5-30 seconds
    const messageCount = Math.floor(randomBetween(5, 15));
    for (let i = 0; i < messageCount; i++) {
      const channel = channels[Math.floor(Math.random() * channels.length)];

      // Typing indicator
      phxPush(socket, channel, 'typing', {}, msgRef++);
      sleep(randomBetween(0.5, 2));

      // Send message
      phxPush(
        socket,
        channel,
        'new_message',
        {
          body: `Active chatter msg ${i} from VU ${__VU}`,
          sent_at: new Date().toISOString(),
        },
        msgRef++
      );
      wsMessagesSent.add(1);

      sleep(randomBetween(5, 30));
    }

    // Stay connected a bit after last message
    sleep(randomBetween(10, 30));
    socket.close();
  });

  const connected = check(res, {
    'active: ws connected': (r) => r && r.status === 101,
  });
  if (!connected) {
    wsConnectionFailRate.add(1);
    wsReconnections.add(1);
  }
}

/**
 * Heavy User (5% of connections)
 * Connects, joins/leaves multiple channels, sends messages every 1-5 seconds.
 * Also sends typing indicators, presence updates, and channel switches.
 */
export function heavyUser() {
  const token = getAuthToken();
  if (!token) {
    wsConnectionFailRate.add(1);
    return;
  }

  const url = `${WS_URL}?token=${token}&vsn=2.0.0`;
  let msgRef = 1;
  const connectStart = Date.now();

  const res = ws.connect(url, {}, function (socket) {
    wsActiveConnections.add(1);
    wsConnectDuration.add(Date.now() - connectStart);
    wsConnectionFailRate.add(0);

    let currentChannels = [
      `conversation:${randomConversation()}`,
      `conversation:${randomConversation()}`,
      `conversation:${randomConversation()}`,
    ];

    socket.on('open', () => {
      phxJoin(socket, `user:${__VU}`, msgRef++);
      phxJoin(socket, 'presence:lobby', msgRef++);
      currentChannels.forEach((ch) => phxJoin(socket, ch, msgRef++));
    });

    socket.on('message', (msg) => {
      wsMessagesReceived.add(1);
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

    socket.on('error', () => wsErrors.add(1));
    socket.on('close', () => wsActiveConnections.add(-1));

    // Heartbeats
    socket.setInterval(() => phxHeartbeat(socket, msgRef++), 30000);

    // Intense activity: messages every 1-5 seconds with channel switching
    const iterations = Math.floor(randomBetween(20, 50));
    for (let i = 0; i < iterations; i++) {
      const channel = currentChannels[Math.floor(Math.random() * currentChannels.length)];

      // Randomly switch channels (10% chance per iteration)
      if (Math.random() < 0.1 && currentChannels.length > 1) {
        const leaveIdx = Math.floor(Math.random() * currentChannels.length);
        phxLeave(socket, currentChannels[leaveIdx], msgRef++);
        currentChannels.splice(leaveIdx, 1);

        const newChannel = `conversation:${randomConversation()}`;
        phxJoin(socket, newChannel, msgRef++);
        currentChannels.push(newChannel);
      }

      // Typing indicator
      phxPush(socket, channel, 'typing', {}, msgRef++);
      sleep(randomBetween(0.3, 1));

      // Send message
      phxPush(
        socket,
        channel,
        'new_message',
        {
          body: `Heavy user msg ${i} from VU ${__VU} [${Date.now()}]`,
          sent_at: new Date().toISOString(),
        },
        msgRef++
      );
      wsMessagesSent.add(1);

      sleep(randomBetween(1, 5));
    }

    socket.close();
  });

  const connected = check(res, {
    'heavy: ws connected': (r) => r && r.status === 101,
  });
  if (!connected) {
    wsConnectionFailRate.add(1);
    wsReconnections.add(1);
  }
}
