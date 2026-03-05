// k6/smoke.js — Quick health/readiness check
// Use this to verify the deployment is alive before running full load tests.

import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, smokeStages } from './config.js';

export const options = {
  stages: smokeStages,
  thresholds: {
    http_req_duration: ['p(95)<200'],
    http_req_failed: ['rate<0.01'],
  },
  tags: { scenario: 'smoke' },
};

export default function () {
  // GET /health
  const healthRes = http.get(`${BASE_URL}/health`, {
    tags: { name: 'GET /health' },
  });

  check(healthRes, {
    'health returns 200': (r) => r.status === 200,
    'health body ok': (r) => {
      try { return JSON.parse(r.body).status === 'ok'; }
      catch { return r.body.includes('ok'); }
    },
  });

  // GET /ready
  const readyRes = http.get(`${BASE_URL}/ready`, {
    tags: { name: 'GET /ready' },
  });

  check(readyRes, {
    'ready returns 200': (r) => r.status === 200,
  });

  // GET /metrics (Prometheus endpoint)
  const metricsRes = http.get(`${BASE_URL}/metrics`, {
    tags: { name: 'GET /metrics' },
  });

  check(metricsRes, {
    'metrics returns 200': (r) => r.status === 200,
  });

  sleep(1);
}
