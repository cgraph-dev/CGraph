# CGraph Web Application - Features Documentation

## Table of Contents

1. [Enhanced Chat System](#enhanced-chat-system)
2. [Gamification System](#gamification-system)
3. [Leaderboard System](#leaderboard-system)
4. [Premium & Subscriptions](#premium--subscriptions)
5. [Virtual Currency & Shop](#virtual-currency--shop)
6. [Quest System](#quest-system)
7. [Global Notifications](#global-notifications)
8. [Performance Optimizations](#performance-optimizations)
9. [Forum Features](#forum-features)
10. [UI/UX Enhancements](#uiux-enhancements)
11. [Architecture & Security](#architecture--security)

---

## Enhanced Chat System

### Message Reactions

**Location:** `/apps/web/src/components/chat/MessageReactions.tsx`

An intuitive emoji-based reaction system that allows users to express emotions without sending full messages.

#### Features:
- **Quick Reactions:** 8 most commonly used emoji (👍 ❤️ 😂 😮 😢 🎉 🔥 👀) for instant access
- **Extended Picker:** Categorized emoji browser (Emotions, Reactions, Objects, Symbols)
- **Aggregated Counts:** Shows total reaction count with user lists on hover
- **Animated Bubbles:** Smooth entrance animations with glow effects for user's own reactions
- **Haptic Feedback:** Tactile response on interactions for enhanced user experience
- **Accessibility:** Full keyboard navigation support

#### Technical Implementation:
```typescript
interface Reaction {
  emoji: string;
  count: number;
  users: Array<{ id: string; username: string }>;
  hasReacted: boolean;
}
```

**API Integration:**
- `POST /api/v1/messages/:messageId/reactions` - Add reaction
- `DELETE /api/v1/messages/:messageId/reactions/:emoji` - Remove reaction
- Real-time updates via WebSocket for instant synchronization

---

### Rich Media Embeds

**Location:** `/apps/web/src/components/chat/RichMediaEmbed.tsx`

Automatically detects and renders rich previews for URLs shared in messages.

#### Supported Media Types:

1. **Images** (`.jpg`, `.png`, `.gif`, `.webp`, `.svg`)
   - Lazy loading for performance
   - Click to expand in lightbox
   - Automatic size optimization

2. **Videos** (`.mp4`, `.webm`, `.ogg`, `.mov`)
   - Native HTML5 player with controls
   - YouTube iframe embeds with thumbnail preview
   - Click-to-play interaction

3. **Audio** (`.mp3`, `.wav`, `.ogg`, `.m4a`)
   - Waveform visualization
   - Custom audio player with glassmorphic design

4. **Link Previews**
   - Open Graph metadata parsing
   - Favicon display
   - Title, description, and preview image
   - Domain highlighting

#### Special Platform Support:
- **YouTube:** Embedded player with thumbnail
- **Twitter:** Tweet preview cards
- **Generic Links:** Favicon + metadata display

#### Security Features:
- Iframe sandboxing for embedded content
- Content Security Policy enforcement
- XSS protection via URL validation
- Rate limiting on metadata fetching

---

### Read Receipts

**Location:** Integrated into `/apps/web/src/pages/messages/Conversation.tsx` (lines 1142-1185)

Visual indicators showing who has read a message.

#### Features:
- **Avatar Stack:** Displays up to 3 reader avatars
- **Overflow Indicator:** Shows "+N" for additional readers
- **Animated Appearance:** Staggered entrance animation
- **Timestamp Support:** "Seen" status with time information
- **Privacy Respecting:** Only shown for user's own messages

---

### Typing Indicators

**Location:** `/apps/web/src/pages/messages/Conversation.tsx` (lines 729-775)

Real-time indicators when other users are composing messages.

#### Features:
- **Animated Dots:** Three bouncing dots with gradient colors
- **Glassmorphic Design:** Crystal-clear UI element
- **Auto-timeout:** Clears after 5 seconds of inactivity
- **Smart Filtering:** Excludes current user from typing list
- **Header Integration:** Shows "typing..." in conversation header

---

## Gamification System

### Overview

A comprehensive progression system designed to encourage organic engagement without creating FOMO or grind.

**Core Store:** `/apps/web/src/stores/gamificationStore.ts`

### XP & Levels

#### Progression Formula:
```typescript
XP Required = 100 × (level ^ 1.8)
```

This exponential curve ensures satisfying progression that remains challenging but achievable.

#### XP Sources:
- **First message:** 50 XP
- **Forum post creation:** 75 XP
- **Helpful answer marked as best:** 750 XP
- **Daily login:** 100 XP (with streak multiplier)
- **Achievement unlocks:** Variable (50-15,000 XP)

#### Streak System:
- **3+ day streak:** 1.5x XP multiplier
- **7+ day streak:** 2.0x XP multiplier
- **Streak breaks:** Grace period until midnight

### Achievements

**Definitions:** `/apps/web/src/data/achievements.ts`

30+ achievements across 6 categories:

#### Categories:
1. **Social** - Networking and communication
   - First Contact (send first message)
   - Social Butterfly (25 active conversations/week)
   - Social Nexus (100+ connections)

2. **Content** - Forum contributions
   - Breaking the Ice (first post)
   - Community Builder (found a forum)
   - Knowledge Keeper (10,000+ words in guides)

3. **Exploration** - Platform discovery
   - Curious Mind (visit 10 forums)
   - Digital Nomad (participate in 25 communities)
   - Omnipresent (active in 50+ communities)

4. **Mastery** - Advanced features
   - Encryption Enthusiast (enable E2EE on 10 chats)
   - Privacy Advocate (verify 5 encryption keys)
   - Protocol Pioneer (contribute to open source)

5. **Legendary** - Long-term milestones
   - Decade Veteran (10 years active)
   - Network of Thousands (1000 connections)
   - Legend Maker (10,000 upvotes)

6. **Secret** - Hidden easter eggs
   - Night Owl (100 messages 2-4 AM)
   - Emoji Enthusiast (use 50 different emoji)
   - Konami Code (enter the code in UI)

#### Rarity Tiers:
- **Common:** 50-100 XP
- **Uncommon:** 200-400 XP
- **Rare:** 500-750 XP
- **Epic:** 1,000-2,000 XP
- **Legendary:** 3,000-5,000 XP
- **Mythic:** 10,000-15,000 XP

### Lore System

**Content:** `/apps/web/src/data/loreContent.ts`

An immersive narrative about privacy, decentralization, and digital freedom.

#### Structure:
- **3 Chapters** with branching storylines
- **Unlock Requirements** tied to achievements and milestones
- **Fragment-based Delivery** reveals story progressively
- **World-building Elements** create rich backstory

#### Chapter Overview:
1. **The Surveillance Age** - Introduction to the dystopian digital landscape
2. **The Awakening** - Discovery of decentralized resistance
3. **The New Protocol** - Birth of CGraph and the encrypted future

### UI Components

#### Level Progress Widget

**Location:** `/apps/web/src/components/gamification/LevelProgress.tsx`

**Variants:**
- **Compact:** Sidebar/header integration (52px height)
- **Expanded:** Full feature showcase with stats grid

**Features:**
- Animated gradient progress bar
- Real-time XP gain notifications
- Streak multiplier display
- Next level preview

#### Level Up Modal

**Location:** `/apps/web/src/components/gamification/LevelUpModal.tsx`

**Celebration Features:**
- Canvas confetti explosion (rarity-based particle count)
- 3D rotating level badge animation
- Reward showcase (titles, badges, perks, lore)
- Sound effects integration ready
- Social sharing hooks

**Confetti Scaling:**
- Common: 30 particles
- Uncommon: 50 particles
- Rare: 75 particles
- Epic: 100 particles
- Legendary: 150 particles
- Mythic: 200 particles (with star shapes)

#### Achievement Notifications

**Location:** `/apps/web/src/components/gamification/AchievementNotification.tsx`

**Toast System:**
- Slide-in from right with spring animation
- Auto-dismiss after 5 seconds with progress bar
- Click to view details or dismiss
- Queue system for multiple achievements
- Rarity-based color coding and glow effects

---

## Forum Features

### Nested Comments System

**Location:** `/apps/web/src/components/forums/NestedComments.tsx`

A sophisticated threaded comment system with unlimited depth.

#### Features:

**Threading:**
- Infinite nesting with visual indentation
- Collapsible threads (hide/show N replies)
- Max depth limiter (default: 10 levels)
- "Continue thread" pagination for deep nests

**Voting:**
- Upvote/downvote with score display
- Real-time optimistic updates
- Color-coded scores (positive=green, negative=red)
- Vote reversal support (click again to undo)

**Best Answer System:**
- Post authors can mark best answers
- Green badge highlight for best answers
- Auto-pin to top of comment list
- XP bonus for best answer recipients

**Moderation:**
- Edit own comments (marked as "edited")
- Delete own comments or as post author
- Report functionality (ready for integration)

**Sorting Options:**
- **Best:** Best answers first, then by score + recency
- **New:** Most recent first
- **Old:** Oldest first
- **Controversial:** High vote activity with low scores

#### Technical Implementation:
```typescript
interface Comment {
  id: string;
  parentId: string | null; // null = top-level
  depth: number; // calculated recursively
  replies: Comment[]; // nested structure
  score: number;
  userVote: 1 | -1 | null;
  isBestAnswer: boolean;
  // ... author, content, timestamps
}
```

**Recursive Rendering:**
The component uses a `renderComment` function that calls itself for nested replies, creating an elegant infinite-depth solution.

---

## UI/UX Enhancements

### Glassmorphism Design System

**Location:** `/apps/web/src/components/ui/GlassCard.tsx`

A modern, frosted-glass aesthetic used throughout the application.

#### Variants:
1. **Default** - Standard frosted glass
2. **Frosted** - Heavy blur with opacity
3. **Crystal** - Clear with subtle tint
4. **Neon** - Vibrant borders with glow
5. **Holographic** - Rainbow gradient effects

#### Properties:
- **Glow:** Optional pulsing glow effect
- **Border Gradient:** Animated rainbow borders
- **3D Hover:** Perspective transform on hover
- **Intensity:** Subtle, medium, or strong blur

### Animation Engine

**Location:** `/apps/web/src/lib/animations/AnimationEngine.ts`

Centralized animation utilities for consistent motion design.

#### Haptic Feedback:
```typescript
HapticFeedback.light(); // Subtle tap
HapticFeedback.medium(); // Standard interaction
HapticFeedback.success(); // Positive confirmation
```

#### Pre-configured Animations:
- **Fade In:** Standard entrance
- **Slide In:** Directional entrance (up, down, left, right)
- **Scale:** Grow/shrink effects
- **Bounce:** Spring physics
- **Stagger:** Sequential list animations

### Customizable UI Settings

**Location:** Integrated into chat interface (lines 504-622 in `Conversation.tsx`)

Users can customize their experience in real-time.

#### Options:
- **Glass Effect:** Choose from 5 variants
- **Animation Intensity:** Low (performance) / Medium / High (beautiful)
- **Particles:** Toggle background particle effects
- **Glow Effects:** Enable/disable glow animations
- **3D Effects:** Enable perspective transforms
- **Haptic Feedback:** Toggle vibration feedback
- **Voice Visualizer Theme:** 4 color schemes (Matrix Green, Cyber Blue, Neon Pink, Amber)
- **Message Animation:** Entry style (slide, scale, fade, bounce)

Settings persist in user preferences (ready for backend integration).

---

## Architecture & Security

### State Management

**Technology:** Zustand with persistence middleware

**Stores:**
1. **authStore** - Authentication, user session
2. **chatStore** - Messages, conversations, typing indicators
3. **forumStore** - Posts, comments, voting
4. **gamificationStore** - XP, levels, achievements, quests

**Persistence Strategy:**
- **Session Storage:** Auth tokens (cleared on browser close)
- **Local Storage:** UI preferences, gamification progress
- **Base64 Encoding:** Obfuscation layer for stored data

### Real-time Communication

**Technology:** WebSocket (Socket.io)

**Event Types:**
- `new_message` - Message received
- `typing` - User typing status
- `reaction` - Reaction added/removed
- `presence` - User online/offline status
- `read_receipt` - Message read notification

**Connection Management:**
- Automatic reconnection with exponential backoff
- Heartbeat ping/pong for connection health
- Offline queue for messages sent while disconnected

### Security Features

#### End-to-End Encryption

**Indicator:** Green badge in chat header

**Implementation Notes:**
- Backend handles encryption/decryption
- Frontend displays E2EE status
- Key verification flow (ready for implementation)

#### Content Security Policy

Protects against XSS and injection attacks:
- Iframe sandboxing for embeds
- URL validation for media
- Input sanitization for user content

#### Authentication

**Method:** JWT tokens with refresh mechanism

**Security Model:**
1. **Primary:** HTTP-only cookies (immune to XSS)
2. **Secondary:** Session storage token (for WebSocket only)
3. **Refresh:** 15-minute access token expiry
4. **Path Restriction:** Refresh endpoint isolated

---

## Integration Guide

### Adding New Achievement

1. Define in `/apps/web/src/data/achievements.ts`:
```typescript
{
  id: 'unique_id',
  title: 'Achievement Name',
  description: 'Clear description of requirement',
  category: 'social', // or content, exploration, mastery, legendary, secret
  rarity: 'rare', // common, uncommon, rare, epic, legendary, mythic
  icon: '🎯',
  xpReward: 500,
  maxProgress: 10, // Number of times action must be performed
  isHidden: false, // true for secret achievements
  loreFragment: 'lore_1_2', // Optional lore unlock
  titleReward: 'The Achiever', // Optional title unlock
}
```

2. Track progress in application code:
```typescript
import { useGamificationStore } from '@/stores/gamificationStore';

const { trackAchievement } = useGamificationStore();

// When achievement-worthy action occurs:
await trackAchievement('unique_id');
```

3. The system automatically:
   - Updates progress
   - Unlocks when maxProgress reached
   - Awards XP and rewards
   - Shows notification
   - Unlocks lore fragments

### Adding XP Source

```typescript
import { useGamificationStore } from '@/stores/gamificationStore';

const { addXP } = useGamificationStore();

// When XP-worthy action occurs:
await addXP(100, 'Created helpful post');
```

The system handles:
- Streak multiplier application
- Level-up detection
- Level-up modal display
- XP gain notification

### Displaying Gamification UI

```typescript
import LevelProgress from '@/components/gamification/LevelProgress';
import LevelUpModal from '@/components/gamification/LevelUpModal';
import AchievementNotification from '@/components/gamification/AchievementNotification';

// In your component:
function YourComponent() {
  return (
    <>
      {/* Compact progress in header/sidebar */}
      <LevelProgress variant="compact" showStreak />

      {/* Expanded in profile/dashboard */}
      <LevelProgress variant="expanded" showStreak />

      {/* Level-up modal (auto-triggered by store) */}
      <LevelUpModal
        isOpen={showLevelUpModal}
        oldLevel={prevLevel}
        newLevel={currentLevel}
        xpGained={xpAmount}
        rewardsUnlocked={rewards}
        onClose={() => setShowLevelUpModal(false)}
      />

      {/* Achievement notifications (auto-managed) */}
      <AchievementNotification
        notifications={achievementQueue}
        onDismiss={(index) => removeFromQueue(index)}
        onViewDetails={(achievement) => navigate('/achievements')}
      />
    </>
  );
}
```

---

## Performance Considerations

### Optimizations Implemented:

1. **Lazy Loading:**
   - Images load only when in viewport
   - Components code-split with React.lazy
   - Route-based chunking

2. **Animation Throttling:**
   - Particle count scales with intensity setting
   - RequestAnimationFrame for smooth 60fps
   - GPU-accelerated transforms (translate3d, will-change)

3. **State Updates:**
   - Optimistic UI updates for instant feedback
   - Debounced API calls (typing indicators, search)
   - Virtualized lists for long comment threads

4. **Memory Management:**
   - Automatic cleanup of event listeners
   - Component unmount cleanup in useEffect
   - WeakMap for DOM reference storage

---

## Browser Compatibility

**Tested Browsers:**
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

**Polyfills Included:**
- ResizeObserver
- IntersectionObserver
- fetch API

**Progressive Enhancement:**
- Core functionality works without JavaScript
- Graceful fallback for older browsers
- CSS fallbacks for unsupported properties

---

## Accessibility

**WCAG 2.1 Level AA Compliance:**

- **Keyboard Navigation:** All interactive elements accessible via keyboard
- **Screen Readers:** Semantic HTML with ARIA labels
- **Color Contrast:** Minimum 4.5:1 ratio for text
- **Focus Indicators:** Visible focus states on all focusable elements
- **Alternative Text:** All images include descriptive alt text
- **Motion Preferences:** Respects `prefers-reduced-motion`

---

## Future Enhancements

**Planned Features:**

1. **Quest System:**
   - Daily, weekly, monthly challenges
   - Quest chains with narrative progression
   - Bonus XP multipliers for completion

2. **Leaderboards:**
   - Global and forum-specific rankings
   - Weekly/monthly/all-time periods
   - Friend leaderboards

3. **Social Features:**
   - Achievement sharing to social media
   - Friend challenges
   - Gift badges and awards

4. **Mobile App Integration:**
   - Cross-platform progress sync
   - Push notifications for achievements
   - Mobile-optimized animations

5. **Advanced Analytics:**
   - Personal progress dashboard
   - Engagement heatmaps
   - Contribution statistics

---

## Leaderboard System

**Location:** `/apps/web/src/pages/leaderboard/LeaderboardPage.tsx`

A global ranking system that fosters healthy competition and community engagement.

### Features

#### Multiple Categories
- **Experience (XP):** Total experience points earned
- **Karma:** Forum reputation from upvotes/helpful answers
- **Streak:** Consecutive login days
- **Messages:** Total messages sent across all conversations
- **Posts:** Forum posts created
- **Connections:** Total friend connections

#### Time Period Filters
- **Today:** Daily rankings reset at midnight UTC
- **This Week:** Weekly rankings reset on Monday
- **This Month:** Monthly rankings reset on the 1st
- **All Time:** Lifetime cumulative rankings

### Visual Design

#### Top 3 Podium
- Animated entrance with staggered delays
- Crown icon for #1 position
- Gold, silver, bronze color schemes
- Glow effects based on rank

#### Rank Change Indicators
- Green up arrow with "+N" for improvements
- Red down arrow with "-N" for drops
- Gray dash for unchanged positions

### Technical Implementation

```typescript
interface LeaderboardEntry {
  rank: number;
  previousRank: number;
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  level: number;
  value: number;
  isOnline: boolean;
  isPremium: boolean;
  isVerified: boolean;
}
```

**API Endpoints:**
- `GET /api/v1/leaderboard?category=xp&period=weekly&page=1` - Fetch rankings
- Real-time updates via WebSocket for rank changes

**Route:** `/leaderboard`

---

## Premium & Subscriptions

**Location:** `/apps/web/src/pages/premium/PremiumPage.tsx`

A tiered subscription system for monetization with fair free tier.

### Subscription Tiers

#### Free Tier
- Basic messaging
- Standard themes
- 5 custom reactions
- Limited file upload (25MB)
- Standard support
- Basic read receipts
- 3 group chats

#### Premium ($4.99/month)
- Everything in Free, plus:
- Custom themes
- Voice effects
- Premium avatars & badges
- 500MB file uploads
- Priority support
- Read receipts everywhere
- Unlimited group chats
- AI message suggestions
- Advanced analytics

#### Premium Plus ($9.99/month)
- Everything in Premium, plus:
- All voice effects unlocked
- Exclusive animated avatars
- Custom badges creation
- 2GB file uploads
- 24/7 priority support
- Advanced read insights
- API access
- Cloud backup
- Priority in queue
- Early feature access
- Personal account manager

### Pricing Features
- **Annual Billing:** 20% discount on all tiers
- **Price Toggle:** Switch between monthly/yearly billing
- **Feature Comparison:** Detailed table comparing all tiers

### Technical Implementation

**API Endpoints:**
- `POST /api/v1/subscription/subscribe` - Initiate subscription
- Returns Stripe checkout URL for payment processing

**Route:** `/premium`

---

## Virtual Currency & Shop

**Location:** `/apps/web/src/pages/premium/CoinShop.tsx`

A virtual currency system for cosmetic purchases and engagement rewards.

### Coin Bundles

| Bundle | Coins | Bonus | Price |
|--------|-------|-------|-------|
| Starter | 100 | 0 | $0.99 |
| Basic | 500 | 50 | $4.99 |
| Popular | 1,200 | 200 | $9.99 |
| Value | 2,500 | 500 | $19.99 |
| Premium | 6,500 | 1,500 | $49.99 |
| Ultimate | 15,000 | 5,000 | $79.99 |

### Shop Categories

#### Themes (800-1,500 coins)
- Midnight Purple, Ocean Blue, Forest Green, Sunset Orange, etc.

#### Emoji Packs (500-1,000 coins)
- Cute Animals, Space Adventure, Food Fiesta, Nature Vibes

#### Profile Badges (1,200-3,000 coins)
- Diamond Member, Verified Plus, Golden Star, etc.

#### Chat Effects (600-2,000 coins)
- Confetti, Fireworks, Hearts, Sparkles, etc.

#### XP Boosts (750-1,500 coins)
- 2x XP for 24h, 3x XP for 1h

#### Gift Items (300-2,500 coins)
- Virtual Coffee, Flowers, Trophy, etc.

### Daily Bonus
- **Free coins daily:** 25 coins
- Claims reset at midnight

### Technical Implementation

```typescript
interface ShopItem {
  id: string;
  name: string;
  description: string;
  coinPrice: number;
  category: 'theme' | 'emoji' | 'badge' | 'effect' | 'boost' | 'gift';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  icon: string;
  preview?: string;
}
```

**API Endpoints:**
- `GET /api/v1/shop/owned` - Fetch owned items
- `POST /api/v1/shop/purchase-coins` - Purchase coin bundle
- `POST /api/v1/shop/purchase-item` - Purchase shop item
- `POST /api/v1/shop/claim-daily` - Claim daily bonus

**Route:** `/premium/coins`

---

## Quest System

**Location:** `/apps/web/src/components/gamification/QuestPanel.tsx`

Daily and weekly quests to drive engagement with meaningful rewards.

### Quest Types

- **Daily:** Reset every 24 hours, simpler objectives
- **Weekly:** Reset every Monday, larger goals
- **Monthly:** Reset on 1st of month, significant achievements
- **Special:** Event-based, limited time

### Features

#### Quest Cards
- Progress bar showing completion percentage
- Time remaining countdown
- XP reward display
- Expandable objective list

#### Quest Objectives
- Multiple objectives per quest
- Individual progress tracking
- Checkmark indicators for completion

#### Reward System
- XP rewards (50-500+ XP)
- Confetti celebration on completion
- Haptic feedback on claim

### Visual Variants

#### Compact Mode
- Minimal footprint for sidebar/dashboard
- Shows top 3 quests
- Progress percentage indicators

#### Full Mode
- Complete quest information
- Expandable objectives
- Category badges (daily/weekly/monthly/special)

### Technical Implementation

```typescript
interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'special';
  objectives: QuestObjective[];
  xpReward: number;
  expiresAt: string;
  completed: boolean;
  completedAt?: string;
}

interface QuestObjective {
  id: string;
  description: string;
  targetValue: number;
  currentValue: number;
  completed: boolean;
}
```

**Integration:** Used in QuestPanel component, exported from `/components/gamification/index.ts`

---

## Global Notifications

**Location:** `/apps/web/src/providers/NotificationProvider.tsx`

Centralized notification system for application-wide alerts and celebrations.

### Notification Types

#### Standard Toast Types
- **Success:** Green theme, checkmark icon
- **Error:** Red theme, X icon
- **Warning:** Yellow theme, exclamation icon
- **Info:** Blue theme, information icon

#### Special Notification Types
- **Level Up:** Golden celebration with confetti
- **Quest Complete:** Purple theme with XP display

### Features

#### Toast Notifications
- Slide-in animation from left
- Auto-dismiss with progress bar
- Manual dismiss button
- Haptic feedback based on type

#### Level Up Celebrations
- Full-screen confetti explosion
- Animated level badge
- Reward showcase
- Progress bar countdown

#### Quest Completion
- Animated icon
- XP reward display
- Smooth transitions

### Usage

```typescript
import { useNotifications } from '@/providers/NotificationProvider';

function MyComponent() {
  const { notify, notifyLevelUp, notifyQuestComplete } = useNotifications();

  // Standard notification
  notify({
    type: 'success',
    title: 'Action Complete',
    message: 'Your changes have been saved.',
  });

  // Level up notification
  notifyLevelUp({
    newLevel: 15,
    rewards: ['New Avatar Frame', 'Title: Rising Star'],
  });

  // Quest completion
  notifyQuestComplete({
    questName: 'Daily Messenger',
    xpReward: 100,
  });
}
```

### Technical Implementation

```typescript
type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'levelup' | 'quest';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  dismissible?: boolean;
}
```

**Integration:** Wrap app with `<NotificationProvider>` in `main.tsx`

---

## Performance Optimizations

**Location:** `/apps/web/src/lib/performance.ts`

Production-ready utilities for handling 10,000+ concurrent users.

### Request Batching

Combines multiple API requests into batched calls for efficiency.

```typescript
const userBatcher = new RequestBatcher<User>(
  async (ids) => {
    const users = await api.get('/users', { ids });
    return new Map(users.map(u => [u.id, u]));
  },
  { batchSize: 50, batchDelay: 16 }
);

// Automatically batched
const user = await userBatcher.load('user-123');
```

### LRU Cache

Memory-efficient caching with TTL expiration.

```typescript
const cache = new LRUCache<string, User>(500, 10 * 60 * 1000); // 500 items, 10min TTL

cache.set('user-123', userData);
const cached = cache.get('user-123');
```

### Pre-configured Caches
- **userCache:** 500 entries, 10 minute TTL
- **messageCache:** 1000 entries, 5 minute TTL
- **presenceCache:** 200 entries, 30 second TTL

### Virtual Scrolling Helpers

Efficient rendering for large lists.

```typescript
const { items, totalSize, startOffset } = calculateVirtualItems(
  totalCount,    // Total items
  itemSize,      // Fixed height or function
  containerHeight,
  scrollTop,
  overscan       // Buffer items (default: 3)
);
```

### Utility Functions

- **debounce:** Delay function execution
- **throttle:** Limit function call rate
- **preloadImage:** Preload images for instant display
- **preloadRoute:** Prefetch route chunks

### Performance Monitoring

```typescript
performanceMonitor.mark('fetch-start');
await fetchData();
const duration = performanceMonitor.measure('fetch-complete', 'fetch-start');
console.log(`Fetch took ${duration}ms`);
```

### Connection Helpers

- **getConnectionType:** Returns '4g', '3g', '2g', etc.
- **isSlowConnection:** True for slow networks
- **getMemoryInfo:** Current heap usage
- **isMemoryPressure:** True when heap > 80%

---

## Troubleshooting

### Common Issues:

**Achievement not unlocking:**
- Check `maxProgress` value in achievement definition
- Verify `trackAchievement()` is being called correctly
- Check browser console for errors

**Animations laggy:**
- Reduce animation intensity in settings
- Disable particle effects
- Check GPU acceleration is enabled in browser

**WebSocket disconnections:**
- Check network connectivity
- Verify backend WebSocket server is running
- Check browser console for connection errors

**XP not updating:**
- Verify `addXP()` is being awaited
- Check gamificationStore is properly initialized
- Ensure API endpoint returns success

---

## Conclusion

CGraph's enhanced web application provides a modern, engaging user experience with gamification, rich media support, and sophisticated community features. The modular architecture allows for easy extension and customization, while maintaining high performance and accessibility standards.

For questions or contributions, please refer to the main repository documentation or contact the development team.

**Version:** 0.7.44
**Last Updated:** January 2026
**Maintained by:** CGraph Development Team
