# Backend API Requirements for CGraph v0.7.34+

> **Version**: 0.7.34 (UI Enhancement & Gamification Release)
> **Date**: 2026-01-10
> **Purpose**: Complete backend API specification for new features
> **Status**: Ready for Backend Implementation

---

## 📋 TABLE OF CONTENTS

1. [Existing APIs (Already Implemented)](#existing-apis-already-implemented)
2. [New APIs Required for UI Enhancements](#new-apis-required-for-ui-enhancements)
3. [Gamification System APIs](#gamification-system-apis)
4. [Premium Features APIs](#premium-features-apis)
5. [User Preferences & Customization APIs](#user-preferences--customization-apis)
6. [Analytics & Metrics APIs](#analytics--metrics-apis)
7. [Webhook & Real-time Events](#webhook--real-time-events)
8. [Database Schema Changes](#database-schema-changes)

---

## ✅ EXISTING APIS (Already Implemented)

### Authentication
- ✅ `POST /api/v1/auth/login`
- ✅ `POST /api/v1/auth/register`
- ✅ `POST /api/v1/auth/logout`
- ✅ `POST /api/v1/auth/refresh`
- ✅ `POST /api/v1/auth/wallet/challenge`
- ✅ `POST /api/v1/auth/wallet/verify`
- ✅ `GET /api/v1/me`

### Messages
- ✅ `GET /api/v1/conversations`
- ✅ `POST /api/v1/conversations`
- ✅ `GET /api/v1/conversations/:id/messages`
- ✅ `POST /api/v1/conversations/:id/messages`
- ✅ `PATCH /api/v1/messages/:id`
- ✅ `DELETE /api/v1/messages/:id`
- ✅ `POST /api/v1/messages/:id/reactions`
- ✅ `DELETE /api/v1/messages/:id/reactions/:emoji`
- ✅ `POST /api/v1/conversations/:id/read`

### Voice Messages
- ✅ `POST /api/v1/voice-messages` (multipart/form-data)

### Friends
- ✅ `GET /api/v1/friends`
- ✅ `GET /api/v1/friends/pending`
- ✅ `POST /api/v1/friends`
- ✅ `POST /api/v1/friends/:id/accept`
- ✅ `POST /api/v1/friends/:id/decline`
- ✅ `DELETE /api/v1/friends/:id`

### Groups
- ✅ `GET /api/v1/groups`
- ✅ `GET /api/v1/groups/:id`
- ✅ `POST /api/v1/groups`
- ✅ `GET /api/v1/groups/:id/messages/:channelId`
- ✅ `POST /api/v1/groups/:id/channels/:channelId/messages`

### Forums
- ✅ `GET /api/v1/forums`
- ✅ `GET /api/v1/forums/:slug`
- ✅ `POST /api/v1/forums`
- ✅ `GET /api/v1/forums/:slug/posts`
- ✅ `POST /api/v1/posts`
- ✅ `GET /api/v1/posts/:id`
- ✅ `POST /api/v1/posts/:id/vote`
- ✅ `POST /api/v1/forums/:id/vote`
- ✅ `GET /api/v1/forums/leaderboard`

### E2EE
- ✅ `POST /api/v1/e2ee/keys`
- ✅ `GET /api/v1/e2ee/bundle/:userId`
- ✅ `GET /api/v1/e2ee/devices`
- ✅ `DELETE /api/v1/e2ee/keys/:deviceId`

---

## 🆕 NEW APIS REQUIRED FOR UI ENHANCEMENTS

### 1. User Preferences & UI Customization

#### **GET /api/v1/users/me/preferences**
Get user's UI preferences and customization settings

**Response**:
```json
{
  "data": {
    "theme": {
      "mode": "dark",
      "primary_color": "#00ff41",
      "accent_color": "#00ff41",
      "glass_intensity": "medium",
      "animations_enabled": true,
      "particles_enabled": true,
      "shader_background": "matrix",
      "message_style": "bubble",
      "font_size": "medium",
      "compact_mode": false
    },
    "notifications": {
      "sound_enabled": true,
      "vibration_enabled": true,
      "desktop_notifications": true,
      "email_notifications": false
    },
    "privacy": {
      "online_status_visible": true,
      "read_receipts_enabled": true,
      "typing_indicators_enabled": true,
      "last_seen_visible": true
    },
    "accessibility": {
      "reduce_motion": false,
      "high_contrast": false,
      "screen_reader_optimized": false
    }
  }
}
```

#### **PATCH /api/v1/users/me/preferences**
Update user preferences

**Request**:
```json
{
  "theme": {
    "primary_color": "#ff00ff",
    "animations_enabled": true
  },
  "privacy": {
    "online_status_visible": false
  }
}
```

**Response**: Updated preferences object

---

### 2. User Activity & Streaks

#### **GET /api/v1/users/:id/activity**
Get user activity data for streak tracking

**Response**:
```json
{
  "data": {
    "current_streak": 15,
    "longest_streak": 30,
    "total_days_active": 45,
    "last_active_at": "2026-01-10T12:00:00Z",
    "streak_freeze_available": 2,
    "activity_calendar": {
      "2026-01-10": {
        "messages_sent": 50,
        "posts_created": 2,
        "reactions_given": 15,
        "time_spent_minutes": 120
      }
    },
    "milestones": {
      "next_milestone": 30,
      "next_reward": "Custom Badge"
    }
  }
}
```

#### **POST /api/v1/users/me/check-in**
Daily check-in for streak tracking

**Request**:
```json
{
  "timestamp": "2026-01-10T12:00:00Z"
}
```

**Response**:
```json
{
  "data": {
    "streak_count": 16,
    "reward_earned": {
      "type": "karma",
      "amount": 10
    },
    "next_milestone": 30
  }
}
```

---

## 🎮 GAMIFICATION SYSTEM APIS

### 3. Achievement System

#### **GET /api/v1/achievements**
Get all available achievements

**Response**:
```json
{
  "data": [
    {
      "id": "ach_1",
      "slug": "first_message",
      "name": "First Steps",
      "description": "Send your first message",
      "category": "messaging",
      "icon_url": "/achievements/first_message.png",
      "rarity": "common",
      "karma_reward": 10,
      "unlock_criteria": {
        "messages_sent": 1
      },
      "total_unlocked": 15000,
      "percentage_unlocked": 75.5
    },
    {
      "id": "ach_2",
      "slug": "social_butterfly",
      "name": "Social Butterfly",
      "description": "Make 100 friends",
      "category": "social",
      "icon_url": "/achievements/social_butterfly.png",
      "rarity": "rare",
      "karma_reward": 100,
      "unlock_criteria": {
        "friends_count": 100
      },
      "total_unlocked": 250,
      "percentage_unlocked": 1.25
    }
  ],
  "meta": {
    "total": 50,
    "categories": ["messaging", "social", "forums", "engagement", "special"]
  }
}
```

#### **GET /api/v1/users/:id/achievements**
Get user's unlocked achievements

**Response**:
```json
{
  "data": [
    {
      "achievement_id": "ach_1",
      "unlocked_at": "2026-01-05T10:00:00Z",
      "progress": 100,
      "achievement": {
        "id": "ach_1",
        "slug": "first_message",
        "name": "First Steps",
        "karma_reward": 10
      }
    }
  ],
  "meta": {
    "unlocked_count": 15,
    "total_achievements": 50,
    "completion_percentage": 30.0,
    "total_karma_earned": 450
  }
}
```

#### **GET /api/v1/users/:id/achievements/progress**
Get current progress toward locked achievements

**Response**:
```json
{
  "data": [
    {
      "achievement_id": "ach_2",
      "current_progress": 45,
      "required_progress": 100,
      "percentage": 45.0,
      "estimated_completion": "2026-02-15"
    }
  ]
}
```

#### **POST /api/v1/achievements/:id/claim**
Claim an achievement reward (if auto-claim is disabled)

**Response**:
```json
{
  "data": {
    "achievement_id": "ach_1",
    "rewards_claimed": {
      "karma": 10,
      "badge": "first_message_badge"
    },
    "unlocked_at": "2026-01-10T12:00:00Z"
  }
}
```

---

### 4. Daily Quests System

#### **GET /api/v1/quests/daily**
Get today's daily quests

**Response**:
```json
{
  "data": [
    {
      "id": "quest_daily_1",
      "name": "Morning Chatter",
      "description": "Send 5 messages today",
      "type": "daily",
      "category": "messaging",
      "expires_at": "2026-01-11T00:00:00Z",
      "rewards": {
        "karma": 10,
        "xp": 50
      },
      "progress": {
        "current": 2,
        "required": 5,
        "percentage": 40.0
      },
      "status": "in_progress"
    },
    {
      "id": "quest_daily_2",
      "name": "Social Hour",
      "description": "React to 10 messages",
      "type": "daily",
      "expires_at": "2026-01-11T00:00:00Z",
      "rewards": {
        "karma": 5,
        "xp": 25
      },
      "progress": {
        "current": 10,
        "required": 10,
        "percentage": 100.0
      },
      "status": "completed"
    }
  ],
  "meta": {
    "total_quests": 3,
    "completed_today": 1,
    "available_quests": 2
  }
}
```

#### **POST /api/v1/quests/:id/claim**
Claim quest rewards

**Request**:
```json
{
  "quest_id": "quest_daily_2"
}
```

**Response**:
```json
{
  "data": {
    "quest_id": "quest_daily_2",
    "rewards_claimed": {
      "karma": 5,
      "xp": 25
    },
    "new_level": 5,
    "level_up": false
  }
}
```

---

### 5. Leaderboards

#### **GET /api/v1/leaderboards/:type**
Get leaderboard data

**Types**: `karma`, `messages`, `posts`, `reactions`, `streak`

**Query Parameters**:
- `period` (hour|day|week|month|all) - Default: `week`
- `page` (integer) - Default: 1
- `limit` (integer) - Default: 50

**Response**:
```json
{
  "data": [
    {
      "rank": 1,
      "user_id": "user_123",
      "username": "alice",
      "display_name": "Alice W.",
      "avatar_url": "/avatars/alice.jpg",
      "score": 5000,
      "level": 15,
      "badge": "legendary",
      "is_premium": true
    }
  ],
  "meta": {
    "current_user_rank": 45,
    "current_user_score": 1200,
    "total_participants": 10000,
    "period": "week",
    "page": 1,
    "total_pages": 200
  }
}
```

---

## 💰 PREMIUM FEATURES APIS

### 6. Subscription Management

#### **GET /api/v1/subscription**
Get current user's subscription status

**Response**:
```json
{
  "data": {
    "tier": "premium",
    "status": "active",
    "started_at": "2026-01-01T00:00:00Z",
    "renews_at": "2026-02-01T00:00:00Z",
    "cancel_at_period_end": false,
    "features": [
      "unlimited_groups",
      "custom_themes",
      "animated_emojis",
      "priority_support",
      "no_ads",
      "custom_badges",
      "large_file_uploads",
      "voice_effects"
    ],
    "billing": {
      "amount": 4.99,
      "currency": "USD",
      "interval": "month",
      "next_billing_date": "2026-02-01"
    }
  }
}
```

#### **POST /api/v1/subscription/subscribe**
Subscribe to a premium tier

**Request**:
```json
{
  "tier": "premium",
  "payment_method_id": "pm_123456",
  "billing_interval": "month"
}
```

**Response**:
```json
{
  "data": {
    "subscription_id": "sub_123",
    "tier": "premium",
    "status": "active",
    "started_at": "2026-01-10T12:00:00Z"
  }
}
```

#### **POST /api/v1/subscription/cancel**
Cancel subscription

**Response**:
```json
{
  "data": {
    "subscription_id": "sub_123",
    "status": "active",
    "cancel_at_period_end": true,
    "ends_at": "2026-02-01T00:00:00Z"
  }
}
```

#### **POST /api/v1/subscription/upgrade**
Upgrade subscription tier

**Request**:
```json
{
  "new_tier": "premium_plus"
}
```

---

### 7. Coin System (Virtual Currency)

#### **GET /api/v1/coins/balance**
Get user's coin balance

**Response**:
```json
{
  "data": {
    "balance": 1250,
    "lifetime_earned": 2000,
    "lifetime_spent": 750,
    "pending": 50
  }
}
```

#### **POST /api/v1/coins/purchase**
Purchase coins

**Request**:
```json
{
  "package_id": "coins_500",
  "payment_method_id": "pm_123456"
}
```

**Response**:
```json
{
  "data": {
    "transaction_id": "tx_123",
    "amount": 500,
    "bonus": 50,
    "total_received": 550,
    "new_balance": 1800,
    "cost_usd": 4.99
  }
}
```

#### **POST /api/v1/coins/spend**
Spend coins on items/features

**Request**:
```json
{
  "item_type": "theme",
  "item_id": "theme_cyberpunk",
  "amount": 200
}
```

**Response**:
```json
{
  "data": {
    "transaction_id": "tx_124",
    "amount_spent": 200,
    "new_balance": 1600,
    "item_unlocked": {
      "type": "theme",
      "id": "theme_cyberpunk",
      "name": "Cyberpunk Neon"
    }
  }
}
```

#### **GET /api/v1/coins/transactions**
Get coin transaction history

**Response**:
```json
{
  "data": [
    {
      "id": "tx_124",
      "type": "spend",
      "amount": -200,
      "description": "Purchased Cyberpunk Neon theme",
      "created_at": "2026-01-10T12:00:00Z",
      "balance_after": 1600
    }
  ],
  "meta": {
    "page": 1,
    "total_pages": 5
  }
}
```

---

### 8. Custom Themes & Shop

#### **GET /api/v1/shop/themes**
Get available premium themes

**Response**:
```json
{
  "data": [
    {
      "id": "theme_cyberpunk",
      "name": "Cyberpunk Neon",
      "description": "Futuristic neon-lit theme",
      "preview_url": "/themes/cyberpunk_preview.jpg",
      "price_coins": 200,
      "price_usd": 1.99,
      "category": "dark",
      "tags": ["neon", "futuristic", "cyberpunk"],
      "popularity": 8.5,
      "is_owned": false,
      "is_premium_only": false
    }
  ],
  "meta": {
    "total": 25,
    "categories": ["dark", "light", "colorful", "minimal"]
  }
}
```

#### **POST /api/v1/users/me/themes**
Save custom theme (premium feature)

**Request**:
```json
{
  "name": "My Custom Theme",
  "config": {
    "primary_color": "#ff00ff",
    "accent_color": "#00ffff",
    "background": "gradient",
    "glass_intensity": "high",
    "particles_enabled": true
  }
}
```

#### **GET /api/v1/users/me/themes**
Get user's custom themes

---

## 📊 ANALYTICS & METRICS APIS

### 9. User Analytics (Premium Plus)

#### **GET /api/v1/analytics/user**
Get detailed user analytics

**Response**:
```json
{
  "data": {
    "overview": {
      "total_messages": 5000,
      "total_posts": 150,
      "total_reactions_given": 800,
      "total_reactions_received": 1200,
      "karma": 2500,
      "level": 12
    },
    "activity_by_day": [
      {
        "date": "2026-01-10",
        "messages": 50,
        "posts": 2,
        "time_spent_minutes": 120
      }
    ],
    "most_active_hours": [14, 18, 20],
    "favorite_conversations": [
      {
        "conversation_id": "conv_123",
        "message_count": 500,
        "last_message_at": "2026-01-10T12:00:00Z"
      }
    ],
    "response_time": {
      "average_minutes": 15,
      "median_minutes": 5
    },
    "sentiment": {
      "positive": 75.5,
      "neutral": 20.0,
      "negative": 4.5
    }
  }
}
```

---

## 🔔 WEBHOOK & REAL-TIME EVENTS

### 10. WebSocket Events (Phoenix Channels)

#### New events to handle:

**Achievement Unlocked**:
```json
{
  "event": "achievement:unlocked",
  "data": {
    "achievement_id": "ach_1",
    "achievement": {
      "name": "First Steps",
      "icon_url": "/achievements/first_message.png"
    },
    "rewards": {
      "karma": 10
    }
  }
}
```

**Quest Progress Updated**:
```json
{
  "event": "quest:progress",
  "data": {
    "quest_id": "quest_daily_1",
    "current": 3,
    "required": 5,
    "percentage": 60.0
  }
}
```

**Quest Completed**:
```json
{
  "event": "quest:completed",
  "data": {
    "quest_id": "quest_daily_1",
    "rewards_available": {
      "karma": 10,
      "xp": 50
    }
  }
}
```

**Level Up**:
```json
{
  "event": "user:level_up",
  "data": {
    "new_level": 13,
    "rewards": {
      "karma": 100
    },
    "unlocked_features": ["custom_themes"]
  }
}
```

**Streak Milestone**:
```json
{
  "event": "streak:milestone",
  "data": {
    "streak_count": 30,
    "milestone": "30_day_streak",
    "rewards": {
      "badge": "streak_master",
      "karma": 50
    }
  }
}
```

---

## 🗄️ DATABASE SCHEMA CHANGES

### New Tables Required

#### **user_preferences**
```sql
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL, -- 'theme', 'notifications', 'privacy', 'accessibility'
  preferences JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, category)
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
```

#### **achievements**
```sql
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  icon_url VARCHAR(500),
  rarity VARCHAR(20) NOT NULL DEFAULT 'common', -- common, rare, epic, legendary
  karma_reward INTEGER NOT NULL DEFAULT 0,
  unlock_criteria JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_achievements_category ON achievements(category);
CREATE INDEX idx_achievements_rarity ON achievements(rarity);
```

#### **user_achievements**
```sql
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP NOT NULL DEFAULT NOW(),
  progress INTEGER NOT NULL DEFAULT 100,
  claimed BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement_id ON user_achievements(achievement_id);
```

#### **daily_quests**
```sql
CREATE TABLE daily_quests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL DEFAULT 'daily', -- daily, weekly, special
  category VARCHAR(50) NOT NULL,
  criteria JSONB NOT NULL DEFAULT '{}',
  rewards JSONB NOT NULL DEFAULT '{}',
  difficulty VARCHAR(20) NOT NULL DEFAULT 'easy',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

#### **user_quest_progress**
```sql
CREATE TABLE user_quest_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quest_id UUID NOT NULL REFERENCES daily_quests(id) ON DELETE CASCADE,
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  claimed_at TIMESTAMP,
  current_progress INTEGER NOT NULL DEFAULT 0,
  required_progress INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'in_progress', -- in_progress, completed, claimed, expired
  expires_at TIMESTAMP NOT NULL,
  UNIQUE(user_id, quest_id, started_at::date)
);

CREATE INDEX idx_user_quest_progress_user_id ON user_quest_progress(user_id);
CREATE INDEX idx_user_quest_progress_status ON user_quest_progress(status);
```

#### **user_activity**
```sql
CREATE TABLE user_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL,
  messages_sent INTEGER NOT NULL DEFAULT 0,
  posts_created INTEGER NOT NULL DEFAULT 0,
  reactions_given INTEGER NOT NULL DEFAULT 0,
  time_spent_minutes INTEGER NOT NULL DEFAULT 0,
  last_active_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, activity_date)
);

CREATE INDEX idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX idx_user_activity_date ON user_activity(activity_date);
```

#### **subscriptions**
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier VARCHAR(50) NOT NULL, -- free, premium, premium_plus
  status VARCHAR(50) NOT NULL, -- active, canceled, past_due, unpaid
  stripe_subscription_id VARCHAR(200),
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  canceled_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

#### **coin_transactions**
```sql
CREATE TABLE coin_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- purchase, earn, spend, refund
  amount INTEGER NOT NULL, -- positive for earn/purchase, negative for spend
  balance_after INTEGER NOT NULL,
  description TEXT,
  item_type VARCHAR(50),
  item_id VARCHAR(200),
  stripe_payment_intent_id VARCHAR(200),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_coin_transactions_user_id ON coin_transactions(user_id);
CREATE INDEX idx_coin_transactions_created_at ON coin_transactions(created_at);
```

#### **custom_themes**
```sql
CREATE TABLE custom_themes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT false,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_custom_themes_user_id ON custom_themes(user_id);
```

### Schema Modifications to Existing Tables

#### **users table** - Add new columns:
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS xp INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_streak INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS longest_streak INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS coin_balance INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_check_in_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_tier VARCHAR(50) NOT NULL DEFAULT 'free';
```

---

## 📝 IMPLEMENTATION PRIORITY

### Phase 1: User Preferences (Week 1)
- ✅ User preferences endpoints
- ✅ Theme customization storage
- ✅ Real-time preference sync

### Phase 2: Activity & Streaks (Week 2)
- ✅ User activity tracking
- ✅ Daily check-in system
- ✅ Streak calculation logic

### Phase 3: Gamification (Week 2-3)
- ✅ Achievement system
- ✅ Daily quests
- ✅ Leaderboards

### Phase 4: Premium Features (Week 3-4)
- ✅ Subscription management (Stripe integration)
- ✅ Coin system
- ✅ Premium theme shop

### Phase 5: Analytics (Week 4)
- ✅ User analytics endpoints
- ✅ Activity metrics

---

## 🔐 SECURITY CONSIDERATIONS

### Authentication & Authorization
- All endpoints require authenticated user (JWT token)
- Premium endpoints check subscription status
- Admin endpoints require admin role
- Coin transactions require 2FA for amounts > 1000 coins

### Rate Limiting
```
General API: 100 requests/minute
Achievement checks: 10 requests/minute
Coin transactions: 5 requests/minute
Preference updates: 20 requests/minute
```

### Data Validation
- All JSONB fields validated against schema
- Prevent SQL injection in all queries
- Sanitize user-generated content
- Validate coin balance before spending

---

## 📊 MONITORING & ANALYTICS

### Metrics to Track
- Achievement unlock rates
- Quest completion rates
- Premium conversion rates
- Coin purchase patterns
- Theme popularity
- API response times
- Error rates per endpoint

---

**This document will be updated as implementation progresses.**

**Next Steps**: Frontend will use these APIs to implement all gamification and premium features.
