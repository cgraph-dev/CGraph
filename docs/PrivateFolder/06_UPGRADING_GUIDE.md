# Upgrading Guide

How to upgrade dependencies, frameworks, and the system itself.

---

## Version Management

Current versions (as of December 2025):

| Component | Version | Notes |
|-----------|---------|-------|
| Elixir | 1.15+ | Required |
| Erlang/OTP | 25+ | Required |
| Phoenix | 1.7.21 | Latest 1.7 |
| Ecto | 3.11+ | Latest 3.x |
| PostgreSQL | 14+ | Production uses 15 |
| Node.js | 18+ | LTS recommended |
| React | 18.x | Web frontend |
| React Native | 0.73 | Mobile |
| Expo | 50 | Mobile SDK |

---

## Elixir and OTP Upgrades

### Minor Version Upgrade (1.15.x → 1.15.y)

1. Update `.tool-versions` or similar:
   ```
   elixir 1.15.7
   erlang 26.2
   ```

2. Clean and reinstall:
   ```bash
   cd apps/backend
   rm -rf _build deps
   mix deps.get
   mix compile
   mix test
   ```

3. Verify everything works before committing.

### Major Version Upgrade (1.15 → 1.16)

1. Read the changelog: https://hexdocs.pm/elixir/changelog.html

2. Check for deprecations:
   ```bash
   mix compile --warnings-as-errors
   ```

3. Update any deprecated syntax or functions.

4. Run full test suite.

5. Test in staging before production.

---

## Phoenix Upgrades

### Patch Version (1.7.20 → 1.7.21)

1. Update `mix.exs`:
   ```elixir
   {:phoenix, "~> 1.7.21"}
   ```

2. Run:
   ```bash
   mix deps.update phoenix
   mix test
   ```

### Minor Version (1.7 → 1.8)

1. Read upgrade guide on phoenixframework.org

2. Update `mix.exs` with new version.

3. Check for:
   - Changed configuration options
   - New required dependencies
   - Deprecated modules

4. Run migration generator if needed:
   ```bash
   mix phx.new.ecto --dev
   ```

5. Compare generated files with yours.

---

## Ecto Upgrades

Ecto is usually backward compatible. Just:

```bash
mix deps.update ecto ecto_sql
mix test
```

Watch for:
- Query syntax changes
- New migration features
- Changed defaults

---

## Node.js Upgrades

### Update Node

1. Update `.nvmrc` or `.node-version`:
   ```
   v20.10.0
   ```

2. Install and use:
   ```bash
   nvm install
   nvm use
   ```

3. Clear node_modules:
   ```bash
   rm -rf node_modules
   pnpm install
   ```

4. Test everything:
   ```bash
   pnpm build
   pnpm test
   ```

---

## React Upgrades

### Patch Updates

```bash
cd apps/web
pnpm update react react-dom
pnpm build
pnpm test
```

### Major Version (18 → 19)

1. Read migration guide on reactjs.org

2. Update package.json:
   ```json
   "react": "^19.0.0",
   "react-dom": "^19.0.0"
   ```

3. Update types:
   ```json
   "@types/react": "^19.0.0",
   "@types/react-dom": "^19.0.0"
   ```

4. Install:
   ```bash
   pnpm install
   ```

5. Fix any breaking changes (usually minimal).

6. Test thoroughly.

---

## React Native / Expo Upgrades

### Expo SDK Upgrade

Expo has a dedicated upgrade command:

```bash
cd apps/mobile
npx expo upgrade
```

This will:
- Update expo and related packages
- Update React Native version
- Show any manual steps needed

### Manual React Native Upgrade

If not using Expo managed workflow:

1. Check upgrade helper: https://react-native-community.github.io/upgrade-helper/

2. Follow the diff and apply changes.

3. For iOS:
   ```bash
   cd ios
   pod install
   ```

4. Rebuild:
   ```bash
   pnpm ios
   pnpm android
   ```

---

## Database Upgrades

### PostgreSQL Minor Upgrade (14.x → 14.y)

Usually handled by your hosting provider or OS package manager.

```bash
sudo apt update
sudo apt upgrade postgresql-14
```

### PostgreSQL Major Upgrade (14 → 15)

1. Create full backup first:
   ```bash
   pg_dump -Fc cgraph_prod > backup_before_upgrade.dump
   ```

2. For hosted databases (RDS, Fly.io, etc.):
   - Use their upgrade process
   - Usually involves a maintenance window

3. For self-hosted:
   ```bash
   pg_upgrade --old-datadir=/var/lib/postgresql/14/main \
              --new-datadir=/var/lib/postgresql/15/main \
              --old-bindir=/usr/lib/postgresql/14/bin \
              --new-bindir=/usr/lib/postgresql/15/bin
   ```

4. Test thoroughly before switching production.

---

## Dependency Auditing

### Elixir

```bash
# Check for outdated deps
mix hex.outdated

# Update all deps
mix deps.update --all

# Or update specific dep
mix deps.update phoenix
```

### JavaScript

```bash
# Check outdated
pnpm outdated

# Update all (respecting semver)
pnpm update

# Update to latest (ignoring semver)
pnpm update --latest

# Security audit
pnpm audit
```

---

## Pre-Upgrade Checklist

Before any major upgrade:

1. **Backup everything**
   - Database dump
   - Git commit all changes
   - Tag current version

2. **Read changelogs**
   - Breaking changes
   - Deprecations
   - New features

3. **Check compatibility**
   - All dependencies work with new version
   - OS compatibility
   - Cloud provider support

4. **Test in staging**
   - Deploy to staging first
   - Run full test suite
   - Manual testing

5. **Plan rollback**
   - Know how to revert
   - Keep backup ready
   - Have previous deployment artifact

---

## Rolling Back

### Backend Rollback

```bash
# If using Fly.io
fly releases -a cgraph
fly deploy --image <previous-image>

# If using Docker
docker-compose down
docker-compose up -d --force-recreate
```

### Database Rollback

```bash
# Rollback last migration
mix ecto.rollback

# Rollback to specific version
mix ecto.rollback --to 20240101000000

# Full restore from backup
pg_restore -d cgraph_prod backup.dump
```

### Frontend Rollback

Usually just redeploy previous version:

```bash
# If using Vercel/Netlify
# Use dashboard to rollback to previous deployment

# If manual
git checkout v1.2.3
pnpm build
# deploy
```

---

## Upgrade Schedule

Recommended cadence:

| Type | Frequency | Notes |
|------|-----------|-------|
| Security patches | Immediately | Don't wait |
| Patch versions | Weekly | Low risk |
| Minor versions | Monthly | Test first |
| Major versions | Quarterly | Plan carefully |

---

## Keeping Up to Date

### Resources

- Elixir Forum: https://elixirforum.com
- Phoenix Blog: https://www.phoenixframework.org/blog
- React Blog: https://react.dev/blog
- Expo Blog: https://blog.expo.dev

### Dependabot / Renovate

Consider setting up automated dependency updates:

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "mix"
    directory: "/apps/backend"
    schedule:
      interval: "weekly"
    
  - package-ecosystem: "npm"
    directory: "/apps/web"
    schedule:
      interval: "weekly"
```

---

*Last updated: December 31, 2025*
