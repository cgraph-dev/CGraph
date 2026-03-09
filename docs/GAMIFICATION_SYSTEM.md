# CGraph Gamification System — Complete Reference

> Generated: 2026-03-09 | Covers: `modules/gamification/`, `pages/gamification/`, `data/achievements.ts`, backend `CGraph.Gamification`

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Leveling & XP](#2-leveling--xp)
3. [Achievements](#3-achievements)
4. [Badges](#4-badges)
5. [Titles](#5-titles)
6. [Quests](#6-quests)
7. [Streaks & Daily Rewards](#7-streaks--daily-rewards)
8. [Leaderboards](#8-leaderboards)
9. [User Stars (Post Tiers)](#9-user-stars-post-tiers)
10. [Prestige](#10-prestige)
11. [Seasonal Events & Battle Pass](#11-seasonal-events--battle-pass)
12. [Marketplace](#12-marketplace)
13. [Coin Shop & Currency](#13-coin-shop--currency)
14. [Referrals](#14-referrals)
15. [Level Gates (Feature Gating)](#15-level-gates-feature-gating)
16. [Socket Events (Real-Time)](#16-socket-events-real-time)
17. [Store Architecture](#17-store-architecture)
18. [Backend Modules](#18-backend-modules)
19. [Known Issues & Inconsistencies](#19-known-issues--inconsistencies)
20. [Data File Locations](#20-data-file-locations)
21. [Feature Counts Summary](#21-feature-counts-summary)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│  Gamification System                                                │
│                                                                     │
│  ┌─ Frontend (apps/web) ──────────────────────────────────────────┐ │
│  │                                                                │ │
│  │  Pages:                                                        │ │
│  │    /gamification         → Hub (stats, links, recent)          │ │
│  │    /gamification/achievements → 107 achievements grid          │ │
│  │    /gamification/quests  → Quest panel (active/daily/weekly)    │ │
│  │    /gamification/titles  → Title collection (26 titles)        │ │
│  │    /leaderboard          → Full leaderboard (6 categories)     │ │
│  │    /customize/progression → Read-only dashboard                │ │
│  │                                                                │ │
│  │  Modules (modules/gamification/):                              │ │
│  │    Stores:  gamification | prestige | seasonal | marketplace   │ │
│  │             referral | coinShop | avatarBorder                 │ │
│  │    Components: achievement-display | quest-panel | badges      │ │
│  │               daily-rewards | streak-tracker | events          │ │
│  │               leaderboard-widget | level-progress | level-gate │ │
│  │               level-up-modal | marketplace-page | user-stars   │ │
│  │               referral-dashboard | title-badge | xp-toast      │ │
│  │    Socket: Phoenix channel → real-time XP/achievement events   │ │
│  │                                                                │ │
│  └────────────────────────┬───────────────────────────────────────┘ │
│                           │                                         │
│  ┌────────────────────────▼───────────────────────────────────────┐ │
│  │  Backend (apps/backend/lib/cgraph/gamification/)               │ │
│  │                                                                │ │
│  │  Contexts: AchievementSystem | QuestSystem | CurrencySystem    │ │
│  │            EventSystem | LeaderboardSystem | FeatureGates      │ │
│  │            Marketplace | TitleShopSystem                       │ │
│  │  Schemas: Achievement | Quest | XpTransaction | CoinTransaction│ │
│  │           SeasonalEvent | MarketplaceItem | UserPrestige       │ │
│  │           UserAchievement | UserQuest | UserTitle | DailyCap   │ │
│  │  Workers: QuestRotationWorker | EventLifecycleWorker           │ │
│  │  Channel: GamificationChannel (Phoenix WebSocket)              │ │
│  │                                                                │ │
│  │  Level Gates: quests (L3) | shop (L8) | cosmetics (L10)       │ │
│  │               titles (L12) | marketplace (L15) | events (L20) │ │
│  │               prestige (L25)                                   │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

**Facade:** `useGamificationFacade` — unified hook exposing 28 fields from 4 stores
**Primary Store:** `useGamificationStore` — Zustand + localStorage persist (`cgraph-gamification`)
**Real-Time:** Phoenix WebSocket channel with 17 event types

---

## 2. Leveling & XP

### XP-to-Level Formula

$$XP_{required}(level) = \lfloor 100 \times level^{1.8} \rfloor$$

| Level | XP Required | Cumulative | Milestone |
|-------|-------------|------------|-----------|
| 1 | 100 | 100 | — |
| 3 | 520 | — | Quests unlock |
| 5 | 1,844 | — | — |
| 8 | 4,096 | — | Shop unlocks |
| 10 | 6,310 | — | Cosmetics unlock |
| 12 | 8,711 | — | Titles unlock |
| 15 | 13,275 | — | Marketplace unlocks |
| 20 | 22,387 | — | Events unlock |
| 25 | 33,437 | — | Prestige unlocks |
| 50 | 94,574 | — | — |
| 100 | 398,107 | — | — |

### Streak Multipliers

| Streak Days | XP Multiplier |
|-------------|---------------|
| 0–2 | 1.0× |
| 3–6 | 1.5× |
| 7+ | 2.0× |

### XP Sources (12 event types)

`message_sent`, `forum_post`, `forum_reply`, `reaction_given`, `reaction_received`, `friend_added`, `group_joined`, `premium_bonus`, `daily_login`, `quest_completed`, `achievement_unlocked`, `referral`

### Daily XP Cap

XP is subject to per-source daily caps with diminishing returns. The `XPAwardedEvent` socket event includes:
- `daily_cap_status.source` — which source was capped
- `daily_cap_status.used` / `limit` / `remaining` — cap tracking
- `daily_cap_status.diminishing_active` — whether diminishing returns are active

### Store Properties

| Property | Type | Default | Persisted |
|----------|------|---------|-----------|
| `level` | number | `1` | ✅ |
| `currentXP` | number | `0` | ✅ |
| `totalXP` | number | `0` | ✅ |
| `xp` | number (alias → `totalXP`) | — | — |
| `karma` | number | `0` | ❌ |

### Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `LevelProgress` | `modules/gamification/components/level-progress.tsx` | XP bar with level display |
| `LevelUpModal` | `modules/gamification/components/level-up-modal/` | Celebration modal on level-up |
| `XPToast` | `modules/gamification/components/xp-toast/` | Floating "+XP" notification |

---

## 3. Achievements

### Data Source

| Property | Details |
|----------|---------|
| **Data file** | `src/data/achievements.ts` |
| **Total count** | **107 achievements** |
| **Categories** | 6: social, content, exploration, mastery, legendary, secret |
| **Rarities** | 6: common, uncommon, rare, epic, legendary, mythic |
| **Title rewards** | 41 achievements grant title strings |
| **API** | `GET /api/v1/gamification/achievements` |

### By Category

| Category | Count | Total XP | Description |
|----------|-------|----------|-------------|
| social | 24 | 11,925 | Messaging, friends, groups, reactions, streaks |
| mastery | 23 | 19,325 | Customization, collecting, premium, tenure |
| secret | 22 | 9,150 | Hidden/holiday/behavioral achievements |
| content | 15 | 9,975 | Forum posts, threads, quality content |
| legendary | 12 | 65,700 | Leaderboard ranks, long-term milestones |
| exploration | 11 | 3,950 | Feature discovery, browsing, community |

### By Rarity

| Rarity | Count | XP Range |
|--------|-------|----------|
| common | 12 | 50–100 |
| uncommon | 34 | 150–400 |
| rare | 29 | 300–750 |
| epic | 19 | 600–2,000 |
| legendary | 7 | 2,000–5,000 |
| mythic | 6 | 5,000–15,000 |

**Grand total XP available:** 120,025

### Achievement Interface

```typescript
interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  icon: string; // emoji
  xpReward: number;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  unlockedAt?: string;
  isHidden: boolean;
  loreFragment?: string;
  titleReward?: string;
}
```

### Achievement Examples

**Social:** `first_message` (common, 50 XP) → `quarterly_champion` (legendary, 2500 XP, title: "The Unwavering")
**Content:** `first_post` (common, 75 XP) → `knowledge_keeper` (legendary, 3000 XP, title: "The Archivist")
**Secret:** `konami_code` (legendary, 2000 XP, title: "Retro Gamer"), `easter_egg_hunter` (epic, 1000 XP, title: "Seeker of Secrets")
**Legendary:** `legend_maker` (mythic, 15000 XP, title: "Living Legend"), `number_one` (mythic, 5000 XP, title: "Champion")

### Components

| Component | Location | Purpose |
|-----------|----------|---------|
| Achievement Display | `modules/gamification/components/achievement-display/` | Grid/list with filter, stats, modal detail |
| Achievement Notification | `modules/gamification/components/achievement-notification/` | Toast popup on unlock |
| Achievement Toast | `components/ui/achievement-toast.tsx` | Simple UI toast |
| Achievements Page | `pages/gamification/achievements-page/` | Full page with category filter, rarity sort |

---

## 4. Badges

### Data Source

| Property | Details |
|----------|---------|
| **Data file** | `src/data/badgesCollection.ts` |
| **Total count** | **36 badges** |
| **Rarities** | 5: common, rare, epic, legendary, mythic (⚠️ no `uncommon`) |
| **Premium badges** | 7 (1 epic, 2 legendary, 4 mythic — all mythic are premium) |
| **Max equipped** | 5 simultaneously |
| **API** | `GET /api/v1/cosmetics/badges` |

### By Rarity

| Rarity | Count | Premium | Examples |
|--------|-------|---------|----------|
| common | 8 | 0 | newcomer, first-message, profile-complete, first-friend, group-joiner, forum-poster, early-adopter, night-owl |
| rare | 8 | 0 | social-butterfly, chatterbox, forum-contributor, group-leader, streak-7, helper, collector, voice-user |
| epic | 8 | 1 | streak-30, 10k-messages, community-star (L25), quest-hunter, beta-tester, event-champion, moderator, vip (premium) |
| legendary | 8 | 3 | streak-365, 100k-messages, founder (premium), completionist, top-contributor, prestige, master-collector, server-booster (premium) |
| mythic | 4 | 4 | immortal (premium), cosmic (premium), god-tier (premium), zodiac-master (premium) |

### Badge Interface

```typescript
interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: BadgeRarity; // 'common' | 'rare' | 'epic' | 'legendary' | 'mythic'
  unlocked: boolean;
  unlockRequirement?: string;
  unlockLevel?: number;
  isPremium: boolean;
}
```

### Components

| Component | Location | Purpose |
|-----------|----------|---------|
| Animated Badge | `modules/gamification/components/badges/animated-badge/` | Rarity-colored badge with glow, orbiting particles, tooltip |
| Badge Collection | `modules/gamification/components/badges/badge-collection/` | Filterable grid with category tabs (⚠️ badge data has no categories) |
| Badge Showcase | `modules/gamification/components/badges/badge-showcase.tsx` | Display row on profile |
| Badge Picker Modal | `modules/gamification/components/badges/badge-picker-modal.tsx` | Equip/unequip selection |

### Animated Badge Effects (by rarity)

Each rarity has 6 color properties: `primary`, `secondary`, `glow`, `gradient`, `particle`, `bg`. The animated badge component uses `AchievementRarity` (6 entries including `uncommon`) rather than `BadgeRarity` (5 entries), so the color map has 6 rarity configs. Sizes: `xs` (32px), `sm` (40px), `md` (56px), `lg` (72px), `xl` (96px).

---

## 5. Titles

### Data Source

| Property | Details |
|----------|---------|
| **Data file** | `src/data/titlesCollection.ts` |
| **Total count** | **26 titles** |
| **Rarities** | 6: free, common, rare, epic, legendary, mythic |
| **Premium titles** | 5 (1 epic, 1 legendary, 3 mythic) |
| **Animation types** | 11 declared (10 used, `bounce` unused) |
| **API** | `GET /api/v1/cosmetics/titles` (level-gated: L12) |

### By Rarity

| Rarity | Count | Titles |
|--------|-------|--------|
| free | 2 | Newbie, Member |
| common | 4 | Adventurer, Chatterbox, Night Owl, Early Bird |
| rare | 5 | Veteran, Forum Master, Social Butterfly, Moderator, Collector |
| epic | 6 | Elite, Champion, Beta Tester, VIP (premium), Speedrunner, PvP Master |
| legendary | 5 | Legend, Founder (premium), Administrator, Completionist, No-Lifer |
| mythic | 4 | Mythic Hero, God (premium), Immortal (premium), Cosmic Entity (premium) |

### Animation Types

| Animation | Count | Used By |
|-----------|-------|---------|
| `rainbow` | 4 | Mythic Hero, God, Cosmic Entity, Legend |
| `shimmer` | 4 | Champion, Founder, Completionist, Immortal |
| `glow` | 4 | Veteran, Forum Master, Collector, VIP |
| `pulse` | 3 | Elite, Moderator, PvP Master |
| `fade` | 3 | Adventurer, Night Owl, Early Bird |
| `none` | 2 | Newbie, Member |
| `glitch` | 2 | Beta Tester, No-Lifer |
| `wave` | 2 | Social Butterfly, Speedrunner |
| `typing` | 1 | Chatterbox |
| `neon-flicker` | 1 | Administrator |
| `bounce` | 0 | Declared in type but unused |

### Title Interface

```typescript
interface TitleDefinition {
  id: string;
  name: string;
  displayName: string;
  description: string;
  rarity: TitleRarity; // 'free' | 'common' | 'rare' | 'epic' | 'legendary' | 'mythic'
  animationType: TitleAnimationType;
  gradient: string; // Tailwind gradient classes
  colors: string[];
  isPremium: boolean;
  unlocked: boolean;
  unlockRequirement?: string;
  unlockLevel?: number;
}
```

### Achievement-Granted Titles vs. Titles Collection

- 41 achievements grant `titleReward` strings
- Only **3** match a `displayName` in `titlesCollection.ts`: "Veteran", "Elite", "Champion"
- The remaining **38 title strings** have no corresponding entry in the titles data — they are either dynamically created by the backend or orphaned references

### Components

| Component | Location | Purpose |
|-----------|----------|---------|
| Title Badge | `modules/gamification/components/title-badge/` | Renders title text with animation |
| Inline Title | `modules/gamification/components/title-badge/inline-title.tsx` | Compact inline title display |
| Profile Title Display | `modules/gamification/components/title-badge/profile-title-display.tsx` | Title in profile card |
| Titles Page | `pages/gamification/titles-page.tsx` | Full title collection with 3 tabs: owned, all, purchasable |

---

## 6. Quests

### Quest Types

| Type | Description | Rotation |
|------|-------------|----------|
| `daily` | Reset every 24h | `QuestRotationWorker` |
| `weekly` | Reset every 7 days | `QuestRotationWorker` |
| `monthly` | Reset every month | Manual |
| `seasonal` | Event-tied | `EventLifecycleWorker` |
| `special` | One-time / limited | Manual |

### Quest Interface

```typescript
interface Quest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  xpReward: number;
  objectives: QuestObjective[];
  expiresAt: string;
  completed: boolean;
  completedAt?: string;
  nextQuestId?: string; // Quest chains
}

interface QuestObjective {
  id: string;
  description: string;
  type: string;
  targetValue: number;
  currentValue: number;
  completed: boolean;
}
```

### API Endpoints (level-gated: L3)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /api/v1/quests/` | GET | All available quests |
| `GET /api/v1/quests/active` | GET | Active (accepted) quests |
| `GET /api/v1/quests/daily` | GET | Today's daily quests |
| `GET /api/v1/quests/weekly` | GET | This week's quests |
| `GET /api/v1/quests/:id` | GET | Quest details |
| `POST /api/v1/quests/:id/accept` | POST | Accept a quest |
| `POST /api/v1/quests/:id/claim` | POST | Claim completed quest rewards |

### Components

| Component | Location | Purpose |
|-----------|----------|---------|
| Quest Panel | `modules/gamification/components/quest-panel/` | Compact or full quest list |
| Quest Page | `pages/gamification/quests-page/` | Full page with 4 tabs: active, daily, weekly, completed |

### Quest Page Tabs (4)

`active` — Accepted quests in progress
`daily` — Today's available dailies
`weekly` — This week's weeklies
`completed` — History of finished quests

---

## 7. Streaks & Daily Rewards

### Streaks

| Property | Details |
|----------|---------|
| **Store keys** | `loginStreak`, `lastLoginDate` (both persisted) |
| **Milestones** | 6 milestone thresholds |
| **API** | `POST /api/v1/gamification/streak/claim` |
| **Features** | Streak freeze (prevents losing streak on missed days) |

### Streak Milestones (6)

| Days | XP | Coins | Badge/Title |
|------|----|-------|-------------|
| 7 | 500 | 100 | — |
| 14 | 1,000 | 250 | — |
| 30 | 2,500 | 500 | 🔥 badge |
| 60 | 5,000 | 1,000 | "Dedicated" title |
| 100 | 10,000 | 2,500 | 💎 badge |
| 365 | 50,000 | 10,000 | "Legendary Streak" title |

**Fire animation:** 3 intensity levels — low (#F97316), medium (#FF6B6B), high (#FF4444)
**Glow color:** #FFD700 (gold)

### Daily Rewards (7-day cycle)

| Day | XP | Coins | Special |
|-----|----|-------|---------|
| 1 | 50 | 10 | — |
| 2 | 75 | 15 | — |
| 3 | 100 | 25 | — |
| 4 | 150 | 35 | Premium only |
| 5 | 200 | 50 | — |
| 6 | 250 | 75 | — |
| 7 | 500 | 150 | 🏆 "Weekly Warrior" badge |

**Total per cycle:** 1,325 XP + 360 coins
**Special reward types:** `border`, `badge`, `title`, `item`

### Components

| Component | Location | Variants |
|-----------|----------|----------|
| Streak Tracker | `modules/gamification/components/streak-tracker/` | default, compact, widget |
| Daily Rewards | `modules/gamification/components/daily-rewards/` | default, compact, modal |

---

## 8. Leaderboards

### Categories

| Category | Widget | Page | API Param |
|----------|--------|------|-----------|
| XP (Experience) | ✅ | ✅ | `xp` |
| Karma | ✅ | ✅ | `karma` |
| Messages | ✅ | ✅ | `messages` |
| Posts | ✅ | ✅ | `posts` |
| Achievements | ✅ widget only | ❌ | `achievements` |
| Referrals | ✅ widget only | ❌ | `referrals` |
| Streak | ❌ | ✅ page only | `streak` |
| Connections | ❌ | ✅ page only | `friends` |

### Time Periods (4)

`daily` (Today), `weekly` (This Week), `monthly` (This Month), `allTime`/`alltime`

### Rank Styling

| Rank | Color | Medal |
|------|-------|-------|
| 1st | Gold (#FFD700) | 🥇 |
| 2nd | Silver (#C0C0C0) | 🥈 |
| 3rd | Bronze (#CD7F32) | 🥉 |

### API Endpoints

| Endpoint | Method | Scope |
|----------|--------|-------|
| `GET /api/v1/gamification/leaderboard/:category` | GET | Global |
| `GET /api/v1/gamification/leaderboard/:scope/:scope_id/:category` | GET | Scoped (group/forum) |

### Components

| Component | Location | Variants |
|-----------|----------|----------|
| Leaderboard Widget | `modules/gamification/components/leaderboard-widget/` | default, compact, sidebar |
| Leaderboard Full Widget | `modules/gamification/components/leaderboard-full-widget.tsx` | Full page |
| Leaderboard Page | `pages/leaderboard/` | Full page with podium, filters, rankings |
| Forum Leaderboard | `modules/forums/components/leaderboard-widget/` | Forum-specific |
| User Leaderboard | `pages/community/user-leaderboard/` | Community page |

**Page size:** 25 entries per page

---

## 9. User Stars (Post Tiers)

Post-count based tier system (independent of XP levels).

### Tiers (10)

| Tier | Posts Required | Stars | Gold | Crown | Color |
|------|---------------|-------|------|-------|-------|
| Newcomer | 0–9 | 0 | ❌ | ❌ | gray-500 |
| Member | 10–49 | ⭐ | ❌ | ❌ | emerald-500 |
| Active | 50–99 | ⭐⭐ | ❌ | ❌ | blue-500 |
| Established | 100–249 | ⭐⭐⭐ | ❌ | ❌ | purple-500 |
| Senior | 250–499 | ⭐⭐⭐⭐ | ❌ | ❌ | pink-500 |
| Veteran | 500–999 | ⭐⭐⭐⭐⭐ | ❌ | ❌ | amber-500 |
| Elite | 1,000–2,499 | ⭐ | ✅ | ❌ | gold |
| Legend | 2,500–4,999 | ⭐⭐ | ✅ | ❌ | gold |
| Champion | 5,000–9,999 | ⭐⭐⭐ | ✅ | ❌ | gold |
| Ultimate | 10,000+ | ⭐⭐⭐⭐⭐ | ✅ | ✅ | gold |

### Sizes (4)

`xs`, `sm`, `md`, `lg` — each with star/crown/gap/text/container classes

### Components

| Component | Location | Purpose |
|-----------|----------|---------|
| User Stars | `modules/gamification/components/user-stars/user-stars.tsx` | Star display with tooltip |
| User Stars Badge | `modules/gamification/components/user-stars/user-stars-badge.tsx` | Compact badge variant |
| Crown Icon | `modules/gamification/components/user-stars/crown-icon.tsx` | Crown for Ultimate tier |
| Tier List | `modules/gamification/components/user-stars/user-stars-tier-list.tsx` | All tiers overview |

---

## 10. Prestige

Reset-based progression system — trade all XP to restart at level 1 with permanent bonuses.

### Bonuses Per Prestige Level

| Bonus | Rate per Level | At P10 | At P20 |
|-------|---------------|--------|--------|
| XP | +5% | +50% | +100% |
| Coins | +3% | +30% | +60% |
| Karma | +2% | +20% | +40% |
| Drop Rate | +1% | +10% | +20% |

### XP Required to Prestige

$$XP_{prestige}(level) = \lfloor 100{,}000 \times 1.5^{level} \rfloor$$

| From → To | XP Required |
|-----------|-------------|
| P0 → P1 | 100,000 |
| P1 → P2 | 150,000 |
| P5 → P6 | ~759,375 |
| P9 → P10 | ~3,844,335 |
| P19 → P20 | ~194,210,699 |

### Exclusive Rewards by Prestige Level

- Every level: "Prestige N" title + 5% XP bonus
- Level 3+: "Dedicated Player Badge"
- Level 5+: "Prestige Glow Effect"
- Level 10+: "Prestige Master Border"
- Level 15+: "Legendary Prestige" title
- Level 20+: "Transcendent Border"

### Reward Types (6)

`title`, `border`, `effect`, `badge`, `xp_bonus`, `coins`

### API Endpoints (level-gated: L25)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /api/v1/prestige` | GET | Current prestige data |
| `POST /api/v1/prestige/reset` | POST | Perform prestige reset |
| `GET /api/v1/prestige/rewards` | GET | Available rewards per tier |
| `GET /api/v1/prestige/leaderboard` | GET | Prestige leaderboard |

### Store: `usePrestigeStore`

- **State:** `prestige`, `requirements`, `canPrestige`, `allTiers[]`, `leaderboard[]`, `isLoading`, `isPrestiging`
- **Actions:** `fetchPrestige`, `fetchRewards`, `fetchLeaderboard`, `performPrestige`, `getProgressPercent`, `getBonusForLevel`, `getXpWithBonus`, `getCoinWithBonus`, `reset`
- **Selectors:** `usePrestigeLevel`, `usePrestigeBonuses`, `useCanPrestige`, `usePrestigeProgress`
- **Persistence:** `cgraph-prestige` — persists `prestige` + `allTiers`
- **Default tiers generated:** 20 levels

---

## 11. Seasonal Events & Battle Pass

### Event Types (6)

`seasonal`, `holiday`, `special`, `anniversary`, `collab`, `community`

### Event Statuses (4)

`upcoming`, `active`, `ending`, `ended`

### Event Reward Types (7)

`coins`, `gems`, `xp`, `title`, `border`, `effect`, `badge`

### Battle Pass

Each event can have a Battle Pass with free and premium tiers:

```typescript
interface BattlePassTier {
  tier: number;
  xpRequired: number;
  freeRewards: EventReward[];
  premiumRewards: EventReward[];
}
```

### Seasonal Themes (7)

| Theme | Particles | Count | Speed |
|-------|-----------|-------|-------|
| default | — | — | — |
| halloween | leaves | 30 | 2.0 |
| winter | snow | 50 | 1.5 |
| valentines | hearts | 25 | 1.0 |
| spring | petals | 30 | 1.2 |
| summer | fireflies | 20 | 0.8 |
| fall | leaves | 35 | 1.5 |

### API Endpoints (level-gated: L20)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /api/v1/events/` | GET | List events |
| `GET /api/v1/events/:id` | GET | Event details |
| `GET /api/v1/events/:id/progress` | GET | User progress |
| `POST /api/v1/events/:id/join` | POST | Join event |
| `POST /api/v1/events/:id/claim-reward` | POST | Claim reward |
| `GET /api/v1/events/:id/leaderboard` | GET | Event leaderboard |
| `POST /api/v1/events/:id/battle-pass/purchase` | POST | Buy battle pass |

### Store: `useSeasonalEventStore`

- **State:** `activeEvents`, `upcomingEvents`, `endedEvents`, `featuredEvent`, `currentEventId`, `currentEvent`, `currentProgress`, `nextMilestone`, `availableRewards[]`, `leaderboard[]`, `userRank`, `isLoading`, `isJoining`, `isClaiming`, `isPurchasing`
- **Actions:** `fetchEvents`, `fetchEventDetails`, `fetchProgress`, `joinEvent`, `claimReward`, `claimEventReward`, `fetchLeaderboard`, `purchaseBattlePass`, `getTimeRemaining`, `isEventActive`, `canClaimMilestone`, `reset`
- **Selectors:** `useActiveEvents`, `useFeaturedEvent`, `useCurrentEventProgress`, `useEventLeaderboard`, `useHasActiveBattlePass`

### Components

| Component | Location | Purpose |
|-----------|----------|---------|
| Event Banner | `modules/gamification/components/events/event-banner/` | Banner with battle pass, leaderboard, quest tracker |
| Seasonal Event Banner | `modules/gamification/components/events/seasonal-event-banner.tsx` | Seasonal decorative banner |
| Seasonal Theme Provider | `modules/gamification/components/events/seasonal-theme-provider/` | App-wide seasonal particles/effects |
| Battle Pass Tiers | `modules/gamification/components/events/battle-pass-tiers.tsx` | Tier grid with free/premium rewards |
| Milestone Card | `modules/gamification/components/events/milestone-card.tsx` | Event milestone progress card |

---

## 12. Marketplace

Player-to-player trading marketplace for cosmetic items.

### Item Types (5)

`avatar_border`, `profile_theme`, `chat_effect`, `title`, `badge`

### Listing Statuses (4)

`active`, `sold`, `cancelled`, `expired`

### Currency Types (2)

`coins`, `gems`

### Sort Options (5)

`newest`, `oldest`, `price_low`, `price_high`, `rarity`

### Price Recommendations (7 tiers)

| Rarity | Min | Max | Suggested |
|--------|-----|-----|-----------|
| common | 100 | 500 | 250 |
| uncommon | 300 | 1,500 | 750 |
| rare | 1,000 | 5,000 | 2,500 |
| epic | 3,000 | 15,000 | 7,500 |
| legendary | 10,000 | 50,000 | 25,000 |
| mythic | 25,000 | 150,000 | 75,000 |
| unique | 50,000 | 500,000 | 150,000 |

### API Endpoints (level-gated: L15)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /api/v1/marketplace/` | GET | Browse listings |
| `GET /api/v1/marketplace/my-listings` | GET | User's own listings |
| `GET /api/v1/marketplace/history` | GET | Transaction history |
| `POST /api/v1/marketplace/listings` | POST | Create listing |
| `POST /api/v1/marketplace/listings/:id/purchase` | POST | Buy listing |
| `GET /api/v1/marketplace/:id` | GET | Listing details |
| `PUT /api/v1/marketplace/:id` | PUT | Update listing |
| `DELETE /api/v1/marketplace/:id` | DELETE | Cancel/remove listing |

### Store: `useMarketplaceStore`

- **State:** `listings[]`, `selectedListing`, `priceHistory[]`, `recommendedPrice`, `myListings[]`, `transactionHistory[]`, `userTotals`, `stats`, `filters`, `hasMore`, `currentOffset`, `isLoading`, `isCreating`, `isPurchasing`, `itemTypes[]`, `currencyTypes[]`
- **Actions:** `fetchListings`, `fetchListing`, `fetchMyListings`, `fetchHistory`, `createListing`, `updateListing`, `cancelListing`, `purchaseListing`, `setFilters`, `clearFilters`, `getPriceRecommendation`, `reset`
- **Selectors:** `useMarketplaceListings`, `useMarketplaceFilters`, `useMyListings`, `useTransactionHistory`
- **Persistence:** `cgraph-marketplace` — persists `filters` only

### Components

| Component | Location | Purpose |
|-----------|----------|---------|
| Marketplace Page | `modules/gamification/components/marketplace-page/` | Full browse, create, history |
| Listing Card | `modules/gamification/components/marketplace-page/listing-card.tsx` | Individual listing display |
| Listing Detail Modal | `modules/gamification/components/marketplace-page/listing-detail-modal.tsx` | Purchase dialog |
| Price History Chart | `modules/gamification/components/price-history-chart/` | SVG price trend chart |

---

## 13. Coin Shop & Currency

### Currencies

| Currency | Source | Usage |
|----------|--------|-------|
| Coins | XP activities, daily rewards, streaks, achievements | Shop purchases, marketplace |
| Gems | Real-money purchase (Stripe) | Premium items, battle passes |

### Coin Bundles

Fetched from API at `GET /api/v1/shop/bundles`. Each bundle includes:
- `coins` — base amount
- `bonusCoins` — extra coins
- `price` — USD price
- `popular` / `bestValue` — display flags

### Purchase Flow

```
User selects bundle → POST /api/v1/shop/purchase-coins
  → Backend creates Stripe Checkout session
  → Returns { checkout_url, session_id }
  → User redirected to Stripe payment page
  → On success: coins credited to balance
```

### API Endpoints (level-gated: L8)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /api/v1/coins` | GET | Balance |
| `GET /api/v1/coins/history` | GET | Transaction history |
| `GET /api/v1/coins/packages` | GET | Available earn methods |
| `GET /api/v1/coins/earn` | GET | Earn methods info |
| `GET /api/v1/shop/` | GET | Shop items |
| `GET /api/v1/shop/categories` | GET | Shop categories |
| `GET /api/v1/shop/purchases` | GET | Purchase history |
| `GET /api/v1/shop/bundles` | GET | Coin bundles (Stripe prices) |
| `POST /api/v1/shop/purchase-coins` | POST | Create Stripe checkout |
| `GET /api/v1/shop/:id` | GET | Item details |
| `POST /api/v1/shop/:id/purchase` | POST | Purchase with coins |

### Store: `useCoinShopStore`

- **State:** `bundles[]`, `loading`, `error`, `checkoutLoading`
- **Actions:** `fetchBundles`, `initiateCheckout`
- **No persistence** — bundles fetched live

---

## 14. Referrals

### Referral Statuses (5)

`pending`, `verified`, `rewarded`, `expired`, `rejected`

### Reward Types (5)

`xp`, `coins`, `badge`, `title`, `premium_days`

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /api/v1/referrals/leaderboard` | GET | Referral rankings |
| `GET /api/v1/referrals/rewards` | GET | Reward tiers |
| `POST /api/v1/referrals/rewards/:id/claim` | POST | Claim reward |
| `GET /api/v1/referrals/validate/:code` | GET | Validate referral code |
| `POST /api/v1/referrals/apply` | POST | Apply referral code |

### Store: `useReferralStore`

- **State:** `referrals[]`, `pendingReferrals[]`, `referralCode`, `stats`, `leaderboard[]`, `rewardTiers[]`, `isLoading`, `isLoadingStats`
- **Actions:** `fetchReferralCode`, `regenerateCode`, `fetchReferrals`, `fetchPendingReferrals`, `fetchStats`, `fetchLeaderboard`, `fetchRewardTiers`, `claimReward`, `validateReferralCode`, `applyReferralCode`, `getReferralUrl`, `clearState`, `reset`
- **13 actions** — most of any store slice

### Components

| Component | Location | Purpose |
|-----------|----------|---------|
| Referral Dashboard | `modules/gamification/components/referral-dashboard/` | Link sharing, stats, leaderboard, tiers |
| Referral Link Card | `...referral-dashboard/referral-link-card.tsx` | Copyable referral link |
| Recent Referrals | `...referral-dashboard/recent-referrals.tsx` | Recent referral list |
| Reward Tiers | `...referral-dashboard/reward-tiers.tsx` | Tier progress cards |

---

## 15. Level Gates (Feature Gating)

Backend middleware gates features by user level. Frontend shows a locked overlay with progress bar.

### Gate Levels

| Feature | Required Level | Backend Pipeline |
|---------|---------------|-----------------|
| Quests | 3 | `:level_gate_quests` |
| Shop | 8 | `:level_gate_shop` |
| Cosmetics | 10 | `:level_gate_cosmetics` |
| Titles | 12 | `:level_gate_titles` |
| Marketplace | 15 | `:level_gate_marketplace` |
| Events | 20 | `:level_gate_events` |
| Prestige | 25 | `:level_gate_prestige` |

### Premium Gates

| Gate | Minimum Tier |
|------|-------------|
| Premium | `"premium"` |
| Enterprise | `"enterprise"` |

### Frontend Component

```
LevelGate(feature)
  └─ useLevelGate(feature)
      ├─ unlocked: boolean
      ├─ requiredLevel / currentLevel
      ├─ progressPercent
      └─ featureName
  └─ If locked: blur + overlay with progress bar
  └─ If unlocked: render children normally
```

### Backend Implementation

- `LevelGatePlug` — checks user level against required level per feature
- `PremiumGatePlug` — checks premium subscription tier
- `FeatureGates` context — manages gate configuration
- Feature gate status endpoint: `GET /api/v1/gamification/feature-gates`

---

## 16. Socket Events (Real-Time)

Phoenix WebSocket channel delivers real-time gamification updates.

### Event Types (17)

| Event | Key Fields | Triggers |
|-------|------------|----------|
| `initial_state` | full state snapshot | Channel join |
| `xp_gained` | `amount`, `source`, `newTotal`, `levelUp?` | XP gain (with optional level-up) |
| `xp_awarded` | `amount`, `source`, `total_xp`, `level`, `level_up`, `level_progress`, `daily_cap_status` | Any XP-granting action |
| `coins_awarded` | `amount`, `type`, `balance` | Coin grants |
| `cap_reached` | `source`, `daily_used`, `daily_limit` | Daily cap hit |
| `level_up` | `newLevel`, `previousLevel` | Level up |
| `achievement_unlocked` | `achievementId`, `title`, `rarity`, `xpReward`, `coinReward` | Achievement unlocked |
| `cosmetic_unlocked` | `type` (5 types), `itemId`, `name`, `rarity` | Cosmetic granted |
| `prestige_updated` | `oldLevel`, `newLevel`, `prestigePoints`, `newBonuses`, `exclusiveRewards[]` | Prestige reset |
| `event_progress` | `eventId`, `points`, `tier`, `milestone?` | Event activity |
| `event_milestone` | `eventId`, `milestone` | Event milestone reached |
| `event_started` | `eventId`, `name`, `type` | New event begins |
| `event_ending_soon` | `eventId`, `endsAt` | Event ending warning |
| `event_ended` | `eventId` | Event has ended |
| `listing_sold` | `listingId`, `price`, `buyer` | Marketplace listing sold |
| `item_purchased` | `listingId`, `price`, `seller` | Marketplace purchase complete |
| `price_alert` | `listingId`, `oldPrice`, `newPrice` | Marketplace price drop |

### Socket Store

```typescript
interface GamificationSocketStore {
  socket: Socket;      // Phoenix Socket
  channel: Channel;    // Phoenix Channel
  state: GamificationState; // { xp, level, coins, streakDays, connected, lastError }
  listeners: Map;
  messageQueue: [];
  // Actions: connect, disconnect, subscribe, getState, sendHeartbeat, reset
}
```

---

## 17. Store Architecture

### Store Composition (7 stores)

| Store | Persist Key | Persisted Fields | State Props | Actions |
|-------|-------------|------------------|-------------|---------|
| `useGamificationStore` | `cgraph-gamification` | level, currentXP, totalXP, loginStreak, lastLoginDate | 22 | 13 |
| `usePrestigeStore` | `cgraph-prestige` | prestige, allTiers | 7 | 9 |
| `useSeasonalEventStore` | `cgraph-seasonal-events` | activeEvents, upcomingEvents, endedEvents, featuredEvent | 15 | 12 |
| `useMarketplaceStore` | `cgraph-marketplace` | filters | 16 | 12 |
| `useReferralStore` | — | — | 8 | 13 |
| `useCoinShopStore` | — | — | 4 | 2 |
| Socket Store | — | — | 6 | 6 |

### Facade: `useGamificationFacade`

Unified hook reading from 4 stores:

| Category | Properties |
|----------|------------|
| Core (6) | `level`, `currentXP`, `totalXP`, `karma`, `loginStreak`, `isLoading` |
| Achievements (3) | `achievements`, `recentlyUnlocked`, `equippedBadges` |
| Quests (2) | `activeQuests`, `completedQuests` |
| Titles (2) | `equippedTitle`, `availableTitles` |
| Prestige (2) | `prestigeLevel`, `canPrestige` |
| Events (2) | `activeEvents`, `featuredEvent` |
| Referrals (3) | `referralCode`, `referralUrl`, `referralCount` |
| Actions (7) | `fetchGamificationData`, `fetchAchievements`, `fetchQuests`, `completeQuest`, `equipTitle`, `equipBadge`, `unequipBadge` |

⚠️ **Not covered by facade:** Marketplace, Coin Shop, Avatar Border stores — components using those must import directly.

### Lore System (Stub)

The store defines `LoreEntry` interface, `loreEntries[]`, and `currentChapter` state. Both `createUnlockLoreEntry` and `createFetchLore` are no-ops ("coming soon"). The lore system is **not implemented**.

---

## 18. Backend Modules

### Elixir Context Modules (50 files)

| Category | Modules |
|----------|---------|
| **Core** | `Gamification`, `Gamification.Repositories` |
| **XP/Leveling** | `XpTransaction`, `XpConfig`, `XpEventHandler`, `DailyCap` |
| **Achievements** | `Achievement`, `UserAchievement`, `AchievementSystem`, `AchievementTriggers` |
| **Quests** | `Quest`, `UserQuest`, `QuestSystem`, `QuestTemplates`, `QuestRotationWorker` |
| **Currency** | `CoinTransaction`, `CurrencySystem` |
| **Titles** | `Title`, `UserTitle`, `TitleShopSystem` |
| **Cosmetics** | `AvatarBorder`, `UserAvatarBorder`, `ChatEffect`, `UserChatEffect`, `ProfileTheme`, `UserProfileTheme`, `ShopItem`, `UserPurchase` |
| **Prestige** | `UserPrestige`, `PrestigeReward` |
| **Events** | `SeasonalEvent`, `UserEventProgress`, `Events` (CRUD, Content, Participation), `EventSystem`, `EventLifecycleWorker`, `BattlePassTier` |
| **Marketplace** | `Marketplace`, `MarketplaceItem` |
| **Leaderboard** | `Leaderboard`, `LeaderboardSystem` |
| **Feature Gates** | `FeatureGates` |
| **Web Layer** | `GamificationController`, `GamificationJson`, `GamificationRoutes`, `GamificationChannel`, `GamificationParams` |

### Backend Workers

| Worker | Purpose |
|--------|---------|
| `QuestRotationWorker` | Rotates daily/weekly quests on schedule |
| `EventLifecycleWorker` | Manages event start/end transitions |

---

## 19. Known Issues & Inconsistencies

### Critical: Triple-Defined Types

`Achievement`, `Quest`, `AchievementCategory`, and `AchievementRarity` exist in **3 different type files** with incompatible shapes:

| File | Achievement uses | Category values |
|------|-----------------|-----------------|
| `gamificationStore.types.ts` | `title`, `icon`, `progress/maxProgress`, `isHidden`, `loreFragment`, `titleReward` | social, content, exploration, mastery, legendary, secret |
| `store/types.ts` | `name`, `iconUrl`, `requirements[]`, `coinReward` | social, messaging, groups, forums, gaming, special, seasonal |
| `types/index.ts` (18 exports) | `name`, `coinReward`, `isSecret` | social, forums, messaging, groups, special, seasonal |

### Category Mismatch

| Location | Categories Used |
|----------|----------------|
| **Actual data** (`achievements.ts`) | social, content, exploration, mastery, legendary, secret |
| **Achievement display constants** | social, messaging, groups, forums, gaming, special, seasonal |
| **Badge collection constants** | social, content, exploration, mastery, legendary, secret |
| **Achievements page constants** | all, social, content, exploration, mastery, legendary, secret |

Only the badge-collection and achievements-page constants match the actual data.

### Missing Rarity: "mythic" in Achievement Display

`achievement-display/constants.ts` omits mythic from `RARITY_COLORS`, `RARITY_GRADIENTS`, and `RARITY_ORDER`. The actual data has 6 mythic achievements — they will render without proper styling.

### Title Rarity Mismatch

| Location | Rarities |
|----------|----------|
| **Title data** | free, common, rare, epic, legendary, mythic |
| **Titles page constants** | common, uncommon, rare, epic, legendary, mythic, unique |

Missing `free` in the page; `uncommon` and `unique` in the page have no corresponding data.

### Badge Category Phantom

Badge data has **no category field** — badges are organized by rarity arrays only. But `badge-collection/constants.ts` defines `CATEGORY_ICONS` and `CATEGORY_LABELS` with 6 categories, implying filtering that the data can't support.

### 38 Orphaned Achievement Title Rewards

41 achievements grant `titleReward` strings, but only 3 match `displayName` in `titlesCollection.ts`. The 38 remaining are either backend-only or dead references.

### 4 Unwired Action Creators

`createHandleXPAwarded`, `createHandleCoinsAwarded`, `createFetchScopedLeaderboard`, `createHandleRankChanged` — exported from `gamification-actions.ts` but never connected to the store.

### Leaderboard Type/Period Inconsistencies

- Widget uses `allTime` (camelCase); page uses `alltime` (lowercase)
- Widget has `achievements`/`referrals` categories; page has `streak`/`friends` — no overlap
- Two separate `LeaderboardEntry` types with different fields

### Lore System is a Stub

`LoreEntry` type, `loreEntries[]`, `currentChapter` state, `createUnlockLoreEntry`, `createFetchLore` — all exist but are completely non-functional.

### Streak Multiplier Constants Conflict

`getStreakMultiplier()` returns 1.0×/1.5×/2.0× at 0/3/7 days, but `XP_REWARDS` in `gamificationStore.utils.ts` defines `STREAK_3_DAYS: 1.2` and `STREAK_100_DAYS: 3.0` — contradicting the function. The function is what's actually used at runtime.

---

## 20. Data File Locations

| Data | File | Count |
|------|------|-------|
| Achievements | `src/data/achievements.ts` | 107 |
| Badges | `src/data/badgesCollection.ts` | 36 |
| Titles | `src/data/titlesCollection.ts` | 26 |
| Achievement Display Constants | `modules/gamification/components/achievement-display/constants.ts` | 5 maps |
| Badge Collection Constants | `modules/gamification/components/badges/badge-collection/constants.ts` | 4 maps |
| Badge Animation Constants | `modules/gamification/components/badges/animated-badge/constants.ts` | 2 maps |
| Streak Milestones | `modules/gamification/components/streak-tracker/constants.ts` | 6 |
| Daily Rewards | `modules/gamification/components/daily-rewards/constants.ts` | 7-day cycle |
| User Star Tiers | `modules/gamification/components/user-stars/constants.ts` | 10 |
| Leaderboard Types (widget) | `modules/gamification/components/leaderboard-widget/constants.ts` | 6 types × 4 periods |
| Leaderboard Config (page) | `pages/leaderboard/constants.tsx` | 6 cats × 4 periods |
| Event Themes | `modules/gamification/components/events/seasonal-theme-provider/constants.ts` | 7 |
| Marketplace Prices | `modules/gamification/store/marketplaceSlice.ts` | 7 tiers |
| Prestige Tiers | `modules/gamification/store/prestigeSlice.ts` | 20 levels |
| Quest Types | `pages/gamification/quests-page/constants.tsx` | 4 tabs |
| Gamification Store Types | `modules/gamification/store/gamificationStore.types.ts` | 22 state props |
| Backend Routes | `lib/cgraph_web/router/gamification_routes.ex` | ~83 endpoints |
| Backend Modules | `lib/cgraph/gamification/` | 50 files |

---

## 21. Feature Counts Summary

| What | Count | Status |
|------|-------|--------|
| **Achievements** | 107 | 6 categories, 6 rarities, 41 grant titles |
| **Badges** | 36 | 5 rarities (no uncommon), 7 premium |
| **Titles** | 26 | 6 rarities, 5 premium, 10 animation types used |
| **Quest types** | 5 | daily, weekly, monthly, seasonal, special |
| **Streak milestones** | 6 | 7d → 365d, total 69,000 XP available |
| **Daily reward cycle** | 7 days | 1,325 XP + 360 coins per cycle |
| **User star tiers** | 10 | Post-count based, 0 → 10,000+ posts |
| **Prestige levels** | 20 | 6 reward types, exponential XP curve |
| **Event types** | 6 | seasonal, holiday, special, anniversary, collab, community |
| **Seasonal themes** | 7 | Particle-driven visual themes |
| **Marketplace item types** | 5 | 7 price recommendation tiers |
| **Leaderboard categories** | 8 (combined) | 6 widget + 6 page, 4 overlapping |
| **Level gate features** | 7 | L3 → L25 progressive unlock |
| **Socket event types** | 17 | Phoenix WebSocket real-time |
| **Zustand stores** | 7 | 4 persisted (gamification, prestige, seasonal, marketplace), 3 ephemeral |
| **Backend modules** | 50 | Elixir contexts, schemas, workers, controllers |
| **API endpoints** | ~83 | 7 level-gated groups + ungated routes |
| **Type definition files** | 3 | ⚠️ Significant duplication & divergence |
| **Total XP available (achievements)** | 120,025 | Across all 107 achievements |
| **Total XP available (streaks)** | 69,000 | Across 6 milestones |
| **Lore system** | — | Stub only, not implemented |
