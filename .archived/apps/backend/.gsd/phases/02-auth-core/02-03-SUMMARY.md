---
phase: 02-auth-core
plan: 03
subsystem: auth
tags: [elixir, phoenix, guardian, jwt, token-rotation, tdd, theft-detection]
requires:
  - phase: 02-auth-core-01
    provides: 'Fixed session field mapping and clean Accounts facade'
provides:
  - 'Token refresh with rotation, family tracking, and theft detection'
  - 'All token generation (login, register, OAuth, wallet) uses TokenManager with Store tracking'
  - 'Comprehensive token refresh tests (11 cases)'
affects: [03-auth-advanced, 05-message-transport]
tech-stack:
  added: []
  patterns:
    [
      'Token rotation with family tracking',
      'TDD for security-critical code',
      'ETS-backed token store with Redis upgrade path',
    ]
key-files:
  created: ['apps/backend/test/cgraph/auth/token_refresh_test.exs']
  modified:
    - 'apps/backend/lib/cgraph_web/controllers/api/v1/auth_controller.ex'
    - 'apps/backend/lib/cgraph/guardian.ex'
    - 'apps/backend/lib/cgraph/auth/token_manager.ex'
    - 'apps/backend/lib/cgraph/application.ex'
    - 'apps/backend/lib/cgraph/oauth.ex'
key-decisions:
  - 'Guardian.build_claims preserves caller-provided JTI instead of always generating new — enables
    TokenManager to control JTI format'
  - 'TokenManager.refresh propagates family_id to maintain family chain — fixes theft detection that
    was broken by always creating new families'
  - 'All token generation entry points (register, login, wallet, OAuth) migrated to TokenManager —
    ensures all tokens are in Store for refresh'
  - 'Guardian.generate_tokens and Guardian.refresh_tokens marked @deprecated — gradual migration
    path'
patterns-established:
  - 'Pattern: Security-critical auth flows use TokenManager (family tracking, rotation, theft
    detection) not raw Guardian'
  - 'Pattern: TDD catches integration bugs — JTI mismatch and broken family propagation discovered
    during RED phase'
duration: 8min
completed: 2026-02-28
---

# Phase 02-03: Token Refresh Wiring Summary

**Wired TokenManager with rotation, family tracking, and theft detection into all auth flows,
replacing the simpler Guardian token generation. TDD caught two critical integration bugs.**

## Performance

- Token refresh test suite: 11 tests, 0.7s
- Full backend suite: 1888 tests, 56.7s — no new regressions (20 pre-existing failures unchanged)

## Accomplishments

1. **AuthController.refresh** now uses `TokenManager.refresh/2` with full rotation and theft
   detection
2. **All token generation** (register, login, wallet_verify, OAuth) uses
   `TokenManager.generate_tokens/2` so tokens are registered in the Store
3. **Token family propagation** fixed in `TokenManager.refresh/2` — refresh chains now share a
   family_id, making theft detection actually work
4. **Guardian.build_claims** preserves caller-provided JTI — enables TokenManager's custom JTI
   format to survive encoding
5. **Max sessions enforcement** properly evicts oldest sessions by marking tokens as used
6. **TokenManager added** to application supervision tree (ETS tables initialized on boot)
7. **11 comprehensive tests** covering rotation, theft detection, device fingerprinting, error
   cases, and max sessions

## Task Commits (TDD)

1. **RED**: Failing tests — `bcf8fdb4`
2. **GREEN**: Implementation — `73b49ce1`
3. **REFACTOR**: Cleanup + deprecations — `91ff578f`

## Files Created/Modified

| File                                                   | Action   | Purpose                                                                                                |
| ------------------------------------------------------ | -------- | ------------------------------------------------------------------------------------------------------ |
| `test/cgraph/auth/token_refresh_test.exs`              | Created  | 11 tests: rotation, theft detection, device fingerprint, error cases, max sessions                     |
| `lib/cgraph_web/controllers/api/v1/auth_controller.ex` | Modified | Refresh uses TokenManager; login/register/wallet use TokenManager.generate_tokens                      |
| `lib/cgraph/guardian.ex`                               | Modified | build_claims preserves existing JTI; generate_tokens and refresh_tokens deprecated                     |
| `lib/cgraph/auth/token_manager.ex`                     | Modified | Family propagation in refresh; max sessions marks evicted as used; family_id option in generate_tokens |
| `lib/cgraph/application.ex`                            | Modified | TokenManager added to supervision tree after SecuritySupervisor                                        |
| `lib/cgraph/oauth.ex`                                  | Modified | Both OAuth callback paths use TokenManager.generate_tokens                                             |

## Decisions Made

1. **Preserve caller JTI in Guardian.build_claims** — Without this, TokenManager's custom JTIs were
   overwritten during encode_and_sign, making Store lookups fail with :token_not_found. The fix is
   minimal: use existing JTI if present, otherwise generate.

2. **Propagate family_id during refresh** — The original TokenManager.refresh always created a new
   family via generate_tokens. This broke the core design: if family X tokens are rotated to get
   family Y tokens, revoking family X doesn't affect family Y tokens. Fixed by passing
   `family_id: stored_token.family_id` through refresh to generate_tokens.

3. **Migrate ALL token generation to TokenManager** — Initially only refresh was changed, but
   integration tests revealed that login-generated tokens (via Guardian.generate_tokens) weren't in
   the Store, causing immediate 401 on first refresh. All entry points now use TokenManager.

## Deviations from Plan

- **Scope expanded**: Plan only called for wiring refresh — but login/register/wallet/OAuth also
  needed migration to TokenManager.generate_tokens, otherwise no tokens would be in the Store for
  refresh lookups.
- **Two TokenManager bugs fixed**: Family propagation and max sessions eviction were broken in the
  existing (unused) TokenManager code. TDD revealed both.
- **OAuth module updated**: Not in original plan scope, but necessary for consistency —
  OAuth-generated tokens would have been un-refreshable.

## Issues Encountered

- **JTI mismatch**: Guardian.build_claims unconditionally generated new JTIs, overwriting
  TokenManager's custom JTIs. Fixed by preserving existing JTIs.
- **Family chain breaks**: TokenManager.refresh created new families on each refresh, preventing
  theft detection. Fixed by propagating family_id.
- **Pre-existing test failures**: 2 auth controller tests (logout, resend-verification) fail due to
  JSON response key mismatch (`["message"]` vs `["data"]["message"]`). These are pre-existing and
  unrelated.

## Next Phase Readiness

- Phase 02-auth-core plan 03 is complete
- Token refresh with rotation and theft detection is operational
- Frontend `httpClient.ts` mutex/queue is compatible — it sends refresh requests that now get
  properly rotated tokens
- Ready for phase transition to mark Phase 2 complete, or advance to Phase 3 (Auth Advanced: OAuth,
  2FA, session management)
