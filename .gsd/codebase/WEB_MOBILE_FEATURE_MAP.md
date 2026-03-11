# CGraph Web & Mobile Feature Map

> **Version:** 1.0.0 | **Date:** March 11, 2026 | **Purpose:** Atomic-precision reference for web/mobile feature parity alignment

---

## Table of Contents

1. [Customization System](#1-customization-system)
2. [Nodes (Virtual Currency)](#2-nodes-virtual-currency)
3. [Direct Messages](#3-direct-messages)
4. [Friend System](#4-friend-system)
5. [Discovery System](#5-discovery-system)
6. [User Profile](#6-user-profile)
7. [Settings](#7-settings)
8. [Forum System](#8-forum-system)
9. [Parity Gap Summary](#9-parity-gap-summary)

---

## 1. Customization System

### Architecture Overview

**Web:** Single page 3-panel layout (sidebar → main content → live preview panel). Routes on `/customize/:category`. 5 category definitions (`identity`, `themes`, `chat`, `effects`, `progression`). Progression tab deleted (gamification removal) but category still defined.

**Mobile:** Navigation hub pattern (hub screen → sub-screens). 2 category cards (Identity, Effects & Themes) + 3 quick action shortcuts (Badges, Titles, Theme).

### Web — All Categories & Sub-Sections

#### Tab 1: Identity Customization (7 sub-tabs)

| Sub-Tab | File | What It Does |
|---------|------|-------------|
| Avatar Borders | `apps/web/src/pages/customize/identity-customization/sections/borders-section.tsx` | 150+ borders with rarity color + animation preview + equip button |
| Titles | `apps/web/src/pages/customize/identity-customization/sections/titles-section.tsx` | 30+ animated title styles |
| Badges | `apps/web/src/pages/customize/identity-customization/sections/badges-section.tsx` | 40+ badges, equip up to 5 |
| Profile Layouts | `apps/web/src/pages/customize/identity-customization/sections/layouts-section.tsx` | 5 templates: classic, modern, compact, showcase, gaming |
| Name Styles | `apps/web/src/pages/customize/identity-customization/sections/name-styles-section.tsx` | Font, effect, primary + secondary color pickers |
| Nameplates | `apps/web/src/pages/customize/identity-customization/sections/nameplates-section.tsx` | Nameplate equip selector |
| Profile Effects | `apps/web/src/pages/customize/identity-customization/sections/profile-effects-section.tsx` | Profile effect equip selector |

**Supporting files:** `useIdentityCustomization.ts` (hook, fetches from API with static fallback `ALL_BORDERS`, `ALL_TITLES`, `ALL_BADGES`), `constants.ts` (6 rarities: free→mythic, 5 profile layouts, rarity color mapping), `types.ts` (`Border`, `Title`, `Badge`, `ProfileLayout`, `RarityOption`), `search-filter-bar.tsx`, `save-button.tsx`.

#### Tab 2: Theme Customization

| Component | File | What It Does |
|-----------|------|-------------|
| Main Page | `apps/web/src/pages/customize/theme-customization/page.tsx` | SearchBar + ProfileThemePicker + SecretThemeSection + SaveButton |
| Theme Picker | `apps/web/src/pages/customize/theme-customization/profile-theme-picker.tsx` | Grid of theme cards with category filter |
| Secret Themes | `apps/web/src/pages/customize/theme-customization/secret-theme-section.tsx` | Hidden/secret chat theme equip slot |
| Theme Card | `apps/web/src/pages/customize/theme-customization/theme-card.tsx` | Individual theme preview |
| Category Tabs | `apps/web/src/pages/customize/theme-customization/category-tabs.tsx` | Filter by: `profile`, `chat`, `forum`, `app` |

**Hook:** `useThemeCustomization` → `useCustomizationStore`. State: `profileTheme`, `chatTheme`, `forumTheme`, `appTheme`. Fetches from `GET /api/v1/themes`.

#### Tab 3: Chat Styling (3 sub-tabs)

| Sub-Tab | File | What It Does |
|---------|------|-------------|
| Bubble Styles | `apps/web/src/pages/customize/chat-customization/bubble-styles-section.tsx` | 9 styles: default, pill, sharp, asymmetric, aero, compact, glass, neon, comic |
| Message Effects | `apps/web/src/pages/customize/chat-customization/message-effects-section.tsx` | 7+ effects: none, bounce, slide, fade, scale, pop, rotate |
| Fine Controls | `apps/web/src/pages/customize/chat-customization/advanced-controls-section.tsx` | Sliders: border radius, shadow intensity, glass effect, bubble tail, hover effects, entrance animation |

#### Tab 4: Effects (3 sub-tabs)

| Sub-Tab | File | What It Does |
|---------|------|-------------|
| Particle Effects | `apps/web/src/pages/customize/effects-customization/particle-effects-section.tsx` | 12+: snow, confetti, stars, fireflies, bubbles, sakura, matrix, sparkles, flames… |
| Background Effects | `apps/web/src/pages/customize/effects-customization/background-effects-section.tsx` | 10+ background effect presets |
| UI Animations | `apps/web/src/pages/customize/effects-customization/animation-sets-section.tsx` | 8+ animation set presets |

**Live particle preview:** `particle-preview.tsx` + `particleDataGenerators.ts`.

#### Tab 5: Progression — DELETED

Category definition remains in `customizeCategories.ts` but component deleted. `TODO(phase-26): Rewire — gamification components deleted`.

### Mobile — All Screens

| Screen | File | What It Does |
|--------|------|-------------|
| Hub | `apps/mobile/src/screens/customize/customize-screen.tsx` | 2 category cards + 3 quick actions |
| Identity | `apps/mobile/src/screens/customize/identity-customization-screen.tsx` | Profile preview + About Me (190 chars) + 5 navigation items: Title, Badge, Avatar, Avatar Decoration, Profile Visibility |
| Effects & Themes | `apps/mobile/src/screens/customize/effects-customization-screen.tsx` | Accent color picker (8 swatches) + 4 nav cards: App Theme, Chat Bubbles, UI Customization, Holographic Effects |
| Badge Selection | `apps/mobile/src/screens/customize/badge-selection-screen.tsx` | FlatList of badges → `GET /api/v1/users/me/badges` → equip via `POST /api/v1/users/me/badge` |
| Title Selection | `apps/mobile/src/screens/customize/title-selection-screen.tsx` | FlatList of titles → `GET /api/v1/users/me/titles` → equip via `POST /api/v1/users/me/title` |

### Stores

| Store | Platform | File | Key Details |
|-------|----------|------|-------------|
| `useCustomizationStore` | Web | `apps/web/src/modules/settings/store/customization/customizationStore.ts` | 58 state properties. Zustand + persist (localStorage). Groups: Theme, Avatar, Chat, Profile, Identity, Display Name Style, Nameplate, Profile Theme Preset |
| Schema mapper | Web | `apps/web/src/modules/settings/store/customization/customizationStore.schema.ts` | camelCase↔snake_case for 30+ fields. Debounced save via `PATCH /api/v1/me/customizations` |
| Selectors | Web | `apps/web/src/modules/settings/store/customization/customizationStore.selectors.ts` | 25+ individual selectors (e.g., `useThemePreset`, `useChatBubbleStyle`, `useEquippedTitle`) |
| Mappings | Web | `apps/web/src/modules/settings/store/customization/mappings.ts` | `BORDER_ID_TO_TYPE` (18), `BUBBLE_ID_TO_STYLE` (12), `EFFECT_ID_TO_ANIMATION` (7), `TITLE_DISPLAY_NAMES` |
| `useThemeStore` | Web | `apps/web/src/stores/theme/store.ts` | Color presets (12 values), profile theme, chat bubble config, effects |
| `customizationStore` | Mobile | `apps/mobile/src/stores/customizationStore.ts` | 325 lines. `CustomizationEngine`, undo/redo (50 deep), live preview mode, AsyncStorage persistence, `exportTheme`/`importTheme` (JSON), `optimizeForDevice` (high/mid/low) |
| `themeStore` | Mobile | `apps/mobile/src/stores/themeStore.ts` | 406 lines. Light/dark palettes, full token set, rarity colors (common→divine), premium gold. Persists via AsyncStorage. Listens to `Appearance` for system scheme |

### API Endpoints

| Endpoint | Method | Platform | Purpose |
|----------|--------|----------|---------|
| `/api/v1/me/customizations` | GET | Web | Load all customization state |
| `/api/v1/me/customizations` | PATCH | Web | Save all customization (debounced, 30+ fields) |
| `/api/v1/cosmetics/borders` | GET | Web | Available borders (TODO, returns `[]`) |
| `/api/v1/cosmetics/titles` | GET | Web | Available titles (TODO, returns `[]`) |
| `/api/v1/cosmetics/badges` | GET | Web | Available badges (TODO, returns `[]`) |
| `/api/v1/themes` | GET | Web | Theme data |
| `/api/v1/users/me/badges` | GET | Mobile | User's earned badges |
| `/api/v1/users/me/badge` | POST | Mobile | Equip badge `{ badge_id }` |
| `/api/v1/users/me/titles` | GET | Mobile | User's earned titles |
| `/api/v1/users/me/title` | POST | Mobile | Equip title `{ title_id }` |

### Parity Gaps — Customization

| Feature | Web | Mobile |
|---------|-----|--------|
| Identity sub-sections | 7 (Borders, Titles, Badges, Layouts, Name Styles, Nameplates, Profile Effects) | 5 (Title, Badge, Avatar, Avatar Decoration, Profile Visibility) |
| Profile Layouts selector | 5 layouts (classic/modern/compact/showcase/gaming) | **Missing** |
| Name Style editor | Font + effect + dual color pickers | **Missing** (exists separately in ProfileCustomization) |
| Nameplates | Equip selector in identity tab | **Missing** (exists in profile module, not customize) |
| Profile Effects | Equip selector in identity tab | **Missing** (exists in profile module, not customize) |
| Theme categories | 4 (profile/chat/forum/app) + secret themes | Accent color only (8 swatches) |
| Chat bubble styles | 9 styles with fine controls (sliders) | Navigates to separate ChatBubbles screen |
| Particle effects | 12+ with live preview | **Missing** |
| Background effects | 10+ presets | **Missing** |
| UI animation sets | 8+ presets | **Missing** |
| Live preview panel | Real-time right-side panel | **Missing** |
| Undo/redo | **Missing** | 50-deep undo/redo history |
| Device optimization | **Missing** | `optimizeForDevice` (high/mid/low tier) |
| Theme export/import | **Missing** | JSON export/import |

---

## 2. Nodes (Virtual Currency)

### How It Works

Nodes is CGraph's **Stripe-backed digital currency**. Users buy node bundles via Stripe Checkout, then spend nodes on tipping creators (20% platform cut), unlocking gated content, and cosmetic purchases. Creators can withdraw nodes to fiat (EUR). All balance mutations use `SELECT FOR UPDATE` row-level locking.

### Backend

| File | Purpose |
|------|---------|
| `apps/backend/lib/cgraph/nodes/nodes.ex` | Context module (510 lines): wallet CRUD, credit/debit with locking, tipping (20% cut), content unlock, hold release, withdrawal |
| `apps/backend/lib/cgraph/nodes/node_wallet.ex` | Schema: `available_balance`, `pending_balance`, `lifetime_earned`, `lifetime_spent` |
| `apps/backend/lib/cgraph/nodes/node_transaction.ex` | Ledger: `amount`, `type`, `reference_id/type`, `platform_cut`, `net_amount`, `hold_until`, `metadata` |
| `apps/backend/lib/cgraph/nodes/node_bundles.ex` | 5 bundles: Starter(500/€4.99), Popular(1200/€9.99/+20%), Creator(2800/€19.99/+40%), Pro(6500/€39.99/+63%), Ultimate(17000/€99.99/+70%) |
| `apps/backend/lib/cgraph/nodes/withdrawal_request.ex` | Withdrawal tracking: `pending → processing → completed/failed` |
| `apps/backend/lib/cgraph_web/controllers/nodes_controller.ex` | 7 REST actions |

### Transaction Types

| Type | Sign | Platform Cut | Hold |
|------|------|-------------|------|
| `purchase` | + | No | No |
| `tip_sent` | - | No | No |
| `tip_received` | + | 20% | 21 days |
| `content_unlock` | - | No | No |
| `subscription_received` | + | 20% | 21 days |
| `subscription_sent` | - | No | No |
| `withdrawal` | - | No | No |
| `cosmetic_purchase` | - | No | No |

### Web Implementation

| File | Purpose |
|------|---------|
| `apps/web/src/pages/nodes/nodes-wallet.tsx` | Balance card, filterable transaction history, withdrawal button |
| `apps/web/src/pages/nodes/nodes-shop.tsx` | Bundle grid, Stripe Checkout trigger |
| `apps/web/src/modules/nodes/store/nodesStore.ts` | Zustand store, persisted to localStorage |
| `apps/web/src/modules/nodes/services/nodesApi.ts` | HTTP wrapper for all 7 endpoints |
| `apps/web/src/modules/nodes/hooks/useNodes.ts` | TanStack Query: `useNodeWallet`, `useNodeTransactions`, `useNodeBundles`, `useSendTip`, `useUnlockContent`, `useCreateCheckout`, `useRequestWithdrawal` |
| `apps/web/src/modules/nodes/components/tip-button.tsx` | Inline tip button for profiles/posts |
| `apps/web/src/modules/nodes/components/tip-modal.tsx` | Preset amounts (10/50/100/500) + custom, shows 80/20 split |
| `apps/web/src/modules/nodes/components/withdrawal-modal.tsx` | Min 1000 nodes, EUR conversion (€0.008/node) |

### API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/nodes/wallet` | Get wallet balance |
| GET | `/api/v1/nodes/transactions` | Transaction history (filterable) |
| GET | `/api/v1/nodes/bundles` | Available bundles |
| POST | `/api/v1/nodes/checkout` | Create Stripe Checkout `{ bundle_id }` |
| POST | `/api/v1/nodes/tip` | Send tip `{ recipient_id, amount }` |
| POST | `/api/v1/nodes/unlock` | Unlock content `{ thread_id }` |
| POST | `/api/v1/nodes/withdraw` | Request withdrawal `{ nodes_amount }` |

### Parity Gap — Nodes

| Feature | Web | Mobile |
|---------|-----|--------|
| Wallet page | ✅ Full | ❌ **Not implemented** |
| Shop/bundles | ✅ Full | ❌ **Not implemented** |
| Tip button/modal | ✅ Full | ❌ **Not implemented** |
| Content unlock | ✅ Full | ❌ **Not implemented** |
| Withdrawal | ✅ Full | ❌ **Not implemented** |
| Store | ✅ Zustand + TanStack | ❌ **None** |
| Types | ✅ Local in `modules/nodes/types/` | ❌ **None** |

**Mobile has zero awareness of the nodes system.**

---

## 3. Direct Messages

### Architecture

**Web:** Sliced store pattern — `useChatStore` orchestrator composes 5 separate slice files (messaging, operations, scheduled, message-ops). 70+ components. Full Secret Chat module with ghost mode, 12 themes, panic wipe, Triple Ratchet (PQXDH) encryption.

**Mobile:** Single-file store (1016 lines). 19 hooks + 19 components in conversation screen. Offline-first via WatermelonDB. No Secret Chat module.

### Web Store Slices

| Slice | File | Actions |
|-------|------|---------|
| Orchestrator | `apps/web/src/modules/chat/store/chatStore.impl.ts` (242 lines) | Composes all slices |
| Messaging | `apps/web/src/modules/chat/store/chatStore.messaging.ts` (446 lines) | `sendMessage`, `sendEncryptedMessage`, `decryptAndAddMessage` (Double Ratchet + X3DH) |
| Operations | `apps/web/src/modules/chat/store/chatStore.operations.ts` (185 lines) | `setActiveConversation`, `setTypingUser` (6s auto-clear), `createConversation`, `markAsRead`, reactions |
| Scheduled | `apps/web/src/modules/chat/store/chatStore.scheduled.ts` (143 lines) | Scheduled message CRUD |
| Message Ops | `apps/web/src/modules/chat/store/chatStore.message-ops.ts` | `addMessage`, `updateMessage`, `removeMessage`, `editMessage`, `deleteMessage`, reactions |
| Thread Store | `apps/web/src/modules/chat/store/threadStore.ts` (213 lines) | Threaded replies: `openThread`, `closeThread`, `fetchMoreReplies`, `sendThreadReply` |
| Chat Bubble Store | `apps/web/src/modules/chat/store/chatBubbleStore.impl.ts` | Legacy wrapper → delegates to `useThemeStore` |
| Chat Effects Store | `apps/web/src/modules/chat/store/chatEffectsStore.impl.ts` (321 lines) | Message effects, bubble styles, emoji packs, typing indicators, sound effects |

### Mobile Store

| Store | File | Key Differences |
|-------|------|----------------|
| `useChatStore` | `apps/mobile/src/stores/chatStore.ts` (1016 lines) | Single file (not sliced). Adds: WatermelonDB offline (`getLocalMessages`, `saveMessageLocally`, `syncWatermelon`), delivery tracking (`sending`/`sent`/`delivered`/`read`/`failed`), `subscribeToConversation` (Phoenix channel) |

### Secret Chat (Web Only)

| File | Purpose |
|------|---------|
| `apps/web/src/modules/secret-chat/store/secretChatStore.ts` | Session, ghost mode, 12 themes, panic wipe |
| `apps/web/src/modules/secret-chat/hooks/useSecretChat.ts` | Triple Ratchet (PQXDH) via `@cgraph/crypto` |
| Components | `GhostModeIndicator`, `PanicWipeButton`, `SecretChatHeader`, `SecretIdentity`, `TimerCountdown` |
| Backend | `apps/backend/lib/cgraph_web/channels/secret_chat_channel.ex`, `secret_chat_controller.ex`, `apps/backend/lib/cgraph/messaging/secret_chat.ex` |

**12 Secret Chat Themes:** void, redacted, midnight, signal, ghost, cipher, onyx, eclipse, static, shadow, obsidian, abyss.

### Message Types (Both Platforms)

`text`, `image`, `video`, `file`, `audio`, `voice`, `sticker`, `gif`, `system`

### Web-Specific Components (70+)

Key unique components: `enhanced-conversation.tsx` (WebGL shader backgrounds, AI themes), `message-search.tsx` (cross-conversation search), `e2ee/key-verification`, `device-verification-dialog`, `safety-number-dialog`, `chat-effects/`, `ambient-background/`, `ui-settings-panel/`.

### Mobile-Specific Components

Key unique components: `QRCodeScanner`, `lightbox-modal`, `swipeable-message`, `morphing-input-button`, `video-player-modal`.

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/conversations` | GET/POST | List/create conversations |
| `/api/v1/conversations/:id/messages` | GET | Paginated messages `?before=&limit=50` |
| `/api/v1/saved-messages` | GET/DELETE | Bookmarked messages |
| `/conversations/:id/scheduled-messages` | GET/POST/PUT/DELETE | Scheduled message CRUD |
| `/api/v1/search/users?q=` | GET | User search (new conversation) |

### Parity Gaps — DMs

| Feature | Web | Mobile |
|---------|-----|--------|
| Secret Chat | ✅ Full (ghost mode, 12 themes, panic wipe, PQXDH) | ❌ **Not implemented** |
| Thread Store | ✅ Full threaded replies | Display only (`thread-preview`) |
| Chat Effects Store | ✅ Message effects, sound effects, bubble styles | ❌ **Missing** |
| Chat Bubble Customization Store | ✅ `useChatBubbleStore` | ❌ **Missing** |
| Enhanced Conversation | ✅ WebGL shaders, AI themes | ❌ **Missing** |
| Cross-conversation search | ✅ `MessageSearch` component | Per-screen only |
| E2EE key verification UI | ✅ Full modal | ❌ **Missing** (exists in settings, not in chat) |
| WatermelonDB offline | ❌ | ✅ Full offline-first |
| `failed` delivery status | ❌ | ✅ + `isOptimistic` flag |
| QR Code Scanner | ❌ | ✅ |
| Native haptics | ❌ (via animation engine) | ✅ `expo-haptics` |

---

## 4. Friend System

### Web Implementation

| File | Purpose |
|------|---------|
| `apps/web/src/pages/friends/friends/page.tsx` | Main page: sidebar with tabs (All, Online, Pending, Blocked) + add friend form + suggestions |
| `apps/web/src/pages/friends/friends/useFriendsPage.ts` | Orchestrates: tabs, search, add-friend, presence via `socketManager.joinPresenceLobby()` |
| `apps/web/src/pages/friends/friends/friends-tab-panels.tsx` | `PendingTab`, `FriendsListTab`, `BlockedTab` |
| `apps/web/src/pages/social/social/friends-tab.tsx` | Social hub: Friend list with pending requests |
| `apps/web/src/pages/social/social/discover-tab.tsx` | Search users/forums/groups, send friend request inline |

**Web Friend Store** — `useFriendStore` (`apps/web/src/modules/social/store/friendStore.impl.ts`, 212 lines):
- State: `friends`, `pendingRequests`, `sentRequests`, `isLoading`, `error`
- Actions: `fetchFriends`, `fetchPendingRequests`, `fetchSentRequests`, `sendRequest` (username/UUID/email/UID with `#` prefix), `acceptRequest`, `declineRequest`, `removeFriend`, `blockUser`, `unblockUser`
- Uses `createIdempotencyKey()` from `@cgraph/utils`
- Separate normalizers: `friend-normalizers.ts`, `friend-types.ts`

### Mobile Implementation

| File | Purpose |
|------|---------|
| `apps/mobile/src/screens/friends/friend-list-screen.tsx` | Glassmorphism UI, `AnimatedFriendItem`, pull-to-refresh, online count |
| `apps/mobile/src/screens/friends/add-friend-screen.tsx` | Floating particles, search form |
| `apps/mobile/src/screens/friends/user-profile-screen.tsx` | Profile view + action buttons |
| `apps/mobile/src/screens/friends/friend-requests-screen/` | Tabs header, stats, request cards |

**Mobile Friend Store** — `useFriendStore` (`apps/mobile/src/stores/friendStore.ts`, 310 lines):
- Same state shape as web
- Additional: `updateFriendStatus`, `addRequest` (socket mutations)
- Inline normalizers (not separated)

**Mobile Friends Service** — `apps/mobile/src/services/friendsService.ts` (462 lines):
- 20+ dedicated functions including: `getFavoriteFriends`, `toggleFavoriteFriend`, `setFriendNickname`, `getMutualFriends`, `getMutualGroups`, `getFriendSuggestions`, `reportUser`, `searchUsers`
- Rich `UserProfile` type: bio, banner, badges (7 rarity tiers), karma, xp, premiumTier, friendshipStatus, mutualFriendsCount, profileVisibility, stats

### API Endpoints

| Endpoint | Method | Platform | Purpose |
|----------|--------|----------|---------|
| `/api/v1/friends` | GET/POST | Both | List friends / Send request |
| `/api/v1/friends/requests` | GET | Both | Incoming requests |
| `/api/v1/friends/sent` | GET | Both | Outgoing requests |
| `/api/v1/friends/:id/accept` | POST | Both | Accept request |
| `/api/v1/friends/:id/decline` | POST | Both | Decline request |
| `/api/v1/friends/:id` | DELETE/PATCH | Both | Remove friend / Set nickname |
| `/api/v1/friends/:id/block` | POST/DELETE | Both | Block/unblock |
| `/api/v1/friends/online/count` | GET | Mobile only | Online count |
| `/api/v1/friends/favorites` | GET | Mobile only | Favorite friends |
| `/api/v1/friends/:id/favorite` | POST | Mobile only | Toggle favorite |
| `/api/v1/users/:id/mutual-friends` | GET | Mobile only | Mutual friends |
| `/api/v1/users/:id/mutual-groups` | GET | Mobile only | Mutual groups |
| `/api/v1/friends/suggestions` | GET | Mobile only | Friend suggestions |
| `/api/v1/users/:id/report` | POST | Mobile only | Report user |

### Parity Gaps — Friends

| Feature | Web | Mobile |
|---------|-----|--------|
| Send request by | username, UUID, email, UID (`#` prefix) | username, email, UUID |
| Favorites | ❌ **Missing** | ✅ `isFavorite`, `toggleFavoriteFriend` |
| Nicknames | ❌ **Missing** | ✅ `setFriendNickname` via PATCH |
| Mutual friends/groups API | ❌ **Missing** | ✅ `getMutualFriends`, `getMutualGroups` |
| User reporting | ❌ Not in friend store | ✅ `reportUser` API |
| Friend suggestions | ✅ Component exists | ✅ API function exists |
| Idempotency keys | ✅ `createIdempotencyKey()` | ❌ **Missing** |
| UID (`#` prefix) lookup | ✅ | ❌ **Missing** |
| Profile richness | Basic `Friend` type | Rich `UserProfile` (badges, karma, xp, premiumTier) |
| Online tracking | `socketManager.joinPresenceLobby()` | `useFriendPresence` hook |

---

## 5. Discovery System

### Web Implementation

**Explore Page** — `apps/web/src/pages/explore/explore-page.tsx` (205 lines):
Search + category filtering + sort (Popular/Newest/A-Z) + infinite scroll of communities.

**Discovery Module** — `apps/web/src/modules/discovery/`:

| File | Purpose |
|------|---------|
| `store/discoveryStore.ts` | Zustand. Active feed mode + community filter |
| `hooks/useFeed.ts` | TanStack infinite query: `GET /api/v1/feed?mode=X&cursor=Y` |
| `hooks/useFrequencies.ts` | `useTopics`, `useUserFrequencies`, `useUpdateFrequencies` |
| `components/feed-mode-tabs.tsx` | 5 modes: Pulse 💓, Fresh 🆕, Rising 🚀, Deep Cut 💎, Frequency Surf 🏄 |
| `components/frequency-picker.tsx` (143 lines) | Multi-select topic grid with weight sliders (0-100) |
| `components/topic-card.tsx` | Selectable topic card |

**5 Feed Modes:**

| Mode | Icon | Algorithm |
|------|------|-----------|
| `pulse` | 💓 | Hot/trending content |
| `fresh` | 🆕 | Newest posts |
| `rising` | 🚀 | Fast-growing content |
| `deep_cut` | 💎 | Niche/hidden gems |
| `frequency_surf` | 🏄 | Personalized by user frequency weights |

**`FeedThread` type:** `id`, `title`, `slug`, `content_preview`, `thread_type`, `is_locked`, `is_pinned`, `is_content_gated`, `gate_price_nodes`, `view_count`, `reply_count`, `score`, `hot_score`, `weighted_resonates`, `author`, `board`, `created_at`, `updated_at`.

**Discovery Settings:** `apps/web/src/pages/settings/discovery/discovery-settings.tsx` — frequency picker in settings.

### Mobile Implementation

**Explore Screen** — `apps/mobile/src/screens/explore/explore-screen.tsx` (386 lines):
Search + category filter + sort + pull-to-refresh + infinite scroll. Same `GET /api/v1/explore` API.

**Hardcoded 10 categories:** gaming, technology, art, music, education, programming, science, social, sports, entertainment.

### Backend

| File | Purpose |
|------|---------|
| `apps/backend/lib/cgraph/discovery/discovery.ex` | Core module |
| `apps/backend/lib/cgraph/discovery/feed.ex` | Feed generation |
| `apps/backend/lib/cgraph/discovery/user_frequency.ex` | User frequency weights |
| `apps/backend/lib/cgraph/discovery/community_health.ex` | Community health scoring |
| `apps/backend/lib/cgraph/discovery/topic.ex` | Topic management |
| `apps/backend/lib/cgraph/discovery/post_metric.ex` | Post metrics/scoring |

### API Endpoints

| Endpoint | Method | Platform | Purpose |
|----------|--------|----------|---------|
| `/api/v1/explore` | GET | Both | Community discovery `?category=&sort=&q=&limit=&offset=` |
| `/api/v1/feed` | GET | Web only | Algorithmic feed `?mode=X&cursor=Y&community_id=` |
| `/api/v1/topics` | GET | Web only | All discovery topics |
| `/api/v1/frequencies` | GET/PUT | Web only | User frequency weights CRUD |

### Parity Gaps — Discovery

| Feature | Web | Mobile |
|---------|-----|--------|
| Discovery module/store | ✅ Full `useDiscoveryStore` | ❌ **Not implemented** |
| Feed modes | ✅ 5 modes (Pulse/Fresh/Rising/Deep Cut/Frequency Surf) | ❌ **Not implemented** |
| Feed API | ✅ `GET /api/v1/feed` with cursor pagination | ❌ **Not used** |
| Topics/frequency weights | ✅ Full CRUD with weight sliders | ❌ **Not implemented** |
| Frequency Picker | ✅ Multi-select topic grid (0-100 weights) | ❌ **Not implemented** |
| Discovery settings | ✅ Dedicated settings page | ❌ **Not implemented** |
| Categories | Dynamic from API | Hardcoded 10 categories |
| Community discovery | ✅ Full | ✅ Full (same API) |

---

## 6. User Profile

### Web Implementation

**Page** — `apps/web/src/pages/profile/user-profile/user-profile.tsx` (223 lines):
Assembles: Banner, Avatar, NameSection, FriendshipActions, ProfileAbout, StatsGrid, Sidebar, BadgesShowcase, AchievementsShowcase.

| Component | File | What It Renders |
|-----------|------|----------------|
| Banner | `profile-banner.tsx` | Banner with edit overlay, upload, save/cancel |
| Avatar | `profile-avatar.tsx` | `AnimatedAvatar`, edit overlay, level badge |
| Name Section | `profile-name-section.tsx` | Display name, `@username`, verification badge, premium shield, equipped title, status |
| About | `profile-about.tsx` | Bio (500 char max) with inline edit mode |
| Friendship Actions | `friendship-actions.tsx` | Context-dependent: Send/Accept/Decline/Cancel request, Remove, Block, Message |

**Profile Data Model:** `id`, `username`, `displayName`, `avatarUrl`, `bannerUrl`, `bio`, `status`, `statusMessage`, `isVerified`, `isPremium`, `equippedTitle`, `level`, `totalXP`, `streak`, `joinedAt`, `postCount`, `friendCount`.

**Hooks:** `useProfileData` (fetches `GET /api/v1/users/:userId`), `useProfileActions` (uploads via `POST /api/v1/uploads`, patches via `PATCH /api/v1/users/:id`), `useFileUpload`.

**No standalone profileStore** — data fetched on-demand via hooks. Theme data from `useThemeStore` (20+ profile theme presets).

### Mobile Implementation

**ProfileCustomizationScreen** — `apps/mobile/src/screens/profile/ProfileCustomizationScreen.tsx` (981 lines):
11-row customization screen with live preview (tablet: pinned panel, phone: FAB modal).

| Row | What It Customizes |
|-----|-------------------|
| 1 | Display Name |
| 2 | Name Styles (font + effect) |
| 3 | Pronouns |
| 4 | Widgets |
| 5 | Avatar |
| 6 | Avatar Decoration (border) |
| 7 | Nameplate |
| 8 | Profile Effect |
| 9 | Banner |
| 10 | Profile Theme |
| 11 | Bio |

**Sub-components:**

| File | Purpose |
|------|---------|
| `apps/mobile/src/screens/profile/BorderPickerModal.tsx` | 42 borders grouped by 6 rarity tiers (FREE→MYTHIC) |
| `apps/mobile/src/screens/profile/NameplatePicker.tsx` | Horizontal scroll of nameplate styles |
| `apps/mobile/src/screens/profile/user-wall-screen.tsx` | Social timeline: post creation, like/comment |

**Profile Module** — `apps/mobile/src/modules/profile/`:

| File | Purpose |
|------|---------|
| `components/DisplayName.tsx` | Stylized username with 5 effects: `solid`, `gradient`, `neon`, `toon`, `pop`. Font registry, MaskedView for gradients |
| `components/ProfileCard/` | `Nameplate.tsx`, `ProfileBanner.tsx`, `ProfileEffect.tsx`, `ProfileWidgets.tsx`, `profileEffectMap.ts` |
| `pickers/NameStylePicker.tsx` | Font + effect picker |
| `pickers/NameplatePicker.tsx` | Nameplate style picker |
| `pickers/ProfileEffectPicker.tsx` | Profile effect picker |
| `pickers/ProfileThemePicker.tsx` | Theme preset picker |

### API Endpoints

| Endpoint | Method | Platform | Purpose |
|----------|--------|----------|---------|
| `/api/v1/users/:userId` | GET | Web | Fetch profile data |
| `/api/v1/users/:id` | PATCH | Web | Update avatar_url/banner_url |
| `/api/v1/uploads` | POST | Web | File upload |
| `/api/v1/me/avatar` | POST | Mobile | Avatar upload |
| `/api/v1/me` | PUT | Mobile | Profile save (display_name, bio) |
| `/api/v1/me/username` | PUT | Mobile | Username change |
| `/api/v1/users/:id/posts` | GET | Mobile | User wall timeline |

### Parity Gaps — Profile

| Feature | Web | Mobile |
|---------|-----|--------|
| Bio character limit | 500 chars | 190 chars |
| Display name effects | Via theme store presets | 5 effects (solid/gradient/neon/toon/pop) + font registry |
| Nameplate picker | ❌ On profile page | ✅ NameplatePicker |
| Border picker | ❌ On profile page (in customize tab) | ✅ BorderPickerModal (42 borders, 6 rarity tiers) |
| Profile effects | ❌ On profile page | ✅ ProfileEffectPicker |
| Profile widgets | ❌ | ✅ ProfileWidgets |
| Pronouns | ❌ | ✅ Pronouns row |
| User wall/timeline | ❌ **Not implemented** | ✅ UserWallScreen with post creation |
| Username change | ❌ (exists in settings, not profile) | ✅ With cooldown tracking |
| Live preview | ❌ On profile page | ✅ Staged-save with tablet/phone preview |
| Achievements showcase | ✅ | ❌ On profile page |
| Stats grid | ✅ | ❌ On profile page |

---

## 7. Settings

### Web — All Sections

#### Main Settings Panel (7 sections)

| Section | Component | File | Functions |
|---------|-----------|------|-----------|
| Account | `AccountSettings` | `apps/web/src/modules/settings/components/account-settings.tsx` | Email, username (with history modal), password, connected accounts, user ID badge, sync status |
| Security | `SecuritySettingsPanel` | `apps/web/src/modules/settings/components/panels/security-settings-panel.tsx` | 2FA setup (5-step wizard: intro→scan→verify→backup→complete), active sessions, API keys |
| Notifications | `NotificationSettingsPanel` | `apps/web/src/modules/settings/components/panels/notification-settings-panel.tsx` | 12 toggles — see below |
| Privacy | `PrivacySettingsPanel` | `apps/web/src/modules/settings/components/panels/privacy-settings-panel.tsx` | 15 toggles — see below |
| Billing | `BillingSettingsPanel` | `apps/web/src/modules/settings/components/panels/billing-settings-panel.tsx` | Subscription management, payment methods |
| Data Export | `DataExport` | `apps/web/src/pages/settings/data-export.tsx` | GDPR data download |
| Delete Account | `DeleteAccount` | `apps/web/src/pages/settings/delete-account.tsx` | Permanent deletion with confirmation |

#### Additional Web Settings Pages

| Page | File | Functions |
|------|------|-----------|
| App Theme | `apps/web/src/pages/settings/app-theme-settings.tsx` | App-wide theme |
| Badge Selection | `apps/web/src/pages/settings/badge-selection/` | Badge grid with filters, preview modal, equipped badges panel |
| Blocked Users | `apps/web/src/pages/settings/blocked-users/` | Block list with search, unblock confirmation |
| Connected Accounts | `apps/web/src/pages/settings/connected-accounts.tsx` | OAuth providers |
| Custom Emoji | `apps/web/src/pages/settings/custom-emoji/` | Upload and manage custom emoji |
| Discovery | `apps/web/src/pages/settings/discovery/` | Frequency picker and topic weights |
| Email Notifications | `apps/web/src/pages/settings/email-notification-settings.tsx` | Granular email preferences |
| RSS Feeds | `apps/web/src/pages/settings/rss-feeds/` | RSS feed management |
| Storage Management | `apps/web/src/pages/settings/storage-management.tsx` | Storage usage and cleanup |
| Theme Customization | `apps/web/src/pages/settings/theme-customization/` | 4 tabs: avatar, chat, effects, theme + preview panel |
| Title Selection | `apps/web/src/pages/settings/title-selection/` | Title cards with preview modal |
| 2FA Setup | `apps/web/src/pages/settings/two-factor-setup/` | 5-step wizard |

#### Web Settings Store — Every Toggle

**Notification Settings (12 fields):**

| Field | Type | Default |
|-------|------|---------|
| `emailNotifications` | boolean | — |
| `pushNotifications` | boolean | — |
| `notifyMessages` | boolean | — |
| `notifyMentions` | boolean | — |
| `notifyFriendRequests` | boolean | — |
| `notifyGroupInvites` | boolean | — |
| `notifyForumReplies` | boolean | — |
| `notificationSound` | boolean | — |
| `quietHoursEnabled` | boolean | — |
| `quietHoursStart` | string (time) | — |
| `quietHoursEnd` | string (time) | — |
| `dndUntil` | string (datetime) | — |

**Privacy Settings (15 fields):**

| Field | Type | Values |
|-------|------|--------|
| `showOnlineStatus` | boolean | — |
| `showReadReceipts` | boolean | — |
| `showTypingIndicators` | boolean | — |
| `profileVisibility` | enum | `public` / `friends` / `private` |
| `allowFriendRequests` | boolean | — |
| `allowMessageRequests` | boolean | — |
| `showInSearch` | boolean | — |
| `allowGroupInvites` | enum | `anyone` / `friends` / `nobody` |
| `showBio` | boolean | — |
| `showPostCount` | boolean | — |
| `showJoinDate` | boolean | — |
| `showLastActive` | boolean | — |
| `showSocialLinks` | boolean | — |
| `showActivity` | boolean | — |
| `showInMemberList` | boolean | — |

**Appearance Settings (9 fields):**

| Field | Type | Values |
|-------|------|--------|
| `theme` | enum | `light` / `dark` / `system` |
| `compactMode` | boolean | — |
| `fontSize` | enum | `small` / `medium` / `large` |
| `messageDensity` | enum | `comfortable` / `compact` |
| `showAvatars` | boolean | — |
| `animateEmojis` | boolean | — |
| `reduceMotion` | boolean | — |
| `highContrast` | boolean | — |
| `screenReaderOptimized` | boolean | — |

**Locale Settings (4 fields):**

| Field | Type | Values |
|-------|------|--------|
| `language` | string | — |
| `timezone` | string | — |
| `dateFormat` | enum | `mdy` / `dmy` / `ymd` |
| `timeFormat` | enum | `12h` / `24h` |

**Keyboard Settings (2 fields):**

| Field | Type |
|-------|------|
| `keyboardShortcutsEnabled` | boolean |
| `customShortcuts` | object |

**Store Actions:** `fetchSettings`, `updateNotificationSettings`, `updatePrivacySettings`, `updateAppearanceSettings`, `updateLocaleSettings`, `updateKeyboardSettings`, `updateAllSettings`, `resetToDefaults`, `clearError`, `getTheme`, `getShouldReduceMotion`.

**API Endpoints:** `GET /api/v1/settings`, `PUT /api/v1/settings/notifications`, `PUT /api/v1/settings/privacy`, `PUT /api/v1/settings/appearance`, `PUT /api/v1/settings/locale`, `PUT /api/v1/settings/keyboard`.

### Mobile — All Sections

#### Settings Hub Categories

| Category | Items → Screen | File |
|----------|---------------|------|
| **Premium** | CGraph Premium → `Premium` | — |
| **Premium** | Coin Shop → `CoinShop` | — |
| **Features** | Calendar → `Calendar` | — |
| **Features** | Referral Program → `Referrals` | — |
| **Features** | Holographic UI Demo → `HolographicDemo` | `apps/mobile/src/screens/settings/holographic-demo-screen.tsx` |
| **Account** | Edit Profile → `Profile` | `apps/mobile/src/screens/settings/profile-screen.tsx` |
| **Account** | Account → `Account` | `apps/mobile/src/screens/settings/account-screen.tsx` |
| **Account** | Privacy → `Privacy` | `apps/mobile/src/screens/settings/privacy-screen.tsx` |
| **Account** | Sessions → `Sessions` | `apps/mobile/src/screens/settings/sessions-screen.tsx` |
| **Preferences** | Appearance → `Appearance` | `apps/mobile/src/screens/settings/appearance-screen.tsx` |
| **Preferences** | UI Customization → `UICustomization` | `apps/mobile/src/screens/settings/ui-customization-screen/` |
| **Preferences** | Chat Bubbles → `ChatBubbles` | `apps/mobile/src/screens/settings/chat-bubble-settings-screen/` |
| **Preferences** | Avatar Settings → `AvatarSettings` | `apps/mobile/src/screens/settings/avatar-settings-screen/` |
| **Preferences** | Notifications → `Notifications` | `apps/mobile/src/screens/settings/notifications-screen.tsx` |
| **About** | Help & Support | — |
| **About** | Terms of Service → `TermsOfService` | — |
| **About** | Privacy Policy → `PrivacyPolicy` | — |
| **Footer** | Logout + version display | — |

#### Additional Mobile Settings Screens

| Screen | File | Functions |
|--------|------|-----------|
| Blocked Users | `apps/mobile/src/screens/settings/blocked-users-screen.tsx` | Block list |
| Device Management | `apps/mobile/src/screens/settings/device-management-screen.tsx` | Device management |
| Email Notifications | `apps/mobile/src/screens/settings/email-notifications-screen.tsx` | Email preferences |
| 2FA Setup | `apps/mobile/src/screens/settings/two-factor-setup/` | 5-step wizard |
| Custom Emoji | `apps/mobile/src/screens/settings/custom-emoji/` | Emoji management, pack browser |
| RSS Feeds | `apps/mobile/src/screens/settings/rss-feeds-screen.tsx` | RSS feeds |
| Profile Visibility | `apps/mobile/src/screens/settings/profile-visibility-screen/` | Visibility toggles |
| Presence Status | `apps/mobile/src/screens/settings/presence-status-screen.tsx` | Online/idle/DND/invisible |
| DND Schedule | `apps/mobile/src/screens/settings/dnd-schedule-screen.tsx` | Do Not Disturb scheduling |
| Key Verification | `apps/mobile/src/screens/settings/key-verification-screen.tsx` | E2EE key verification |

**Mobile Privacy Screen (6 toggles):** online status, typing indicators, read receipts, DMs, friend requests, search visibility.

**Mobile Settings Store** — `apps/mobile/src/stores/settingsStore.ts` (485 lines): Same Zustand structure as web, persists via AsyncStorage. Identical `UserSettings` shape **except no `keyboard` settings**.

**Mobile Settings Service** — `apps/mobile/src/services/settingsService.ts` (666 lines): Rich API service covering `AccountInfo`, `AvatarSettings`, `AvatarFrame` (7 rarities), `AvatarBadge`, `ChatBubbleSettings` (5 styles), `CustomEmoji`, `EmojiPack`, `RssFeed`, `UICustomization` (colors, fonts, border radius, glass intensity, particles, animation speed, haptics, sounds), `NotificationPreference`.

### Parity Gaps — Settings

| Feature | Web | Mobile |
|---------|-----|--------|
| Keyboard settings | ✅ 2 fields | ❌ **N/A** (no keyboard on mobile) |
| Biometric auth | ❌ **N/A** | ✅ Face ID/Touch ID toggle |
| Premium/Coin Shop in settings | Via billing panel | ✅ Dedicated section |
| Calendar in settings | ❌ | ✅ Settings → Calendar |
| Referrals in settings | ❌ | ✅ Settings → Referrals |
| Holographic demo | ❌ | ✅ |
| Presence status screen | ❌ (in privacy toggles) | ✅ Dedicated screen |
| DND schedule screen | ✅ Panel in notifications | ✅ Dedicated screen |
| Key verification in settings | ❌ | ✅ Dedicated screen |
| Discovery settings | ✅ Frequency picker | ❌ **Missing** |
| Storage management | ✅ | ❌ **Missing** |
| Connected accounts page | ✅ | ❌ **Missing** |
| Privacy toggles count | 15 fields | 6 toggles |

---

## 8. Forum System

### Architecture

**Web:** Massively complex — 12 store files (orchestrator + 11 slices/standalone), 50+ module components, 10 admin panels, full BBCode editor, real-time via 3 Phoenix channel hooks, thread PDF export, emoji pack marketplace.

**Mobile:** Simplified — single store (297 lines, ~15 actions), basic screens mirroring web pages, flat comment display.

### Web Store Slices

| Store | File | Scope |
|-------|------|-------|
| `useForumStore` | `apps/web/src/modules/forums/store/forumStore.impl.ts` | Main orchestrator — composes all slices |
| Core | `forumStore.core.ts` | CRUD: forums, posts, comments, voting, sorting, search |
| Forum CRUD | `forumStore.forumCrud.ts` | Create/update/delete forums, subscribe/unsubscribe, leaderboard, top forums |
| Moderation | `forumStore.moderation.ts` | Pin/unpin, lock/unlock, delete, move/split/merge threads, close/reopen |
| Features | `forumStore.features.ts` | Thread prefixes, ratings, attachments, edit history, polls, subscriptions, categories |
| Admin | `forumStore.admin.ts` | User groups CRUD, warnings, bans, moderation queue, reports |
| `usePermissionsStore` | `forumStore.permissions.ts` | Board/forum permissions, templates, effective permissions (21 permission flags) |
| `useForumLeaderboardStore` | `forumStore.leaderboard.ts` | Leaderboard entries, my rank, period filtering |
| `useRssConfigStore` | `forumStore.rss.ts` | RSS feed config per board |
| `useUserGroupsStore` | `forumStore.userGroups.ts` | Groups, secondary groups, auto-rules |
| `useEmojiPackStore` | `forumStore.emoji.ts` | Emoji packs CRUD, marketplace, import/export |
| `useAnnouncementStore` | `announcementStore.impl.ts` | Announcements CRUD |
| `useForumHostingStore` | `forumHostingStore.impl.ts` | Forum hosting management |
| `useForumThemeStore` | `forumThemeStore.ts` | Forum theme management |

### Web Forum Pages

| Page | File | Features |
|------|------|----------|
| Forum List | `apps/web/src/pages/forums/forums/page.tsx` | Header, sidebar, post cards, sort controls |
| Board View | `apps/web/src/pages/forums/forum-board-view/` | Boards list, threads list, members list, board banner |
| Post View | `apps/web/src/pages/forums/forum-post/` | Post content, vote sidebar, comments (threaded), report modal |
| Create Forum | `apps/web/src/pages/forums/create-forum/` | 4-step wizard: basic info → appearance → settings → confirm |
| Create Post | `apps/web/src/pages/forums/create-post/` | 5 post types (text/link/image/video/poll) + poll form |
| Admin | `apps/web/src/pages/forums/forum-admin/` | 10 panels: general, appearance, categories, members, moderators, posts, rules, mod-queue, analytics |
| Leaderboard | `apps/web/src/pages/forums/forum-leaderboard/` | Leaderboard cards, sidebar, top forums |
| Moderation Queue | `apps/web/src/pages/forums/moderation-queue/` | Queue list with bulk actions, filters, reject modal |
| Search Results | `apps/web/src/pages/forums/forum-search-results/` | Search filters, result cards |
| Board Permissions | `apps/web/src/pages/forums/board-permissions.tsx` | Permission editor |
| User Groups | `apps/web/src/pages/forums/forum-user-groups.tsx` | Group management |

### Web-Only Forum Components

`bbcode-editor/`, `forum-hierarchy-tree/`, `threaded-comment-tree.tsx`, `nested-comments.tsx`, `multi-quote-indicator.tsx`, `thread-pdf-export/`, `emoji-picker/` (marketplace), `announcement-banner.tsx`, `customization-center/`, `plugin-settings/`, `user-signature.tsx`, `subscription-manager/`, `rss-feed/`.

### Web Real-Time Hooks

| Hook | File | Channel |
|------|------|---------|
| `useBoardSocket` | `apps/web/src/modules/forums/hooks/useBoardSocket.ts` | Board-level events |
| `useForumSocket` | `apps/web/src/modules/forums/hooks/useForumSocket.ts` | Forum-level events |
| `useThreadSocket` | `apps/web/src/modules/forums/hooks/useThreadSocket.ts` | Thread-level events |

### Mobile Forum Screens

| Screen | File | Features |
|--------|------|----------|
| Forum List | `apps/mobile/src/screens/forums/forum-list-screen.tsx` | Animated items |
| Forum View | `apps/mobile/src/screens/forums/forum-screen.tsx` | Posts list, voting, create post button |
| Post View | `apps/mobile/src/screens/forums/post-screen.tsx` (641 lines) | Comments, voting, thread prefix, ratings, attachments, polls, edit history, delete |
| Board View | `apps/mobile/src/screens/forums/forum-board-screen.tsx` | Board view |
| Create Post | `apps/mobile/src/screens/forums/create-post-screen/` | Post creation with animated components |
| Create Forum | `apps/mobile/src/screens/forums/create-forum-screen.tsx` | Forum creation |
| Admin | `apps/mobile/src/screens/forums/forum-admin-screen.tsx` | Tab views + ban modal |
| Settings | `apps/mobile/src/screens/forums/forum-settings-screen.tsx` | Forum settings |
| Customization | `apps/mobile/src/screens/forums/forum-customization-screen.tsx` | Forum customization |
| Leaderboard | `apps/mobile/src/screens/forums/forum-leaderboard-screen.tsx` | Animated podium, tabs, period selector |
| Search | `apps/mobile/src/screens/forums/forum-search-screen.tsx` | Forum search |
| Moderation | `apps/mobile/src/screens/forums/forum-moderation-screen.tsx` | Moderation tools |
| Board Permissions | `apps/mobile/src/screens/forums/board-permissions-screen.tsx` | Permissions |
| User Groups | `apps/mobile/src/screens/forums/forum-user-groups-screen.tsx` | User groups |

**Mobile Forum Store** — `apps/mobile/src/stores/forumStore.ts` (297 lines):
Actions: `fetchForums`, `fetchForum`, `clearCurrentForum`, `fetchBoards`, `fetchThreads`, `fetchPost`, `deletePost`, `clearCurrentThread`, `fetchComments`, `addComment`, `deleteComment`, `searchForums`, `setSearchQuery`, `clearSearch`, `reset`.

**Mobile Forum Service** — `apps/mobile/src/services/forumService.ts`:
API wrappers for forums/boards/threads/posts/comments CRUD, voting, polls, search.

### Forum Data Model

| Entity | Key Fields |
|--------|-----------|
| `Forum` | id, name, slug, description, icon/bannerUrl, customCss, isNsfw/Private/Public, memberCount, threadCount, postCount, score, upvotes/downvotes, hotScore, weeklyScore, featured, userVote, categories, moderators, ownerId |
| `ForumCategory` | id, name, slug, description, color, order, postCount |
| `Post` | 30+ fields: postType (text/link/image/video/poll), prefix, views, rating, attachments, editHistory, poll, content gating |
| `Comment` | Nested (parentId, children, depth), voting, best answer marking, attachments |
| `ThreadPrefix` | id, name, color, forumId |
| `Poll` | id, question, options, multiSelect, expiresAt, totalVotes |
| `UserGroup` | id, name, color, permissions (21 flags) |
| `ModerationQueueItem` | id, type, content, reporter, status |

### Forum API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/forums` | GET/POST | List/create forums |
| `/api/v1/forums/:id` | GET/PATCH/DELETE | Forum CRUD |
| `/api/v1/forums/:id/subscribe` | POST/DELETE | Subscribe |
| `/api/v1/forums/:id/boards` | GET/POST | Board CRUD |
| `/api/v1/forums/:id/boards/:boardId` | GET/PATCH/DELETE | Board CRUD |
| `/api/v1/forums/:id/boards/:boardId/rss` | PUT | Toggle RSS |
| `/api/v1/forums/:id/posts` | GET/POST | Post CRUD |
| `/api/v1/forums/:id/posts/:postId/pin` | POST/DELETE | Pin/unpin |
| `/api/v1/forums/:id/posts/:postId/lock` | POST/DELETE | Lock/unlock |
| `/api/v1/forums/:id/leaderboard` | GET | Forum leaderboard |
| `/api/v1/forums/:id/thread-prefixes` | GET | Thread prefixes |
| `/api/v1/forums/leaderboard` | GET | Global leaderboard |
| `/api/v1/forums/top` | GET | Top forums |
| `/api/v1/posts/:id` | GET/PATCH/DELETE | Post CRUD |
| `/api/v1/posts/:id/vote` | POST | Vote on post |
| `/api/v1/posts/:id/rate` | POST | Rate thread |
| `/api/v1/posts/:id/comments` | GET/POST | Comments |
| `/api/v1/comments/:id` | PATCH/DELETE | Comment CRUD |
| `/api/v1/comments/:id/vote` | POST | Vote on comment |
| `/api/v1/polls/:id/vote` | POST | Poll vote |
| `/api/v1/polls/:id/close` | POST | Close poll |
| `/api/v1/search/forums` | GET | Forum search |

### Parity Gaps — Forums

| Feature | Web | Mobile |
|---------|-----|--------|
| Store complexity | 12 store files, 100+ actions | 1 store, ~15 actions |
| Nested/threaded comments | ✅ `threaded-comment-tree.tsx`, `nested-comments.tsx` | Flat-ish display |
| Multi-quote | ✅ `useMultiQuote.ts` + buffer | ❌ **Missing** |
| BBCode editor | ✅ Full `bbcode-editor/` | Plain text |
| Real-time sockets | ✅ 3 hooks (board/forum/thread socket) | ❌ **Missing** |
| Permissions system | ✅ Full store: 21 permission flags, templates | Basic screen |
| User groups | ✅ Full CRUD + secondary groups + auto-rules | Basic screen |
| Moderation queue | ✅ Bulk actions, reject modal, filters | Basic screen |
| Announcements | ✅ Announcement store + banner | ❌ **Missing** |
| Forum hosting | ✅ Dedicated store | ❌ **Missing** |
| Emoji pack marketplace | ✅ Dedicated store + marketplace + import/export | ❌ **Missing** |
| Thread PDF export | ✅ `thread-pdf-export.tsx` | ❌ **Missing** |
| Forum themes/customization center | ✅ Full | Theme picker only |
| Admin panels | 10 panels (general, appearance, categories, members, moderators, posts, rules, mod-queue, analytics) | Tab views + ban modal |
| RSS config per board | ✅ `useRssConfigStore` | Subscribe sheet only |

---

## 9. Parity Gap Summary

### Critical Missing (Mobile has ZERO implementation)

| Feature | Impact |
|---------|--------|
| **Nodes (virtual currency)** | Entire module: wallet, shop, tipping, content unlock, withdrawal |
| **Secret Chat** | Ghost mode, 12 themes, panic wipe, Triple Ratchet (PQXDH) |
| **Discovery feed modes** | 5 feed algorithms (Pulse/Fresh/Rising/Deep Cut/Frequency Surf) |
| **Discovery frequency weights** | Topic selection with weight sliders, personalized feed |

### Significant Missing (Mobile has partial or no implementation)

| Feature | Web Has | Mobile Has |
|---------|---------|------------|
| Forum real-time sockets | 3 channel hooks | None |
| Forum threaded comments | Full tree rendering | Flat display |
| Forum multi-quote | Buffer + indicator | None |
| Forum BBCode editor | Full editor | Plain text |
| Forum announcements | Store + banners | None |
| Forum emoji packs | Marketplace + CRUD | None |
| Chat effects store | Full (effects, sounds, bubbles) | None |
| Chat bubble customization store | Full | None |
| Enhanced conversation | WebGL shaders, AI themes | None |
| Cross-conversation message search | Full | Per-screen only |
| Particle/background effects | 12+ particle, 10+ background | None |
| Discovery settings | Frequency picker page | None |
| Privacy settings | 15 toggle fields | 6 toggles |

### Mobile-Only Features (Web needs to catch up)

| Feature | Mobile Has | Web Has |
|---------|-----------|---------|
| Favorites system (friends) | `toggleFavoriteFriend`, `getFavoriteFriends` | None |
| Friend nicknames | `setFriendNickname` via PATCH | None |
| Mutual friends/groups | `getMutualFriends`, `getMutualGroups` | None |
| User wall/timeline | Post creation, like/comment | None |
| WatermelonDB offline DMs | Full offline-first sync | None |
| Profile widgets | ProfileWidgets component | None |
| Pronouns | Profile customization row | None |
| Display name effects | 5 effects (solid/gradient/neon/toon/pop) | Theme presets only |
| Border picker | 42 borders, 6 rarity tiers | In customize tab only |
| Undo/redo (customization) | 50-deep history | None |
| Device tier optimization | `optimizeForDevice` (high/mid/low) | None |
| Theme export/import | JSON format | None |
| Biometric auth | Face ID/Touch ID | N/A (web) |
| Key verification in settings | Dedicated screen | None |

### API Endpoint Divergence

| Area | Web Uses | Mobile Uses | Note |
|------|----------|-------------|------|
| Customization save | `PATCH /api/v1/me/customizations` (bulk) | `POST /api/v1/users/me/badge`, `POST /api/v1/users/me/title` (individual) | Different patterns |
| Cosmetics fetch | `GET /api/v1/cosmetics/borders\|titles\|badges` (TODO, returns []) | `GET /api/v1/users/me/badges\|titles` | Different endpoints |
| Profile update | `PATCH /api/v1/users/:id` | `PUT /api/v1/me` | Different verbs and paths |
| Avatar upload | `POST /api/v1/uploads` (generic) | `POST /api/v1/me/avatar` (dedicated) | Different patterns |
| Feed | `GET /api/v1/feed?mode=X&cursor=Y` | Not used | Mobile doesn't have feed |
| Frequencies | `GET/PUT /api/v1/frequencies` | Not used | Mobile doesn't have frequencies |

---

*End of document. This map reflects the codebase state as of March 11, 2026.*
