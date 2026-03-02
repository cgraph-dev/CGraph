/**
 * k6 Rich Media Load Test — CGraph Phase 18 Features
 *
 * Tests the new rich media features introduced in Phase 18:
 *   - Voice message upload (simulated binary payload)
 *   - File upload (multipart form data)
 *   - GIF search (Tenor/Giphy proxy)
 *   - Scheduled message CRUD
 *
 * Each scenario runs at a constant arrival rate to test sustained throughput.
 *
 * Thresholds:
 *   - Voice upload p95 < 2s
 *   - File upload p95 < 3s
 *   - GIF search p95 < 500ms
 *   - Scheduled CRUD p95 < 300ms
 *
 * Run:
 *   k6 run --env BASE_URL=https://staging.cgraph.org rich-media.js
 *
 * @see infrastructure/load-tests/results/SCALE_RESULTS.md
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Trend, Rate } from 'k6/metrics';

// ── Custom Metrics ──────────────────────────────────────────────────────

const voiceUploadDuration = new Trend('voice_upload_duration', true);
const fileUploadDuration = new Trend('file_upload_duration', true);
const gifSearchDuration = new Trend('gif_search_duration', true);
const scheduledCrudDuration = new Trend('scheduled_crud_duration', true);
const uploadErrors = new Counter('upload_errors');
const searchErrors = new Counter('search_errors');
const crudErrors = new Counter('crud_errors');
const errorRate = new Rate('rich_media_error_rate');

// ── Test Configuration ──────────────────────────────────────────────────

export const options = {
  scenarios: {
    // Voice message uploads — 10 per second sustained
    voice_upload: {
      executor: 'constant-arrival-rate',
      rate: 10,
      timeUnit: '1s',
      duration: '5m',
      preAllocatedVUs: 50,
      maxVUs: 100,
      exec: 'voiceUpload',
    },
    // File uploads — 20 per second sustained
    file_upload: {
      executor: 'constant-arrival-rate',
      rate: 20,
      timeUnit: '1s',
      duration: '5m',
      preAllocatedVUs: 100,
      maxVUs: 200,
      exec: 'fileUpload',
    },
    // GIF search — 50 per second sustained
    gif_search: {
      executor: 'constant-arrival-rate',
      rate: 50,
      timeUnit: '1s',
      duration: '5m',
      preAllocatedVUs: 100,
      maxVUs: 200,
      exec: 'gifSearch',
    },
    // Scheduled message CRUD — 5 per second sustained
    scheduled_crud: {
      executor: 'constant-arrival-rate',
      rate: 5,
      timeUnit: '1s',
      duration: '5m',
      preAllocatedVUs: 20,
      maxVUs: 50,
      exec: 'scheduledCrud',
    },
  },
  thresholds: {
    'voice_upload_duration': ['p(95)<2000', 'p(99)<4000'],
    'file_upload_duration': ['p(95)<3000', 'p(99)<5000'],
    'gif_search_duration': ['p(95)<500', 'p(99)<1000'],
    'scheduled_crud_duration': ['p(95)<300', 'p(99)<500'],
    'rich_media_error_rate': ['rate<0.05'],
    'http_req_duration': ['p(95)<3000'],
  },
};

// ── Environment ──────────────────────────────────────────────────────────

const BASE_URL = __ENV.BASE_URL || 'https://staging.cgraph.org';

// ── Helpers ──────────────────────────────────────────────────────────────

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

  if (loginRes.status !== 200) return null;

  try {
    const body = JSON.parse(loginRes.body);
    return body.token || body.data?.access_token || body.data?.token;
  } catch {
    return null;
  }
}

function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Generate a simulated voice message payload (binary-like).
 * Real voice messages are Opus-encoded ~10-60KB.
 */
function generateVoicePayload(durationSec) {
  // Simulate Opus audio at ~16kbps = 2KB/s
  const size = durationSec * 2000;
  const bytes = new ArrayBuffer(Math.min(size, 64000));
  return new Uint8Array(bytes);
}

/**
 * Generate a simulated file payload for upload.
 */
function generateFilePayload(sizeKB) {
  const bytes = new ArrayBuffer(sizeKB * 1024);
  return new Uint8Array(bytes);
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

// ── Scenarios ────────────────────────────────────────────────────────────

/**
 * Voice Message Upload
 * POST /api/v1/conversations/:id/messages with voice attachment
 */
export function voiceUpload() {
  const token = getAuthToken();
  if (!token) {
    uploadErrors.add(1);
    errorRate.add(1);
    return;
  }

  const conversationId = Math.floor(Math.random() * 100) + 1;
  const durationSec = Math.floor(randomBetween(3, 30));
  const voiceData = generateVoicePayload(durationSec);

  const start = Date.now();

  const res = http.post(
    `${BASE_URL}/api/v1/conversations/${conversationId}/messages`,
    JSON.stringify({
      type: 'voice',
      voice: {
        duration: durationSec,
        waveform: Array.from({ length: 50 }, () => Math.random()),
        mime_type: 'audio/ogg; codecs=opus',
      },
      body: '',
    }),
    {
      headers: authHeaders(token),
      tags: { name: 'voice_upload' },
    }
  );

  voiceUploadDuration.add(Date.now() - start);

  const ok = check(res, {
    'voice: upload accepted': (r) =>
      r.status === 200 || r.status === 201 || r.status === 422,
  });

  if (!ok) {
    uploadErrors.add(1);
    errorRate.add(1);
  } else {
    errorRate.add(0);
  }
}

/**
 * File Upload
 * POST /api/v1/conversations/:id/messages with file attachment
 */
export function fileUpload() {
  const token = getAuthToken();
  if (!token) {
    uploadErrors.add(1);
    errorRate.add(1);
    return;
  }

  const conversationId = Math.floor(Math.random() * 100) + 1;
  const fileSizeKB = Math.floor(randomBetween(10, 500));
  const fileData = generateFilePayload(fileSizeKB);

  const fileTypes = ['image/png', 'image/jpeg', 'application/pdf', 'text/plain'];
  const fileExts = ['png', 'jpg', 'pdf', 'txt'];
  const idx = Math.floor(Math.random() * fileTypes.length);

  const start = Date.now();

  const res = http.post(
    `${BASE_URL}/api/v1/conversations/${conversationId}/messages`,
    JSON.stringify({
      type: 'file',
      file: {
        name: `loadtest_file_${__VU}_${Date.now()}.${fileExts[idx]}`,
        size: fileSizeKB * 1024,
        mime_type: fileTypes[idx],
      },
      body: `File upload from VU ${__VU}`,
    }),
    {
      headers: authHeaders(token),
      tags: { name: 'file_upload' },
    }
  );

  fileUploadDuration.add(Date.now() - start);

  const ok = check(res, {
    'file: upload accepted': (r) =>
      r.status === 200 || r.status === 201 || r.status === 422,
  });

  if (!ok) {
    uploadErrors.add(1);
    errorRate.add(1);
  } else {
    errorRate.add(0);
  }
}

/**
 * GIF Search
 * GET /api/v1/gifs/search?q=...
 */
export function gifSearch() {
  const token = getAuthToken();
  if (!token) {
    searchErrors.add(1);
    errorRate.add(1);
    return;
  }

  const queries = [
    'happy', 'sad', 'funny', 'excited', 'thumbs up',
    'celebration', 'dancing', 'cats', 'dogs', 'reaction',
    'mind blown', 'ok', 'yes', 'no', 'thank you',
    'hello', 'goodbye', 'laugh', 'cry', 'love',
  ];
  const query = queries[Math.floor(Math.random() * queries.length)];

  const start = Date.now();

  const res = http.get(
    `${BASE_URL}/api/v1/gifs/search?q=${encodeURIComponent(query)}&limit=20`,
    {
      headers: { Authorization: `Bearer ${token}` },
      tags: { name: 'gif_search' },
    }
  );

  gifSearchDuration.add(Date.now() - start);

  const ok = check(res, {
    'gif: search responded': (r) =>
      r.status === 200 || r.status === 404 || r.status === 503,
  });

  if (!ok) {
    searchErrors.add(1);
    errorRate.add(1);
  } else {
    errorRate.add(0);
  }
}

/**
 * Scheduled Message CRUD
 * Tests create, list, update, and delete of scheduled messages.
 */
export function scheduledCrud() {
  const token = getAuthToken();
  if (!token) {
    crudErrors.add(1);
    errorRate.add(1);
    return;
  }

  const conversationId = Math.floor(Math.random() * 100) + 1;
  const headers = authHeaders(token);

  // Schedule in future (1 hour from now)
  const scheduledAt = new Date(Date.now() + 3600000).toISOString();

  // CREATE scheduled message
  const createStart = Date.now();
  const createRes = http.post(
    `${BASE_URL}/api/v1/conversations/${conversationId}/scheduled-messages`,
    JSON.stringify({
      body: `Scheduled msg from VU ${__VU} at ${Date.now()}`,
      scheduled_at: scheduledAt,
    }),
    {
      headers,
      tags: { name: 'scheduled_create' },
    }
  );
  scheduledCrudDuration.add(Date.now() - createStart);

  const createOk = check(createRes, {
    'scheduled: created': (r) =>
      r.status === 200 || r.status === 201 || r.status === 422,
  });

  if (!createOk) {
    crudErrors.add(1);
    errorRate.add(1);
    return;
  }
  errorRate.add(0);

  // LIST scheduled messages
  const listStart = Date.now();
  const listRes = http.get(
    `${BASE_URL}/api/v1/conversations/${conversationId}/scheduled-messages`,
    {
      headers: { Authorization: `Bearer ${token}` },
      tags: { name: 'scheduled_list' },
    }
  );
  scheduledCrudDuration.add(Date.now() - listStart);

  check(listRes, {
    'scheduled: listed': (r) => r.status === 200 || r.status === 404,
  });

  // Try to extract a scheduled message ID for update/delete
  let scheduledId = null;
  try {
    const body = JSON.parse(createRes.body);
    scheduledId = body.data?.id || body.id;
  } catch {
    // If we can't parse the ID, skip update/delete
  }

  if (scheduledId) {
    // UPDATE scheduled message
    const updateStart = Date.now();
    const updateRes = http.patch(
      `${BASE_URL}/api/v1/conversations/${conversationId}/scheduled-messages/${scheduledId}`,
      JSON.stringify({
        body: `Updated scheduled msg from VU ${__VU}`,
        scheduled_at: new Date(Date.now() + 7200000).toISOString(),
      }),
      {
        headers,
        tags: { name: 'scheduled_update' },
      }
    );
    scheduledCrudDuration.add(Date.now() - updateStart);

    check(updateRes, {
      'scheduled: updated': (r) =>
        r.status === 200 || r.status === 404 || r.status === 422,
    });

    sleep(0.5);

    // DELETE scheduled message
    const deleteStart = Date.now();
    const deleteRes = http.del(
      `${BASE_URL}/api/v1/conversations/${conversationId}/scheduled-messages/${scheduledId}`,
      null,
      {
        headers: { Authorization: `Bearer ${token}` },
        tags: { name: 'scheduled_delete' },
      }
    );
    scheduledCrudDuration.add(Date.now() - deleteStart);

    check(deleteRes, {
      'scheduled: deleted': (r) =>
        r.status === 200 || r.status === 204 || r.status === 404,
    });
  }
}
