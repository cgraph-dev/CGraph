# Development Session Log

Record of major changes made during development sprints.

---

## January 9, 2026 Sprint (v0.7.31) - Cross-Platform Storybook

### Storybook for Web and Mobile

Added comprehensive component documentation with Storybook for both platforms.

| Platform | Package                 | Version | Stories      |
| -------- | ----------------------- | ------- | ------------ |
| Web      | @storybook/react-vite   | 8.6.15  | 8 components |
| Mobile   | @storybook/react-native | 8.6.1   | 9 components |

### Web Storybook

- Downgraded from v10 to v8.6.15 (addons not yet released for v10)
- Renamed `preview.ts` to `preview.tsx` for JSX support
- Removed `src/**/*.mdx` pattern (no MDX docs)
- Stories: Button, Input, Avatar, Modal, Select, Loading, Switch, EmptyState

### Mobile Storybook

- Created `.storybook/` config (main.ts, preview.tsx, index.tsx)
- Added on-device addons (controls, actions)
- Stories in `src/components/stories/`:
  - Button, Input, Avatar, Card, LoadingSpinner
  - Switch, Skeleton, StatusBadge, EmptyState

### TypeScript Fixes

- **ProfilerWrapper.tsx:** Added `'nested-update'` to phase type (React 18+)
- **preview.tsx:** Added React import for JSX decorators

### Documentation Updates

- CHANGELOG.md - Added v0.7.31 release notes
- FRONTEND.md - Updated Storybook version to 8.6
- MOBILE.md - Added Storybook section with setup guide
- DEVELOPMENT_WORKFLOW.md - Added Storybook section, updated date
- README.md - Added Storybook to Getting Started
- 09_STORYBOOK_GUIDE.md - Added Mobile Storybook section
- V0.7.31_RELEASE_NOTES.md - Full release documentation

### Files Changed

23 files, 2,129 insertions, 372 deletions

---

## January 8, 2026 Sprint (v0.7.25) - E2EE Forward Secrecy Fix

### Critical Security Fix: Key Revocation Broadcast

Fixed a critical Forward Secrecy vulnerability in the E2EE key revocation flow.

| Problem                                      | Impact                                            | Solution                                     |
| -------------------------------------------- | ------------------------------------------------- | -------------------------------------------- |
| Key revocation only notified user themselves | Contacts continued encrypting to compromised keys | Broadcast to all contacts via WebSocket      |
| No cache invalidation                        | Stale prekey bundles used                         | Added `handleKeyRevoked` to invalidate cache |

### Backend Changes

**e2ee_controller.ex:**

- Added `notify_key_revocation/3` private function
- Fetches all friend IDs and broadcasts `e2ee:key_revoked` to each `user:{friend_id}` channel
- Also notifies user's own devices for multi-device sync

**friends.ex:**

- Added public `get_accepted_friend_ids/1` function for E2EE revocation broadcasts

### Frontend Changes

**Web (socket.ts):**

- Added `joinUserChannel/1` method to subscribe to personal `user:{id}` channel
- Handles `e2ee:key_revoked` events and calls E2EE store

**Web (e2eeStore.ts):**

- Added `handleKeyRevoked/2` function to clear cached prekey bundle

**Mobile (socket.ts):**

- Added `joinUserChannel/1` and user channel infrastructure
- Added `setE2EEKeyRevokedHandler/1` for callback registration
- Handles `e2ee:key_revoked` events

**Mobile (E2EEContext.tsx):**

- Added `handleKeyRevoked/2` to context interface and implementation

### Documentation Updates

- CHANGELOG.md - Added v0.7.25 release notes
- README.md - Updated version badge
- SECURITY.md - Documented key revocation broadcast and Forward Secrecy
- API_REFERENCE.md - Updated Revoke Key endpoint with broadcast details
- TECHNICAL_OVERVIEW.md - Added key revocation code example
- ARCHITECTURE.md - Updated version

---

## January 7, 2026 Sprint (v0.7.23) - Security Hardening

### Comprehensive Security Audit & Fixes

Major security review identifying and resolving critical vulnerabilities.

### P0: Foreign Key Constraint Fix

Fixed database integrity issue preventing user deletion.

| Problem           | Root Cause                                             | Solution                                       |
| ----------------- | ------------------------------------------------------ | ---------------------------------------------- |
| Users undeletable | `on_delete: :nilify_all` with `null: false` constraint | Migration changes to `on_delete: :delete_all`  |
| FK conflicts      | Conflicting cascade behaviors                          | Updated conversations, messages, groups tables |

**Migration:** `20260107105635_fix_foreign_key_constraints.exs`

### P1: Magic Byte File Validation

Added defense-in-depth file upload security.

| Feature             | Implementation                                          |
| ------------------- | ------------------------------------------------------- |
| Magic signatures    | Binary headers for JPEG, PNG, GIF, PDF, MP4, WebM, etc. |
| Validation function | `validate_mime_type/3` reads first 16 bytes             |
| Container formats   | Special handling for MP4/MOV/HEIC (ftyp containers)     |
| Test coverage       | 12 comprehensive tests for all scenarios                |

**Code:** `lib/cgraph/uploads.ex` - `validate_file_signature/3`

### Message Idempotency

Prevent duplicate message creation from network retries.

| Component               | Changes                                  |
| ----------------------- | ---------------------------------------- |
| **client_message_id**   | New UUID field on messages schema        |
| **check_idempotency/2** | Lookup existing message before creation  |
| **Unique constraint**   | Per-conversation client_message_id index |
| **Test coverage**       | 6 tests for idempotency behavior         |

**Migration:** `20260107105636_add_message_idempotency.exs`

### Documentation Accuracy (E2EE)

Updated SECURITY.md to accurately reflect E2EE implementation status.

| Before                       | After                                                  |
| ---------------------------- | ------------------------------------------------------ |
| "Full E2E encryption" claim  | "Infrastructure Ready, Client Integration In Progress" |
| Misleading security promises | Honest status table with component breakdown           |
| No roadmap                   | Clear implementation path documented                   |

### Version Updates

| Package             | Before | After  |
| ------------------- | ------ | ------ |
| Root (package.json) | 0.7.22 | 0.7.23 |
| @cgraph/mobile      | 0.7.22 | 0.7.23 |
| @cgraph/web         | 0.7.22 | 0.7.23 |
| Backend (mix.exs)   | 0.7.22 | 0.7.23 |

### New Files

- `priv/repo/migrations/20260107105635_fix_foreign_key_constraints.exs`
- `priv/repo/migrations/20260107105636_add_message_idempotency.exs`
- `test/cgraph/uploads_security_test.exs`
- `test/cgraph/messaging_idempotency_test.exs`

---

## January 7, 2026 Sprint (v0.7.22)

### Chat UX Overhaul - Inverted FlatList Pattern

Implemented industry-standard inverted FlatList pattern for chat messages, fixing persistent scroll
issues.

| Before                                | After                                     |
| ------------------------------------- | ----------------------------------------- |
| `inverted={false}` with manual scroll | `inverted={true}` with automatic behavior |
| Messages sorted oldest-first          | Messages sorted newest-first              |
| `scrollToEnd()` after new message     | `scrollToOffset({ offset: 0 })`           |
| `[...prev, normalized]` (append)      | `[normalized, ...prev]` (prepend)         |

### Picker Concurrency Fix

Fixed photo/camera/file picker crashes from concurrent operations.

| Problem                                 | Solution                        |
| --------------------------------------- | ------------------------------- |
| Multiple pickers opening simultaneously | `isPickerActiveRef` mutex lock  |
| No cleanup on picker cancel             | `finally` blocks ensure unlock  |
| Rapid tap causing race condition        | 500ms delay before picker opens |

### Deleted Message Tracking

Prevented deleted/unsent messages from reappearing via WebSocket.

| Component                | Changes                                         |
| ------------------------ | ----------------------------------------------- |
| **deletedMessageIdsRef** | Tracks deleted message IDs for session          |
| **setMessages**          | Filters out deleted IDs when receiving messages |
| **handleUnsendMessage**  | Adds ID to deleted tracking Set                 |

### Code Changes Summary

```typescript
// ConversationScreen.tsx key changes:

// 1. Inverted list pattern
<FlatList
  inverted={true}
  data={sortedMessages} // newest-first sort
/>

// 2. Messages sorted newest-first
const sortedMessages = filtered.sort((a, b) => {
  const dateA = new Date(a.inserted_at || a.created_at).getTime();
  const dateB = new Date(b.inserted_at || b.created_at).getTime();
  return dateB - dateA; // Newest first
});

// 3. New messages prepend (for inverted list)
setMessages(prev => [normalized, ...prev]);
flatListRef.current?.scrollToOffset({ offset: 0 });

// 4. Picker lock mechanism
const isPickerActiveRef = useRef(false);
const handlePhotoSelect = async () => {
  if (isPickerActiveRef.current) return;
  isPickerActiveRef.current = true;
  try {
    await new Promise(r => setTimeout(r, 500));
    // ... picker logic
  } finally {
    isPickerActiveRef.current = false;
  }
};

// 5. Deleted message tracking
const deletedMessageIdsRef = useRef<Set<string>>(new Set());
// Filter deleted messages in all handlers
if (deletedMessageIdsRef.current.has(msg.id)) return;
```

### Version Updates

| Package             | Before | After  |
| ------------------- | ------ | ------ |
| Root (package.json) | 0.7.20 | 0.7.22 |
| @cgraph/mobile      | 0.7.20 | 0.7.22 |
| @cgraph/web         | 0.7.19 | 0.7.22 |
| Backend (mix.exs)   | 0.7.19 | 0.7.22 |

---

## January 6, 2026 Sprint (v0.7.20)

### Audio System Modernization

Complete migration from deprecated expo-av to modern expo-audio hooks.

| Component                | Changes                                                          |
| ------------------------ | ---------------------------------------------------------------- |
| **VoiceMessagePlayer**   | Migrated to `useAudioPlayer` and `useAudioPlayerStatus` hooks    |
| **VoiceMessageRecorder** | Migrated to `useAudioRecorder` with `RecordingPresets`           |
| **app.config.js**        | Added expo-audio and expo-asset plugins                          |
| **package.json**         | Removed expo-av, added expo-audio ~1.1.1 and expo-asset ~12.0.12 |

### TypeScript Fixes

| File             | Issue                                 | Resolution                                           |
| ---------------- | ------------------------------------- | ---------------------------------------------------- |
| `normalizers.ts` | `thumbnailUrl` property doesn't exist | Changed to `thumbnail` per MessageMetadata interface |
| `normalizers.ts` | `metadata` possibly undefined         | Added null check before accessing properties         |
| `socket.ts`      | Timeout type incompatibility          | Cast to `NodeJS.Timeout` for Map storage             |
| `socket.ts`      | Channel event handler typing          | Cast payload to typed object after receiving         |

### Dependency Updates

```bash
# Installed missing peer dependency
npx expo install expo-asset

# All expo-doctor checks passing
17/17 checks passed
```

### API Migration Reference

| expo-av (Old)                     | expo-audio (New)                                 |
| --------------------------------- | ------------------------------------------------ |
| `Audio.Sound.createAsync()`       | `useAudioPlayer(source)`                         |
| `sound.playAsync()`               | `player.play()`                                  |
| `sound.pauseAsync()`              | `player.pause()`                                 |
| `sound.setPositionAsync(ms)`      | `player.seekTo(seconds)`                         |
| `Audio.Recording.createAsync()`   | `useAudioRecorder(preset)`                       |
| `Audio.requestPermissionsAsync()` | `AudioModule.requestRecordingPermissionsAsync()` |
| `playsInSilentModeIOS`            | `playsInSilentMode`                              |
| `allowsRecordingIOS`              | `allowsRecording`                                |

---

## January 5, 2026 Sprint (v0.7.19)

### Code Quality Overhaul

Comprehensive codebase cleanup to meet strict professional standards.

| Category         | Before                     | After           |
| ---------------- | -------------------------- | --------------- |
| **Credo Issues** | 257 readability, 25 design | 2 unavoidable   |
| **Tests**        | 620 (6 failing)            | 620 (0 failing) |
| **Source Files** | 212                        | 212             |
| **Functions**    | 4,499                      | 4,499           |

### Refactoring Changes

1. **Cyclomatic Complexity** - Refactored 45 functions with high complexity scores
2. **Nested Depth** - Flattened deeply nested conditionals using early returns
3. **Predicate Naming** - Renamed `is_blocked?` → `blocked?`, `is_member?` → `member?`, etc.
4. **Implicit Try** - Converted 15 explicit try/rescue to function-level rescue
5. **Alias Ordering** - Organized alphabetically in 50+ files
6. **Module Alias Placement** - Fixed aliases appearing before @moduledoc

### Test Fixes

Fixed 6 pre-existing test failures:

- **VoiceMessageTest** - Tests now create actual temp files for upload validation
- **RealTimeMessagingIntegrationTest** - Fixed event pattern assertions to match actual channel
  broadcasts

### Commits

```
1fa1030 - refactor: reduce cyclomatic complexity and fix nested depth issues
64054b4 - style: fix code readability issues across codebase
2e05fc5 - style: fix module alias placement across codebase
027ef72 - fix: update test references for renamed predicates and aliases
f87d2fe - docs: update all documentation with current stats and version 0.7.19
```

---

## January 2026 Sprint (v0.6.0)

### Major Features Added

| Feature                | Files Created                                            | Description                     |
| ---------------------- | -------------------------------------------------------- | ------------------------------- |
| **Email System**       | `lib/cgraph/mailer.ex`, `lib/cgraph/mailer/templates.ex` | Enterprise email with templates |
| **Push Notifications** | `lib/cgraph/notifications/push_service.ex`, + 3 clients  | APNs, FCM, Expo support         |
| **Admin Dashboard**    | `apps/web/src/pages/admin/AdminDashboard.tsx`            | Full admin UI                   |
| **Admin API**          | `apps/web/src/lib/api/admin.ts`                          | Type-safe admin client          |

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

| Suite     | Result                                          |
| --------- | ----------------------------------------------- |
| Backend   | 585 tests, 578 passing, 7 pre-existing failures |
| Web Build | Successful, no TypeScript errors                |

---

## December 2025 Sprint

This session focused on two main areas:

1. UI polish with micro-interactions across web and mobile
2. Internal documentation and stability improvements

---

## UI Enhancements

### Web Components Enhanced

| Component        | Changes                                                |
| ---------------- | ------------------------------------------------------ |
| `Button.tsx`     | Scale on press (0.97), shadow lift, smooth transitions |
| `Loading.tsx`    | Fade-in animation on mount                             |
| `Tooltip.tsx`    | Fade-in animation for tooltip content                  |
| `Dropdown.tsx`   | Scale-in animation with origin-top                     |
| `Switch.tsx`     | Hover glow, focus ring, smooth toggle                  |
| `Tabs.tsx`       | TabPanel fade-in when switching                        |
| `FileUpload.tsx` | Drag scale, preview fade-in                            |

### Web Pages Enhanced

| Page                | Changes                                             |
| ------------------- | --------------------------------------------------- |
| `Login.tsx`         | Form fade-in, input focus animations, button polish |
| `Register.tsx`      | Same as Login                                       |
| `UserProfile.tsx`   | Content fade-in, avatar hover scale                 |
| `Settings.tsx`      | Nav slide-in, content fade animation                |
| `CreatePost.tsx`    | Form element stagger animation                      |
| `Forums.tsx`        | Post list stagger animation                         |
| `ForumPost.tsx`     | Content fade-in, smooth interactions                |
| `Notifications.tsx` | Item stagger, hover lift effect                     |
| `Groups.tsx`        | Server icon hover animations                        |
| `Search.tsx`        | Input focus shadow effect                           |
| `Messages.tsx`      | Various polish                                      |
| `Friends.tsx`       | List animations                                     |
| `Conversation.tsx`  | Message animations                                  |

### Mobile Components Enhanced

| Component          | Changes                             |
| ------------------ | ----------------------------------- |
| `Button.tsx`       | Spring press animation (Reanimated) |
| `UserListItem.tsx` | Animated entrance with delay        |

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

_Created: December 31, 2025_

---

# Development Session - OTP 28.3 Upgrade (January 2025)

## Summary

Major runtime upgrade to latest stable Erlang/OTP and Elixir versions.

## Changes Made

### Runtime Upgrade

| Component             | Before  | After            |
| --------------------- | ------- | ---------------- |
| Erlang/OTP            | 25.x    | 28.3 (erts-16.2) |
| Elixir                | 1.14.x  | 1.19.4-otp-28    |
| Phoenix               | 1.7.21  | 1.8.3            |
| Phoenix LiveView      | 0.20.17 | 1.1.19           |
| Phoenix LiveDashboard | 0.8.5   | 0.8.7            |
| Sentry                | 10.x    | 11.0.4           |
| Cachex                | 3.6     | 4.1.1            |
| Bandit                | 1.6.7   | 1.10.0           |
| Swoosh                | 1.18.3  | 1.20.0           |
| Oban                  | 2.19.0  | 2.20.2           |

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

| File                 | Change                                                |
| -------------------- | ----------------------------------------------------- |
| `database_backup.ex` | `Logger.warn` → `Logger.warning`                      |
| `jobs.ex`            | `Logger.warn` → `Logger.warning`                      |
| `connection_pool.ex` | `Logger.warn` → `Logger.warning`                      |
| `forums.ex`          | Renamed duplicate `vote_post/3` → `vote_post_by_id/3` |
| `post_json.ex`       | Removed duplicate `render_flair/1` clause             |
| `role_controller.ex` | Removed duplicate `extract_role_params/1` clause      |
| `accounts.ex`        | Prefixed unused `token` variable                      |
| `messaging.ex`       | Prefixed unused `creator` and `thread` variables      |

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

_Updated: January 2025_

---

## December 31, 2025 - App Store Compliance Session

### Overview

Completed authentication flow and GDPR compliance features for Google Play and App Store submission.

### Authentication Flow Fixes

| Issue                                           | Resolution                                        |
| ----------------------------------------------- | ------------------------------------------------- |
| Mobile register missing `password_confirmation` | Added to AuthContext.tsx                          |
| Token refresh expecting wrong response format   | Fixed to use `tokens.access_token`                |
| Missing logout endpoint                         | Added POST `/api/v1/auth/logout`                  |
| Missing email verification                      | Added verify-email, resend-verification endpoints |

### New Endpoints Added

| Endpoint                           | Method | Purpose                                  |
| ---------------------------------- | ------ | ---------------------------------------- |
| `/api/v1/auth/logout`              | POST   | Revoke current session (authenticated)   |
| `/api/v1/auth/verify-email`        | GET    | Verify email with token                  |
| `/api/v1/auth/resend-verification` | POST   | Resend verification email (rate limited) |
| `/api/v1/me/export`                | POST   | Request GDPR data export                 |

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

## January 12, 2026 Sprint (v0.7.53) - Frontend-Backend Integration Audit

### Comprehensive Review and Fixes

Conducted a thorough audit of frontend-backend connections, focusing on forum features and messaging
system. Found and fixed several critical disconnects between UI and API.

### Forum System Fixes

| Component                                | Issue                                                  | Fix                                                                              |
| ---------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `CreatePost.tsx`                         | Poll/prefix/attachment data not sent to backend        | Updated handleSubmit to include prefixId, attachmentIds, and poll data           |
| `ForumPost.tsx`                          | Report button showed fake toast instead of calling API | Implemented proper report modal with reason selection, connected to reportItem() |
| `forumStore.ts` - reportItem             | Threw "Not implemented" error                          | Implemented full API call to POST /api/v1/reports                                |
| `forumStore.ts` - createPost             | Missing MyBB fields in API payload                     | Added prefixId, attachmentIds, and poll object to request                        |
| `forumStore.ts` - fetchThreadPrefixes    | Empty stub                                             | Added standard prefix set (Discussion, Question, Help, Solved, etc.)             |
| `forumStore.ts` - ThreadPrefix interface | Missing isDefault field                                | Added optional isDefault property                                                |
| `forumStore.ts` - CreatePostData         | Missing MyBB fields                                    | Added prefixId, attachmentIds, and poll object to interface                      |

### Messaging System Fixes

| Component                              | Issue                                               | Fix                                                                    |
| -------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------- |
| `socket.ts` - sendReaction             | Wrong event format (single "reaction" event)        | Changed to send "add_reaction" or "remove_reaction" as backend expects |
| `socket.ts` - reaction listeners       | Missing handlers for reaction_added/removed         | Added channel.on handlers for real-time reaction sync                  |
| `chatStore.ts` - reaction methods      | No socket-based reaction update methods             | Added addReactionToMessage() and removeReactionFromMessage()           |
| `Conversation.tsx` - reaction handlers | Used URL query params (wrong) to get conversationId | Fixed to extract from URL path or use provided param                   |

### Files Modified

**Frontend (Web):**

- `apps/web/src/stores/forumStore.ts` - Report implementation, createPost enhancements,
  fetchThreadPrefixes
- `apps/web/src/stores/chatStore.ts` - Real-time reaction methods
- `apps/web/src/lib/socket.ts` - Socket reaction events and listeners
- `apps/web/src/pages/forums/ForumPost.tsx` - Report modal implementation
- `apps/web/src/pages/forums/CreatePost.tsx` - Poll/prefix/attachment submission
- `apps/web/src/pages/messages/Conversation.tsx` - Fixed reaction handler URL parsing

### Test Results

All tests passing after changes:

- Web: 426 tests pass
- Mobile: 43 tests pass
- Backend: 830 tests pass

### Build Status

- Web build: Success (0 TypeScript errors)
- Backend: 0 warnings with --warnings-as-errors

### Breaking Changes

None - all changes are additive or bug fixes.

### API Compatibility Notes

Forum report endpoint expects:

```json
POST /api/v1/reports
{
  "report": {
    "report_type": "post",
    "item_id": "<post_id>",
    "reason": "<reason_code>",
    "details": "<optional details>"
  }
}
```

Socket reaction events now correctly use:

- `add_reaction` with `{ message_id, emoji }`
- `remove_reaction` with `{ message_id, emoji }`

---

_Updated: January 12, 2026_
