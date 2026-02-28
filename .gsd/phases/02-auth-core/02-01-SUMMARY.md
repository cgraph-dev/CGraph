---
phase: 02-auth-core
plan: 01
subsystem: auth
tags: [elixir, phoenix, oban, swoosh, sessions, cachex]
requires:
  - phase: 01-infrastructure-baseline
    provides: "Clean backend with synced versions and healthy routes"
provides:
  - "Working password reset email delivery"
  - "Correct session field mapping (token_hash, device_name, device_type)"
  - "Clean Accounts context without redundant modules"
affects: [02-auth-core, 03-auth-advanced]
tech-stack:
  added: []
  patterns: ["Oban worker for async email delivery"]
key-files:
  created: []
  modified:
    - apps/backend/lib/cgraph/accounts/password_reset.ex
    - apps/backend/lib/cgraph/accounts/sessions.ex
  deleted:
    - apps/backend/lib/cgraph/accounts/authentication.ex
key-decisions:
  - "Used Orchestrator.enqueue pattern (matching EmailVerification) rather than direct Mailer call for password reset emails"
  - "Sessions.create_session now returns {ok, session, raw_token} tuple so callers get the raw token while only the hash is persisted"
  - "Used Ecto.Changeset.change/2 for touch_session and revoke_session since revoked_at and last_active_at are not in Session.changeset cast list"
patterns-established:
  - "Pattern: all session tokens are hashed with :crypto.hash(:sha256, token) |> Base.encode64() before storage — never store raw tokens"
  - "Pattern: async email delivery via Orchestrator.enqueue(SendEmailNotification, %{...}) for all transactional emails"
duration: 8min
completed: 2026-02-28
---

# Phase 02-01: Backend Auth Fixes Summary

**Wired password reset emails, fixed session field mappings, and removed dead Authentication module — backend auth primitives now function correctly.**

## Performance
- Duration: ~8 minutes
- Tasks: 3/3 completed
- Files modified: 2, Files deleted: 1

## Accomplishments
- Password reset flow now actually sends emails via the Oban `SendEmailNotification` worker, following the same `Orchestrator.enqueue` pattern used by `EmailVerification`
- `Sessions.create_session/2` now correctly hashes tokens to `token_hash`, maps device info to `device_name`/`device_type`, and sets `expires_at` (60 days)
- `Sessions.get_session/1` queries by `token_hash` instead of non-existent `token` field
- `touch_session/1` and `revoke_session/1` use `Ecto.Changeset.change/2` directly since `last_active_at` and `revoked_at` are not in the Session changeset cast list
- Redundant `Authentication` module deleted (214 lines) — no references existed; all auth operations already delegated to `Credentials`, `PasswordReset`, and `SessionManagement`

## Task Commits
1. Wire password reset email delivery — `4d1200fa`
2. Fix session field name mismatches — `49cf3501`
3. Remove redundant Authentication module — `c08848f3`

## Files Created/Modified
- **Modified:** `apps/backend/lib/cgraph/accounts/password_reset.ex` — added Orchestrator.enqueue call for email delivery
- **Modified:** `apps/backend/lib/cgraph/accounts/sessions.ex` — fixed field mappings, added token hashing, device type parsing
- **Deleted:** `apps/backend/lib/cgraph/accounts/authentication.ex` — redundant module with no references

## Decisions Made
- Used `Orchestrator.enqueue` pattern over direct `Mailer.deliver_password_reset_email/2` call for consistency with email verification and to get Oban retry/dedup benefits
- Changed `create_session` return to `{:ok, session, raw_token}` 3-tuple to separate the raw token (for client) from the persisted hash
- Used `Ecto.Changeset.change/2` instead of `Session.changeset` for `touch_session` and `revoke_session` because the Session changeset only casts insert-time fields

## Deviations from Plan
- Plan suggested 7-day session expiry; kept existing 60-day expiry to match `SessionManagement` module's `@session_token_validity_days 60` and avoid breaking existing sessions
- Added `parse_device_type/1` helper (not explicitly in plan) to populate the `device_type` schema field

## Issues Encountered
- Pre-existing `--warnings-as-errors` failures in unrelated files (QueryOptimizer, InputValidation) — not introduced by these changes
- 19 pre-existing test failures (all in Forums pagination) — none related to auth changes

## Next Phase Readiness
- Password reset email delivery is wired — ready for frontend integration in plan 02-02
- Session creation correctly maps all schema fields — ready for token refresh wiring in plan 02-03
- Accounts facade is clean with no dead delegations — clear foundation for advanced auth features
