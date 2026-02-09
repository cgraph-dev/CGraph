/**
 * k6 Stress Test — CGraph API
 *
 * Find breaking points under extreme load.
 * 500 VUs, 10 minutes. Runs monthly.
 *
 * Goal: Identify bottlenecks, measure max throughput,
 * find failure modes before users do.
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

const errorRate = new Rate('errors');
const requestsPerSec = new Counter('requests_per_second');
const peakLatency = new Trend('peak_latency', true);
const concurrentUsers = new Gauge('concurrent_users');

export const options = {
  stages: [
    { duration: '1m', target: 100 },    // Warm up
    { duration: '2m', target: 250 },     // Ramp to medium load
    { duration: '3m', target: 500 },     // Peak stress
    { duration: '2m', target: 250 },     // Step down
    { duration: '1m', target: 100 },     // Recovery check
    { duration: '1m', target: 0 },       // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],    // More lenient under stress
    errors: ['rate<0.05'],                // Allow 5% errors under extreme load
    http_req_failed: ['rate<0.10'],       // Hard fail at 10%
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://staging.cgraph.org';

export default function () {
  concurrentUsers.add(__VU);
  requestsPerSec.add(1);

  const scenario = __ITER % 5;

  switch (scenario) {
    case 0:
    case 1:
      // 40% — API health + readiness (lightweight)
      healthChecks();
      break;
    case 2:
      // 20% — Auth flow
      authFlow();
      break;
    case 3:
      // 20% — Search (typically DB-heavy)
      searchStress();
      break;
    case 4:
      // 20% — Forum browse (cache-heavy)
      forumStress();
      break;
  }
}

function healthChecks() {
  group('Health', () => {
    const start = Date.now();
    const res = http.get(`${BASE_URL}/health`);
    peakLatency.add(Date.now() - start);
    check(res, { 'health ok': (r) => r.status === 200 }) || errorRate.add(1);

    const readyRes = http.get(`${BASE_URL}/ready`);
    check(readyRes, { 'ready ok': (r) => r.status === 200 }) || errorRate.add(1);

    sleep(0.5);
  });
}

function authFlow() {
  group('Auth Stress', () => {
    const start = Date.now();
    const res = http.post(
      `${BASE_URL}/api/v1/auth/login`,
      JSON.stringify({
        email: `stress+${__VU}@cgraph.org`,
        password: 'stresstest123!',
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    peakLatency.add(Date.now() - start);

    check(res, {
      'auth: not 500': (r) => r.status !== 500,
      'auth: responded': (r) => r.status > 0,
    }) || errorRate.add(1);

    sleep(1);
  });
}

function searchStress() {
  group('Search Stress', () => {
    const queries = ['hello', 'test', 'user', 'message', 'group', 'forum',
                     'chat', 'dev', 'bug', 'feature', 'help', 'admin'];
    const q = queries[Math.floor(Math.random() * queries.length)];

    const start = Date.now();
    const res = http.get(`${BASE_URL}/api/v1/search?q=${q}&type=users&limit=50`);
    peakLatency.add(Date.now() - start);

    check(res, {
      'search: not 500': (r) => r.status !== 500,
    }) || errorRate.add(1);

    sleep(1);
  });
}

function forumStress() {
  group('Forum Stress', () => {
    const start = Date.now();
    const res = http.get(`${BASE_URL}/api/v1/groups`);
    peakLatency.add(Date.now() - start);

    check(res, {
      'groups: not 500': (r) => r.status !== 500,
    }) || errorRate.add(1);

    const discoverRes = http.get(`${BASE_URL}/api/v1/groups/discover`);
    check(discoverRes, {
      'discover: not 500': (r) => r.status !== 500,
    }) || errorRate.add(1);

    sleep(1);
  });
}

export function handleSummary(data) {
  // Summary output
  const summary = {
    timestamp: new Date().toISOString(),
    test: 'stress',
    duration_s: data.state.testRunDurationMs / 1000,
    vus_max: data.metrics.vus_max ? data.metrics.vus_max.values.max : 0,
    total_requests: data.metrics.http_reqs ? data.metrics.http_reqs.values.count : 0,
    rps_avg: data.metrics.http_reqs
      ? data.metrics.http_reqs.values.count / (data.state.testRunDurationMs / 1000)
      : 0,
    p95_ms: data.metrics.http_req_duration
      ? data.metrics.http_req_duration.values['p(95)']
      : 0,
    p99_ms: data.metrics.http_req_duration
      ? data.metrics.http_req_duration.values['p(99)']
      : 0,
    error_rate: data.metrics.errors ? data.metrics.errors.values.rate : 0,
  };

  return {
    stdout: `\n=== STRESS TEST SUMMARY ===\n${JSON.stringify(summary, null, 2)}\n`,
    'results/stress-test-results.json': JSON.stringify(data),
    'results/stress-test-summary.json': JSON.stringify(summary, null, 2),
  };
}
