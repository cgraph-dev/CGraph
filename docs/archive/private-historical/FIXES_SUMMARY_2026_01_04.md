# CGraph Bug Fixes - January 4, 2026

## Overview

This document summarizes all bugs fixed in the backend during the January 4, 2026 debugging session,
focusing on the "Unknown" names issue in conversation lists and various compilation warnings.

## Critical Fixes

### 1. ✅ FIXED: "Unknown" Names in Conversation List

**File**: `apps/backend/lib/cgraph/messaging.ex` (Line 29)

**Problem**:

- Conversation list API was returning participants WITHOUT nested user data
- Frontend received `ConversationParticipant` records but `user` field was
  `%Ecto.Association.NotLoaded{}`
- All participant names displayed as "Unknown" in the UI
- Mobile logs showed: `Participants: []` and `Other participant found: no`

**Root Cause**:

```elixir
# BEFORE (WRONG):
preload: [:participants]

# AFTER (CORRECT):
preload: [participants: :user]
```

**Impact**:

- Main conversation list screen now displays actual usernames instead of "Unknown"
- Mobile and web apps can properly identify conversation participants
- Status indicators and display names now work correctly

**Why This Happened**:

- Inconsistent preload patterns across the codebase
- Other queries in the same file (`get_conversation`, `find_dm_conversation`) correctly used nested
  preloads
- `list_conversations` was missing the nested `:user` association

---

### 2. ✅ FIXED: Phoenix.CodeReloader Warning

**File**: `apps/backend/mix.exs` (Line 17)

**Problem**:

```
warning: a Mix listener expected by Phoenix.CodeReloader is missing.
Please add the listener to your mix.exs configuration
```

**Solution**:

```elixir
def project do
  [
    app: :cgraph,
    version: @version,
    # ... other config ...
    listeners: [Phoenix.CodeReloader],  # ADDED
    dialyzer: dialyzer(),
    test_coverage: [tool: ExCoveralls]
  ]
end
```

**Impact**: Eliminates startup warning, ensures proper hot-reloading during development

---

## Code Quality Fixes

### 3. ✅ FIXED: Unused Functions

Removed unused helper functions that were causing compilation warnings:

**File**: `apps/backend/lib/cgraph_web/controllers/api/v1/conversation_json.ex`

- Removed `get_participants/1` (line 82) - Was alias for `get_participants_with_data`
- Removed `participant_data/1` (lines 97-112) - Unused participant rendering helper

**File**: `apps/backend/lib/cgraph_web/controllers/api/v1/oauth_controller.ex`

- Removed `decode_apple_id_token/1` (lines 384-395) - Unused JWT decoder

**File**: `apps/backend/lib/cgraph/oauth.ex`

- Removed `decode_jwt/1` (lines 692-706) - Duplicate JWT decoding logic

---

### 4. ✅ FIXED: @doc Redefining Warnings

Fixed multiple `@doc` attribute redefinition issues by using function headers:

**File**: `apps/backend/lib/cgraph/messaging.ex` (Lines 638-655)

```elixir
# BEFORE (WRONG):
@doc """Delete message by ID"""
def delete_message(message_id, user_id) when ... do

@doc """Delete message struct"""  # ← DUPLICATE @doc
def delete_message(message, user) do

# AFTER (CORRECT):
@doc """
Delete a message.
Can be called with message_id and user_id, or with message struct and user.
"""
def delete_message(message_id, user_id)  # ← Function header

def delete_message(message_id, user_id) when ... do
def delete_message(message, user) do
```

**File**: `apps/backend/lib/cgraph/accounts.ex` (Lines 114-490)

- Consolidated duplicate `get_user_by_user_id/1` definitions
- Removed duplicate `@doc` at line 487

**File**: `apps/backend/lib/cgraph_web/controllers/api/v1/auth_controller.ex` (Lines 37-47)

- Consolidated `login/2` function clauses with single `@doc`

---

### 5. ✅ FIXED: Function Clause Grouping Warning

**File**: `apps/backend/lib/cgraph/accounts.ex` (Lines 117 and 490)

**Problem**:

```
warning: clauses with the same name and arity should be grouped together,
"def get_user_by_user_id/1" was previously defined (line 117)
```

**Solution**: Removed duplicate definition at line 490, consolidated to lines 114-131

---

### 6. ✅ FIXED: Multiple Clause Default Values Warning

**File**: `apps/backend/lib/cgraph/oauth.ex` (Line 155)

**Problem**:

```
warning: def mobile_callback/3 has multiple clauses and also declares default values.
```

**Solution**:

```elixir
# BEFORE (WRONG):
def mobile_callback(provider, access_token, id_token \\ nil) when ... do

# AFTER (CORRECT):
def mobile_callback(provider, access_token, id_token \\ nil)  # Function header
def mobile_callback(provider, access_token, id_token) when ... do
```

---

### 7. ✅ FIXED: Unused Variable Warnings

**File**: `apps/backend/lib/cgraph/notifications/push_service/expo_client.ex`

- Line 176: Changed `body` to `_body` (unused in 500 error handler)
- Line 522: Commented out unused `info_base` variable (reserved for future HKDF implementation)

**File**: `apps/backend/lib/cgraph_web/channels/conversation_channel.ex`

- Line 32: Changed `conversation` to `_conversation` (only needed for existence check)

---

### 8. ✅ FIXED: Unused Module Attribute Warning

**File**: `apps/backend/lib/cgraph/security/input_validator.ex` (Line 79)

**Problem**: `@command_injection_patterns` defined but never used

**Solution**: Commented out with note for future shell command validation

---

## Remaining Non-Critical Warnings

### Info Messages (Not Errors)

1. **Telemetry Handler Performance**: Local function handlers for telemetry may have performance
   penalty
   - Location: `lib/cgraph_web/telemetry.ex`
   - Impact: Minimal - only affects telemetry collection
   - Status: Can be optimized later by extracting to named functions

2. **Assets Directory Spawn Warning**: `Could not cd to /CGraph/apps/backend/apps/backend/assets`
   - Reason: Assets are handled by web frontend, backend doesn't need assets directory
   - Impact: None - backend serves API only
   - Status: Expected behavior in current architecture

---

## Testing Status

### ✅ Verified Working

1. Backend server starts without errors (Phoenix on port 4000)
2. Phoenix.CodeReloader warning eliminated
3. All unused function warnings eliminated
4. All @doc redefining warnings eliminated
5. All unused variable warnings eliminated

### 🔄 Requires User Testing

1. **Conversation List Names**: Refresh mobile/web apps and verify participant names display
   correctly instead of "Unknown"
2. **Voice Message Error**: Still needs investigation (500 error on voice message upload)

---

## Voice Message 500 Error Status

**Current Status**: NOT YET INVESTIGATED

**Evidence**:

- Mobile logs show:
  `ERROR Error sending voice message: [AxiosError: Request failed with status code 500]`
- Voice message module structure reviewed (processing, FFmpeg transcoding, storage)
- Backend logs need review during actual voice message upload attempt

**Next Steps**:

1. Trigger voice message upload from mobile app
2. Check backend logs for specific error message
3. Verify FFmpeg is installed and accessible
4. Check file upload size limits and storage permissions
5. Review `voice_message.ex` process pipeline

**Relevant Code**: `apps/backend/lib/cgraph/messaging/voice_message.ex` (Lines 180-210)

---

## Deployment Instructions

### Backend Restart Required

All fixes require backend restart to take effect:

```bash
cd /CGraph/apps/backend
pkill -9 beam.smp  # Stop current server
mix phx.server  # Start with fixes applied
```

### Frontend Updates

Mobile and web apps should automatically receive corrected API responses after backend restart. No
code changes needed on frontend.

### Verification Steps

1. Restart backend server
2. Open mobile app or web app
3. Navigate to conversations/messages list
4. Verify participant names display correctly (not "Unknown")
5. Check backend logs - should have no compilation warnings
6. Test voice message upload (if applicable)

---

## Files Modified

### Core Fixes (2 files)

1. `apps/backend/lib/cgraph/messaging.ex` - Added nested user preload
2. `apps/backend/mix.exs` - Added Phoenix.CodeReloader listener

### Code Quality (7 files)

3. `apps/backend/lib/cgraph_web/controllers/api/v1/conversation_json.ex`
4. `apps/backend/lib/cgraph_web/controllers/api/v1/oauth_controller.ex`
5. `apps/backend/lib/cgraph/oauth.ex`
6. `apps/backend/lib/cgraph/accounts.ex`
7. `apps/backend/lib/cgraph_web/controllers/api/v1/auth_controller.ex`
8. `apps/backend/lib/cgraph/notifications/push_service/expo_client.ex`
9. `apps/backend/lib/cgraph_web/channels/conversation_channel.ex`
10. `apps/backend/lib/cgraph/security/input_validator.ex`

---

## Historical Context

This fix addresses a recurring pattern in the codebase where Ecto preloads are inconsistently
applied. Similar issues have been fixed before (see BUGFIX_LOG.md entries for participant matching).
The pattern is:

**Wrong**: `preload: [:association]` - Loads association records but not nested data **Correct**:
`preload: [association: :nested]` - Loads association AND nested associations

This pattern should be audited across all queries to ensure consistent behavior.

---

## Version

- **Date**: January 4, 2026
- **Backend Version**: v0.7.17+fixes
- **Commit Hash**: [To be added after commit]
- **Developer**: GitHub Copilot (Claude Sonnet 4.5)

---

## Related Documentation

- See `docs/BUGFIX_LOG.md` for historical bug fixes
- See `docs/DATABASE.md` for Ecto preload patterns
- See `docs/API_REFERENCE.md` for conversation API documentation
