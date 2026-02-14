# CGraph Mobile - Revolutionary UI Documentation

## Overview

This document catalogs all the next-generation mobile UI components and screens that have been built
with premium animations, glassmorphism effects, and competitor-surpassing features.

**Version**: 0.9.2 - Revolutionary Edition  
**Last Updated**: January 15, 2026

---

## Table of Contents

1. [Design System Foundation](#design-system-foundation)
2. [Core UI Components](#core-ui-components)
3. [Hooks](#hooks)
4. [Offline Support](#offline-support)
5. [Theme System](#theme-system)
6. [Testing](#testing)
7. [Screen Implementations](#screen-implementations)
8. [Animation Patterns](#animation-patterns)
9. [Integration Points](#integration-points)

---

## Design System Foundation

### Location: `src/lib/design/DesignSystem.ts`

The centralized design system provides consistent styling across all screens.

#### Features:

- **Color Palettes**: Matrix, Neon, Holographic themes
- **Typography Scale**: 8 sizes from xs to 4xl
- **Spacing System**: 8px base unit (4, 8, 12, 16, 20, 24, 32, 40, 48, 64)
- **Shadow Presets**: sm, md, lg, xl with platform-specific implementations
- **Rarity System**: 7 tiers (common → divine) with colors and glow effects

#### Rarity Tiers:

```typescript
type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'divine';

// Each tier has:
// - primary color
// - secondary color
// - glow color for effects
```

---

## Core UI Components

### 1. GlassCard (`src/components/ui/GlassCard.tsx`)

Glassmorphism card component with multiple variants.

**Variants:**

- `frosted` - Standard frosted glass
- `crystal` - Clear crystal effect
- `neon` - Glowing neon borders
- `holographic` - Rainbow shimmer effect

**Props:**

```typescript
interface GlassCardProps {
  variant?: 'frosted' | 'crystal' | 'neon' | 'holographic';
  intensity?: 'subtle' | 'medium' | 'strong';
  borderGradient?: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
}
```

### 2. AnimatedAvatar (`src/components/ui/AnimatedAvatar.tsx`)

Premium avatar component with animated borders and effects.

**Features:**

- Border animations: `none`, `glow`, `gradient`, `rainbow`, `holographic`
- Particle effects: `none`, `sparkles`, `hearts`, `stars`
- Shape options: `circle`, `rounded`, `hexagon`
- Level badge display
- Premium indicator
- Online status dot

**Props:**

```typescript
interface AnimatedAvatarProps {
  source: ImageSourcePropType;
  size?: number;
  borderAnimation?: 'none' | 'glow' | 'gradient' | 'rainbow' | 'holographic';
  shape?: 'circle' | 'rounded' | 'hexagon';
  particleEffect?: 'none' | 'sparkles' | 'hearts' | 'stars';
  levelBadge?: number;
  isPremium?: boolean;
  isOnline?: boolean;
}
```

### 3. ParticleBackground (`src/components/ui/ParticleBackground.tsx`)

Animated floating particles background.

**Particle Types:**

- `orbs` - Floating circular orbs
- `stars` - Twinkling stars
- `snow` - Falling snowflakes
- `bubbles` - Rising bubbles
- `confetti` - Celebration confetti
- `matrix` - Matrix-style rain
- `fireflies` - Glowing fireflies

### 4. TypingIndicator (`src/components/chat/TypingIndicator.tsx`)

6 different animation styles for typing indicators.

**Styles:**

- `dots` - Classic bouncing dots
- `wave` - Wave motion dots
- `pulse` - Pulsing dots
- `bars` - Animated bars
- `bounce` - High bounce dots
- `fade` - Fading in/out dots

**Props:**

```typescript
interface TypingIndicatorProps {
  style?: TypingIndicatorStyle;
  users?: { id: string; name: string }[];
  showNames?: boolean;
  color?: string;
  size?: 'small' | 'medium' | 'large';
  glassEffect?: boolean;
}
```

### 5. EmojiPicker (`src/components/chat/EmojiPicker.tsx`)

Full-featured emoji picker with categories.

**Features:**

- 8 emoji categories (Smileys, People, Animals, Food, Activities, Travel, Objects, Symbols)
- Search functionality
- Skin tone selector (6 tones)
- Recent emojis with AsyncStorage persistence
- Animated modal entry/exit
- Haptic feedback

### 6. StickerPicker (`src/components/chat/StickerPicker.tsx`)

Advanced sticker system with animations and rarity.

**Features:**

- 15+ animation types per sticker
- Rarity-based glow effects
- Pack organization
- Preview animations on hover
- Favorites system

### 7. ErrorBoundary (`src/components/error/ErrorBoundary.tsx`)

Comprehensive error boundary system with variants and HOC support.

**Exports:**

- `ErrorBoundary` - Main class component
- `ScreenErrorBoundary` - Wrapper for full screens
- `ComponentErrorBoundary` - Compact wrapper for individual components
- `withErrorBoundary` - HOC for wrapping components

**Props:**

```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode; // Custom fallback UI
  boundaryName?: string; // Name for logging/tracking
  showDetails?: boolean; // Show error details (default: __DEV__)
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showRetry?: boolean; // Show retry button (default: true)
  onRetry?: () => void; // Custom retry handler
}
```

**Features:**

- Gradient background UI on error
- Stack trace display in development mode
- Retry functionality with state reset
- Haptic feedback on retry
- Logger integration for error tracking
- Compact fallback for ComponentErrorBoundary

---

## Hooks

### 1. useE2EE (`src/hooks/useE2EE.ts`)

Complete end-to-end encryption management hook using Signal Protocol.

**Return Interface:**

```typescript
interface UseE2EEReturn {
  // State (7 properties)
  isSetUp: boolean; // Whether E2EE is configured
  isInitializing: boolean; // Initial check in progress
  isLoading: boolean; // Any operation in progress
  identityKey: string | null; // User's identity key
  deviceId: string | null; // Device identifier
  fingerprint: string | null; // Key fingerprint
  error: Error | null; // Last error

  // Setup actions (3 methods)
  setupE2EE(): Promise<boolean>;
  resetE2EE(): Promise<void>;
  checkSetup(): Promise<void>;

  // Key operations (3 methods)
  generateNewKeys(): Promise<KeyBundle | null>;
  registerKeysWithServer(bundle: KeyBundle): Promise<boolean>;
  refreshOneTimePreKeys(): Promise<boolean>;

  // Encryption/Decryption (2 methods)
  encryptMessage(recipientId: string, plaintext: string): Promise<EncryptedMessage | null>;
  decryptMessage(senderId: string, message: EncryptedMessage): Promise<string | null>;

  // Verification (3 methods)
  generateSafetyNumber(recipientId: string): Promise<string | null>;
  copySafetyNumber(recipientId: string): Promise<void>;
  getFingerprint(): Promise<string | null>;

  // Session management (3 methods)
  getSession(recipientId: string): Promise<Session | null>;
  hasSession(recipientId: string): Promise<boolean>;
  clearSession(recipientId: string): Promise<void>;
}
```

**Features:**

- Signal Protocol key management
- Server key registration (`POST /api/v1/e2ee/keys`)
- Prekey refresh (`POST /api/v1/e2ee/keys/refresh`)
- Recipient bundle fetching (`GET /api/v1/e2ee/bundle/:recipientId`)
- Safety number generation for verification
- 5-minute cache duration for key checks
- Haptic feedback on success/error

**API Integration:**

- `POST /api/v1/e2ee/keys` - Register keys with server
- `POST /api/v1/e2ee/keys/refresh` - Refresh one-time prekeys
- `GET /api/v1/e2ee/bundle/:recipientId` - Fetch recipient's prekey bundle
- `POST /api/v1/e2ee/keys/reset` - Notify server of key reset

---

### 2. useReferrals (`src/hooks/useReferrals.ts`)

Referral program management hook with caching and computed values.

**Return Interface:**

```typescript
interface UseReferralsReturn {
  // Data (5 properties)
  referralCode: string | null;
  stats: ReferralStats | null;
  referrals: Referral[];
  rewardTiers: RewardTier[];
  leaderboard: LeaderboardEntry[];

  // Loading states (4 properties)
  isLoading: boolean;
  isLoadingReferrals: boolean;
  isLoadingLeaderboard: boolean;
  isClaiming: boolean;

  // Error (1 property)
  error: Error | null;

  // Computed values (4 properties)
  currentRank: number | null;
  nextTier: RewardTier | null;
  progressToNextTier: number;
  hasUnclaimedRewards: boolean;

  // Actions (7 methods)
  loadReferralData(): Promise<void>;
  loadReferrals(page?: number, limit?: number): Promise<void>;
  loadLeaderboard(period?: 'daily' | 'weekly' | 'monthly' | 'all_time'): Promise<void>;
  claimReward(tierId: string): Promise<boolean>;
  copyReferralCode(): Promise<void>;
  shareReferralLink(): Promise<void>;
  refresh(forceRefresh?: boolean): Promise<void>;
}
```

**Features:**

- 1-minute cache duration for all data
- Platform-aware share (iOS Share Sheet vs Android intent)
- Clipboard integration for code copying
- Haptic feedback on actions
- Auto-refresh after claiming rewards
- Progress calculation to next tier

**API Integration:**

- `GET /api/v1/referrals/stats` - Get user's referral statistics
- `GET /api/v1/referrals` - List user's referrals with pagination
- `GET /api/v1/referrals/tiers` - Get reward tier definitions
- `GET /api/v1/referrals/leaderboard` - Get referral leaderboard
- `POST /api/v1/referrals/tiers/:id/claim` - Claim tier reward
- `POST /api/v1/referrals/generate` - Generate new referral code

---

### 3. useOfflineQueue (`src/hooks/useOfflineQueue.ts`)

React wrapper for the offline queue system with event subscriptions.

**Return Interface:**

```typescript
interface UseOfflineQueueReturn {
  // State
  pendingItems: QueueItem[];
  failedItems: QueueItem[];
  isProcessing: boolean;
  lastSyncAt: Date | null;

  // Computed values
  hasPendingItems: boolean;
  hasFailedItems: boolean;
  pendingCount: number;
  failedCount: number;

  // Actions
  addToQueue(item: Omit<QueueItem, 'id' | 'createdAt' | 'retryCount'>): Promise<string>;
  removeFromQueue(id: string): Promise<boolean>;
  retryFailed(): Promise<void>;
  clear(): Promise<void>;
  refresh(): Promise<void>;

  // Convenience methods
  queueMessage(conversationId: string, content: string, attachments?: any[]): Promise<string>;
  queueReaction(messageId: string, emoji: string): Promise<string>;
  queueForumPost(forumId: string, title: string, content: string): Promise<string>;
}
```

**Features:**

- Automatic sync on network restore
- Event subscriptions for queue changes
- Priority-based processing
- Convenience methods for common operations
- Real-time pending/failed counts

---

## Offline Support

### OfflineQueue System (`src/lib/offline/OfflineQueue.ts`)

Complete offline-first queue system with network monitoring and retry logic.

**Exports:**

```typescript
// Types
type OfflineItemType =
  | 'message'
  | 'reaction'
  | 'typing'
  | 'read_receipt'
  | 'forum_post'
  | 'forum_reply'
  | 'vote'
  | 'profile_update'
  | 'settings_update'
  | 'attachment_upload'
  | 'other';

enum Priority {
  CRITICAL = 1,
  HIGH = 2,
  NORMAL = 3,
  LOW = 4,
}

interface QueueItem<T = unknown> {
  id: string;
  type: OfflineItemType;
  payload: T;
  priority: Priority;
  retryCount: number;
  maxRetries: number;
  createdAt: number;
  lastAttempt?: number;
  error?: string;
}

// Functions
function addToQueue<T>(
  item: Omit<QueueItem<T>, 'id' | 'createdAt' | 'retryCount'>
): Promise<string>;
function removeFromQueue(id: string): Promise<boolean>;
function getPendingItems(): Promise<QueueItem[]>;
function getFailedItems(): Promise<QueueItem[]>;
function getQueueStats(): Promise<QueueStats>;
function clearQueue(): Promise<void>;
function retryFailedItems(): Promise<void>;
function subscribeToQueue(callback: QueueEventCallback): () => void;
function registerCallback(itemId: string, onSuccess, onFailure): void;
function unregisterCallback(itemId: string): void;
function initializeOfflineQueue(): Promise<void>;
function shutdownOfflineQueue(): Promise<void>;
function getDebugState(): DebugState;
```

**Features:**

- AsyncStorage persistence (`@cgraph_offline_queue`, `@cgraph_offline_failed`)
- Network state monitoring via NetInfo
- Priority-based processing (CRITICAL → LOW)
- Exponential backoff with jitter (1s base, 60s max, 3 max retries)
- Event system (5 event types: added, removed, processing, completed, failed)
- Callback registry for item completion notifications
- Auto-process on network restore
- Debug state getter for troubleshooting

**Queue Events:**

```typescript
type QueueEventType =
  | 'item_added'
  | 'item_removed'
  | 'item_processing'
  | 'item_completed'
  | 'item_failed';

interface QueueEvent {
  type: QueueEventType;
  item?: QueueItem;
  error?: string;
}
```

---

## Theme System

### ThemeContext (`src/contexts/ThemeContext.tsx`)

Comprehensive theme system with light/dark modes and system preference support.

**Exports:**

```typescript
// Provider
export function ThemeProvider({ children }: { children: React.ReactNode }): JSX.Element;

// Hook
export function useTheme(): ThemeContextValue;

// Types
export type ThemeColors = typeof lightColors;
export type ColorSchemeType = 'light' | 'dark';
export type ThemePreferenceType = 'light' | 'dark' | 'system';

// Color Palettes
export const lightColors: ThemeColors;
export const darkColors: ThemeColors;
```

**Context Value:**

```typescript
interface ThemeContextValue {
  colors: ThemeColors; // Current theme colors
  colorScheme: ColorSchemeType; // 'light' or 'dark'
  isDark: boolean; // Convenience boolean
  themePreference: ThemePreferenceType;
  setThemePreference: (pref: ThemePreferenceType) => void;
  toggleTheme: () => void;
}
```

**Color Token Categories (80+ tokens per theme):**

| Category         | Tokens                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Backgrounds**  | `background`, `surface`, `surfaceElevated`, `card`, `modal`                                                            |
| **Primary**      | `primary`, `primaryDark`, `primaryLight`, `primaryMuted`, `primaryBg`, `accent`                                        |
| **Text**         | `text`, `textSecondary`, `textMuted`, `textInverse`, `textLink`                                                        |
| **Borders**      | `border`, `borderLight`, `borderFocus`, `divider`                                                                      |
| **Semantic**     | `error`, `errorLight`, `success`, `successLight`, `warning`, `warningLight`, `info`, `infoLight`                       |
| **UI Elements**  | `cardHover`, `inputBorder`, `inputFocus`, `inputPlaceholder`, `disabled`, `disabledText`                               |
| **Interactive**  | `highlight`, `selection`, `overlayLight`, `shadow`                                                                     |
| **Matrix Theme** | `matrixGreen`, `matrixGlow`, `matrixDark`                                                                              |
| **Chat**         | `chat.bubbleSent`, `chat.bubbleReceived`, `chat.bubbleSentText`, `chat.bubbleReceivedText`, `chat.timestamp`           |
| **Sidebar**      | `sidebar.bg`, `sidebar.hover`, `sidebar.active`, `sidebar.text`, `sidebar.textActive`                                  |
| **Tab Bar**      | `tabBar.bg`, `tabBar.active`, `tabBar.inactive`, `tabBar.border`                                                       |
| **Status**       | `status.online`, `status.away`, `status.dnd`, `status.offline`, `status.invisible`                                     |
| **Rarity**       | `rarity.common`, `rarity.uncommon`, `rarity.rare`, `rarity.epic`, `rarity.legendary`, `rarity.mythic`, `rarity.divine` |
| **Premium**      | `premium.gold`, `premium.silver`, `premium.bronze`                                                                     |

**Light Theme Design:**

- Professional, clean aesthetic with Matrix green accents
- White/gray backgrounds with subtle shadows
- High contrast text for readability
- Soft semantic colors for alerts

**Dark Theme Design:**

- Dark theme with Matrix glow effects
- Deep dark backgrounds (#0d0d0d, #1a1a1a)
- Matrix green (#00ff41) primary color
- Neon glow effects for premium feel

---

## Testing

### Test Infrastructure

**Location:** `src/test/`

| File                    | Purpose                              |
| ----------------------- | ------------------------------------ |
| `setup.ts` (426 lines)  | Jest setup with comprehensive mocks  |
| `utils.tsx` (441 lines) | Test utilities and provider wrappers |

### Test Files

| Test File                                               | Tests  | Coverage                                  |
| ------------------------------------------------------- | ------ | ----------------------------------------- |
| `src/hooks/__tests__/useE2EE.test.ts`                   | 16     | Full hook lifecycle, encryption, sessions |
| `src/hooks/__tests__/useReferrals.test.ts`              | 10     | Data loading, caching, reward claiming    |
| `src/hooks/__tests__/useOfflineQueue.test.ts`           | 14     | Queue operations, events, computed values |
| `src/components/error/__tests__/ErrorBoundary.test.tsx` | 17     | Boundary behavior, retry, HOC             |
| **Total**                                               | **57** | Comprehensive coverage                    |

**Test Categories:**

1. **useE2EE Tests:**
   - Initialization (3): Setup check, identity key loading, not-set-up state
   - Setup (3): Key generation, already-set-up handling, failure handling
   - Reset (2): Key clearing, server notification
   - Key Operations (2): New key generation, prekey refresh
   - Encryption (2): Message encryption, not-set-up handling
   - Verification (1): Safety number generation
   - Sessions (2): Session retrieval, existence check

2. **useReferrals Tests:**
   - Loading (2): Data load on mount, referrals list load
   - Computed (2): Current rank, next tier calculation
   - Actions (2): Claim reward, error handling
   - Caching (2): Cache usage, force refresh

3. **useOfflineQueue Tests:**
   - Initialization (3): State load, event subscription, cleanup
   - Computed (4): Pending/failed checks, counts
   - Queue Ops (4): Add, remove, retry, clear
   - Convenience (3): Queue message, reaction, forum post
   - Refresh (1): Manual refresh

4. **ErrorBoundary Tests:**
   - Basic (5): Render children, catch errors, show message, stack trace, hide retry
   - Details (2): Dev mode details, hidden details
   - Custom (1): Custom fallback rendering
   - Retry (2): State reset, callback invocation
   - Callback (1): onError invocation
   - Variants (4): ScreenErrorBoundary, ComponentErrorBoundary
   - HOC (3): Wrapping, error catching, display name

---

## Screen Implementations

### 1. SearchScreen (`src/screens/search/SearchScreen.tsx`)

**Version:** 3.0.0 - Revolutionary Edition

**Features:**

- Animated search bar with pulsing glow effect
- Voice search button with waveform animation
- Recent searches (AsyncStorage persisted, swipe-to-delete)
- Trending topics with live pulse animation and LIVE badge
- Advanced filters modal (blur backdrop, spring animations)
- Quick actions grid (Find Friends, Join Groups, Explore Forums, Discover)
- Skeleton loading states with shimmer
- Category tabs with gradient selection
- ID search panel
- Pro tip card

**Filter Options:**

- Verified only toggle
- Premium users only toggle
- Has profile picture toggle
- Sort by: relevance, recent, popular

**Key Animations:**

```typescript
// Header entry animation
Animated.parallel([
  Animated.timing(headerOpacity, { toValue: 1, duration: 400 }),
  Animated.spring(headerTranslateY, { toValue: 0, friction: 8 }),
]);

// Search glow effect
const glowBorderColor = searchGlow.interpolate({
  inputRange: [0, 1],
  outputRange: ['transparent', 'rgba(59, 130, 246, 0.5)'],
});

// Trending item pulse
Animated.loop(
  Animated.sequence([
    Animated.timing(pulseAnim, { toValue: 1.02, duration: 1500 }),
    Animated.timing(pulseAnim, { toValue: 1, duration: 1500 }),
  ])
);
```

**API Integration:**

- `GET /api/v1/search/users` - User search
- `GET /api/v1/groups` - Group search
- `GET /api/v1/forums` - Forum search
- `GET /api/v1/users/:id` - User by ID
- `GET /api/v1/groups/:id` - Group by ID
- `GET /api/v1/forums/:id` - Forum by ID

---

### 2. CoinShopScreen (`src/screens/premium/CoinShopScreen.tsx`)

**Version:** 2.0.0 - Revolutionary Edition

**Features:**

- Animated 3D coin with rotation and glow
- Floating gold particles background
- Animated balance counter (counts up smoothly)
- Special offers carousel with countdown timers
- Enhanced balance card with daily bonus
- Premium subscription banner
- Rarity-based bundle cards
- Category tabs (Bundles, Themes, Badges, Effects, Boosts)

**Components:**

```typescript
// Animated 3D Coin
function Animated3DCoin({ size = 70, delay = 0 });
// - Y-axis rotation animation
// - Scale breathing animation
// - Glow pulse animation

// Animated Counter
function AnimatedCounter({ value, style });
// - Smooth count-up using Animated.Value listener

// Floating Particles
function FloatingParticles({ count = 12 });
// - Gold-colored particles rising upward

// Countdown Timer
function CountdownTimer({ endsInHours });
// - Real-time HH:MM:SS countdown
```

**Coin Bundles:** | ID | Coins | Bonus | Price | Rarity | |----|-------|-------|-------|--------| |
small | 100 | 0 | $0.99 | common | | medium | 500 | 50 | $4.99 | popular | | large | 1,200 | 200 |
$9.99 | - | | mega | 2,500 | 500 | $19.99 | best value | | ultra | 6,000 | 1,500 | $49.99 | - |

**Special Offers:**

- Starter Pack: 1,000 coins, 50% off, 24h countdown
- Weekend Special: 3,000 coins, 50% off, 48h countdown
- Mega Bundle: 10,000 coins, 60% off, 12h countdown

**API Integration:**

- `GET /api/v1/coins` - User balance
- `GET /api/v1/coins/daily-status` - Daily claim status
- `POST /api/v1/coins/daily-claim` - Claim daily bonus
- `POST /api/v1/shop/:itemId/purchase` - Purchase item
- Native payment via `paymentService.purchaseProduct()`

---

### 3. LeaderboardScreen (`src/screens/community/LeaderboardScreen.tsx`)

**Version:** Revolutionary Edition

**Features:**

- Animated 3D-style podium for top 3
- Staggered podium entry animations
- Category filters (Karma, XP, Streak, Messages, Posts)
- Time period filters (Today, This Week, This Month, All Time)
- Rank change indicators (up/down arrows with delta)
- Crown emoji for #1
- Animated avatars with particle effects
- Pull-to-refresh with haptics

**Podium Animation:**

```typescript
// Staggered podium entry (2nd, 1st, 3rd order)
Animated.stagger(200, [
  Animated.spring(podiumAnims[1], { toValue: 1, tension: 50, friction: 8 }),
  Animated.spring(podiumAnims[0], { toValue: 1, tension: 50, friction: 8 }),
  Animated.spring(podiumAnims[2], { toValue: 1, tension: 50, friction: 8 }),
]);

// Scale bounce effect
const scale = podiumAnims[index].interpolate({
  inputRange: [0, 0.5, 1],
  outputRange: [0.5, 1.1, 1],
});
```

**Categories:**

```typescript
const CATEGORIES = [
  { key: 'karma', label: 'Karma', icon: 'heart', color: '#ec4899' },
  { key: 'xp', label: 'XP', icon: 'star', color: '#f59e0b' },
  { key: 'streak', label: 'Streak', icon: 'flame', color: '#ef4444' },
  { key: 'messages', label: 'Messages', icon: 'chatbubble', color: '#3b82f6' },
  { key: 'posts', label: 'Posts', icon: 'document-text', color: '#10b981' },
];
```

**API Integration:**

- `GET /api/v1/users/leaderboard?page=X&limit=25&category=X&period=X`

---

### 4. VoiceCallScreen (`src/screens/calls/VoiceCallScreen.tsx`)

**Features:**

- Audio waveform visualization (5 animated bars)
- Connection quality indicator (excellent/good/fair/poor)
- Call state management (connecting, ringing, connected, ended)
- Glassmorphism control buttons
- Mute, speaker, end call controls
- Call duration timer
- Animated background gradient
- Haptic feedback on actions

**Call States:**

```typescript
type CallState = 'connecting' | 'ringing' | 'connected' | 'ended';
type ConnectionQuality = 'excellent' | 'good' | 'fair' | 'poor';
```

---

### 5. VideoCallScreen (`src/screens/calls/VideoCallScreen.tsx`)

**Features:**

- Picture-in-Picture (PiP) with drag-to-reposition
- Auto-hide controls (3s timeout)
- Camera flip animation (180° rotation)
- Layout modes (fullscreen, grid)
- Mute, camera toggle, speaker, end call
- Connection status indicator
- PanResponder for PiP dragging with corner snapping

**PiP Implementation:**

```typescript
// Draggable PiP with corner snapping
const panResponder = PanResponder.create({
  onMoveShouldSetPanResponder: () => true,
  onPanResponderMove: (_, gesture) => {
    pipPosition.x.setValue(gesture.moveX - 60);
    pipPosition.y.setValue(gesture.moveY - 80);
  },
  onPanResponderRelease: (_, gesture) => {
    // Snap to nearest corner
    const snapX = gesture.moveX < SCREEN_WIDTH / 2 ? 16 : SCREEN_WIDTH - 136;
    const snapY = gesture.moveY < SCREEN_HEIGHT / 2 ? 100 : SCREEN_HEIGHT - 200;
    Animated.spring(pipPosition.x, { toValue: snapX }).start();
    Animated.spring(pipPosition.y, { toValue: snapY }).start();
  },
});
```

---

### 6. CallHistoryScreen (`src/screens/calls/CallHistoryScreen.tsx`)

**Features:**

- Grouped by date (Today, Yesterday, Previous)
- Animated list items with staggered entry
- Swipe-to-delete with spring animation
- Filter tabs (All, Missed)
- Call type icons (incoming, outgoing, missed, video)
- Duration formatting
- Haptic feedback

---

### 7. UserWallScreen (`src/screens/profile/UserWallScreen.tsx`)

**Features:**

- Social timeline with post cards
- Post composer with media buttons (Photo, Video, Poll, Feeling)
- Like, comment, share interactions
- Animated post entry (staggered fade + slide)
- Reactions display with emoji badges
- Pull-to-refresh
- Haptic feedback on interactions

**Post Actions:**

```typescript
const handleLike = (postId: string) => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  // Toggle like state
};

const handleComment = (postId: string) => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  // Open comment modal
};
```

---

### 8. ChatBubbleSettingsScreen (`src/screens/settings/ChatBubbleSettingsScreen.tsx`)

**Features:**

- 6 customization tabs
- Bubble style presets (Modern, Classic, Minimal, Gradient, Neon, Glassmorphism)
- Color picker with gradient support
- Font selection
- Animation settings
- Preview panel
- Save/reset functionality

---

## Animation Patterns

### Entry Animations

```typescript
// Parallel fade + slide
Animated.parallel([
  Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
  Animated.spring(translateY, { toValue: 0, friction: 8, useNativeDriver: true }),
]).start();
```

### Staggered List Items

```typescript
// Staggered entry for list items
Animated.stagger(
  60,
  items.map((_, i) =>
    Animated.parallel([
      Animated.timing(itemOpacity[i], { toValue: 1, duration: 300 }),
      Animated.spring(itemTranslateX[i], { toValue: 0, friction: 8 }),
    ])
  )
).start();
```

### Pulse/Glow Effects

```typescript
// Continuous pulse
Animated.loop(
  Animated.sequence([
    Animated.timing(scale, { toValue: 1.05, duration: 1500, easing: Easing.inOut(Easing.ease) }),
    Animated.timing(scale, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease) }),
  ])
).start();
```

### Modal Entry

```typescript
// Bottom sheet spring
Animated.spring(translateY, {
  toValue: 0,
  friction: 8,
  tension: 65,
  useNativeDriver: true,
}).start();
```

---

## Integration Points

### Theme Context

All screens use `useTheme()` from `../../contexts/ThemeContext`:

```typescript
const { colors, colorScheme } = useTheme();
const isDark = colorScheme === 'dark';
```

### Haptic Feedback

Consistent haptic patterns:

```typescript
// Light - taps, toggles
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// Medium - button presses, selections
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

// Heavy - purchases, major actions
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

// Success notification
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

// Error notification
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
```

### AsyncStorage Keys

```typescript
const RECENT_SEARCHES_KEY = '@cgraph_recent_searches';
const RECENT_EMOJIS_KEY = '@cgraph_recent_emojis';
const CHAT_BUBBLE_SETTINGS_KEY = '@cgraph_chat_bubble_settings';
```

### API Service

All API calls use `import api from '../../lib/api'`:

```typescript
const response = await api.get('/api/v1/endpoint');
const response = await api.post('/api/v1/endpoint', data);
```

---

## Dependencies

### Required Packages

```json
{
  "expo-linear-gradient": "^13.x",
  "expo-blur": "^13.x",
  "expo-haptics": "^13.x",
  "@expo/vector-icons": "^14.x",
  "@react-native-async-storage/async-storage": "^2.x",
  "react-native-safe-area-context": "^4.x",
  "lodash.debounce": "^4.x"
}
```

### Import Pattern

```typescript
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
```

---

## File Structure

```
apps/mobile/src/
├── components/
│   ├── ui/
│   │   ├── GlassCard.tsx
│   │   ├── AnimatedAvatar.tsx
│   │   └── ParticleBackground.tsx
│   └── chat/
│       ├── TypingIndicator.tsx
│       ├── EmojiPicker.tsx
│       └── StickerPicker.tsx
├── lib/
│   └── design/
│       └── DesignSystem.ts
├── screens/
│   ├── search/
│   │   └── SearchScreen.tsx
│   ├── premium/
│   │   ├── CoinShopScreen.tsx
│   │   └── PremiumScreen.tsx
│   ├── community/
│   │   └── LeaderboardScreen.tsx
│   ├── calls/
│   │   ├── VoiceCallScreen.tsx
│   │   ├── VideoCallScreen.tsx
│   │   └── CallHistoryScreen.tsx
│   ├── profile/
│   │   └── UserWallScreen.tsx
│   └── settings/
│       └── ChatBubbleSettingsScreen.tsx
└── contexts/
    └── ThemeContext.tsx
```

---

---

## Complete Screen Inventory

> **Updated**: January 2026 - Connection status verified by checking actual `api` imports

### Authentication Screens (4 screens)

| Screen                   | File                            | Backend Connected | API Endpoints                       |
| ------------------------ | ------------------------------- | ----------------- | ----------------------------------- |
| **LoginScreen**          | `auth/LoginScreen.tsx`          | ✅ Yes            | `POST /api/v1/auth/login`           |
| **RegisterScreen**       | `auth/RegisterScreen.tsx`       | ✅ Yes            | `POST /api/v1/auth/register`        |
| **ForgotPasswordScreen** | `auth/ForgotPasswordScreen.tsx` | ✅ Yes            | `POST /api/v1/auth/forgot-password` |
| **WelcomeScreen**        | `auth/WelcomeScreen.tsx`        | N/A               | N/A (navigation only)               |

### Messages/Chat Screens (4 screens)

| Screen                     | File                                  | Backend Connected | API Endpoints                                             |
| -------------------------- | ------------------------------------- | ----------------- | --------------------------------------------------------- |
| **ConversationListScreen** | `messages/ConversationListScreen.tsx` | ✅ Yes            | `GET /api/v1/conversations`, WebSocket                    |
| **ConversationScreen**     | `messages/ConversationScreen.tsx`     | ✅ Yes            | `GET/POST /api/v1/conversations/:id/messages`, WebSocket  |
| **NewConversationScreen**  | `messages/NewConversationScreen.tsx`  | ✅ Yes            | `POST /api/v1/conversations`, search APIs                 |
| **MessageSearchScreen**    | `messages/MessageSearchScreen.tsx`    | ⚠️ Partial        | Uses search service, needs: `GET /api/v1/search/messages` |

### Friends Screens (4 screens)

| Screen                   | File                               | Backend Connected | API Endpoints                                                     |
| ------------------------ | ---------------------------------- | ----------------- | ----------------------------------------------------------------- |
| **FriendListScreen**     | `friends/FriendListScreen.tsx`     | ✅ Yes            | `GET /api/v1/friends`, WebSocket                                  |
| **AddFriendScreen**      | `friends/AddFriendScreen.tsx`      | ✅ Yes            | `POST /api/v1/friends`, `GET /api/v1/search/users`                |
| **FriendRequestsScreen** | `friends/FriendRequestsScreen.tsx` | ✅ Yes            | `GET /api/v1/friends/requests`, `POST /api/v1/friends/:id/accept` |
| **UserProfileScreen**    | `friends/UserProfileScreen.tsx`    | ✅ Yes            | `GET /api/v1/profiles/:username`                                  |

### Forums Screens (10 screens)

| Screen                      | File                                 | Backend Connected | API Endpoints                                            |
| --------------------------- | ------------------------------------ | ----------------- | -------------------------------------------------------- |
| **ForumListScreen**         | `forums/ForumListScreen.tsx`         | ✅ Yes            | `GET /api/v1/forums`                                     |
| **ForumScreen**             | `forums/ForumScreen.tsx`             | ✅ Yes            | `GET /api/v1/forums/:id`, `GET /api/v1/forums/:id/posts` |
| **ForumBoardScreen**        | `forums/ForumBoardScreen.tsx`        | ✅ Yes            | `GET /api/v1/forums/:id/board`                           |
| **PostScreen**              | `forums/PostScreen.tsx`              | ✅ Yes            | `GET /api/v1/forums/:forum_id/posts/:id`                 |
| **CreatePostScreen**        | `forums/CreatePostScreen.tsx`        | ✅ Yes            | `POST /api/v1/forums/:forum_id/posts`                    |
| **CreateForumScreen**       | `forums/CreateForumScreen.tsx`       | ✅ Yes            | `POST /api/v1/forums`                                    |
| **ForumSettingsScreen**     | `forums/ForumSettingsScreen.tsx`     | ✅ Yes            | `PUT /api/v1/forums/:id`                                 |
| **ForumAdminScreen**        | `forums/ForumAdminScreen.tsx`        | ✅ Yes            | Admin forum operations                                   |
| **ForumLeaderboardScreen**  | `forums/ForumLeaderboardScreen.tsx`  | ✅ Yes            | `GET /api/v1/forums/:id/leaderboard`                     |
| **PluginMarketplaceScreen** | `forums/PluginMarketplaceScreen.tsx` | ✅ Yes            | Plugin marketplace APIs                                  |

### Groups Screens (4 screens)

| Screen               | File                             | Backend Connected | API Endpoints                               |
| -------------------- | -------------------------------- | ----------------- | ------------------------------------------- |
| **GroupListScreen**  | `groups/GroupListScreen.tsx`     | ✅ Yes            | `GET /api/v1/groups`                        |
| **GroupScreen**      | `groups/GroupScreen.tsx`         | ✅ Yes            | `GET /api/v1/groups/:id`, channels/messages |
| **ChannelScreen**    | `groups/ChannelScreen.tsx`       | ✅ Yes            | `GET /api/v1/groups/:id/channels/:id`       |
| **MemberListScreen** | `community/MemberListScreen.tsx` | ✅ Yes            | `GET /api/v1/members`                       |

### Call Screens (3 screens)

| Screen                | File                          | Backend Connected | API Endpoints                       |
| --------------------- | ----------------------------- | ----------------- | ----------------------------------- |
| **VoiceCallScreen**   | `calls/VoiceCallScreen.tsx`   | ⚠️ Partial        | Needs: WebRTC signaling integration |
| **VideoCallScreen**   | `calls/VideoCallScreen.tsx`   | ⚠️ Partial        | Needs: WebRTC signaling integration |
| **CallHistoryScreen** | `calls/CallHistoryScreen.tsx` | ⚠️ Partial        | Needs: call history endpoint        |

### Gamification Screens (5 screens)

| Screen                    | File                                     | Backend Connected | API Endpoints                                      |
| ------------------------- | ---------------------------------------- | ----------------- | -------------------------------------------------- |
| **GamificationHubScreen** | `gamification/GamificationHubScreen.tsx` | ✅ Yes            | Uses `useGamification` hook → gamification service |
| **AchievementsScreen**    | `gamification/AchievementsScreen.tsx`    | ✅ Yes            | Uses gamification service                          |
| **QuestsScreen**          | `gamification/QuestsScreen.tsx`          | ✅ Yes            | Uses gamification service                          |
| **TitlesScreen**          | `gamification/TitlesScreen.tsx`          | ✅ Yes            | Uses gamification service                          |
| **LeaderboardScreen**     | `leaderboard/LeaderboardScreen.tsx`      | ✅ Yes            | `GET /api/v1/users/leaderboard`                    |

### Premium/Shop Screens (3 screens)

| Screen             | File                           | Backend Connected | API Endpoints                               |
| ------------------ | ------------------------------ | ----------------- | ------------------------------------------- |
| **PremiumScreen**  | `premium/PremiumScreen.tsx`    | ✅ Yes            | Uses `usePremium` hook → premium service    |
| **CoinShopScreen** | `premium/CoinShopScreen.tsx`   | ✅ Yes            | `GET /api/v1/coins`, shop APIs              |
| **ReferralScreen** | `referrals/ReferralScreen.tsx` | ✅ Yes            | Uses `useReferrals` hook → referral service |

### Settings Screens (10 screens)

| Screen                       | File                                    | Backend Connected | API Endpoints                      |
| ---------------------------- | --------------------------------------- | ----------------- | ---------------------------------- |
| **SettingsScreen**           | `settings/SettingsScreen.tsx`           | ✅ Yes            | Uses settings service              |
| **ProfileScreen**            | `settings/ProfileScreen.tsx`            | ✅ Yes            | `GET /api/v1/me`, `PUT /api/v1/me` |
| **AccountScreen**            | `settings/AccountScreen.tsx`            | ✅ Yes            | Account management APIs            |
| **AppearanceScreen**         | `settings/AppearanceScreen.tsx`         | ⚠️ Local          | Local storage only                 |
| **NotificationsScreen**      | `settings/NotificationsScreen.tsx`      | ✅ Yes            | Uses notifications service         |
| **PrivacyScreen**            | `settings/PrivacyScreen.tsx`            | ✅ Yes            | Uses settings service              |
| **ChatBubbleSettingsScreen** | `settings/ChatBubbleSettingsScreen.tsx` | ⚠️ Local          | Local storage only                 |
| **AvatarSettingsScreen**     | `settings/AvatarSettingsScreen.tsx`     | ⚠️ Partial        | Needs: `POST /api/v1/me/avatar`    |
| **UICustomizationScreen**    | `settings/UICustomizationScreen.tsx`    | ⚠️ Local          | Local storage only                 |
| **CustomEmojiScreen**        | `settings/CustomEmojiScreen.tsx`        | ✅ Yes            | Custom emoji APIs                  |
| **ProfileVisibilityScreen**  | `settings/ProfileVisibilityScreen.tsx`  | ✅ Yes            | `PUT /api/v1/settings/privacy`     |

### Account Screens (2 screens)

| Screen                   | File                               | Backend Connected | API Endpoints             |
| ------------------------ | ---------------------------------- | ----------------- | ------------------------- |
| **UsernameChangeScreen** | `account/UsernameChangeScreen.tsx` | ✅ Yes            | `PUT /api/v1/me/username` |
| **ExportContentScreen**  | `content/ExportContentScreen.tsx`  | ✅ Yes            | `POST /api/v1/me/export`  |

### Security Screens (2 screens)

| Screen                     | File                                  | Backend Connected | API Endpoints                             |
| -------------------------- | ------------------------------------- | ----------------- | ----------------------------------------- |
| **E2EEVerificationScreen** | `security/E2EEVerificationScreen.tsx` | ✅ Yes            | Uses `useE2EE` hook, `GET /api/v1/e2ee/*` |
| **KeyVerificationScreen**  | `settings/KeyVerificationScreen.tsx`  | ✅ Yes            | `GET /api/v1/e2ee/safety-number/:user_id` |

### Notifications Screens (1 screen)

| Screen                       | File                                         | Backend Connected | API Endpoints                                        |
| ---------------------------- | -------------------------------------------- | ----------------- | ---------------------------------------------------- |
| **NotificationsInboxScreen** | `notifications/NotificationsInboxScreen.tsx` | ✅ Yes            | Uses `useNotifications` hook → notifications service |

### Search Screen (1 screen)

| Screen           | File                      | Backend Connected | API Endpoints                          |
| ---------------- | ------------------------- | ----------------- | -------------------------------------- |
| **SearchScreen** | `search/SearchScreen.tsx` | ✅ Yes            | Uses `useSearch` hook → search service |

### Profile Screens (1 screen)

| Screen             | File                         | Backend Connected | API Endpoints                                 |
| ------------------ | ---------------------------- | ----------------- | --------------------------------------------- |
| **UserWallScreen** | `profile/UserWallScreen.tsx` | ⚠️ Partial        | Needs: `GET /api/v1/profiles/:username/posts` |

### Calendar Screen (1 screen)

| Screen             | File                          | Backend Connected | API Endpoints                              |
| ------------------ | ----------------------------- | ----------------- | ------------------------------------------ |
| **CalendarScreen** | `calendar/CalendarScreen.tsx` | ✅ Yes            | Uses `useCalendar` hook → calendar service |

### Admin Screens (2 screens)

| Screen                   | File                             | Backend Connected | API Endpoints              |
| ------------------------ | -------------------------------- | ----------------- | -------------------------- |
| **AdminDashboardScreen** | `admin/AdminDashboardScreen.tsx` | ✅ Yes            | `GET /api/v1/admin/*`      |
| **ForumReorderScreen**   | `admin/ForumReorderScreen.tsx`   | ✅ Yes            | `PUT /api/v1/admin/config` |

### Community Screens (2 screens)

| Screen                | File                              | Backend Connected | API Endpoints                            |
| --------------------- | --------------------------------- | ----------------- | ---------------------------------------- |
| **LeaderboardScreen** | `community/LeaderboardScreen.tsx` | ✅ Yes            | `GET /api/v1/users/leaderboard`          |
| **WhosOnlineScreen**  | `community/WhosOnlineScreen.tsx`  | ✅ Yes            | `GET /api/v1/presence/online`, WebSocket |

### Moderation Screens (1 screen)

| Screen           | File                          | Backend Connected | API Endpoints          |
| ---------------- | ----------------------------- | ----------------- | ---------------------- |
| **ReportScreen** | `moderation/ReportScreen.tsx` | ✅ Yes            | `POST /api/v1/reports` |

### Utility Screens (2 screens)

| Screen                    | File                             | Backend Connected | API Endpoints |
| ------------------------- | -------------------------------- | ----------------- | ------------- |
| **LoadingScreen**         | `LoadingScreen.tsx`              | N/A               | N/A           |
| **HolographicDemoScreen** | `demo/HolographicDemoScreen.tsx` | N/A               | N/A           |

---

## Backend Connection Summary

**Total Screens**: 58

- ✅ **Fully Connected**: 47 screens (81%)
- ⚠️ **Partially Connected / Local Only**: 8 screens (14%)
- N/A **No Backend Needed**: 3 screens (5%)

### Services & Hooks Architecture

The mobile app uses a clean service layer architecture:

| Service                | Hook                              | Screens Using                            |
| ---------------------- | --------------------------------- | ---------------------------------------- |
| `settingsService`      | `useSettings`                     | Settings, Privacy, Notifications screens |
| `premiumService`       | `usePremium`                      | PremiumScreen, subscription flows        |
| `friendsService`       | `useFriendPresence`               | Friend screens, presence indicators      |
| `searchService`        | `useSearch`                       | SearchScreen, AddFriendScreen            |
| `calendarService`      | `useCalendar`                     | CalendarScreen                           |
| `notificationsService` | `useNotifications`                | NotificationsInboxScreen                 |
| `groupsService`        | `useGroups`                       | Group screens                            |
| `referralService`      | `useReferrals`                    | ReferralScreen                           |
| `gamificationService`  | `useGamification`                 | Gamification screens                     |
| `e2ee` (module)        | `useE2EE`                         | E2EE verification screens                |
| `socket` (module)      | `useSocket`, `useRealtimeChannel` | All real-time features                   |

---

## Backend API Endpoints Reference

### Authentication (`/api/v1/auth/*`)

```
POST /api/v1/auth/register         - Create account
POST /api/v1/auth/login            - Login
POST /api/v1/auth/logout           - Logout
POST /api/v1/auth/refresh          - Refresh token
POST /api/v1/auth/forgot-password  - Request password reset
POST /api/v1/auth/reset-password   - Reset password
POST /api/v1/auth/verify-email     - Verify email
POST /api/v1/auth/2fa/*            - Two-factor authentication
```

### User (`/api/v1/me`, `/api/v1/users/*`)

```
GET    /api/v1/me                  - Get current user
PUT    /api/v1/me                  - Update current user
PUT    /api/v1/me/username         - Change username
DELETE /api/v1/me                  - Delete account
POST   /api/v1/me/avatar           - Upload avatar
GET    /api/v1/me/sessions         - List sessions
POST   /api/v1/me/export           - Request data export
GET    /api/v1/users/leaderboard   - User leaderboard
GET    /api/v1/users/:id           - Get user by ID
```

### Settings (`/api/v1/settings`)

```
GET /api/v1/settings               - Get all settings
PUT /api/v1/settings               - Update all settings
PUT /api/v1/settings/notifications - Update notification settings
PUT /api/v1/settings/privacy       - Update privacy settings
PUT /api/v1/settings/appearance    - Update appearance settings
```

### Friends (`/api/v1/friends/*`)

```
GET    /api/v1/friends             - List friends
GET    /api/v1/friends/requests    - Get friend requests
GET    /api/v1/friends/pending     - Get pending requests
GET    /api/v1/friends/suggestions - Get friend suggestions
POST   /api/v1/friends             - Send friend request
POST   /api/v1/friends/:id/accept  - Accept friend request
POST   /api/v1/friends/:id/decline - Decline friend request
POST   /api/v1/friends/:id/block   - Block user
DELETE /api/v1/friends/:id         - Remove friend
```

### Conversations/Messages (`/api/v1/conversations/*`)

```
GET  /api/v1/conversations                     - List conversations
GET  /api/v1/conversations/:id                 - Get conversation
POST /api/v1/conversations                     - Create conversation
GET  /api/v1/conversations/:id/messages        - Get messages
POST /api/v1/conversations/:id/messages        - Send message
POST /api/v1/conversations/:id/messages/:id/read - Mark read
POST /api/v1/conversations/:id/typing          - Send typing indicator
```

### Groups (`/api/v1/groups/*`)

```
GET    /api/v1/groups              - List groups
POST   /api/v1/groups              - Create group
GET    /api/v1/groups/:id          - Get group
PUT    /api/v1/groups/:id          - Update group
DELETE /api/v1/groups/:id          - Delete group
GET    /api/v1/groups/:id/channels - List channels
GET    /api/v1/groups/:id/members  - List members
POST   /api/v1/invites/:code/join  - Join via invite
```

### Forums (`/api/v1/forums/*`)

```
GET    /api/v1/forums                       - List forums (public)
GET    /api/v1/forums/:id                   - Get forum (public)
POST   /api/v1/forums                       - Create forum
PUT    /api/v1/forums/:id                   - Update forum
DELETE /api/v1/forums/:id                   - Delete forum
GET    /api/v1/forums/:forum_id/posts       - List posts (public)
GET    /api/v1/forums/:forum_id/posts/:id   - Get post (public)
POST   /api/v1/forums/:forum_id/posts       - Create post
POST   /api/v1/forums/:forum_id/posts/:id/vote - Vote on post
```

### Search (`/api/v1/search/*`)

```
GET /api/v1/search/users    - Search users
GET /api/v1/search/messages - Search messages
GET /api/v1/search/posts    - Search posts
```

### Notifications (`/api/v1/notifications`)

```
GET  /api/v1/notifications          - List notifications
POST /api/v1/notifications/read     - Mark all read
POST /api/v1/notifications/:id/read - Mark one read
```

### Gamification (`/api/v1/gamification/*`, `/api/v1/quests/*`, `/api/v1/titles/*`)

```
GET  /api/v1/gamification/stats        - Get user stats
GET  /api/v1/gamification/achievements - List achievements
GET  /api/v1/gamification/leaderboard/:category - Leaderboard
POST /api/v1/gamification/streak/claim - Claim streak bonus
GET  /api/v1/quests                    - List all quests
GET  /api/v1/quests/active             - Active quests
GET  /api/v1/quests/daily              - Daily quests
GET  /api/v1/quests/weekly             - Weekly quests
POST /api/v1/quests/:id/accept         - Accept quest
POST /api/v1/quests/:id/claim          - Claim rewards
GET  /api/v1/titles                    - List titles
GET  /api/v1/titles/owned              - Owned titles
POST /api/v1/titles/:id/equip          - Equip title
```

### Shop/Coins (`/api/v1/shop/*`, `/api/v1/coins/*`)

```
GET  /api/v1/shop              - List shop items
GET  /api/v1/shop/categories   - Shop categories
GET  /api/v1/shop/:id          - Get item
POST /api/v1/shop/:id/purchase - Purchase item
GET  /api/v1/coins             - Get balance
GET  /api/v1/coins/history     - Transaction history
GET  /api/v1/coins/packages    - Available packages
```

### Premium (`/api/v1/premium/*`)

```
GET  /api/v1/premium/status   - Get premium status
GET  /api/v1/premium/tiers    - Available tiers
GET  /api/v1/premium/features - Premium features
POST /api/v1/premium/subscribe - Subscribe
POST /api/v1/premium/cancel    - Cancel subscription
```

### Referrals (`/api/v1/referrals/*`)

```
GET  /api/v1/referrals/code           - Get referral code
POST /api/v1/referrals/code/regenerate - Regenerate code
GET  /api/v1/referrals                 - List referrals
GET  /api/v1/referrals/stats           - Referral stats
GET  /api/v1/referrals/leaderboard     - Referral leaderboard
POST /api/v1/referrals/apply           - Apply referral code
```

### Calendar (`/api/v1/calendar/*`)

```
GET    /api/v1/calendar/events     - List events
GET    /api/v1/calendar/events/:id - Get event
POST   /api/v1/calendar/events     - Create event
PUT    /api/v1/calendar/events/:id - Update event
DELETE /api/v1/calendar/events/:id - Delete event
POST   /api/v1/calendar/events/:id/rsvp - RSVP to event
```

### Presence (`/api/v1/presence/*`)

```
GET  /api/v1/presence/online    - Online users
POST /api/v1/presence/heartbeat - Update presence
GET  /api/v1/presence/stats     - Presence stats
```

### E2EE (`/api/v1/e2ee/*`)

```
POST   /api/v1/e2ee/keys              - Register keys
GET    /api/v1/e2ee/keys/:user_id     - Get prekey bundle
GET    /api/v1/e2ee/devices           - List devices
DELETE /api/v1/e2ee/devices/:id       - Remove device
GET    /api/v1/e2ee/safety-number/:id - Safety number
```

### Profiles (`/api/v1/profiles/*`)

```
GET  /api/v1/profiles/:username            - Get profile
PUT  /api/v1/profiles/signature            - Update signature
PUT  /api/v1/profiles/bio                  - Update bio
GET  /api/v1/profiles/:username/posts      - User's posts
GET  /api/v1/profiles/:username/reputation - Reputation
POST /api/v1/profiles/:username/reputation - Give reputation
```

---

## Notes for Future Development

1. Always use `useNativeDriver: true` for transform and opacity animations
2. Use `useNativeDriver: false` for color/backgroundColor animations
3. Implement haptic feedback on all interactive elements
4. Use spring animations for natural-feeling interactions
5. Persist user preferences to AsyncStorage
6. Follow the rarity color system for gamification elements
7. Use GlassCard for all card-like containers
8. Use AnimatedAvatar for all user avatars
