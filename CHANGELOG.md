# CGraph Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

---

## [0.6.2] - 2026-01-03

### Security Fixes & Test Coverage

Critical security patches and comprehensive OAuth test coverage.

### Security Fixes

- **Wallet Nonce Replay Attack** (CRITICAL) - Fixed replay attack vulnerability by deleting wallet challenge after successful signature verification
- **Apple JWT Verification** (CRITICAL) - Added proper JWKS fetching and JWT signature verification for Apple Sign-In tokens
- **Group Invite Race Condition** - Fixed concurrent invite usage with atomic increment using `Repo.update_all`
- **Friend Request Race Condition** - Prevented duplicate friendships with upsert pattern

### Performance Improvements

- **Mark Messages Read N+1** - Converted individual inserts to batch `Repo.insert_all`, reducing database calls from O(n) to O(1)

### Fixed

- Mobile storage module missing - Created storage abstraction layer with Expo SecureStore
- Mobile API_URL export missing - Added named export for API_URL
- TypeScript unused imports in OAuth components
- HTTPoison dependency replaced with hackney for Apple JWKS fetching
- Cachex error handling in OAuth for test environment compatibility
- Auth test AccountLockout state contamination with unique emails

### Added

- **OAuth Test Suite** - 35 comprehensive tests covering all OAuth providers, security validations, and edge cases
- Test coverage increased from 585 to 620 tests (0 failures)

### Changed

- Updated BUGFIX_LOG.md with comprehensive documentation of all fixes
- ReadReceipt batch insert now uses correct field precision (read_at: second, inserted_at: microsecond)

---

## [0.6.1] - 2026-01-03

### OAuth Authentication & Bug Fixes

Minor release adding OAuth 2.0 authentication with four major providers and fixing authentication issues.

### Added

#### OAuth Authentication
- **Google OAuth** - Sign in with Google via OAuth 2.0 + OpenID Connect
- **Apple Sign In** - Privacy-focused authentication with email relay support
- **Facebook OAuth** - Social login via Facebook Login SDK
- **TikTok OAuth** - Login Kit integration for TikTok users

#### Backend OAuth Infrastructure
- New `Cgraph.OAuth` module with provider abstraction
- OAuth controller with authorize, callback, mobile, link, unlink endpoints
- User schema extended with `oauth_provider`, `oauth_uid`, `oauth_data`, `oauth_tokens` fields
- Secure token storage with encryption at rest
- State parameter for CSRF protection
- PKCE support for mobile/SPA flows

#### Web OAuth Components
- `OAuthButtons` component for social login buttons
- `OAuthCallback` page for handling provider redirects
- `oauth.ts` service for OAuth API integration
- Updated Login and Register pages with OAuth options

#### Mobile OAuth Components
- React Native OAuth service with native SDK placeholders
- `OAuthButtons` component with platform-specific styling
- WebBrowser fallback for OAuth flow on mobile
- Updated LoginScreen and RegisterScreen with OAuth buttons

### Fixed
- **Authentication failing** - Root cause was pending database migrations not applied
- Module naming inconsistency (`CgraphWeb.Api.V1` → `CgraphWeb.API.V1`)
- OAuth return type pattern matching in accounts functions
- Added public `user_json` helper to AuthJSON

### Changed
- Added `assent ~> 0.2` dependency for OAuth provider support
- Extended config with OAuth provider credentials (environment variables)

### Documentation
- Added OAuth section to API.md with complete endpoint documentation
- Added OAuth security section to SECURITY.md
- Added OAuth components to FRONTEND.md component library

### Database Migrations
- `20260103000001_add_oauth_fields.exs` - Adds OAuth fields to users table

---

## [0.6.0] - 2026-01-02

### Enterprise Security, E2EE, Email & Push Notifications

Major release with enterprise security features, E2EE across all platforms, email delivery, push notifications, and admin tooling.

### Added

#### Email System
- Enterprise-grade email delivery via Swoosh with Resend for production
- Welcome, verification, password reset, and security alert templates
- Notification digest emails with daily/weekly summaries
- Email tracking and configurable sender addresses
- Responsive HTML templates with dark mode

#### Push Notifications
- APNs client with HTTP/2, JWT auth, and connection pooling
- FCM v1 API with service account auth and topic messaging
- Expo Push for React Native with batch sending and receipt tracking
- Scheduled notifications and broadcast topics
- Telemetry integration

#### Admin Dashboard
- System metrics with real-time updates
- User management: search, ban/unban, account actions
- Content moderation and report resolution
- Audit log viewer with category filtering
- Runtime configuration panel
- Admin API client with type safety

#### End-to-End Encryption
- **Mobile (React Native)**: X25519 via TweetNaCl, X3DH protocol, AES-256-GCM encryption, SecureStore integration, session management
- **Web (Browser)**: Web Crypto API, ECDH P-256, ECDSA signatures, IndexedDB persistence, automatic prekey replenishment
- E2EE React Context/Provider and hooks for both platforms
- Safety number generation for contact verification

#### Security Hardening
- Comprehensive input validation: email, username, password strength, UUIDs, URLs
- Abuse detection: spam, harassment, account takeover, brute force
- Risk scoring with configurable thresholds
- SQL injection and XSS prevention
- Password breach detection integration

#### Performance Infrastructure
- Unified caching layer with ETS and Cachex backends
- Query optimizer with batched loading and cursor pagination
- Circuit breaker pattern for external service resilience
- Connection pool sizing and management
  - HTTP pool configuration (Finch)
  - Redis pool configuration
  - Pool health monitoring
  - Auto-tuning recommendations

#### Integration Testing
- E2EE messaging: key exchange, encryption/decryption, prekey handling, safety numbers (9 tests)
- Voice messages: complete lifecycle, storage integration, rate limiting (11 tests)
- Real-time messaging: WebSocket delivery, typing, presence, edit/delete broadcasts (8 tests)

### Changed
- Fixed argument order in ConversationChannel for `user_in_conversation?`
- Fixed conversation channel receiving string instead of struct for `list_messages`
- Updated `Logger.warn` to `Logger.warning` for Elixir 1.19 compatibility
- Push notification worker handles GenServer not running gracefully
- Increased push notification retry attempts from 3 to 5
- Fixed TypeScript ArrayBuffer type issues in E2EE modules

### Test Results
- 585 tests total, 578 passing
- All E2EE and voice message tests passing
- Web app builds with no TypeScript errors

---

## [0.5.0] - 2026-01-01

### Runtime Upgrade

Upgraded to Erlang/OTP 28.3 and Elixir 1.19.4 for improved performance.

### Changed

#### Runtime Upgrades
- **Erlang/OTP**: 25.x → 28.3 (JIT improvements)
- **Elixir**: 1.14.x → 1.19.4 (set-theoretic types)
- **Phoenix**: 1.7.21 → 1.8.3 (latest stable)
- **Phoenix LiveView**: 0.20.17 → 1.1.19 (major upgrade)
- **Phoenix LiveDashboard**: 0.8.5 → 0.8.7
- **Ecto SQL**: 3.11.x → 3.13.4
- **Postgrex**: 0.17.x → 0.21.1
- **Oban**: 2.19.0 → 2.20.2
- **Cachex**: 3.6 → 4.1.1 (major version)
- **Sentry**: 10.x → 11.0.4 (major version)
- **Bandit**: 1.6.7 → 1.10.0
- **Swoosh**: 1.18.3 → 1.20.0
- **Tesla**: 1.13 → 1.15.3
- **Guardian**: 2.3.x → 2.4.0

#### Deprecation Fixes
- Replaced all `Logger.warn` calls with `Logger.warning` (Elixir 1.15+)
- Fixed `Cgraph.Events.emit` → `Cgraph.Events.publish` call
- Renamed duplicate function clause `vote_post/3` → `vote_post_by_id/3`
- Removed duplicate `render_flair/1` function clause
- Removed duplicate `extract_role_params/1` function clause
- Fixed unused variable warnings with underscore prefix

#### Developer Experience
- Added `.tool-versions` files for asdf version management
- Added `def cli()` callback for Elixir 1.19 preferred_envs pattern
- Removed `jose` version override (OTP 28 compatible now)

### Documentation Updated
- Updated ARCHITECTURE.md with new version table
- Updated README.md prerequisites section
- Updated QUICKSTART.md installation commands
- Updated all PrivateFolder developer docs
- Added OTP 28.3 upgrade session to SESSION_LOG.md
- Updated UPGRADING_GUIDE.md with new version info

### Technical Notes
- All 220 tests passing
- Remaining warnings are from external dependencies (Timex, SweetXml, Waffle, Tesla)
- OTP 28.3 JIT provides ~5-15% performance improvement
- Recommended installation via asdf for reproducible builds

---

## [0.4.0] - 2024-12-31

### 🎨 UI Polish & Internal Documentation

This release adds micro-interactions and animation polish across web and mobile, along with comprehensive internal developer documentation.

### Added

#### UI Micro-Interactions (Web)
- **Button**: Scale press feedback (0.97), shadow lift effect, smooth transitions
- **Loading**: Fade-in animation on mount
- **Tooltip**: Fade-in animation for tooltip content
- **Dropdown**: Scale-in animation with origin-top
- **Switch**: Hover glow effect, focus ring, smooth toggle
- **Tabs**: TabPanel fade-in when switching tabs
- **FileUpload**: Drag state scale, preview fade-in animations

#### Page Animations (Web)
- **Login/Register**: Form fade-in, input focus animations
- **UserProfile**: Content fade-in, avatar hover scale
- **Settings**: Navigation slide-in, content fade animation
- **CreatePost**: Form element stagger animation
- **Forums**: Post list stagger animation
- **ForumPost**: Content fade-in, smooth interactions
- **Notifications**: Item stagger, hover lift effect
- **Groups**: Server icon hover animations
- **Search**: Input focus shadow effect
- **Messages/Friends/Conversation**: Various polish

#### Mobile Animations
- **Button**: Spring press animation using Reanimated
- **UserListItem**: Animated entrance with staggered delay

#### Stability Features
- **Database Backup Worker**: Oban-based automated PostgreSQL backups
  - Runs daily at 3 AM
  - Compresses with gzip
  - Uploads to S3/R2
  - Configurable retention policy (30 daily, 12 weekly, 12 monthly)
  - Health check integration

#### Internal Documentation
- Created `docs/PrivateFolder/` for internal developer documentation
- 8 comprehensive documents covering architecture, startup, backend, frontend, database, upgrading, and scaling

### Technical Details
- All animations use CSS transforms/opacity for performance (hardware accelerated)
- Mobile uses react-native-reanimated for 60fps animations
- Backup worker uses Oban cron with ExAWS for S3 uploads

---

## [0.3.0] - 2024-12-30

### 🎉 Production Ready for 100 Users

This release focuses on making the platform ready for initial users with working 1:1 messaging, friend requests, and username improvements.

### Added

#### Unique User ID System
- **Database**: Auto-increment `user_id` sequence for unique numeric IDs
- **Display Format**: User IDs displayed as `#0001`, `#0042`, etc.
- **Optional Usernames**: Username is now optional at registration
- **14-Day Username Cooldown**: Users can change username every 14 days

#### Friend Request Improvements
- **Add by Username**: Can now send friend requests using username (not just user_id)
- **Backend Support**: `POST /api/v1/friends` accepts both `user_id` and `username`

#### Messaging Improvements
- **Start Chat from Friends**: Clicking "Message" on a friend creates/opens conversation
- **Auto-redirect**: Messages page handles `?userId=` param to start new conversations

#### Animation Libraries
- **Web**: `src/lib/animations.ts` with CSS animation utilities
- **Mobile**: `src/lib/animations.ts` with React Native Animated helpers

#### New Components
- **Web UserBadge**: Displays user ID, username, verification badges, karma
- **Mobile UserBadge**: Mobile version of user identity component
- **Mobile AnimatedCard**: Reusable animated container with press feedback

### Changed
- Username is now nullable in User schema
- Registration no longer requires username (can be set later)
- API returns `user_id_display`, `can_change_username`, `next_username_change_at`

### Fixed
- Mobile AddFriendScreen now sends `username` instead of `user_id`
- Web friend store detects UUID vs username format automatically

### Documentation
- Updated API.md with accurate friend endpoints and response formats
- Updated README with correct test count (220 tests)

---

## [0.2.0] - 2024-12-30

### 🚀 Full UI Implementation & Code Quality Improvements

This release delivers a comprehensive UI implementation for both web and mobile platforms, introduces robust API response handling utilities, and fixes critical authentication and state management issues.

### Added

#### Web UI Components (9 new components)
- **Dropdown** - Portal-based dropdown menu with keyboard navigation
- **Tooltip** - Multi-position tooltip with customizable placement
- **FileUpload** - Drag-and-drop file upload with progress tracking
- **TextArea** - Auto-growing textarea with character count
- **Tabs** - Tab navigation component with pill and underline variants
- **TagInput** - Tag input field with autocomplete support
- **ProgressBar** - Progress indicator with size and color variants
- **Switch** - Toggle switch component with labels
- **Select** - Searchable select dropdown with filtering

#### Mobile UI Components (4 new components)
- **Tabs** - Native tab navigation for mobile
- **Switch** - Native toggle switch
- **ProgressBar** - Progress indicator component
- **Select** - Modal-based select picker

#### New Pages/Screens
- **Web: Notifications Page** - Full notifications inbox with filtering by type
- **Web: User Profile Page** - Profile viewing with friend actions
- **Mobile: NotificationsInboxScreen** - Native notifications list

#### API Utilities (`lib/apiUtils.ts`)
- **ensureArray** - Type-safe array extraction from API responses
- **ensureObject** - Type-safe object extraction from API responses
- **extractPagination** - Pagination metadata extraction
- **extractErrorMessage** - Unified error message extraction
- **isNonEmptyString** - String validation type guard
- **isValidId** - ID validation type guard

#### Navigation
- Web: Added notifications route (`/notifications`)
- Web: Added user profile route (`/users/:userId`)
- Mobile: Added NotificationsNavigator with NotificationsTab

### Changed
- **authStore.ts** - Fixed API response mapping with `mapUserFromApi` helper
- **friendStore.ts** - Updated to use `ensureArray` for robust response parsing
- **chatStore.ts** - Updated to use `ensureArray` and `ensureObject`
- **groupStore.ts** - Updated to use API utilities
- **forumStore.ts** - Updated to use API utilities
- **notificationStore.ts** - Updated to use API utilities
- **searchStore.ts** - Updated to use API utilities with proper error handling
- **AppLayout.tsx** - Added notifications link with unread badge
- **App.tsx** - Added AuthInitializer component for proper auth flow

### Fixed
- **Authentication Infinite Loading** - Added AuthInitializer to call `checkAuth()` on app mount
- **API Response Parsing** - Fixed `friends.filter is not a function` error by ensuring arrays
- **Registration Params** - Wrapped user params in `{user: {...}}` for backend compatibility
- **Token Handling** - Properly extract tokens from nested `tokens` object in responses
- **Mobile TypeScript** - Installed `@types/react@19.1.0` for proper JSX support
- **Error Handling** - Replaced inline error casting with `extractErrorMessage` utility

### Technical Debt Addressed
- Removed all `any` type usages in stores (replaced with proper types)
- Standardized API response handling across all Zustand stores
- Added comprehensive JSDoc documentation to API utilities
- Consistent error message extraction pattern across stores

### Developer Experience
- VS Code TypeScript errors resolved (compile-time verified)
- Backend: 215 tests passing
- Web: TypeScript compiles clean (`npx tsc --noEmit`)
- Mobile: TypeScript compiles clean (`npx tsc --noEmit`)

---

## [0.1.1] - 2024-12-29

### 🎨 UI Component Library & Production Readiness

This release adds a comprehensive UI component library and prepares the project for production deployment and app store submission.

### Added

#### Web UI Component Library
- **ErrorBoundary** - React error boundary with recovery functionality
- **Loading** - Reusable loading spinner with size variants (sm/md/lg)
- **LoadingOverlay** - Full-screen loading overlay for async operations
- **Modal** - Accessible modal dialog with focus trapping
- **ConfirmDialog** - Pre-configured confirmation dialogs
- **Button** - Versatile button component with variants and loading states
- **IconButton** - Icon-only buttons for toolbars
- **Input** - Form input with labels, errors, and icons
- **Textarea** - Multi-line text input
- **Select** - Dropdown select component
- **Avatar** - User avatars with status indicators
- **AvatarGroup** - Overlapping avatar groups
- **EmptyState** - Generic empty state with pre-built variants
- **Toast** - Toast notification system (React context based)

#### Production & App Store
- **EAS Build Configuration** - Expo Application Services setup (eas.json)
- **Privacy Policy Page** - Legal compliance for app stores
- **Terms of Service Page** - Legal compliance for app stores
- **Environment Examples** - `.env.example` for backend, web, and mobile
- **Production Readiness Guide** - Comprehensive deployment checklist

#### Documentation
- Updated UI_CUSTOMIZATION.md with component library reference
- Created PRODUCTION_READINESS.md for 100-user deployment

### Changed
- Enhanced `.gitignore` with security patterns (secrets, keys, credentials)
- Added CSS animations for toast slide-in/fade-out
- Wrapped App with ErrorBoundary in main.tsx

### Fixed
- Fixed mobile asset paths in app.json

---

## [0.1.0] - 2024-12-29

### 🎉 Initial Release

This release represents the first working version of CGraph with all core functionality operational.

### Added

#### Backend (Elixir/Phoenix)
- **Authentication System**
  - Email/password registration and login
  - JWT token-based authentication with Guardian
  - Wallet-based anonymous authentication (Web3)
  - Session management with refresh tokens
  - Password reset functionality

- **User Management**
  - User profiles with bio, avatar, banner
  - User settings (notifications, privacy, theme)
  - Friend system (add, remove, block, suggestions)
  - User presence tracking (online/offline/away)

- **Messaging**
  - Direct messages (1:1 conversations)
  - Group conversations
  - Message reactions (emoji)
  - Read receipts
  - Typing indicators via WebSocket
  - Message search

- **Groups**
  - Group creation and management
  - Role-based permissions
  - Channels within groups
  - Member management
  - Invite system with codes

- **Forums**
  - Forum creation with categories
  - Posts with markdown support
  - Comments and replies
  - Voting system
  - Post search

- **Push Notifications**
  - Token registration (iOS/APNS, Android/FCM, Web)
  - Platform mapping for different providers

- **Rate Limiting**
  - Configurable per-endpoint limits
  - Multiple algorithms (token bucket, sliding window, etc.)
  - Test environment bypass

#### Web Frontend (React/Vite)
- **Pages**
  - Authentication (login, register, forgot password)
  - Messages (conversations list, chat view)
  - Groups (list, channels, settings)
  - Forums (posts, comments)
  - Settings (profile, notifications, privacy)

- **Features**
  - Real-time updates via Phoenix Channels
  - Dark/light theme support
  - Responsive design with TailwindCSS
  - Form validation with React Hook Form
  - State management with Zustand
  - Server state with React Query

#### Mobile App (React Native/Expo)
- **Screens**
  - Authentication flow
  - Messages and chat
  - Groups and channels
  - Forums browsing
  - Settings

- **Features**
  - Native navigation with React Navigation
  - Secure storage for tokens
  - Push notification support
  - Gesture handling
  - Native animations with Reanimated

### Fixed

#### December 29, 2024 Bug Fixes

- **Rate Limiting in Tests** - Added configuration to disable rate limiting in test environment to prevent false test failures
- **Push Token Platform Mapping** - Fixed mismatch between user-facing platform names (ios/android) and internal schema values (apns/fcm)
- **Push Token Upsert** - Replaced broken `on_conflict` upsert with find-or-create pattern
- **HTTP Status Codes** - Changed validation errors from 400 to 422 (Unprocessable Entity) for proper REST semantics
- **Test Assertions** - Fixed multiple test files with incorrect status codes, response paths, and argument orders
- **ESLint Configuration** - Created ESLint 9 flat config for web frontend

### Technical Details

#### Test Results
```
Backend: 215 tests, 0 failures, 1 skipped
Web Build: ✅ 1.92s build time, 264KB main bundle (gzipped: 70KB)
Mobile TypeScript: ✅ Compiles without errors
```

#### API Endpoints Summary
| Category | Endpoints | Status |
|----------|-----------|--------|
| Authentication | 8 | ✅ Working |
| Users | 12 | ✅ Working |
| Messaging | 15 | ✅ Working |
| Groups | 18 | ✅ Working |
| Forums | 14 | ✅ Working |
| Settings | 6 | ✅ Working |
| Notifications | 5 | ✅ Working |

#### Database Schema
- 25+ tables including users, messages, groups, forums, etc.
- Full-text search on messages and posts
- Soft deletes for user data
- Audit logging for admin actions

---

## Development Notes

### Architecture Decisions

1. **Monorepo Structure** - Using Turborepo for managing backend, web, mobile, and shared packages together
2. **Phoenix Channels** - Real-time WebSocket communication instead of polling
3. **Zustand over Redux** - Simpler state management with less boilerplate
4. **React Query** - Server state management with automatic caching and refetching
5. **Guardian JWT** - Industry-standard token-based auth for Elixir

### Known Issues

1. ESLint warnings exist but don't block builds
2. Some mobile dependencies have security advisories (non-critical)
3. 1 test skipped (group conversation creation - needs investigation)

### Future Improvements

- [ ] Add end-to-end encryption for DMs
- [ ] Implement voice/video calls
- [ ] Add i18n/localization support
- [ ] Implement admin dashboard
- [ ] Add comprehensive E2E tests
- [ ] Performance optimization for large group chats

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

## License

See [LICENSE](./LICENSE) for license information.
