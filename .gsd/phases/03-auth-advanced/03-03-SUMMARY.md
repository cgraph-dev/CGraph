---
phase: 03-auth-advanced
plan: 03
subsystem: auth
tags: [session-token-bridge, tdd, security, revocation]
duration: ~15 min
completed: 2026-02-28
---

# Plan 03-03 Summary: Session-Token Bridge (TDD)

Session revocation now cascades to TokenManager.Store, preventing revoked sessions from making
authenticated API requests via still-valid JWT tokens.

## Performance

| Metric         | Value  |
| -------------- | ------ |
| Duration       | ~15min |
| Tasks          | 3 / 3  |
| Files modified | 4      |
| Files created  | 1      |
| Tests added    | 5      |
| Tests passing  | 16/16  |

## Accomplishments

- **Session-token bridge**: `Sessions.revoke_session/1` and `SessionManagement.revoke_session/1` now
  revoke associated JWT tokens in `TokenManager.Store` after DB update
- **Multi-device logout**: `Sessions.revoke_other_sessions/2` revokes tokens for all other sessions
  while preserving the current session's tokens
- **Session-scoped token tracking**: `TokenManager.generate_tokens/2` accepts `session_id` opt,
  stored in token metadata for session-level lookups
- **Store API extensions**: `Store.get_session_token_jtis/1` and `Store.revoke_tokens_for_session/1`
  enable session-scoped token operations
- **Idempotent revocation**: Revoking a session with no tokens in Store succeeds gracefully
- **Security audit trail**: Structured `Logger.info` emitted on every session+token revocation with
  session_id, user_id, and tokens_revoked count
- **No circular dependencies**: Dependency is one-way (`Accounts.Sessions` →
  `Auth.TokenManager.Store`)

## Task Commits

| Task | Phase    | Commit     | Description                             |
| ---- | -------- | ---------- | --------------------------------------- |
| 1    | RED      | `58e649bb` | 5 failing integration tests             |
| 2    | GREEN    | `3b8e57aa` | Bridge implementation, all 5 tests pass |
| 3    | REFACTOR | `a912bde5` | Documentation + structured logging      |

## Files Created

- `apps/backend/test/cgraph/auth/session_token_bridge_test.exs` — 5 integration tests

## Files Modified

- `apps/backend/lib/cgraph/accounts/sessions.ex` — Bridge revoke_session + revoke_other_sessions to
  Store, structured logging
- `apps/backend/lib/cgraph/accounts/session_management.ex` — Bridge revoke_session to Store,
  structured logging
- `apps/backend/lib/cgraph/auth/token_manager/store.ex` — session-scoped tracking
  (get_session_token_jtis, revoke_tokens_for_session, session_id in store_refresh_token)
- `apps/backend/lib/cgraph/auth/token_manager.ex` — Accept session_id opt in generate_tokens, store
  in token metadata

## Decisions Made

1. **Session-token link via metadata**: Rather than adding a DB column/migration, session_id is
   stored in token metadata (ETS/Redis). Simpler, no migration needed, and the link is only needed
   for revocation lookups.
2. **Dual revocation (revoke_by_jti + mark_token_used)**: Token revocation both marks the JTI as
   revoked AND sets `used: true` so that both `token_revoked?` checks and `refresh` flow's
   `verify_not_used` reject the token.
3. **Pre-query for revoke_other_sessions**: We query session IDs before the bulk `update_all` so we
   can revoke their tokens individually. Slightly more queries but maintains session-level
   granularity.
4. **One-way dependency**: `Accounts.Sessions` depends on `Auth.TokenManager.Store`, not vice versa.
   No circular dependency risk.

## Deviations from Plan

1. **Path corrections**: Plan referenced `c_graph/auth/sessions.ex` but actual paths use
   `cgraph/accounts/sessions.ex` and `cgraph/accounts/session_management.ex`. Adjusted all
   references.
2. **Test 4 passes in RED**: The "revoking a session with no tokens succeeds" test passes even
   without the bridge because it only tests graceful DB operation. 4/5 fail in RED, which is the
   correct behavior.
3. **revoke_session_tokens helper**: Added a private helper to count revoked tokens for structured
   logging (not in plan but needed for accurate audit trail).

## Next Phase Readiness

Plan 03-03 is complete. The session-token bridge ensures that:

- Logging out invalidates tokens immediately
- "Log out other devices" works end-to-end
- No regression in existing auth flows (16/16 tests pass)

Ready for plan 03-02 (Frontend 2FA Login UI) once 03-01 completes.
