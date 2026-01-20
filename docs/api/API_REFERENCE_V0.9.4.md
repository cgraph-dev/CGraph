# CGraph API Reference - v0.9.4

**Last Updated**: January 20, 2026 **Base URL**: `https://api.cgraph.org/api/v1`

## Table of Contents

1. [Authentication](#authentication)
2. [Rate Limiting](#rate-limiting)
3. [Customization Endpoints (NEW)](#customization-endpoints)
4. [Email Rate Limiting (NEW)](#email-rate-limiting)
5. [WebSocket Token Management (UPDATED)](#websocket-token-management)
6. [Event Reward Distribution (NEW)](#event-reward-distribution)
7. [RSS Feeds](#rss-feeds)
8. [Web Push Notifications](#web-push-notifications)
9. [Custom Emojis](#custom-emojis)
10. [Forum Hierarchy](#forum-hierarchy)
11. [Secondary Groups](#secondary-groups)
12. [Themes & Cosmetics](#themes-cosmetics)
13. [Background Jobs](#background-jobs)

---

## Authentication

### Overview

CGraph uses HTTP-only cookie-based authentication for enhanced security:

- **Access tokens**: HTTP-only cookies (15 min expiry)
- **Refresh tokens**: HTTP-only cookies (7 day expiry)
- **WebSocket tokens**: Session tokens for real-time connections

All authenticated requests automatically include cookies via `withCredentials: true`.

### Headers

```
Authorization: Bearer <token>  # Legacy support
Cookie: _cgraph_session=<session_token>  # Preferred
```

### Rate Limiting

Authentication endpoints use **strict rate limiting** to prevent brute force attacks:

- **5 requests per minute** per IP address
- **Account lockout** after 5 failed attempts (see Security section)

---

## Rate Limiting

### v0.9.4 Updates

**New Rate Limit Tiers**:

| Tier       | Requests/Minute                            | Use Case                   |
| ---------- | ------------------------------------------ | -------------------------- |
| `strict`   | 5                                          | Authentication endpoints   |
| `standard` | 100 (unauthenticated), 300 (authenticated) | General API                |
| `relaxed`  | 500                                        | Public read-only endpoints |

**Headers** (included in all responses):

```
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 299
X-RateLimit-Reset: 1706644800
```

**Account Lockout** (v0.9.4 security fix):

- After **5 failed login attempts**, accounts are locked for **30 minutes**
- Uses **atomic database increment** to prevent race conditions
- Unlock via password reset or automatic expiration

---

## Customization Endpoints

**NEW in v0.9.4**: Complete customization persistence system.

### Get User Customizations

```http
GET /api/v1/users/:id/customizations
```

**Response**:

```json
{
  "user_id": "01HQXYZ...",
  "avatar_border": "holographic-rainbow",
  "title": "legend",
  "equipped_badges": ["pioneer", "contributor", "veteran"],
  "profile_layout": "modern-glass",
  "profile_theme": "cyberpunk-neon",
  "chat_theme": "midnight-purple",
  "forum_theme": "dark-code",
  "app_theme": "dark",
  "bubble_style": "glassmorphic",
  "message_effect": "sparkle",
  "reaction_style": "bounce",
  "particle_effect": "fireflies",
  "background_effect": "gradient-mesh",
  "animation_speed": "normal"
}
```

### Update All Customizations

```http
PUT /api/v1/users/:id/customizations
```

**Request**:

```json
{
  "avatar_border": "neon-pulse",
  "title": "master",
  "equipped_badges": ["elite", "champion"],
  "profile_theme": "ocean-depths"
}
```

**Response**: `200 OK` with updated customizations

### Patch Specific Fields

```http
PATCH /api/v1/users/:id/customizations
```

**Request**:

```json
{
  "bubble_style": "modern-rounded",
  "message_effect": "confetti"
}
```

Allows updating specific customization fields without sending entire object.

### Individual Customization Endpoints

```http
PUT /api/v1/users/:id/avatar-border
PUT /api/v1/users/:id/title
PUT /api/v1/users/:id/badges
PUT /api/v1/users/:id/themes
PUT /api/v1/users/:id/chat-style
PUT /api/v1/users/:id/effects
```

**Example - Update Avatar Border**:

```json
{
  "avatar_border": "legendary-flames"
}
```

### Database Schema

```sql
CREATE TABLE user_customizations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Identity
  avatar_border_id VARCHAR(50),
  title_id VARCHAR(50),
  equipped_badges JSONB DEFAULT '[]'::jsonb,
  profile_layout VARCHAR(50) DEFAULT 'classic',

  -- Themes
  profile_theme VARCHAR(50) DEFAULT 'classic-purple',
  chat_theme VARCHAR(50) DEFAULT 'default',
  forum_theme VARCHAR(50),
  app_theme VARCHAR(50) DEFAULT 'dark',

  -- Chat Styling
  bubble_style VARCHAR(50) DEFAULT 'default',
  message_effect VARCHAR(50) DEFAULT 'none',
  reaction_style VARCHAR(50) DEFAULT 'bounce',

  -- Effects
  particle_effect VARCHAR(50) DEFAULT 'none',
  background_effect VARCHAR(50) DEFAULT 'solid',
  animation_speed VARCHAR(50) DEFAULT 'normal',

  inserted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE(user_id)
);

CREATE INDEX idx_user_customizations_user_id ON user_customizations(user_id);
```

---

## Email Rate Limiting

**NEW in v0.9.4**: Email delivery rate limiting to prevent abuse and email provider suspension.

### Implementation

Uses **Hammer** library with Redis-backed distributed rate limiting:

- **Limit**: 10 emails per hour per user
- **Critical emails** can bypass limit (password resets)
- **Distributed**: Works across multiple server instances

### Configuration

```elixir
# In mailer.ex
case Hammer.check_rate("email:#{user.id}", :timer.hours(1), 10) do
  {:allow, _count} ->
    send_email(user, template, assigns)

  {:deny, _limit} ->
    Logger.warning("Email rate limit exceeded for user #{user.id}")
    {:error, :rate_limited}
end
```

### Bypass Critical Emails

```elixir
# Password resets bypass rate limit
Mailer.deliver_email(user, :password_reset, %{}, bypass_rate_limit: true)
```

### Error Response

```json
{
  "error": "rate_limited",
  "message": "Email rate limit exceeded. Try again in 45 minutes.",
  "retry_after": 2700
}
```

---

## WebSocket Token Management

**UPDATED in v0.9.4**: Token expiration now enforced for active WebSocket connections.

### Security Fix

Previously, WebSocket tokens were validated **only on connection** and never refreshed. Users stayed
connected even after:

- Token expiration
- Account suspension/ban
- Password change
- Logout from other devices

### New Behavior (v0.9.4)

- **Periodic token validation** every 5 minutes
- **Automatic disconnection** if token expired or invalid
- **Graceful reconnection** with token refresh

### Client Implementation

```typescript
// Phoenix Socket with automatic token refresh
const socket = new Socket('/socket', {
  params: () => ({ token: getToken() }),
  heartbeatIntervalMs: 30000,
});

socket.onError(() => {
  // Token expired - refresh and reconnect
  refreshToken().then((newToken) => {
    socket.disconnect();
    socket.connect();
  });
});
```

### Server Implementation

```elixir
# In user_socket.ex
def handle_info(:check_token, socket) do
  case Guardian.decode_and_verify(socket.assigns.token) do
    {:ok, _claims} ->
      # Token still valid, schedule next check
      Process.send_after(self(), :check_token, :timer.minutes(5))
      {:noreply, socket}

    {:error, _} ->
      # Token expired, disconnect
      {:stop, :normal, socket}
  end
end
```

### WebSocket Events

New event for token expiration:

```javascript
channel.on('token_expired', () => {
  console.log('Session expired, please log in again');
  redirectToLogin();
});
```

---

## Event Reward Distribution

**NEW in v0.9.4**: Complete implementation of gamification event reward distribution.

### Overview

Automatically distributes rewards when seasonal events end:

- **Participation rewards** (all users who joined)
- **Milestone rewards** (battle pass tier progress)
- **Leaderboard rewards** (top X ranks)

### Event Endpoints

#### Get Event Details

```http
GET /api/v1/events/:id
```

**Response**:

```json
{
  "id": "01HQXYZ...",
  "name": "Winter Wonderland 2026",
  "slug": "winter-wonderland-2026",
  "starts_at": "2026-01-01T00:00:00Z",
  "ends_at": "2026-01-31T23:59:59Z",
  "participation_rewards": [
    { "type": "xp", "amount": 500 },
    { "type": "coins", "amount": 100 }
  ],
  "milestone_rewards": [
    { "id": "tier_10", "tier": 10, "type": "title", "title_id": "winter_warrior" },
    { "id": "tier_25", "tier": 25, "type": "coins", "amount": 500 }
  ],
  "leaderboard_rewards": [
    { "min_rank": 1, "max_rank": 1, "type": "title", "title_id": "champion" },
    { "min_rank": 2, "max_rank": 10, "type": "coins", "amount": 1000 }
  ]
}
```

#### Get Event Leaderboard

```http
GET /api/v1/events/:id/leaderboard?limit=100
```

**Response**:

```json
{
  "leaderboard": [
    {
      "rank": 1,
      "user_id": "01HQXYZ...",
      "username": "TopPlayer",
      "score": 15000,
      "battle_pass_tier": 50
    }
  ]
}
```

### Reward Distribution Worker

Background job runs when event ends:

```elixir
# Enqueue reward distribution
CGraph.Workers.EventRewardDistributor.enqueue(%{event_id: event.id})
```

**Process**:

1. **Validate event ended** (past `ends_at`)
2. **Fetch all participants** (users with `UserEventProgress`)
3. **Calculate final leaderboard** (top 100)
4. **Distribute participation rewards** (all users)
5. **Distribute milestone rewards** (based on tier progress)
6. **Distribute leaderboard rewards** (top ranks)
7. **Send notifications** (via NotificationWorker)

### Reward Types

| Type          | Fields           | Example                                                    |
| ------------- | ---------------- | ---------------------------------------------------------- |
| `xp`          | `amount`         | `{"type": "xp", "amount": 500}`                            |
| `coins`       | `amount`         | `{"type": "coins", "amount": 100}`                         |
| `title`       | `title_id`       | `{"type": "title", "title_id": "legend"}`                  |
| `achievement` | `achievement_id` | `{"type": "achievement", "achievement_id": "first_place"}` |
| `cosmetic`    | `item_id`        | `{"type": "cosmetic", "item_id": "legendary_border"}`      |

### Notifications

Participants receive notification when event ends:

```json
{
  "type": "event_ended",
  "title": "Event Ended: Winter Wonderland",
  "body": "Rewards have been distributed! Check your profile.",
  "data": {
    "event_id": "01HQXYZ...",
    "event_slug": "winter-wonderland-2026"
  }
}
```

---

## RSS Feeds

**IMPLEMENTED in v0.9.4**: Complete RSS/Atom feed system for forum content.

All feeds support both **RSS 2.0** (default) and **Atom 1.0** (via `?format=atom`).

### Global Activity Feed

```http
GET /api/v1/rss/global/activity
```

Aggregated feed of all public forum activity.

### Forum Feeds

```http
GET /api/v1/rss/forums/:forum_id/threads
GET /api/v1/rss/forums/:forum_id/posts
```

All threads or posts within a forum.

### Board Feeds

```http
GET /api/v1/rss/boards/:board_id/threads
```

Threads within a specific board.

### Thread Feeds

```http
GET /api/v1/rss/threads/:thread_id/posts
```

All posts (replies) within a thread.

### User Activity Feeds

```http
GET /api/v1/rss/users/:user_id/activity
```

All posts and threads created by a user.

### Feed Format

**RSS 2.0** (default):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>CGraph - Forum Activity</title>
    <link>https://cgraph.org</link>
    <description>Latest forum posts and threads</description>
    <item>
      <title>Post Title</title>
      <link>https://cgraph.org/forums/abc/posts/xyz</link>
      <description>Post content...</description>
      <pubDate>Mon, 20 Jan 2026 12:00:00 GMT</pubDate>
      <author>user@example.com (Username)</author>
    </item>
  </channel>
</rss>
```

**Atom 1.0** (via `?format=atom`):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>CGraph - Forum Activity</title>
  <link href="https://cgraph.org"/>
  <updated>2026-01-20T12:00:00Z</updated>
  <entry>
    <title>Post Title</title>
    <link href="https://cgraph.org/forums/abc/posts/xyz"/>
    <id>https://cgraph.org/forums/abc/posts/xyz</id>
    <updated>2026-01-20T12:00:00Z</updated>
    <summary>Post content...</summary>
    <author><name>Username</name></author>
  </entry>
</feed>
```

### Caching

All RSS feeds are **cached for 5 minutes** for CDN optimization.

---

## Web Push Notifications

**UPDATED in v0.9.4**: Complete notification delivery implementation.

### Get VAPID Public Key (Public)

```http
GET /api/v1/web-push/vapid-key
```

**Response**:

```json
{
  "public_key": "BH7z..."
}
```

### Get Web Push Status (Public)

```http
GET /api/v1/web-push/status
```

**Response**:

```json
{
  "enabled": true,
  "subscriptions_count": 1523
}
```

### Subscribe (Authenticated)

```http
POST /api/v1/web-push/subscribe
```

**Request**:

```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": {
    "p256dh": "BH7z...",
    "auth": "XxYy..."
  }
}
```

**Response**: `201 Created`

### Unsubscribe (Authenticated)

```http
DELETE /api/v1/web-push/unsubscribe
```

**Response**: `204 No Content`

### Send Test Notification (Authenticated)

```http
POST /api/v1/web-push/test
```

Sends test notification to verify subscription works.

**Response**:

```json
{
  "sent": true,
  "message": "Test notification sent"
}
```

### Notification Payload

```json
{
  "title": "New Message",
  "body": "You have a new message from Alice",
  "icon": "/icons/notification-icon.png",
  "badge": "/icons/badge.png",
  "data": {
    "url": "/messages/01HQXYZ...",
    "type": "message",
    "conversation_id": "01HQXYZ..."
  },
  "actions": [
    { "action": "reply", "title": "Reply" },
    { "action": "view", "title": "View" }
  ]
}
```

---

## Custom Emojis

**COMPLETED in v0.9.4**: Full custom emoji system with upload, moderation, and usage tracking.

### Public Endpoints

#### List All Emojis

```http
GET /api/v1/emojis?page=1&limit=50
```

#### Get Emoji Categories

```http
GET /api/v1/emojis/categories
```

**Response**:

```json
{
  "categories": [
    { "id": "reactions", "name": "Reactions", "count": 42 },
    { "id": "animals", "name": "Animals", "count": 28 }
  ]
}
```

#### Search Emojis

```http
GET /api/v1/emojis/search?q=heart
```

#### Get Popular Emojis

```http
GET /api/v1/emojis/popular?limit=20
```

### Authenticated Endpoints

#### Get User's Favorites

```http
GET /api/v1/emojis/favorites
```

#### Get Recently Used

```http
GET /api/v1/emojis/recent?limit=10
```

#### Upload Custom Emoji

```http
POST /api/v1/emojis
Content-Type: multipart/form-data
```

**Form Data**:

```
name: my_emoji
category: reactions
image: [file]
```

**Response**:

```json
{
  "id": "01HQXYZ...",
  "name": "my_emoji",
  "category": "reactions",
  "url": "https://cdn.cgraph.org/emojis/01HQXYZ.png",
  "status": "pending"
}
```

**Note**: Uploaded emojis require admin approval before appearing publicly.

#### Track Emoji Usage

```http
POST /api/v1/emojis/:id/use
```

Increments usage counter for trending calculation.

#### Add/Remove Favorite

```http
POST /api/v1/emojis/:id/favorite
DELETE /api/v1/emojis/:id/favorite
```

### Admin Endpoints

#### Get Pending Emojis

```http
GET /api/v1/admin/emojis/pending
```

#### Approve Emoji

```http
POST /api/v1/admin/emojis/:id/approve
```

#### Reject Emoji

```http
POST /api/v1/admin/emojis/:id/reject
```

**Request**:

```json
{
  "reason": "Inappropriate content"
}
```

---

## Forum Hierarchy

**IMPLEMENTED in v0.9.4**: Nested subforum support.

### Public Endpoints

#### Get Full Forum Tree

```http
GET /api/v1/forums/tree
```

**Response**:

```json
{
  "tree": [
    {
      "id": "01HQXYZ...",
      "name": "General Discussion",
      "depth": 0,
      "children": [
        {
          "id": "01HQABC...",
          "name": "Off-Topic",
          "depth": 1,
          "children": []
        }
      ]
    }
  ]
}
```

#### Get Root Forums

```http
GET /api/v1/forums/roots
```

Returns only top-level forums (no parent).

#### Get Subtree

```http
GET /api/v1/forums/:id/subtree
```

Returns forum and all descendants.

#### Get Children

```http
GET /api/v1/forums/:id/children
```

Returns only direct child forums.

#### Get Ancestors

```http
GET /api/v1/forums/:id/ancestors
```

Returns path from root to forum.

#### Get Breadcrumbs

```http
GET /api/v1/forums/:id/breadcrumbs
```

**Response**:

```json
{
  "breadcrumbs": [
    { "id": "01HQXYZ...", "name": "General", "slug": "general" },
    { "id": "01HQABC...", "name": "Gaming", "slug": "gaming" },
    { "id": "01HQDEF...", "name": "RPG", "slug": "rpg" }
  ]
}
```

### Authenticated Endpoints

#### Move Forum

```http
PUT /api/v1/forums/:id/move
```

**Request**:

```json
{
  "parent_id": "01HQXYZ...", // null for root level
  "position": 3
}
```

#### Reorder Siblings

```http
PUT /api/v1/forums/:id/reorder
```

**Request**:

```json
{
  "positions": [
    { "id": "01HQABC...", "position": 1 },
    { "id": "01HQDEF...", "position": 2 }
  ]
}
```

#### Create Subforum

```http
POST /api/v1/forums/:id/create_subforum
```

**Request**:

```json
{
  "name": "New Subforum",
  "slug": "new-subforum",
  "description": "A subforum under parent"
}
```

---

## Secondary Groups

**IMPLEMENTED in v0.9.4**: Multiple group membership and auto-assignment rules.

### Get Member's Groups

```http
GET /api/v1/forums/:forum_id/members/:member_id/groups
```

**Response**:

```json
{
  "primary_group": {
    "id": "01HQXYZ...",
    "name": "Moderators"
  },
  "secondary_groups": [
    { "id": "01HQABC...", "name": "Contributors" },
    { "id": "01HQDEF...", "name": "Donors" }
  ],
  "display_group": {
    "id": "01HQXYZ...",
    "name": "Moderators"
  }
}
```

### Get Current User's Groups

```http
GET /api/v1/forums/:forum_id/my-groups
```

### Add Secondary Group

```http
POST /api/v1/forums/:forum_id/members/:member_id/secondary-groups
```

**Request**:

```json
{
  "group_id": "01HQXYZ..."
}
```

### Remove Secondary Group

```http
DELETE /api/v1/forums/:forum_id/members/:member_id/secondary-groups/:group_id
```

### Set Display Group

```http
PUT /api/v1/forums/:forum_id/members/:member_id/display-group
```

**Request**:

```json
{
  "group_id": "01HQXYZ..."
}
```

Display group determines which badge/color shows on user's profile.

### Auto-Assignment Rules

#### List Rules

```http
GET /api/v1/forums/:forum_id/group-rules
```

**Response**:

```json
{
  "rules": [
    {
      "id": "01HQXYZ...",
      "group_id": "01HQABC...",
      "condition_type": "post_count",
      "threshold": 100,
      "enabled": true
    }
  ]
}
```

#### Create Rule

```http
POST /api/v1/forums/:forum_id/groups/:group_id/rules
```

**Request**:

```json
{
  "condition_type": "karma",
  "threshold": 500,
  "enabled": true
}
```

**Condition Types**:

- `post_count` - Total posts
- `karma` - Karma points
- `days_registered` - Account age
- `reputation` - Reputation score

#### Evaluate Rules for User

```http
POST /api/v1/forums/:forum_id/evaluate-rules
```

Checks all rules and automatically adds qualifying groups.

**Response**:

```json
{
  "added_groups": ["01HQXYZ..."],
  "removed_groups": []
}
```

---

## Themes & Cosmetics

### Global Theme System

#### Get User Theme

```http
GET /api/v1/users/:id/theme
```

**Response**:

```json
{
  "profile_theme": "cyberpunk-neon",
  "chat_theme": "midnight-purple",
  "app_theme": "dark"
}
```

#### Update Theme

```http
PUT /api/v1/users/:id/theme
```

**Request**:

```json
{
  "profile_theme": "ocean-depths",
  "chat_theme": "default"
}
```

#### Reset to Default

```http
POST /api/v1/users/:id/theme/reset
```

#### Get Theme Presets

```http
GET /api/v1/themes/presets
```

**Response**:

```json
{
  "presets": [
    {
      "id": "cyberpunk-neon",
      "name": "Cyberpunk Neon",
      "colors": {
        "primary": "#00ffff",
        "secondary": "#ff00ff",
        "background": "#0a0a0a"
      }
    }
  ]
}
```

### Avatar Borders

#### List Borders

```http
GET /api/v1/avatar-borders
```

**Response**:

```json
{
  "borders": [
    {
      "id": "holographic-rainbow",
      "name": "Holographic Rainbow",
      "rarity": "legendary",
      "price": 5000,
      "unlocked": true
    }
  ]
}
```

#### Get Unlocked Borders

```http
GET /api/v1/avatar-borders/unlocked
```

#### Equip Border

```http
POST /api/v1/avatar-borders/:id/equip
```

#### Purchase Border

```http
POST /api/v1/avatar-borders/:id/purchase
```

**Response**:

```json
{
  "success": true,
  "new_balance": 4500
}
```

---

## Background Jobs

### Oban Configuration (v0.9.4)

New plugins for reliability:

```elixir
plugins: [
  # Prune completed jobs after 7 days
  {Oban.Plugins.Pruner, max_age: 60 * 60 * 24 * 7},

  # Rescue orphaned jobs (stuck jobs older than 30 minutes)
  {Oban.Plugins.Lifeline, rescue_after: :timer.minutes(30)},

  # Prevent queue congestion
  {Oban.Plugins.Staler, interval: :timer.minutes(1)}
]
```

### Queue Configuration

| Queue           | Concurrency | Purpose                   |
| --------------- | ----------- | ------------------------- |
| `default`       | 10          | General background tasks  |
| `mailers`       | 5           | Email delivery            |
| `notifications` | 20          | Push notifications        |
| `events`        | 5           | Event reward distribution |
| `cleanup`       | 3           | Orphaned file cleanup     |

### Worker Types

#### CleanupWorker

Runs daily at 2 AM UTC:

- **Expired sessions** (> 7 days old)
- **Unverified users** (> 30 days since registration)
- **Orphaned attachments** (> 7 days, not referenced by messages)

**Storage Support**:

- Cloudflare R2
- AWS S3
- Local filesystem

#### EmailDigestWorker

Runs weekly:

- **Trending posts** (from subscribed forums)
- **Friend activity** (new posts, achievements)
- **Unread messages** (summary)

**Performance Optimization**:

- Uses JOIN queries (no N+1)
- 6x faster than previous implementation

#### EventRewardDistributor

Runs when event ends:

- Validates event completion
- Distributes participation/milestone/leaderboard rewards
- Sends notifications to all participants

#### NotificationWorker

Delivers push notifications:

- Web push (browser)
- Mobile push (Expo)
- Email fallback

---

## Appendix: Migration Guide

### Upgrading from v0.9.3 to v0.9.4

**Database Migrations**:

1. Run customization table migration:

```bash
cd apps/backend
mix ecto.migrate
```

2. Add missing indexes (performance):

```sql
CREATE INDEX idx_posts_forum_created ON posts(forum_id, inserted_at DESC);
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, inserted_at DESC);
CREATE INDEX idx_user_achievements_user_earned ON user_achievements(user_id, earned_at DESC);
CREATE INDEX idx_notifications_user_created ON notifications(user_id, inserted_at DESC, read);
```

**Configuration Changes**:

1. Update `config/runtime.exs`:
   - **Enable SSL verification** (CRITICAL):
     ```elixir
     ssl_opts = [verify: :verify_peer, ...]
     ```

2. Add Redis for rate limiting (optional but recommended):

   ```elixir
   config :cgraph, :redis_url, System.get_env("REDIS_URL")
   ```

3. Configure Oban plugins in `config/config.exs`:
   ```elixir
   config :cgraph, Oban,
     plugins: [
       {Oban.Plugins.Lifeline, rescue_after: :timer.minutes(30)},
       {Oban.Plugins.Pruner, max_age: 60 * 60 * 24 * 7}
     ]
   ```

**Frontend Changes**:

1. Update WebSocket connection handling:

```typescript
socket.onError(() => {
  // Handle token expiration
  refreshToken().then(() => socket.connect());
});
```

2. Use new customization endpoints:

```typescript
// Get user customizations
const response = await api.get(`/users/${userId}/customizations`);

// Update customizations
await api.put(`/users/${userId}/customizations`, {
  avatar_border: 'neon-pulse',
  title: 'legend',
});
```

---

## Support

- **Documentation**: https://docs.cgraph.org
- **Email**: support@cgraph.org
- **GitHub**: https://github.com/cgraph/cgraph

---

**Version**: 0.9.4 **Last Updated**: January 20, 2026 **License**: MIT
