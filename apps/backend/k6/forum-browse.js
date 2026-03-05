// k6/forum-browse.js — Forum and thread listing load test

import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, authHeaders, defaultThresholds, standardStages } from './config.js';

export const options = {
  stages: standardStages,
  thresholds: defaultThresholds,
  tags: { scenario: 'forum-browse' },
};

export default function () {
  const headers = authHeaders();

  // GET /api/v1/forums — list all forums
  const forumsRes = http.get(`${BASE_URL}/api/v1/forums`, {
    headers,
    tags: { name: 'GET /forums' },
  });

  check(forumsRes, {
    'forums returns 200': (r) => r.status === 200,
    'forums has data': (r) => {
      try { return Array.isArray(JSON.parse(r.body).data); }
      catch { return false; }
    },
  });

  // If forums returned, pick a random forum and browse its threads
  if (forumsRes.status === 200) {
    try {
      const forums = JSON.parse(forumsRes.body).data;
      if (forums.length > 0) {
        const forum = forums[Math.floor(Math.random() * forums.length)];

        // GET /api/v1/forums/:id/threads
        const threadsRes = http.get(`${BASE_URL}/api/v1/forums/${forum.id}/threads`, {
          headers,
          tags: { name: 'GET /forums/:id/threads' },
        });

        check(threadsRes, {
          'threads returns 200': (r) => r.status === 200,
          'threads has data': (r) => {
            try { return Array.isArray(JSON.parse(r.body).data); }
            catch { return false; }
          },
        });

        // If threads exist, view a random thread's posts
        const threads = JSON.parse(threadsRes.body).data;
        if (threads && threads.length > 0) {
          const thread = threads[Math.floor(Math.random() * threads.length)];

          const postsRes = http.get(`${BASE_URL}/api/v1/forums/${forum.id}/threads/${thread.id}/posts`, {
            headers,
            tags: { name: 'GET /forums/:id/threads/:id/posts' },
          });

          check(postsRes, {
            'posts returns 200': (r) => r.status === 200,
          });
        }
      }
    } catch (_) { /* ignore parse errors */ }
  }

  sleep(2 + Math.random() * 3);  // 2-5s think time (simulates reading)
}
