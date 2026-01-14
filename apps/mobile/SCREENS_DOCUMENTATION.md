# CGraph Mobile - Revolutionary UI Documentation

## Overview

This document catalogs all the next-generation mobile UI components and screens that have been built with premium animations, glassmorphism effects, and competitor-surpassing features.

**Version**: 0.9.0 - Revolutionary Edition
**Last Updated**: January 2026

---

## Table of Contents

1. [Design System Foundation](#design-system-foundation)
2. [Core UI Components](#core-ui-components)
3. [Screen Implementations](#screen-implementations)
4. [Animation Patterns](#animation-patterns)
5. [Integration Points](#integration-points)

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
function Animated3DCoin({ size = 70, delay = 0 })
// - Y-axis rotation animation
// - Scale breathing animation
// - Glow pulse animation

// Animated Counter
function AnimatedCounter({ value, style })
// - Smooth count-up using Animated.Value listener

// Floating Particles
function FloatingParticles({ count = 12 })
// - Gold-colored particles rising upward

// Countdown Timer
function CountdownTimer({ endsInHours })
// - Real-time HH:MM:SS countdown
```

**Coin Bundles:**
| ID | Coins | Bonus | Price | Rarity |
|----|-------|-------|-------|--------|
| small | 100 | 0 | $0.99 | common |
| medium | 500 | 50 | $4.99 | popular |
| large | 1,200 | 200 | $9.99 | - |
| mega | 2,500 | 500 | $19.99 | best value |
| ultra | 6,000 | 1,500 | $49.99 | - |

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
Animated.stagger(60, items.map((_, i) =>
  Animated.parallel([
    Animated.timing(itemOpacity[i], { toValue: 1, duration: 300 }),
    Animated.spring(itemTranslateX[i], { toValue: 0, friction: 8 }),
  ])
)).start();
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

### Authentication Screens (4 screens)
| Screen | File | Backend Connected | API Endpoints |
|--------|------|-------------------|---------------|
| **LoginScreen** | `auth/LoginScreen.tsx` | ✅ Yes | `POST /api/v1/auth/login` |
| **RegisterScreen** | `auth/RegisterScreen.tsx` | ✅ Yes | `POST /api/v1/auth/register` |
| **ForgotPasswordScreen** | `auth/ForgotPasswordScreen.tsx` | ✅ Yes | `POST /api/v1/auth/forgot-password` |
| **WelcomeScreen** | `auth/WelcomeScreen.tsx` | N/A | N/A (navigation only) |

### Messages/Chat Screens (3 screens)
| Screen | File | Backend Connected | API Endpoints |
|--------|------|-------------------|---------------|
| **ConversationListScreen** | `messages/ConversationListScreen.tsx` | ✅ Yes | `GET /api/v1/conversations`, WebSocket |
| **ChatScreen** | `messages/ChatScreen.tsx` | ⚠️ Partial | Needs: `POST /api/v1/conversations/:id/messages` |
| **MessageSearchScreen** | `messages/MessageSearchScreen.tsx` | ❌ No | Needs: `GET /api/v1/search/messages` |

### Friends Screens (4 screens)
| Screen | File | Backend Connected | API Endpoints |
|--------|------|-------------------|---------------|
| **FriendListScreen** | `friends/FriendListScreen.tsx` | ✅ Yes | `GET /api/v1/friends`, WebSocket |
| **AddFriendScreen** | `friends/AddFriendScreen.tsx` | ❌ No | Needs: `POST /api/v1/friends`, `GET /api/v1/search/users` |
| **FriendRequestsScreen** | `friends/FriendRequestsScreen.tsx` | ❌ No | Needs: `GET /api/v1/friends/requests`, `POST /api/v1/friends/:id/accept` |
| **UserProfileScreen** | `friends/UserProfileScreen.tsx` | ❌ No | Needs: `GET /api/v1/profiles/:username` |

### Forums Screens (5 screens)
| Screen | File | Backend Connected | API Endpoints |
|--------|------|-------------------|---------------|
| **ForumListScreen** | `forums/ForumListScreen.tsx` | ✅ Yes | `GET /api/v1/forums` |
| **ForumDetailScreen** | `forums/ForumDetailScreen.tsx` | ⚠️ Partial | Needs: `GET /api/v1/forums/:id/posts` |
| **PostDetailScreen** | `forums/PostDetailScreen.tsx` | ❌ No | Needs: `GET /api/v1/forums/:forum_id/posts/:id` |
| **CreatePostScreen** | `forums/CreatePostScreen.tsx` | ❌ No | Needs: `POST /api/v1/forums/:forum_id/posts` |
| **SubscriptionsScreen** | `forums/SubscriptionsScreen.tsx` | ❌ No | Needs: forum subscription endpoints |

### Groups Screens (4 screens)
| Screen | File | Backend Connected | API Endpoints |
|--------|------|-------------------|---------------|
| **GroupListScreen** | `groups/GroupListScreen.tsx` | ❌ No | Needs: `GET /api/v1/groups` |
| **GroupDetailScreen** | `groups/GroupDetailScreen.tsx` | ❌ No | Needs: `GET /api/v1/groups/:id` |
| **GroupSettingsScreen** | `groups/GroupSettingsScreen.tsx` | ❌ No | Needs: `PUT /api/v1/groups/:id` |
| **MemberListScreen** | `community/MemberListScreen.tsx` | ✅ Yes | `GET /api/v1/members` |

### Call Screens (3 screens)
| Screen | File | Backend Connected | API Endpoints |
|--------|------|-------------------|---------------|
| **VoiceCallScreen** | `calls/VoiceCallScreen.tsx` | ❌ No | Needs: WebRTC signaling |
| **VideoCallScreen** | `calls/VideoCallScreen.tsx` | ❌ No | Needs: WebRTC signaling |
| **CallHistoryScreen** | `calls/CallHistoryScreen.tsx` | ❌ No | Needs: call history endpoint |

### Gamification Screens (5 screens)
| Screen | File | Backend Connected | API Endpoints |
|--------|------|-------------------|---------------|
| **GamificationHubScreen** | `gamification/GamificationHubScreen.tsx` | ❌ No | Needs: `GET /api/v1/gamification/stats` |
| **AchievementsScreen** | `gamification/AchievementsScreen.tsx` | ❌ No | Needs: `GET /api/v1/gamification/achievements` |
| **QuestsScreen** | `gamification/QuestsScreen.tsx` | ❌ No | Needs: `GET /api/v1/quests` |
| **TitlesScreen** | `gamification/TitlesScreen.tsx` | ❌ No | Needs: `GET /api/v1/titles` |
| **LeaderboardScreen** | `leaderboard/LeaderboardScreen.tsx` | ✅ Yes | `GET /api/v1/users/leaderboard` |

### Premium/Shop Screens (3 screens)
| Screen | File | Backend Connected | API Endpoints |
|--------|------|-------------------|---------------|
| **PremiumScreen** | `premium/PremiumScreen.tsx` | ❌ No | Needs: `GET /api/v1/premium/status`, `GET /api/v1/premium/tiers` |
| **CoinShopScreen** | `premium/CoinShopScreen.tsx` | ⚠️ Partial | Needs: `GET /api/v1/coins`, `GET /api/v1/shop` |
| **ReferralScreen** | `referrals/ReferralScreen.tsx` | ❌ No | Needs: `GET /api/v1/referrals/*` |

### Settings Screens (10 screens)
| Screen | File | Backend Connected | API Endpoints |
|--------|------|-------------------|---------------|
| **SettingsScreen** | `settings/SettingsScreen.tsx` | ❌ No | Needs: `GET /api/v1/settings` |
| **ProfileScreen** | `settings/ProfileScreen.tsx` | ❌ No | Needs: `GET /api/v1/me`, `PUT /api/v1/me` |
| **AppearanceScreen** | `settings/AppearanceScreen.tsx` | ❌ No | Needs: `PUT /api/v1/settings/appearance` |
| **NotificationsScreen** | `settings/NotificationsScreen.tsx` | ❌ No | Needs: `PUT /api/v1/settings/notifications` |
| **PrivacyScreen** | `settings/PrivacyScreen.tsx` | ❌ No | Needs: `PUT /api/v1/settings/privacy` |
| **ChatBubbleSettingsScreen** | `settings/ChatBubbleSettingsScreen.tsx` | ❌ No | Local storage only |
| **AvatarSettingsScreen** | `settings/AvatarSettingsScreen.tsx` | ❌ No | Needs: `POST /api/v1/me/avatar` |
| **UICustomizationScreen** | `settings/UICustomizationScreen.tsx` | ❌ No | Local storage only |
| **CustomEmojiScreen** | `settings/CustomEmojiScreen.tsx` | ❌ No | Local storage only |
| **ProfileVisibilityScreen** | `settings/ProfileVisibilityScreen.tsx` | ❌ No | Needs: `PUT /api/v1/settings/privacy` |

### Account Screens (2 screens)
| Screen | File | Backend Connected | API Endpoints |
|--------|------|-------------------|---------------|
| **UsernameChangeScreen** | `account/UsernameChangeScreen.tsx` | ✅ Yes | `PUT /api/v1/me/username` |
| **ExportContentScreen** | `account/ExportContentScreen.tsx` | ❌ No | Needs: `POST /api/v1/me/export` |

### Security Screens (2 screens)
| Screen | File | Backend Connected | API Endpoints |
|--------|------|-------------------|---------------|
| **E2EEVerificationScreen** | `security/E2EEVerificationScreen.tsx` | ❌ No | Needs: `GET /api/v1/e2ee/*` |
| **KeyVerificationScreen** | `security/KeyVerificationScreen.tsx` | ❌ No | Needs: `GET /api/v1/e2ee/safety-number/:user_id` |

### Notifications Screens (1 screen)
| Screen | File | Backend Connected | API Endpoints |
|--------|------|-------------------|---------------|
| **NotificationsInboxScreen** | `notifications/NotificationsInboxScreen.tsx` | ❌ No | Needs: `GET /api/v1/notifications` |

### Search Screen (1 screen)
| Screen | File | Backend Connected | API Endpoints |
|--------|------|-------------------|---------------|
| **SearchScreen** | `search/SearchScreen.tsx` | ⚠️ Partial | Needs: `GET /api/v1/search/users`, `GET /api/v1/search/posts` |

### Profile Screens (1 screen)
| Screen | File | Backend Connected | API Endpoints |
|--------|------|-------------------|---------------|
| **UserWallScreen** | `profile/UserWallScreen.tsx` | ❌ No | Needs: `GET /api/v1/profiles/:username/posts` |

### Calendar Screen (1 screen)
| Screen | File | Backend Connected | API Endpoints |
|--------|------|-------------------|---------------|
| **CalendarScreen** | `calendar/CalendarScreen.tsx` | ✅ Yes | `GET /api/v1/calendar/events` |

### Admin Screens (2 screens)
| Screen | File | Backend Connected | API Endpoints |
|--------|------|-------------------|---------------|
| **AdminDashboardScreen** | `admin/AdminDashboardScreen.tsx` | ✅ Yes | `GET /api/v1/admin/*` |
| **ForumReorderScreen** | `admin/ForumReorderScreen.tsx` | ✅ Yes | `PUT /api/v1/admin/config` |

### Community Screens (2 screens)
| Screen | File | Backend Connected | API Endpoints |
|--------|------|-------------------|---------------|
| **LeaderboardScreen** | `community/LeaderboardScreen.tsx` | ⚠️ Partial | Needs: community-specific endpoints |
| **WhosOnlineScreen** | `community/WhosOnlineScreen.tsx` | ❌ No | Needs: `GET /api/v1/presence/online` |

### Utility Screens (2 screens)
| Screen | File | Backend Connected | API Endpoints |
|--------|------|-------------------|---------------|
| **LoadingScreen** | `LoadingScreen.tsx` | N/A | N/A |
| **HolographicDemoScreen** | `demo/HolographicDemoScreen.tsx` | N/A | N/A |

---

## Backend Connection Summary

**Total Screens**: 55
- ✅ **Fully Connected**: 12 screens (22%)
- ⚠️ **Partially Connected**: 5 screens (9%)
- ❌ **Not Connected**: 32 screens (58%)
- N/A **No Backend Needed**: 6 screens (11%)

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
