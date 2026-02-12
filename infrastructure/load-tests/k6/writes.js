/**
 * k6 Write-Heavy Load Test — CGraph API
 *
 * Tests write operations: message creation, post creation, user updates,
 * group operations. Models peak write patterns similar to Discord during
 * large events. Validates database write throughput and connection pool.
 *
 * Run: k6 run --env BASE_URL=https://staging.cgraph.org writes.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const writeErrors = new Rate('write_errors');
const messageSendDuration = new Trend('message_send_duration', true);
const postCreateDuration = new Trend('post_create_duration', true);
const profileUpdateDuration = new Trend('profile_update_duration', true);
const totalWrites = new Counter('total_writes');

export const options = {
  scenarios: {
    // Message burst — simulates a raid/event where everyone talks at once
    message_burst: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      preAllocatedVUs: 100,
      stages: [
        { duration: '30s', target: 50 }, // Ramp up to 50 msg/s
        { duration: '2m', target: 100 }, // Peak: 100 messages/second
        { duration: '1m', target: 200 }, // Spike: 200 messages/second
        { duration: '30s', target: 50 }, // Ramp down
        { duration: '30s', target: 0 },
      ],
      exec: 'sendMessage',
    },
    // Post creation — sustained forum activity
    forum_writes: {
      executor: 'constant-arrival-rate',
      rate: 5,
      timeUnit: '1s',
      duration: '4m',
      preAllocatedVUs: 20,
      exec: 'createPost',
    },
    // Profile and settings updates
    profile_updates: {
      executor: 'constant-arrival-rate',
      rate: 2,
      timeUnit: '1s',
      duration: '4m',
      preAllocatedVUs: 10,
      exec: 'updateProfile',
    },
  },
  thresholds: {
    write_errors: ['rate<0.02'], // <2% write failure rate
    message_send_duration: ['p(95)<300', 'p(99)<1000'],
    post_create_duration: ['p(95)<500', 'p(99)<2000'],
    profile_update_duration: ['p(95)<200', 'p(99)<500'],
    http_req_duration: ['p(99)<2000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://staging.cgraph.org';

// Token cache per VU
let cachedToken = null;
let tokenExpiry = 0;

function getAuthHeaders() {
  if (cachedToken && Date.now() < tokenExpiry) {
    return {
      headers: { Authorization: `Bearer ${cachedToken}`, 'Content-Type': 'application/json' },
    };
  }

  const loginRes = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({
      email: `loadtest+${__VU}@cgraph.org`,
      password: 'loadtest123!',
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  if (loginRes.status !== 200) {
    writeErrors.add(1);
    return null;
  }

  const body = JSON.parse(loginRes.body);
  cachedToken = body.token;
  tokenExpiry = Date.now() + 10 * 60 * 1000; // Cache for 10 minutes

  return {
    headers: { Authorization: `Bearer ${cachedToken}`, 'Content-Type': 'application/json' },
  };
}

/**
 * Send Message — write to a conversation
 */
export function sendMessage() {
  const params = getAuthHeaders();
  if (!params) return;

  const conversationId = `loadtest-conv-${(__VU % 10) + 1}`; // 10 shared conversations

  group('Send Message', () => {
    const start = Date.now();
    const res = http.post(
      `${BASE_URL}/api/v1/conversations/${conversationId}/messages`,
      JSON.stringify({
        body: `Load test message ${Date.now()} — iteration ${__ITER}`,
        type: 'text',
      }),
      params
    );

    messageSendDuration.add(Date.now() - start);
    totalWrites.add(1);

    const success = check(res, {
      'message created': (r) => r.status === 201 || r.status === 200,
      'message has id': (r) => {
        try {
          return JSON.parse(r.body).data?.id != null;
        } catch (_) {
          return false;
        }
      },
    });

    if (!success) writeErrors.add(1);
  });
}

/**
 * Create Post — write to a forum
 */
export function createPost() {
  const params = getAuthHeaders();
  if (!params) return;

  const forumId = `loadtest-forum-${(__VU % 5) + 1}`; // 5 shared forums

  group('Create Post', () => {
    const start = Date.now();
    const res = http.post(
      `${BASE_URL}/api/v1/forums/${forumId}/posts`,
      JSON.stringify({
        title: `Load test post ${Date.now()}`,
        body: `Performance test content from VU ${__VU}. This simulates sustained forum write activity with realistic payload sizes. Adding some more text to be realistic about payload size and database write cost.`,
        tags: ['loadtest', 'automated'],
      }),
      params
    );

    postCreateDuration.add(Date.now() - start);
    totalWrites.add(1);

    const success = check(res, {
      'post created': (r) => r.status === 201 || r.status === 200,
    });

    if (!success) writeErrors.add(1);
  });
}

/**
 * Update Profile — concurrent profile writes (tests row-level locking)
 */
export function updateProfile() {
  const params = getAuthHeaders();
  if (!params) return;

  group('Update Profile', () => {
    const start = Date.now();

    // Alternate between different update types
    const updateType = __ITER % 3;
    let payload;

    switch (updateType) {
      case 0:
        payload = { display_name: `LoadTest User ${__VU} - ${Date.now()}` };
        break;
      case 1:
        payload = { bio: `Updated bio at ${new Date().toISOString()} by VU ${__VU}` };
        break;
      case 2:
        payload = { status: __ITER % 2 === 0 ? 'online' : 'away' };
        break;
    }

    const res = http.patch(`${BASE_URL}/api/v1/me`, JSON.stringify(payload), params);

    profileUpdateDuration.add(Date.now() - start);
    totalWrites.add(1);

    const success = check(res, {
      'profile updated': (r) => r.status === 200,
    });

    if (!success) writeErrors.add(1);
  });
}

/**
 * Baseline export — captures current performance for regression detection
 */
export function handleSummary(data) {
  const summary = {
    timestamp: new Date().toISOString(),
    test: 'writes',
    metrics: {
      message_send_p95: data.metrics.message_send_duration?.values?.['p(95)'],
      message_send_p99: data.metrics.message_send_duration?.values?.['p(99)'],
      post_create_p95: data.metrics.post_create_duration?.values?.['p(95)'],
      post_create_p99: data.metrics.post_create_duration?.values?.['p(99)'],
      total_writes: data.metrics.total_writes?.values?.count,
      error_rate: data.metrics.write_errors?.values?.rate,
    },
  };

  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    'results/writes-baseline.json': JSON.stringify(summary, null, 2),
  };
}

// k6 utility import (available in k6 runtime)
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
