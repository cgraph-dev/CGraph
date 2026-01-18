# Gamification Guide (v2.0.0)

> **Last Updated:** January 2026  
> **Status:** Production Ready

## Table of Contents

1. [Overview](#overview)
2. [Core Systems](#core-systems)
3. [Cosmetics System](#cosmetics-system)
4. [Prestige System](#prestige-system)
5. [Seasonal Events](#seasonal-events)
6. [Marketplace](#marketplace)
7. [API Reference](#api-reference)
8. [WebSocket Events](#websocket-events)

---

## Overview

The CGraph Gamification System provides comprehensive features for user engagement:

| Feature | Description | Status |
|---------|-------------|--------|
| XP & Levels | Experience points and leveling | ✅ Production |
| Achievements | Unlockable accomplishments | ✅ Production |
| Quests | Daily/weekly challenges | ✅ Production |
| **Avatar Borders** | Animated avatar decorations | ✅ Production |
| **Profile Themes** | Full profile customization | ✅ Production |
| **Chat Effects** | Message animations | ✅ Production |
| **Prestige System** | Prestige levels with bonuses | ✅ Production |
| **Seasonal Events** | Time-limited events | ✅ Production |
| **Battle Pass** | Tiered progression | ✅ Production |
| **Marketplace** | P2P cosmetic trading | ✅ Production |

---

## Core Systems

### XP & Levels
- Users earn XP from activities
- Levels unlock new features
- Max level: 100

### Streaks
- Daily login rewards
- Streak multipliers for XP
- `POST /api/v1/gamification/streak/claim`

### Achievements & Quests
- Unlock achievements for XP/coins
- Daily/weekly quests with rewards
- Quest categories: social, content, exploration

---

## Cosmetics System

### Avatar Borders

Avatar borders are visual decorations around profile pictures.

**Types:**
- `static` - Simple colored borders
- `animated` - CSS/WebGL animations
- `particle` - GPU-accelerated effects

**Rarities:**
| Rarity | Drop Rate | Trade Cooldown |
|--------|-----------|----------------|
| Common | 50% | None |
| Uncommon | 25% | None |
| Rare | 15% | 24 hours |
| Epic | 7% | 72 hours |
| Legendary | 2.5% | 7 days |
| Mythic | 0.5% | 14 days |

**API Endpoints:**
```
GET  /api/v1/cosmetics/borders          # List all borders
GET  /api/v1/cosmetics/borders/owned    # User's owned borders
POST /api/v1/cosmetics/borders/:id/equip
POST /api/v1/cosmetics/borders/:id/purchase
```

### Profile Themes

Full profile page customization with backgrounds, colors, and effects.

```
GET  /api/v1/cosmetics/themes
POST /api/v1/cosmetics/themes/:id/equip
POST /api/v1/cosmetics/themes/:id/purchase
```

### Chat Effects

Message animations and visual effects.

| Effect Type | Description |
|-------------|-------------|
| `message` | Send animations |
| `bubble` | Message styling |
| `typing` | Typing indicators |
| `reaction` | Reaction effects |

```
GET  /api/v1/cosmetics/chat-effects
POST /api/v1/cosmetics/chat-effects/:id/equip
```

---

## Prestige System

When users reach max level (100), they can "prestige" to:
- Reset to level 1
- Gain permanent XP/coin multipliers
- Unlock exclusive rewards

**Prestige Bonuses:**
| Level | XP Bonus | Coin Bonus |
|-------|----------|------------|
| 1 | +5% | +5% |
| 5 | +25% | +25% |
| 10 | +50% | +50% |
| 20 | +100% | +100% |

```
GET  /api/v1/prestige              # Get prestige status
POST /api/v1/prestige/activate     # Activate prestige
GET  /api/v1/prestige/rewards      # Available rewards
GET  /api/v1/prestige/history      # Prestige history
```

---

## Seasonal Events

Time-limited events with exclusive content.

**Event Lifecycle:**
```
Draft → Scheduled → Active → Ending → Ended
```

**Features:**
- XP multipliers during events
- Exclusive cosmetic rewards
- Battle pass progression
- Leaderboard competitions

```
GET  /api/v1/events/active
GET  /api/v1/events/:id
GET  /api/v1/events/:id/progress
GET  /api/v1/events/:id/leaderboard
GET  /api/v1/events/:id/quests
POST /api/v1/events/:id/battle-pass/claim
POST /api/v1/events/:id/battle-pass/purchase
```

### Battle Pass

Each event has a tiered battle pass:
- **Free Track:** Available to all users
- **Premium Track:** Requires purchase

50 tiers with progressive XP requirements.

---

## Marketplace

P2P trading system for cosmetic items.

**Transaction Fee:** 5%

**API Endpoints:**
```
GET  /api/v1/marketplace/listings
POST /api/v1/marketplace/listings
GET  /api/v1/marketplace/listings/:id
POST /api/v1/marketplace/listings/:id/purchase
DELETE /api/v1/marketplace/listings/:id
GET  /api/v1/marketplace/my-listings
GET  /api/v1/marketplace/history
POST /api/v1/marketplace/offers
```

**Filters:**
- `type`: avatar_border, profile_theme, chat_effect
- `rarity`: common, uncommon, rare, epic, legendary
- `min_price`, `max_price`
- `sort`: newest, price_low, price_high, rarity

---

## API Reference

### Legacy Endpoints (v0.9.1)
- `GET /api/v1/gamification/stats`
- `GET /api/v1/gamification/level-info`
- `GET /api/v1/gamification/xp/history`
- `GET /api/v1/gamification/achievements`
- `GET /api/v1/quests`
- `GET /api/v1/titles`
- `GET /api/v1/shop`
- `GET /api/v1/coins`
- `GET /api/v1/leaderboard`

### New Endpoints (v2.0.0)
- `/api/v1/cosmetics/*`
- `/api/v1/prestige/*`
- `/api/v1/events/*`
- `/api/v1/marketplace/*`

---

## WebSocket Events

### Gamification Channel
```javascript
// Subscribe
socket.channel("gamification:user_123")

// Events
- xp_gained: { amount, source, new_total }
- level_up: { new_level, rewards }
- achievement_unlocked: { achievement }
- cosmetic_unlocked: { type, item }
- prestige_updated: { level, multipliers }
```

### Marketplace Channel
```javascript
// Subscribe
socket.channel("marketplace:lobby")
socket.channel("marketplace:user_123")

// Events
- listing_created: { listing }
- listing_sold: { listing_id }
- item_sold: { listing_id, price, buyer }
- offer_received: { offer }
```

### Events Channel
```javascript
// Subscribe
socket.channel("events:global")
socket.channel("events:event_123")

// Events
- event_started: { event }
- event_ending: { event_id, ends_in }
- leaderboard_update: { entries }
- quest_refresh: { quests }
```

---

## Rate Limits

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| Read | 100/min | Per user |
| Write | 20/min | Per user |
| Purchase | 10/min | Per user |

---

## Migration Notes

### From v0.9.1 to v2.0.0

All legacy endpoints remain functional. New features are additive:

1. Run database migrations
2. Deploy backend changes
3. Deploy frontend changes
4. Enable features via admin dashboard

See [MIGRATION.md](./MIGRATION.md) for detailed steps.
