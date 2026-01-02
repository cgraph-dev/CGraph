# Development Session Log

Record of major changes made during development sprints.

---

## January 2026 Sprint (v0.6.0)

### Major Features Added

| Feature | Files Created | Description |
|---------|--------------|-------------|
| **Email System** | `lib/cgraph/mailer.ex`, `lib/cgraph/mailer/templates.ex` | Enterprise email with templates |
| **Push Notifications** | `lib/cgraph/notifications/push_service.ex`, + 3 clients | APNs, FCM, Expo support |
| **Admin Dashboard** | `apps/web/src/pages/admin/AdminDashboard.tsx` | Full admin UI |
| **Admin API** | `apps/web/src/lib/api/admin.ts` | Type-safe admin client |

### Bug Fixes

- Fixed conversation channel passing string instead of struct to `list_messages/2`
- Fixed push notification worker crashing in test environment
- Fixed TypeScript ArrayBuffer type issues in E2EE modules
- Updated worker max_attempts configuration

### Documentation Updates

- Updated all package versions to 0.6.0
- Removed competitor name references from all docs
- Updated CHANGELOG with v0.6.0 features
- Updated README with new features list

### Test Status

| Suite | Result |
|-------|--------|
| Backend | 585 tests, 578 passing, 7 pre-existing failures |
| Web Build | Successful, no TypeScript errors |

---

## December 2025 Sprint

This session focused on two main areas:
1. UI polish with micro-interactions across web and mobile
2. Internal documentation and stability improvements

---

## UI Enhancements

### Web Components Enhanced

| Component | Changes |
|-----------|---------|
| `Button.tsx` | Scale on press (0.97), shadow lift, smooth transitions |
| `Loading.tsx` | Fade-in animation on mount |
| `Tooltip.tsx` | Fade-in animation for tooltip content |
| `Dropdown.tsx` | Scale-in animation with origin-top |
| `Switch.tsx` | Hover glow, focus ring, smooth toggle |
| `Tabs.tsx` | TabPanel fade-in when switching |
| `FileUpload.tsx` | Drag scale, preview fade-in |

### Web Pages Enhanced

| Page | Changes |
|------|---------|
| `Login.tsx` | Form fade-in, input focus animations, button polish |
| `Register.tsx` | Same as Login |
| `UserProfile.tsx` | Content fade-in, avatar hover scale |
| `Settings.tsx` | Nav slide-in, content fade animation |
| `CreatePost.tsx` | Form element stagger animation |
| `Forums.tsx` | Post list stagger animation |
| `ForumPost.tsx` | Content fade-in, smooth interactions |
| `Notifications.tsx` | Item stagger, hover lift effect |
| `Groups.tsx` | Server icon hover animations |
| `Search.tsx` | Input focus shadow effect |
| `Messages.tsx` | Various polish |
| `Friends.tsx` | List animations |
| `Conversation.tsx` | Message animations |

### Mobile Components Enhanced

| Component | Changes |
|-----------|---------|
| `Button.tsx` | Spring press animation (Reanimated) |
| `UserListItem.tsx` | Animated entrance with delay |

### Commits

1. `0b3b0b1` - feat: Add micro-interactions and polish to UI components
2. `ea6173a` - feat: Polish interactive components with refined animations
3. `aeaae42` - feat(mobile): Add spring press animation to Button component
4. `efcc329` - feat: Enhance Settings and CreatePost pages with animations

All pushed to main branch.

---

## Stability Improvements

### Database Backup Worker

Created `/apps/backend/lib/cgraph/workers/database_backup.ex`:

- Oban worker for automated PostgreSQL backups
- Runs daily at 3 AM by default
- Compresses backups with gzip
- Uploads to S3/R2 cloud storage
- Retention policy (keeps 30 daily, 12 weekly, 12 monthly by default)
- Health check integration

---

## Documentation Created

### PrivateFolder Documents

1. **01_DEVELOPER_OVERVIEW.md** - High-level app overview, tech stack, how things connect
2. **02_HOW_TO_START.md** - Step-by-step startup guide for all components
3. **03_BACKEND_EXPLAINED.md** - Deep dive into Elixir/Phoenix architecture
4. **04_FRONTEND_EXPLAINED.md** - React web app and React Native mobile patterns
5. **05_DATABASE_EXPLAINED.md** - PostgreSQL, Ecto, migrations, schemas
6. **06_UPGRADING_GUIDE.md** - How to upgrade each part of the stack
7. **07_LIMITATIONS_AND_SCALING.md** - Current limits and scaling strategies
8. **08_SESSION_LOG.md** - This file

---

## Files Changed (Not Yet Committed)

```
apps/backend/lib/cgraph/workers/database_backup.ex (new)
docs/PrivateFolder/01_DEVELOPER_OVERVIEW.md (new)
docs/PrivateFolder/02_HOW_TO_START.md (new)
docs/PrivateFolder/03_BACKEND_EXPLAINED.md (new)
docs/PrivateFolder/04_FRONTEND_EXPLAINED.md (new)
docs/PrivateFolder/05_DATABASE_EXPLAINED.md (new)
docs/PrivateFolder/06_UPGRADING_GUIDE.md (new)
docs/PrivateFolder/07_LIMITATIONS_AND_SCALING.md (new)
docs/PrivateFolder/08_SESSION_LOG.md (new)
```

---

## Test Status

- Backend: 220 tests, 0 failures
- Web: TypeScript compiles clean
- Mobile: TypeScript compiles clean

---

*Created: December 31, 2025*

---

# Development Session - OTP 28.3 Upgrade (January 2025)

## Summary

Major runtime upgrade to latest stable Erlang/OTP and Elixir versions.

## Changes Made

### Runtime Upgrade

| Component | Before | After |
|-----------|--------|-------|
| Erlang/OTP | 25.x | 28.3 (erts-16.2) |
| Elixir | 1.14.x | 1.19.4-otp-28 |
| Phoenix | 1.7.21 | 1.8.3 |
| Phoenix LiveView | 0.20.17 | 1.1.19 |
| Phoenix LiveDashboard | 0.8.5 | 0.8.7 |
| Sentry | 10.x | 11.0.4 |
| Cachex | 3.6 | 4.1.1 |
| Bandit | 1.6.7 | 1.10.0 |
| Swoosh | 1.18.3 | 1.20.0 |
| Oban | 2.19.0 | 2.20.2 |

### Installation Method

Used `asdf` version manager for reproducible builds:

```bash
# Install asdf
git clone https://github.com/asdf-vm/asdf.git ~/.asdf --branch v0.15.0

# Build OTP from source (~10 min)
asdf plugin add erlang
asdf install erlang 28.3

# Install precompiled Elixir
asdf plugin add elixir
asdf install elixir 1.19.4-otp-28

# Set project versions
asdf local erlang 28.3
asdf local elixir 1.19.4-otp-28
```

### Files Created

- `/.tool-versions` - Root asdf config
- `/apps/backend/.tool-versions` - Backend asdf config

### Deprecation Fixes

| File | Change |
|------|--------|
| `database_backup.ex` | `Logger.warn` → `Logger.warning` |
| `jobs.ex` | `Logger.warn` → `Logger.warning` |
| `connection_pool.ex` | `Logger.warn` → `Logger.warning` |
| `forums.ex` | Renamed duplicate `vote_post/3` → `vote_post_by_id/3` |
| `post_json.ex` | Removed duplicate `render_flair/1` clause |
| `role_controller.ex` | Removed duplicate `extract_role_params/1` clause |
| `accounts.ex` | Prefixed unused `token` variable |
| `messaging.ex` | Prefixed unused `creator` and `thread` variables |

### mix.exs Changes

```elixir
# New Elixir version requirement
defp elixir_version, do: "~> 1.19"

# Added def cli() for Elixir 1.19 pattern
def cli do
  [preferred_envs: [test: :test, "test.watch": :test]]
end

# Removed jose override (OTP 28 compatible now)
```

### Documentation Updated

- `ARCHITECTURE.md` - Version table updated
- `README.md` - Prerequisites updated
- `QUICKSTART.md` - Installation commands updated
- `PrivateFolder/01_DEVELOPER_OVERVIEW.md` - Stack info updated
- `PrivateFolder/02_HOW_TO_START.md` - Install guides updated
- `PrivateFolder/06_UPGRADING_GUIDE.md` - Version table updated

## Git Commit

```
commit d866d15
Author: CGraph Dev
Date: January 2025

feat: Upgrade to Erlang/OTP 28.3 and Elixir 1.19.4

- Installed asdf version manager for reproducible builds
- Upgraded Erlang/OTP from 25.x to 28.3 (latest stable)
- Upgraded Elixir from 1.14.x to 1.19.4 (latest stable)
- Updated all Phoenix and Ecto dependencies to latest versions
- Fixed all deprecation warnings (Logger.warn, duplicate clauses)
- All 220 tests passing
```

## Test Status

- Backend: 220 tests, 0 failures, 1 skipped
- Compilation: 0 warnings (from app code)
- Remaining warnings: External deps (Timex, SweetXml, Waffle, Tesla)

## Performance Notes

OTP 28.3 includes improved JIT compilation which provides:
- Faster cold start times
- Better pattern matching performance
- Improved binary handling
- Enhanced process scheduling

---

*Updated: January 2025*

---

## December 31, 2025 - App Store Compliance Session

### Overview

Completed authentication flow and GDPR compliance features for Google Play and App Store submission.

### Authentication Flow Fixes

| Issue | Resolution |
|-------|------------|
| Mobile register missing `password_confirmation` | Added to AuthContext.tsx |
| Token refresh expecting wrong response format | Fixed to use `tokens.access_token` |
| Missing logout endpoint | Added POST `/api/v1/auth/logout` |
| Missing email verification | Added verify-email, resend-verification endpoints |

### New Endpoints Added

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/auth/logout` | POST | Revoke current session (authenticated) |
| `/api/v1/auth/verify-email` | GET | Verify email with token |
| `/api/v1/auth/resend-verification` | POST | Resend verification email (rate limited) |
| `/api/v1/me/export` | POST | Request GDPR data export |

### Backend Changes

1. **Auth Controller** (`auth_controller.ex`)
   - Added `logout/2` - revokes session, clears cookies
   - Added `verify_email/2` - validates token, marks email verified
   - Added `resend_verification/2` - 60-second rate limit

2. **User Controller** (`user_controller.ex`)
   - Added `request_data_export/2` - GDPR data export request

3. **Accounts Module** (`accounts.ex`)
   - Added `send_verification_email/1`
   - Added `verify_email_token/1`
   - Added `resend_verification_email/1`
   - Added `generate_verification_token/1` (24h expiry, Cachex storage)

4. **DataExport Module** (`data_export.ex`)
   - Fixed Audit.log calls (4-argument format)
   - Added to Application supervisor

5. **Router** (`router.ex`)
   - Added new auth and user routes

6. **Workers** (`send_email_notification.ex`)
   - Added support for verification email type

### Frontend Changes

1. **Mobile** (`AuthContext.tsx`, `api.ts`)
   - Fixed `password_confirmation` in register
   - Fixed token refresh response handling
   - Logout calls backend endpoint

2. **Web** (`authStore.ts`)
   - Fixed `password_confirmation` in register
   - Fixed token refresh response handling
   - Added `resendVerificationEmail` function

### Tests Added

- Auth controller: logout, resend-verification
- User controller: data export

### Documentation Updated

- `API.md` - Added new endpoints documentation
- Privacy and Terms pages already exist in `/apps/web/public/`

### Git Commits

1. `c1aef31` - feat: Complete authentication flow with email verification
2. `9ea06c2` - feat: Add GDPR data export endpoint for app store compliance

### Test Status

- Backend: **255 tests, 0 failures**, 1 skipped
- Web TypeScript: Compiles clean
- Mobile TypeScript: Compiles clean

### App Store Compliance Checklist

- [x] User registration with email verification
- [x] Secure logout endpoint
- [x] Account deletion (30-day grace period)
- [x] GDPR data export
- [x] Privacy Policy page
- [x] Terms of Service page
- [x] Secure token storage (SecureStore on mobile)

---

*Updated: December 31, 2025*
