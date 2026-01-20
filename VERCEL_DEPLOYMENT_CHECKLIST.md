# CGraph Vercel Deployment Checklist

## Pre-Deployment Status ✅

| Check             | Status              |
| ----------------- | ------------------- |
| TypeScript Errors | 0 errors ✅         |
| Vite Build        | Passes in ~14.5s ✅ |
| GSAP Landing Page | 68.83 kB gzipped ✅ |
| Git Push          | Completed ✅        |

---

## Vercel Environment Variables (Required)

Set these in your Vercel project settings → Environment Variables:

```bash
# Required
VITE_API_URL=https://cgraph-backend.fly.dev
VITE_WS_URL=wss://cgraph-backend.fly.dev
VITE_APP_NAME=CGraph
VITE_APP_VERSION=1.0.0

# Optional - Feature Flags
VITE_AI_ENABLED=false
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_SENTRY=true

# Optional - Error Tracking (recommended for 10k+ users)
VITE_SENTRY_DSN=<your-sentry-dsn>
```

---

## Production Readiness for 10,000+ Users

### 1. Frontend (Vercel) ✅

- [x] **Security Headers** - CSP, X-Frame-Options, XSS Protection configured in vercel.json
- [x] **Asset Caching** - 1 year cache for static assets (js, css, assets/)
- [x] **No-Cache HTML** - index.html has no-cache for instant updates
- [x] **SPA Fallback** - Rewrites configured for client-side routing
- [x] **Code Splitting** - Manual chunks for React, GSAP, Framer Motion, etc.
- [x] **Error Boundary** - Global error boundary wraps entire app
- [x] **Source Maps** - Enabled for debugging production issues

### 2. Vercel Configuration ✅

- [x] **Region** - fra1 (Frankfurt) configured
- [x] **Framework** - Vite detected
- [x] **Build Command** - `pnpm turbo run build --filter=@cgraph/web`
- [x] **Output Directory** - `apps/web/dist`

### 3. Recommended Vercel Settings for Scale

In Vercel Dashboard → Project Settings:

1. **Speed Insights** - Enable for Core Web Vitals monitoring
2. **Analytics** - Enable for traffic insights
3. **Deployment Protection** - Enable for preview deployments
4. **Spend Management** - Set budget alerts

### 4. Backend Scaling (Fly.io) Recommendations

For 10,000 concurrent users, ensure:

```toml
# fly.toml recommendations
[http_service]
  internal_port = 4000
  force_https = true
  auto_stop_machines = false  # Keep warm for scale
  auto_start_machines = true
  min_machines_running = 2    # Minimum for redundancy

[[vm]]
  memory = "1gb"
  cpu_kind = "shared"
  cpus = 2
```

### 5. WebSocket Scaling

- Ensure Fly.io has sticky sessions enabled for WebSocket connections
- Consider Redis adapter for Socket.IO if horizontal scaling

---

## Post-Deployment Verification

Run these checks after deployment:

1. **Landing Page** - Visit https://your-domain.vercel.app
2. **Auth Flow** - Test login/register
3. **WebSocket** - Test real-time messaging
4. **API Proxy** - Verify /api/\* routes work
5. **Assets** - Check images/fonts load with caching headers
6. **Mobile** - Test responsive design
7. **Performance** - Run Lighthouse audit (target 90+ scores)

---

## Monitoring Setup

### Recommended Services

| Service          | Purpose               | Priority |
| ---------------- | --------------------- | -------- |
| Sentry           | Error tracking        | High     |
| Vercel Analytics | Traffic & performance | High     |
| Fly.io Metrics   | Backend monitoring    | High     |
| UptimeRobot      | Uptime monitoring     | Medium   |

---

## Rollback Plan

If issues occur after deployment:

1. **Vercel Dashboard** → Deployments → Select previous deployment → Promote to Production
2. Or use CLI: `vercel rollback`

---

## Load Testing Recommendations

Before expecting 10,000 users:

1. Run load test with tools like k6 or Artillery
2. Test WebSocket connection limits
3. Monitor Fly.io resource usage during load
4. Test database connection pooling

---

## Commit Summary

**Commit:** a6076c7  
**Message:** fix: resolve typescript errors for vercel deployment  
**Files Changed:** 60  
**Insertions:** 3,109  
**Deletions:** 2,351

---

_Last Updated: January 20, 2026_
