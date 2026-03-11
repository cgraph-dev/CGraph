# Gamification API Reference

> **Version:** 2.0.0  
> **Base URL:** `/api/v1`

## Table of Contents

1. [Authentication](#authentication)
2. [Cosmetics Endpoints](#cosmetics-endpoints)
3. [Prestige Endpoints](#prestige-endpoints)
4. [Events Endpoints](#events-endpoints)
5. [Marketplace Endpoints](#marketplace-endpoints)
6. [Error Codes](#error-codes)

---

## Authentication

All endpoints require Bearer token authentication:

```http
Authorization: Bearer <access_token>
```

---

## Cosmetics Endpoints

### Avatar Borders

#### List All Borders

```http
GET /cosmetics/borders
```

**Query Parameters:** | Parameter | Type | Description | |-----------|------|-------------| |
`rarity` | string | Filter by rarity (common, uncommon, rare, epic, legendary, mythic) | | `theme` |
string | Filter by theme (default, premium, seasonal, achievement) | | `type` | string | Filter by
type (static, animated, particle) | | `owned` | boolean | Filter by ownership status | | `page` |
integer | Page number (default: 1) | | `per_page` | integer | Items per page (default: 20, max: 100)
|

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Cosmic Glow",
      "slug": "cosmic-glow",
      "description": "A mesmerizing cosmic border",
      "border_type": "animated",
      "theme": "premium",
      "rarity": "legendary",
      "config": {
        "color": "#8B5CF6",
        "thickness": 4,
        "glow": true
      },
      "animation_config": {
        "type": "pulse",
        "duration": 2000,
        "easing": "ease-in-out"
      },
      "preview_url": "https://cdn.cgraph.io/borders/cosmic-glow.png",
      "coin_price": 15000,
      "gem_price": null,
      "is_purchasable": true,
      "is_tradeable": true,
      "owned": false,
      "equipped": false
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total": 92,
    "per_page": 20
  }
}
```

#### Get User's Owned Borders

```http
GET /cosmetics/borders/owned
```

**Response:** Same structure as list, filtered to owned items with `acquired_at` included.

#### Equip Border

```http
POST /cosmetics/borders/:id/equip
```

**Response:**

```json
{
  "equipped": true,
  "border": { ... }
}
```

**Errors:**

- `403`: "You do not own this border"

#### Purchase Border

```http
POST /cosmetics/borders/:id/purchase
```

**Request Body:**

```json
{
  "currency": "coins" // or "gems"
}
```

**Response:**

```json
{
  "success": true,
  "new_balance": 5000,
  "border": { ... }
}
```

**Errors:**

- `400`: "This item cannot be purchased"
- `402`: "Insufficient coins"
- `409`: "You already own this item"

---

### Profile Themes

#### List All Themes

```http
GET /cosmetics/themes
```

**Query Parameters:** | Parameter | Type | Description | |-----------|------|-------------| |
`category` | string | Filter by category (minimal, vibrant, dark, light, seasonal) | | `rarity` |
string | Filter by rarity | | `owned` | boolean | Filter by ownership |

#### Equip Theme

```http
POST /cosmetics/themes/:id/equip
```

#### Purchase Theme

```http
POST /cosmetics/themes/:id/purchase
```

---

### Chat Effects

#### List All Effects

```http
GET /cosmetics/chat-effects
```

**Query Parameters:** | Parameter | Type | Description | |-----------|------|-------------| |
`effect_type` | string | Filter by type (message, bubble, typing, reaction, entrance) | | `category`
| string | Filter by category (fun, elegant, festive, minimal) |

#### Equip Effect

```http
POST /cosmetics/chat-effects/:id/equip
```

---

## Prestige Endpoints

### Get Prestige Status

```http
GET /prestige
```

**Response:**

```json
{
  "prestige_level": 3,
  "total_prestiges": 3,
  "xp_multiplier": 1.15,
  "coin_multiplier": 1.15,
  "total_xp_earned": 5234567,
  "total_coins_earned": 892345,
  "exclusive_rewards_unlocked": ["prestige-i-border", "prestige-ii-border", "prestige-iii-border"],
  "prestige_title": "Veteran",
  "last_prestige_at": "2026-01-10T15:30:00Z",
  "can_prestige": false,
  "prestige_requirements": {
    "required_level": 100,
    "current_level": 45
  }
}
```

### Activate Prestige

```http
POST /prestige/activate
```

**Requirements:**

- User must be at max level (100)
- User must confirm prestige action

**Response:**

```json
{
  "success": true,
  "new_prestige_level": 4,
  "xp_multiplier": 1.2,
  "coin_multiplier": 1.2,
  "rewards_granted": [
    {
      "type": "avatar_border",
      "id": "prestige-iv-border",
      "name": "Prestige IV Border"
    }
  ]
}
```

**Errors:**

- `400`: "Must be at max level to prestige"

### Get Prestige Rewards

```http
GET /prestige/rewards
```

**Response:**

```json
{
  "data": [
    {
      "prestige_level": 1,
      "reward_type": "avatar_border",
      "reward_id": "prestige-i-border",
      "reward_name": "Prestige I Border",
      "reward_description": "Exclusive border for first prestige",
      "unlocked": true
    },
    {
      "prestige_level": 5,
      "reward_type": "title",
      "reward_id": "veteran-title",
      "reward_name": "Veteran",
      "reward_description": "Title for prestige level 5",
      "unlocked": false
    }
  ]
}
```

### Get Prestige History

```http
GET /prestige/history
```

**Response:**

```json
{
  "data": [
    {
      "prestige_level": 3,
      "prestiged_at": "2026-01-10T15:30:00Z",
      "total_xp_at_prestige": 1500000,
      "level_at_prestige": 100
    }
  ]
}
```

---

## Events Endpoints

### Get Active Events

```http
GET /events/active
```

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Winter Wonderland 2026",
      "slug": "winter-wonderland-2026",
      "description": "Celebrate winter with exclusive rewards!",
      "event_type": "seasonal",
      "status": "active",
      "starts_at": "2026-12-01T00:00:00Z",
      "ends_at": "2026-12-31T23:59:59Z",
      "config": {
        "xp_multiplier": 2.0,
        "primary_color": "#4F46E5",
        "secondary_color": "#EC4899",
        "battle_pass_enabled": true,
        "leaderboard_enabled": true,
        "max_battle_pass_tier": 50
      },
      "user_progress": {
        "event_xp": 15000,
        "battle_pass_tier": 8,
        "has_premium_pass": true,
        "leaderboard_rank": 42
      }
    }
  ]
}
```

### Get Event Details

```http
GET /events/:id
```

### Get User Event Progress

```http
GET /events/:id/progress
```

**Response:**

```json
{
  "event_id": "uuid",
  "event_xp": 15000,
  "battle_pass_tier": 8,
  "xp_to_next_tier": 300,
  "has_premium_pass": true,
  "leaderboard_rank": 42,
  "leaderboard_score": 15000,
  "quests_completed": 12,
  "claimed_tiers": [1, 2, 3, 4, 5, 6, 7],
  "claimable_tiers": [8],
  "last_activity_at": "2026-12-15T10:30:00Z"
}
```

### Get Event Leaderboard

```http
GET /events/:id/leaderboard
```

**Query Parameters:** | Parameter | Type | Description | |-----------|------|-------------| | `page`
| integer | Page number | | `per_page` | integer | Items per page (max: 100) | | `friends_only` |
boolean | Show only friends |

**Response:**

```json
{
  "data": [
    {
      "rank": 1,
      "user_id": "uuid",
      "username": "top_player",
      "display_name": "Top Player",
      "avatar_url": "https://...",
      "score": 250000,
      "change": 0
    }
  ],
  "user_rank": {
    "rank": 42,
    "score": 15000,
    "change": 5
  },
  "pagination": { ... }
}
```

### Get Event Quests

```http
GET /events/:id/quests
```

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Winter Warrior",
      "description": "Win 10 matches during the event",
      "type": "event",
      "progress": 7,
      "target": 10,
      "reward": {
        "type": "event_xp",
        "amount": 500,
        "icon": "⭐"
      },
      "expires_at": "2026-12-31T23:59:59Z",
      "completed": false,
      "claimed": false
    }
  ]
}
```

### Get Battle Pass

```http
GET /events/:id/battle-pass
```

**Response:**

```json
{
  "event_id": "uuid",
  "current_tier": 8,
  "current_xp": 15000,
  "xp_per_tier": 1000,
  "has_premium": true,
  "tiers": [
    {
      "tier_number": 1,
      "xp_required": 0,
      "free_reward": {
        "type": "coins",
        "amount": 100,
        "icon": "🪙"
      },
      "premium_reward": {
        "type": "avatar_border",
        "id": "winter-border-1",
        "name": "Frost Border",
        "icon": "❄️"
      },
      "claimed": true
    }
  ]
}
```

### Claim Battle Pass Reward

```http
POST /events/:id/battle-pass/claim
```

**Request Body:**

```json
{
  "tier": 8
}
```

**Response:**

```json
{
  "success": true,
  "rewards": [
    {
      "type": "coins",
      "amount": 250
    },
    {
      "type": "avatar_border",
      "id": "winter-border-8",
      "name": "Blizzard Border"
    }
  ]
}
```

**Errors:**

- `400`: "Tier not yet reached"
- `409`: "Tier already claimed"

### Purchase Premium Battle Pass

```http
POST /events/:id/battle-pass/purchase
```

**Response:**

```json
{
  "success": true,
  "new_balance": 2500,
  "premium_unlocked": true
}
```

---

## Marketplace Endpoints

### Browse Listings

```http
GET /marketplace/listings
```

**Query Parameters:** | Parameter | Type | Description | |-----------|------|-------------| | `type`
| string | Item type (avatar_border, profile_theme, chat_effect) | | `rarity` | string | Item rarity
| | `min_price` | integer | Minimum price | | `max_price` | integer | Maximum price | | `currency` |
string | Currency (coins, gems) | | `sort` | string | Sort order (newest, oldest, price_low,
price_high, rarity) | | `search` | string | Search item names | | `page` | integer | Page number | |
`per_page` | integer | Items per page |

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "seller": {
        "id": "uuid",
        "username": "seller123",
        "display_name": "Seller",
        "avatar_url": "https://..."
      },
      "item_type": "avatar_border",
      "item_id": "uuid",
      "item_name": "Cosmic Glow",
      "item_rarity": "legendary",
      "item_preview_url": "https://...",
      "price": 15000,
      "currency": "coins",
      "accepts_trades": true,
      "listed_at": "2026-01-15T10:00:00Z",
      "expires_at": "2026-02-14T10:00:00Z",
      "view_count": 42,
      "favorite_count": 5
    }
  ],
  "pagination": { ... },
  "stats": {
    "total_listings": 1234,
    "average_price": 5000
  }
}
```

### Get Listing Details

```http
GET /marketplace/listings/:id
```

**Response includes:**

- Full listing details
- Price history
- Similar listings
- Seller stats

### Create Listing

```http
POST /marketplace/listings
```

**Request Body:**

```json
{
  "item_type": "avatar_border",
  "item_id": "uuid",
  "price": 5000,
  "currency": "coins",
  "accepts_trades": true
}
```

**Response:**

```json
{
  "id": "uuid",
  "status": "active",
  "listed_at": "2026-01-15T10:00:00Z",
  "expires_at": "2026-02-14T10:00:00Z"
}
```

**Errors:**

- `400`: "This item cannot be traded"
- `400`: "Item is trade locked until {date}"
- `403`: "You do not own this item"
- `409`: "Item is already listed"

### Purchase Listing

```http
POST /marketplace/listings/:id/purchase
```

**Response:**

```json
{
  "success": true,
  "transaction_id": "uuid",
  "new_balance": 5000,
  "item": { ... }
}
```

**Errors:**

- `400`: "Cannot purchase your own listing"
- `402`: "Insufficient balance"
- `404`: "Listing not found"
- `409`: "Listing no longer available"

### Cancel Listing

```http
DELETE /marketplace/listings/:id
```

### Get My Listings

```http
GET /marketplace/my-listings
```

**Query Parameters:** | Parameter | Type | Description | |-----------|------|-------------| |
`status` | string | Filter by status (active, sold, cancelled, expired) |

### Get Transaction History

```http
GET /marketplace/history
```

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "transaction_type": "sell",
      "item_type": "avatar_border",
      "item_name": "Cosmic Glow",
      "price": 15000,
      "fee_amount": 750,
      "proceeds": 14250,
      "counterparty": {
        "username": "buyer123",
        "display_name": "Buyer"
      },
      "completed_at": "2026-01-15T12:00:00Z"
    }
  ],
  "totals": {
    "sells": {
      "count": 10,
      "total": 50000,
      "fees": 2500,
      "proceeds": 47500
    },
    "buys": {
      "count": 5,
      "total": 25000
    }
  }
}
```

### Make Trade Offer

```http
POST /marketplace/offers
```

**Request Body:**

```json
{
  "listing_id": "uuid",
  "offered_items": [
    {
      "item_type": "avatar_border",
      "item_id": "uuid"
    }
  ],
  "coins_offered": 1000,
  "message": "I'd love to trade for this!"
}
```

### Get Offers

```http
GET /marketplace/offers
```

**Query Parameters:** | Parameter | Type | Description | |-----------|------|-------------| | `type`
| string | received, sent | | `status` | string | pending, accepted, rejected, cancelled |

### Respond to Offer

```http
POST /marketplace/offers/:id/respond
```

**Request Body:**

```json
{
  "action": "accept" // or "reject"
}
```

---

## Error Codes

| Code  | Description                             |
| ----- | --------------------------------------- |
| `400` | Bad Request - Invalid parameters        |
| `401` | Unauthorized - Invalid or missing token |
| `402` | Payment Required - Insufficient balance |
| `403` | Forbidden - No permission               |
| `404` | Not Found - Resource doesn't exist      |
| `409` | Conflict - Resource state conflict      |
| `429` | Too Many Requests - Rate limit exceeded |
| `500` | Internal Server Error                   |

### Error Response Format

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

---

## Rate Limits

| Endpoint Type | Limit        | Window   |
| ------------- | ------------ | -------- |
| Read          | 100 requests | 1 minute |
| Write         | 20 requests  | 1 minute |
| Purchase      | 10 requests  | 1 minute |

Rate limit headers:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705329600
```
