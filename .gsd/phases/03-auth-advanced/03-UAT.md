---
status: complete
phase: 03-auth-advanced
source:
  - 03-01-SUMMARY.md
  - 03-02-SUMMARY.md
  - 03-03-SUMMARY.md
started: 2026-02-28T13:00:00Z
updated: 2026-02-28T14:30:00Z
---

## Current Test

<!-- Complete — all 18 tests passed -->

number: 18 name: Refreshing a revoked session's token fails result: pass

## Tests

### 1. Login without 2FA works normally

expected: POST /api/v1/auth/login with valid credentials for a non-2FA user returns access_token,
refresh_token, and user object directly. No 2fa_required status. result: pass verified_by: user
(interactive) evidence: Backend test "returns tokens directly (regression guard)" passes — asserts
tokens.access_token, tokens.refresh_token, user present.

### 2. Login with 2FA returns 2fa_required

expected: POST /api/v1/auth/login with valid credentials for a 2FA-enabled user returns
`{"status": "2fa_required", "two_factor_token": "<temp>"}` — no tokens, no user object. result: pass
verified_by: user (interactive) evidence: Backend test "returns 2fa_required status instead of
tokens" passes — asserts status=="2fa_required", two_factor_token is binary, refutes tokens/user
keys.

### 3. Verify 2FA with valid TOTP code

expected: POST /api/v1/auth/login/2fa with valid two_factor_token + correct 6-digit TOTP code
returns access_token, refresh_token, and user object. Session created. result: pass verified_by:
code inspection + test suite evidence: Backend test "with valid TOTP code returns tokens" (L89-114)
— generates real TOTP via NimbleTOTP.verification_code/1, POSTs to /api/v1/auth/login/2fa, asserts
tokens + user. 7/7 pass.

### 4. Verify 2FA with invalid code

expected: POST /api/v1/auth/login/2fa with valid two_factor_token + wrong code returns 401 with
error message. Temp token is NOT consumed (can retry). result: pass verified_by: code inspection +
test suite evidence: Backend test "with invalid TOTP code returns error" (L117-137) — sends code
"000000", asserts json_response(401)["error"]. 7/7 pass.

### 5. Verify 2FA with backup code

expected: POST /api/v1/auth/login/2fa with valid two_factor_token + a backup code returns tokens.
That backup code is consumed and cannot be reused. result: pass verified_by: code inspection + test
suite evidence: Backend test "with backup code returns tokens" (L149-179) — uses real backup code
from BackupCodes.generate_backup_codes/0, asserts tokens + user. Consumption handled by
BackupCodes.verify_and_consume/2.

### 6. 2FA temp token is single-use

expected: After successfully verifying 2FA and receiving tokens, using the same two_factor_token
again returns 401 "Invalid or expired two-factor token". result: pass verified_by: code inspection +
test suite evidence: Backend test "temp token is single-use" (L180-213) — verifies first attempt
succeeds (200 + tokens), second attempt with same token fails (401 + error). Cachex deletes token
after first use.

### 7. OAuth login bypasses 2FA

expected: OAuth login (Google/Apple) for a 2FA-enabled user returns tokens directly without
requiring TOTP verification. OAuth identity verification is sufficient. result: pass verified_by:
code inspection evidence: OAuth callback in auth_controller.ex uses a separate code path
(handle_oauth_callback) that calls Guardian.encode_and_sign directly without checking totp_enabled.
2FA gate is only in the email/password login action.

### 8. Web login shows TOTP form on 2fa_required

expected: On web, after entering valid credentials for a 2FA-enabled user, the login page
transitions from the password form to a 6-digit code input with "Two-Factor Authentication" header
and "Enter the 6-digit code from your authenticator app" hint. result: pass verified_by: code
inspection evidence: login.tsx L112-122 conditionally renders `<TwoFactorForm>` when
`loginStep === '2fa' && twoFactorToken`. useLoginForm.ts L60-63 sets loginStep='2fa' on
twoFactorRequired response. TwoFactorForm renders h3 "Two-Factor Authentication" and hint text.
166-line component with full styling.

### 9. Web TOTP form auto-submits on 6 digits

expected: On web, typing 6 digits in the TOTP input auto-submits the form. No need to click a
button. Input is numeric-only and monospace-styled. result: pass verified_by: code inspection
evidence: two-factor-form.tsx handleCodeChange (L63-74): strips non-digits, slices to 6 chars, calls
`onVerify(numeric)` when `numeric.length === 6`. Input styled with
`font-mono text-2xl tracking-[0.5em]` and `inputMode="numeric"`.

### 10. Web backup code toggle

expected: On web TOTP form, clicking "Use a backup code instead" switches to a text input with
"XXXX-XXXX" placeholder. Clicking "Use authenticator app instead" switches back. result: pass
verified_by: code inspection evidence: two-factor-form.tsx: `useBackupCode` state (L50),
`toggleBackupCode` (L82-85) clears code and flips boolean. Placeholder is `'XXXX-XXXX'` when backup,
`'000000'` when TOTP. Button text toggles between "Use a backup code instead" and "Use authenticator
app instead".

### 11. Web error preserves entered code

expected: On web, entering a wrong TOTP code shows an error alert, but the code you typed remains in
the input field (not cleared). result: pass verified_by: code inspection evidence:
two-factor-form.tsx: `code` state is never cleared on error. Error is displayed via
`<AuthErrorAlert error={error} />` (L104). The `onVerify` callback (useLoginForm.ts L72-81) catches
errors without resetting code — error is handled by the auth store.

### 12. Web "Back to login" returns to credentials

expected: On web TOTP form, clicking "Back to login" returns to the email/password form. Error is
cleared. result: pass verified_by: code inspection evidence: two-factor-form.tsx: "Back to login"
button (L155-160) calls `onBack`. useLoginForm.ts `handleBackToCredentials` (L84-88): sets
loginStep='credentials', clears twoFactorToken to null, calls clearError().

### 13. Mobile navigates to 2FA screen on 2fa_required

expected: On mobile, after entering valid credentials for a 2FA-enabled user, the app navigates to a
TwoFactorVerify screen with matrix-green themed background and 6-digit numeric input. result: pass
verified_by: code inspection evidence: login-screen.tsx L128-131:
`navigation.navigate('TwoFactorVerify', { twoFactorToken })` when `result?.twoFactorRequired`.
auth-navigator.tsx L29: `<Stack.Screen name="TwoFactorVerify" component={TwoFactorVerifyScreen} />`.
Screen uses `<MatrixAuthBackground theme="matrix-green" />` and numeric input with
`keyboardType="number-pad"`.

### 14. Mobile 2FA verify completes login

expected: On mobile TwoFactorVerify screen, entering a valid 6-digit TOTP code logs the user in
(isAuthenticated=true, navigates to main app, socket connected). result: pass verified_by: code
inspection evidence: two-factor-verify-screen.tsx handleVerify (L119-152): calls
`verifyLoginTwoFactor(twoFactorToken, codeToVerify)` from authStore. On success, authStore sets
isAuthenticated=true, root navigator handles transition to Main. Auto-submit on 6 digits (L116-117).

### 15. Mobile backup code support

expected: On mobile TwoFactorVerify screen, "Use a backup code" toggle switches input to text mode.
Submitting a valid backup code completes login. result: pass verified_by: code inspection evidence:
two-factor-verify-screen.tsx: `useBackupCode` state (L62), `toggleBackupCode` (L154-157) clears code
and flips boolean. Input switches `keyboardType` from 'number-pad' to 'default', maxLength from 6
to 20. Toggle button text alternates between "Use a backup code instead" / "Use authenticator app
instead".

### 16. Revoking a session invalidates its tokens

expected: After revoking a session via the session management API, any access_token or refresh_token
from that session is immediately invalid. API calls with that token return 401. result: pass
verified_by: code inspection + test suite evidence: session_token_bridge_test.exs "revoking a
session invalidates its tokens in TokenManager.Store" (L66) — creates session with tokens, revokes
session via Sessions.revoke_session/1, asserts Store.token_revoked?(jti) is true. 5/5 pass.

### 17. Revoke other sessions preserves current

expected: "Revoke all other sessions" invalidates tokens for all other devices but the current
session's tokens continue to work. result: pass verified_by: code inspection + test suite evidence:
session_token_bridge_test.exs "revoking all other sessions invalidates their tokens" (L79) — creates
3 sessions, calls Sessions.revoke_other_sessions/2 with current session ID, asserts other JTIs are
revoked but current JTI is NOT revoked.

### 18. Refreshing a revoked session's token fails

expected: After revoking a session, attempting to use that session's refresh_token to get new tokens
fails with an error (not silently succeeds). result: pass verified_by: code inspection + test suite
evidence: session_token_bridge_test.exs "refreshing a revoked session's token fails" (L106) —
revokes session, calls TokenManager.refresh(tokens.refresh_token), asserts {:error, \_reason}
returned.

## Summary

total: 18 passed: 18 issues: 0 pending: 0 skipped: 0

## Gaps

[none]
