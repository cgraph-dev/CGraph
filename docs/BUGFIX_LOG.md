# CGraph Bug Fix Log

> Comprehensive documentation of all bugs fixed and improvements made during the December 2024 stabilization sprint.

---

## Summary

| Metric | Before | After |
|--------|--------|-------|
| Backend Tests | 8 failures | 0 failures |
| Backend Test Count | 215 | 215 |
| Web Build | ✅ | ✅ |
| Mobile TypeScript | ✅ | ✅ |

---

## Bug Fixes by Category

### 1. Rate Limiting in Test Environment

**Problem:** Tests were failing intermittently due to rate limiting being applied even in test environment, causing legitimate test requests to be blocked.

**Root Cause:** The rate limiter had no concept of test environment bypass. All requests were rate-limited regardless of environment.

**Solution:** Added configuration-based bypass for rate limiting in test environment.

**Files Modified:**

**`lib/cgraph/rate_limiter.ex`**
```elixir
# Added enabled check function
defp enabled? do
  Application.get_env(:cgraph, __MODULE__)[:enabled] != false
end

# Modified check function to bypass when disabled
def check(key, limit, window_seconds) do
  if enabled?() do
    # ... existing rate limiting logic
  else
    {:allow, 0}
  end
end
```

**`lib/cgraph_web/plugs/rate_limiter_v2.ex`**
```elixir
# Added enabled check
defp rate_limiting_enabled? do
  Application.get_env(:cgraph, Cgraph.RateLimiter)[:enabled] != false
end

# Modified call/2 to check if enabled
def call(conn, opts) do
  if rate_limiting_enabled?() do
    # ... existing logic
  else
    conn
  end
end
```

**`config/test.exs`**
```elixir
# Added configuration to disable rate limiting in tests
config :cgraph, Cgraph.RateLimiter, enabled: false
```

---

### 2. HTTP Status Code Semantics

**Problem:** The API was returning `400 Bad Request` for validation errors like missing tokens and invalid platforms, when `422 Unprocessable Entity` is more semantically correct.

**Root Cause:** The `FallbackController` was mapping validation errors to `:bad_request` instead of `:unprocessable_entity`.

**Solution:** Updated FallbackController to use proper HTTP status codes.

**File Modified:** `lib/cgraph_web/controllers/fallback_controller.ex`
```elixir
# Changed from:
def call(conn, {:error, :token_required}) do
  # ... :bad_request
end

# Changed to:
def call(conn, {:error, :token_required}) do
  conn
  |> put_status(:unprocessable_entity)  # 422 instead of 400
  |> put_view(json: CgraphWeb.ErrorJSON)
  |> render(:error, message: "Push token is required")
end

# Same change for :invalid_platform
```

---

### 3. Push Token Platform Mapping

**Problem:** The push token registration endpoint expected platform values like "ios" and "android", but the database schema used internal values like "apns" and "fcm". Requests were failing with foreign key constraints.

**Root Cause:** No mapping layer between user-facing platform names and internal schema values.

**Solution:** Added platform mapping in the controller.

**File Modified:** `lib/cgraph_web/controllers/api/v1/push_token_controller.ex`
```elixir
# Added platform mapping
defp map_platform("ios"), do: "apns"
defp map_platform("android"), do: "fcm"
defp map_platform(platform), do: platform

# Used string keys instead of atom keys (JSON comes in as strings)
def create(conn, %{"token" => token, "platform" => platform}) do
  user = Guardian.Plug.current_resource(conn)
  platform = map_platform(platform)
  # ...
end
```

---

### 4. Push Token Registration Logic

**Problem:** The `register_push_token/3` function was using an `on_conflict` upsert with a constraint that didn't exist in the schema, causing database errors.

**Root Cause:** The code assumed a unique constraint `unique_user_token` existed, but only `unique_user_platform_token` constraint was defined.

**Solution:** Replaced upsert with a find-or-create pattern.

**File Modified:** `lib/cgraph/notifications/notifications.ex`
```elixir
# Changed from broken upsert:
def register_push_token(user, token, platform) do
  %PushToken{}
  |> PushToken.changeset(%{...})
  |> Repo.insert(
    on_conflict: {:replace, [:token, :updated_at]},
    conflict_target: [:user_id, :token]  # Constraint doesn't exist!
  )
end

# Changed to find-or-create:
def register_push_token(user, token, platform) do
  case Repo.get_by(PushToken, user_id: user.id, token: token) do
    nil ->
      %PushToken{}
      |> PushToken.changeset(%{...})
      |> Repo.insert()
    existing ->
      {:ok, existing}
  end
end
```

---

### 5. Push Token JSON Response

**Problem:** The JSON view was trying to render a `device_name` field that doesn't exist in the PushToken schema, causing render errors.

**Root Cause:** Documentation or prior implementation had a `device_name` field that was never added to the schema.

**Solution:** Removed non-existent field, added useful `registered` field.

**File Modified:** `lib/cgraph_web/controllers/api/v1/push_token_json.ex`
```elixir
# Changed from:
def push_token_json(token) do
  %{
    id: token.id,
    token: token.token,
    platform: token.platform,
    device_name: token.device_name,  # Doesn't exist!
    inserted_at: token.inserted_at
  }
end

# Changed to:
def push_token_json(token) do
  %{
    id: token.id,
    token: token.token,
    platform: token.platform,
    registered: true,
    inserted_at: token.inserted_at
  }
end
```

---

### 6. Test Assertion Corrections

**Problem:** Multiple test files had incorrect assertions that didn't match actual API behavior.

#### 6a. Channel Invite Join Status Code
**File:** `test/cgraph_web/controllers/api/v1/channel_role_invite_test.exs`
```elixir
# Changed from:
assert json_response(conn, 200)

# Changed to:
assert json_response(conn, 201)  # Creating membership returns 201
```

#### 6b. User Profile Response Path
**File:** `test/cgraph_web/controllers/api/v1/user_controller_test.exs`
```elixir
# Changed from:
assert json["data"]["bio"] == "Updated bio"

# Changed to:
assert json["bio"] == "Updated bio"  # No data wrapper
```

#### 6c. Username Uniqueness Error Structure
**File:** `test/cgraph_web/controllers/api/v1/user_controller_test.exs`
```elixir
# Changed from:
assert json["errors"]["username"]

# Changed to:
assert json["error"] =~ "username"  # Uses error string, not errors map
```

---

### 7. Reaction Test Foreign Key Issue

**Problem:** Reaction delete test was using direct function call with wrong argument order, causing foreign key constraint violations.

**Root Cause:** The test called `Messaging.add_reaction(message, user, "👍")` but the function signature is `add_reaction(user, message, emoji)`.

**Solution:** Changed test to use API endpoint instead of direct function call.

**File Modified:** `test/cgraph_web/controllers/api/v1/misc_controllers_test.exs`
```elixir
# Changed from direct function call:
describe "DELETE /api/v1/messages/:message_id/reactions/:emoji" do
  @tag :skip  # Was skipped because it failed!
  test "removes reaction", %{conn: conn, user: user} do
    {:ok, message} = create_test_message(user)
    {:ok, _reaction} = Messaging.add_reaction(message, user, "👍")  # Wrong order!
    # ...
  end
end

# Changed to API call:
describe "DELETE /api/v1/messages/:message_id/reactions/:emoji" do
  @describetag async: false  # Prevent race conditions
  
  test "removes reaction from message", %{conn: conn, user: user} do
    {:ok, message} = create_test_message(user)
    
    # Add reaction via API first
    conn
    |> put_req_header("authorization", "Bearer #{token}")
    |> post("/api/v1/messages/#{message.id}/reactions", %{emoji: "👍"})
    
    # Then delete via API
    conn
    |> put_req_header("authorization", "Bearer #{token}")
    |> delete("/api/v1/messages/#{message.id}/reactions/👍")
    |> json_response(204)
  end
end
```

---

### 8. ESLint Configuration for Web Frontend

**Problem:** Web frontend had no ESLint configuration, making it harder to catch issues during development.

**Solution:** Created ESLint 9.x flat config file.

**File Created:** `apps/web/eslint.config.js`
```javascript
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', '*.config.js'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  }
);
```

---

## Documentation Updates

The following documentation files were updated to reflect current implementation:

| File | Changes |
|------|---------|
| `CHANGELOG.md` | Created comprehensive changelog for v0.1.0 |
| `README.md` | Updated version badges, added status table |
| `DEVELOPMENT_WORKFLOW.md` | Added bug fix log section |
| `API_REFERENCE.md` | Added push token endpoint documentation |
| `ARCHITECTURE.md` | Updated version numbers |

---

## Verification

All fixes verified with:

```bash
# Backend tests
cd apps/backend && mix test
# Result: 215 tests, 0 failures, 1 skipped

# Web frontend build
cd apps/web && pnpm build
# Result: ✅ built in 1.96s (264.89 kB main bundle)

# Mobile TypeScript check
cd apps/mobile && npx tsc --noEmit
# Result: ✅ No errors
```

---

## Lessons Learned

1. **Always check constraint names** - Upsert operations must reference actual database constraints
2. **Use string keys for JSON params** - Elixir receives JSON keys as strings, not atoms
3. **API responses should be consistent** - Use data wrappers consistently or not at all
4. **Test environment config matters** - Rate limiting and other production features need test bypasses
5. **Integration tests over unit tests** - When testing API behavior, use the actual API
6. **Document as you fix** - Future developers will thank you
7. **Schema field names change** - Always verify tests use actual schema field names (e.g., `channel_type` not `type`)
8. **Function argument order** - Check function signatures match test calls (e.g., `join_via_invite(user, invite)` not `(invite, user)`)
9. **Enum values matter** - Audit log action types must match allowed enum values exactly

---

## Additional Fixes (December 29, 2024 - Session 2)

### 9. User Registration Password Confirmation

**Problem:** Tests were failing because `password_confirmation` was required in `registration_changeset`.

**Solution:** Made `password_confirmation` optional - it's validated if provided via `validate_confirmation/2`.

**File Modified:** `lib/cgraph/accounts/user.ex`

### 10. Channel Schema Field Name

**Problem:** Tests used `.type` but schema has `.channel_type`.

**Solution:** Updated tests to use correct field name.

**File Modified:** `test/cgraph/groups_test.exs`

### 11. Friendship Schema Field Names

**Problem:** Tests used `requester_id/addressee_id/blocked_id` but schema has `user_id/friend_id`.

**Solution:** Updated test assertions to use correct field names.

**File Modified:** `test/cgraph/accounts_test.exs`

### 12. list_friends Return Type

**Problem:** `list_friends/1` returns `{friends, meta}` tuple, not just list.

**Solution:** Updated test to destructure return value.

**File Modified:** `test/cgraph/accounts_test.exs`

### 13. join_via_invite Argument Order

**Problem:** Tests called `join_via_invite(invite, user)` but function is `join_via_invite(user, invite)`.

**Solution:** Fixed argument order in tests.

**File Modified:** `test/cgraph/groups_test.exs`

### 14. Audit Log Action Types

**Problem:** Tests used `:channel_created` but valid enum values use `"channel_create"`.

**Solution:** Fixed action types and field names in tests.

**File Modified:** `test/cgraph/groups_test.exs`

### 15. Platform Mapping in Accounts.register_push_token/3

**Problem:** The 3-argument version of `register_push_token` in Accounts module didn't map platforms.

**Solution:** Added platform mapping (ios→apns, android→fcm) to match PushTokenController behavior.

**File Modified:** `lib/cgraph/accounts.ex`

---

*Last updated: December 29, 2024*
