# CGraph Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
