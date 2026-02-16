# CGraph Troubleshooting Guide

> Solutions for common issues when developing and deploying CGraph

**Version:** 0.9.4 | **Last Updated:** January 2026

---

## 📋 Quick Diagnostics

Before diving into specific issues, run these diagnostic commands:

```bash
# Check Node.js version (requires 18+)
node --version

# Check pnpm version
pnpm --version

# Check Elixir version (requires 1.17+)
elixir --version

# Check if services are running
docker ps

# Check for port conflicts
lsof -i :3000   # Web frontend
lsof -i :4000   # Backend API
lsof -i :5432   # PostgreSQL
```

---

## 🌐 Web Frontend Issues

### Build Fails with TypeScript Errors

**Symptom:** `pnpm build` fails with type errors

**Solutions:**

1. **Clear TypeScript cache:**

   ```bash
   cd apps/web
   rm -rf node_modules/.cache
   rm -rf dist
   pnpm install
   pnpm build
   ```

2. **Check for missing types:**

   ```bash
   pnpm add -D @types/node @types/react @types/react-dom
   ```

3. **Regenerate lock file:**
   ```bash
   rm pnpm-lock.yaml
   pnpm install
   ```

### ESLint Warnings in Development

**Symptom:** Many ESLint warnings during development

**Solutions:**

1. **Update ESLint config for development:**

   ```javascript
   // eslint.config.js - already configured to suppress non-critical warnings
   ```

2. **Run targeted lint fix:**
   ```bash
   pnpm lint --fix
   ```

### Vite Hot Reload Not Working

**Symptom:** Changes don't reflect without manual refresh

**Solutions:**

1. **Check Vite config:**

   ```javascript
   // vite.config.ts
   export default defineConfig({
     server: {
       watch: {
         usePolling: true, // Required for Docker/WSL
       },
     },
   });
   ```

2. **Clear Vite cache:**

   ```bash
   rm -rf node_modules/.vite
   pnpm dev
   ```

3. **Check for circular imports:**
   ```bash
   npx madge --circular src/
   ```

### WebSocket Connection Failed

**Symptom:** Real-time features not working, socket connection errors

**Solutions:**

1. **Verify backend is running:**

   ```bash
   curl http://localhost:4000/api/v1/health
   ```

2. **Check CORS configuration:**

   ```elixir
   # config/config.exs
   config :cors_plug,
     origin: ["http://localhost:3000", "https://your-domain.com"]
   ```

3. **Verify WebSocket URL:**
   ```typescript
   // Check environment variable
   console.log(import.meta.env.VITE_WS_URL);
   ```

---

## 🔧 Backend Issues

### Database Connection Failed

**Symptom:** `(DBConnection.ConnectionError) connection refused`

**Solutions:**

1. **Start PostgreSQL:**

   ```bash
   docker-compose up -d postgres
   ```

2. **Verify connection settings:**

   ```bash
   # Check DATABASE_URL
   echo $DATABASE_URL

   # Test connection
   psql $DATABASE_URL -c "SELECT 1"
   ```

3. **Reset database:**
   ```bash
   cd apps/backend
   mix ecto.reset
   ```

### Mix Dependencies Won't Compile

**Symptom:** Compilation errors in dependencies

**Solutions:**

1. **Clean and recompile:**

   ```bash
   cd apps/backend
   rm -rf _build deps
   mix deps.get
   mix deps.compile
   ```

2. **Check Erlang/OTP version:**

   ```bash
   # Requires OTP 26+
   elixir --version
   ```

3. **Force recompile specific dep:**
   ```bash
   mix deps.compile jason --force
   ```

### Migrations Failed

**Symptom:** Migration errors or database schema issues

**Solutions:**

1. **Check migration status:**

   ```bash
   mix ecto.migrations
   ```

2. **Rollback and re-run:**

   ```bash
   mix ecto.rollback --step 1
   mix ecto.migrate
   ```

3. **Force migration in production (Fly.io):**
   ```bash
   flyctl ssh console -a cgraph-backend -C "/app/bin/cgraph eval 'CGraph.Release.migrate()'"
   ```

### Phoenix Server Won't Start

**Symptom:** Server crashes on startup

**Solutions:**

1. **Check for port conflicts:**

   ```bash
   lsof -i :4000
   kill -9 <PID>
   ```

2. **Verify config:**

   ```bash
   mix phx.server
   # Check error output for config issues
   ```

3. **Check required env vars:**
   ```bash
   echo $SECRET_KEY_BASE
   echo $DATABASE_URL
   ```

---

## 📱 Mobile App Issues

### Expo Build Failures

**Symptom:** `expo build` or `eas build` fails

**Solutions:**

1. **Clear Expo cache:**

   ```bash
   cd apps/mobile
   npx expo start --clear
   ```

2. **Update Expo SDK:**

   ```bash
   npx expo upgrade
   ```

3. **Check app.json configuration:**
   ```json
   {
     "expo": {
       "sdkVersion": "52.0.0",
       "ios": { "bundleIdentifier": "com.cgraph.app" },
       "android": { "package": "com.cgraph.app" }
     }
   }
   ```

### Metro Bundler Crashes

**Symptom:** Metro crashes with memory errors

**Solutions:**

1. **Increase Node memory:**

   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" npx expo start
   ```

2. **Clear Metro cache:**

   ```bash
   npx expo start --clear
   # Or manually:
   rm -rf node_modules/.cache/metro
   ```

3. **Reset watchman:**
   ```bash
   watchman watch-del-all
   ```

### App Crashes on Launch

**Symptom:** App crashes immediately after opening

**Solutions:**

1. **Check logs:**

   ```bash
   # iOS Simulator
   npx expo run:ios --device

   # Android
   adb logcat | grep ReactNative
   ```

2. **Verify environment:**

   ```typescript
   // Check API URL is set
   console.log(process.env.EXPO_PUBLIC_API_URL);
   ```

3. **Clear app data:**
   - iOS: Delete app, reinstall
   - Android: Settings > Apps > CGraph > Clear Data

---

## 🚀 Deployment Issues

### Vercel Deployment Failed

**Symptom:** Vercel build fails or app doesn't load

**Solutions:**

1. **Check build logs in Vercel dashboard**

2. **Verify vercel.json:**

   ```json
   {
     "buildCommand": "cd apps/web && pnpm build",
     "outputDirectory": "apps/web/dist",
     "framework": "vite"
   }
   ```

3. **Check environment variables in Vercel:**
   - `VITE_API_URL`
   - `VITE_WS_URL`

### Fly.io Deployment Failed

**Symptom:** `flyctl deploy` fails

**Solutions:**

1. **Check Fly.io logs:**

   ```bash
   flyctl logs -a cgraph-backend --no-tail
   ```

2. **Verify secrets are set:**

   ```bash
   flyctl secrets list -a cgraph-backend
   ```

3. **Rebuild from scratch:**

   ```bash
   flyctl deploy --remote-only --no-cache -a cgraph-backend
   ```

4. **Check Dockerfile:**
   ```bash
   # Ensure Dockerfile is valid
   docker build -t test-build apps/backend/
   ```

### SSL/HTTPS Issues

**Symptom:** Mixed content errors, SSL warnings

**Solutions:**

1. **Force HTTPS in production:**

   ```elixir
   # config/runtime.exs
   config :cgraph, CGraphWeb.Endpoint,
     force_ssl: [rewrite_on: [:x_forwarded_proto]]
   ```

2. **Update frontend API URLs:**
   ```typescript
   // Use https:// and wss:// in production
   const API_URL = import.meta.env.VITE_API_URL; // https://cgraph-backend.fly.dev
   const WS_URL = import.meta.env.VITE_WS_URL; // wss://cgraph-backend.fly.dev
   ```

---

## 🔐 Authentication Issues

### JWT Token Invalid

**Symptom:** 401 errors, token validation fails

**Solutions:**

1. **Check token expiration:**

   ```typescript
   import { jwtDecode } from 'jwt-decode';
   const decoded = jwtDecode(token);
   console.log('Expires:', new Date(decoded.exp * 1000));
   ```

2. **Verify SECRET_KEY_BASE matches:**

   ```bash
   # Frontend and backend must use same secret for JWT
   flyctl secrets list -a cgraph-backend | grep SECRET_KEY_BASE
   ```

3. **Clear stored tokens:**
   ```typescript
   localStorage.removeItem('auth_token');
   sessionStorage.clear();
   ```

### OAuth Login Failed

**Symptom:** OAuth redirects fail or return errors

**Solutions:**

1. **Verify callback URLs in provider settings:**
   - Google: `https://your-domain.com/auth/google/callback`
   - Apple: `https://your-domain.com/auth/apple/callback`

2. **Check client ID/secret:**

   ```bash
   flyctl secrets list | grep GOOGLE
   ```

3. **Test locally with ngrok:**
   ```bash
   ngrok http 4000
   # Update OAuth callback URLs to ngrok URL
   ```

---

## 💾 Database Issues

### Slow Queries

**Symptom:** Pages load slowly, timeouts

**Solutions:**

1. **Check slow queries:**

   ```sql
   SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;
   ```

2. **Add missing indexes:**

   ```elixir
   # Create migration
   def change do
     create index(:posts, [:user_id])
     create index(:posts, [:forum_id, :inserted_at])
   end
   ```

3. **Analyze query plans:**
   ```sql
   EXPLAIN ANALYZE SELECT * FROM posts WHERE user_id = 'xxx';
   ```

### Connection Pool Exhausted

**Symptom:** `(DBConnection.ConnectionError) connection not available`

**Solutions:**

1. **Increase pool size:**

   ```elixir
   # config/runtime.exs
   config :cgraph, CGraph.Repo,
     pool_size: String.to_integer(System.get_env("POOL_SIZE") || "20")
   ```

2. **Check for connection leaks:**
   ```elixir
   # Log connection usage
   Logger.info("Repo pool: #{inspect(:poolboy.status(CGraph.Repo.Pool))}")
   ```

---

## 🔍 Debugging Tips

### Enable Verbose Logging

```elixir
# config/dev.exs
config :logger, level: :debug

# For specific module
config :logger, :console,
  metadata: [:request_id, :user_id]
```

### Frontend Debug Mode

```typescript
// Enable React Query devtools
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// In App.tsx
<ReactQueryDevtools initialIsOpen={false} />
```

### Network Debugging

```bash
# Monitor WebSocket connections
wscat -c wss://cgraph-backend.fly.dev/socket/websocket

# Test API endpoints
curl -v https://cgraph-backend.fly.dev/api/v1/health

# Check response headers
curl -I https://cgraph-web-v2.vercel.app
```

---

## 🆘 Getting Help

1. **Search existing issues:** [GitHub Issues](https://github.com/cgraph/cgraph/issues)
2. **Join CGraph:** [CGraph Community](https://discord.gg/cgraph)
3. **Check documentation:** [docs/](../README.md)
4. **Create detailed bug report** with:
   - Environment (OS, Node version, browser)
   - Steps to reproduce
   - Expected vs actual behavior
   - Error logs/screenshots

---

_Last updated: January 2026_
