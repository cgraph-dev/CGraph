# CGraph Database Documentation

> Maintainer: @marcus | Last updated: January 2025  
> If you're modifying the schema, PLEASE update this doc. Future you will thank present you.

---

## Table of Contents

1. [Entity-Relationship Diagram](#entity-relationship-diagram)
2. [Table Reference](#table-reference)
3. [Index Strategy](#index-strategy)
4. [Migration Guide](#migration-guide)
5. [Backup and Recovery](#backup-and-recovery)
6. [Query Optimization](#query-optimization)
7. [Data Retention](#data-retention)

---

## Entity-Relationship Diagram

Here's the full schema. I tried to use a fancy tool but honestly ASCII art is easier to maintain:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    CORE ENTITIES                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

    ┌──────────────────┐
    │      users       │
    ├──────────────────┤
    │ id (PK, UUID)    │
    │ user_id (unique) │──────── Auto-increment sequence (#0001)
    │ email            │─────────┐
    │ username (null)  │         │  Username is optional, can be set later
    │ username_changed │         │  Timestamp of last username change
    │ display_name     │         │
    │ password_hash    │         │
    │ avatar_url       │         │
    │ bio              │         │
    │ is_anonymous     │         │
    │ wallet_address   │         │     ┌───────────────────┐
    │ wallet_pin_hash  │         │     │   user_settings   │
    │ status           │         │     ├───────────────────┤
    │ premium_until    │         ├────▶│ id (PK)           │
    │ inserted_at      │         │     │ user_id (FK) ─────┘
    │ updated_at       │         │     │ theme             │
    └────────┬─────────┘         │     │ notifications...  │
             │                   │     │ privacy...        │
             │                   │     └───────────────────┘
             │
    ┌────────┴────────────────────────────────────────────────┐
    │                                                          │
    ▼                                                          ▼
┌──────────────────┐                              ┌──────────────────┐
│   friendships    │                              │  recovery_codes  │
├──────────────────┤                              ├──────────────────┤
│ id (PK)          │                              │ id (PK)          │
│ user_id (FK) ────┼─────┐                        │ user_id (FK) ────┘
│ friend_id (FK) ──┼─────┤                        │ code_hash        │
│ status           │     │                        │ used_at          │
│ inserted_at      │     │                        └──────────────────┘
└──────────────────┘     │
                         │
                         │
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     MESSAGING                                                │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────────────┐         ┌──────────────────┐
│  conversations   │         │ conversation_participants│         │    messages      │
├──────────────────┤         ├──────────────────────────┤         ├──────────────────┤
│ id (PK)          │◀────────│ conversation_id (FK)     │         │ id (PK)          │
│ type             │         │ user_id (FK) ────────────┼────────▶│ conversation_id  │
│ last_message_at  │         │ joined_at                │         │ sender_id (FK)   │
│ inserted_at      │         │ last_read_at             │         │ content          │
└──────────────────┘         │ unread_count             │         │ encrypted        │
                             └──────────────────────────┘         │ reply_to_id      │
                                                                  │ edited_at        │
                                                                  │ deleted_at       │
┌──────────────────┐                                              │ inserted_at      │
│    reactions     │◀─────────────────────────────────────────────┤                  │
├──────────────────┤                                              └──────────────────┘
│ id (PK)          │
│ message_id (FK)  │         ┌──────────────────┐
│ user_id (FK)     │         │   attachments    │
│ emoji            │         ├──────────────────┤
│ inserted_at      │         │ id (PK)          │
└──────────────────┘         │ message_id (FK)  │────────────────────────┐
                             │ upload_id (FK)   │                        │
                             └──────────────────┘                        ▼
                                                                 ┌──────────────────┐
                                                                 │     uploads      │
                                                                 ├──────────────────┤
                                                                 │ id (PK)          │
                                                                 │ user_id (FK)     │
                                                                 │ filename         │
                                                                 │ content_type     │
                                                                 │ size_bytes       │
                                                                 │ storage_path     │
                                                                 │ width, height    │
                                                                 │ inserted_at      │
                                                                 └──────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       GROUPS                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│     groups       │         │  group_members   │         │      roles       │
├──────────────────┤         ├──────────────────┤         ├──────────────────┤
│ id (PK)          │◀────────│ group_id (FK)    │    ┌───▶│ id (PK)          │
│ name             │         │ user_id (FK)     │    │    │ group_id (FK)    │
│ description      │         │ role_id (FK) ────┼────┘    │ name             │
│ icon_url         │         │ nickname         │         │ color            │
│ owner_id (FK)    │         │ joined_at        │         │ permissions      │
│ is_public        │         │ muted_until      │         │ position         │
│ inserted_at      │         └──────────────────┘         └──────────────────┘
└────────┬─────────┘
         │
         │
         ▼
┌──────────────────┐         ┌──────────────────┐
│    channels      │         │ channel_messages │
├──────────────────┤         ├──────────────────┤
│ id (PK)          │◀────────│ channel_id (FK)  │
│ group_id (FK)    │         │ id (PK)          │
│ name             │         │ sender_id (FK)   │
│ type (text/voice)│         │ content          │
│ topic            │         │ reply_to_id      │
│ position         │         │ edited_at        │
│ category_id      │         │ pinned           │
│ slowmode_seconds │         │ inserted_at      │
└──────────────────┘         └──────────────────┘

┌──────────────────┐
│  group_invites   │
├──────────────────┤
│ id (PK)          │
│ group_id (FK)    │
│ code (unique)    │
│ created_by (FK)  │
│ max_uses         │
│ use_count        │
│ expires_at       │
└──────────────────┘

┌──────────────────┐
│   group_bans     │
├──────────────────┤
│ id (PK)          │
│ group_id (FK)    │
│ user_id (FK)     │
│ banned_by (FK)   │
│ reason           │
│ expires_at       │
│ inserted_at      │
└──────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       FORUMS                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│     forums       │         │      posts       │         │    comments      │
├──────────────────┤         ├──────────────────┤         ├──────────────────┤
│ id (PK)          │◀────────│ forum_id (FK)    │    ┌───▶│ id (PK)          │
│ name             │         │ id (PK)          │────┘    │ post_id (FK)     │
│ slug (unique)    │         │ author_id (FK)   │         │ author_id (FK)   │
│ description      │         │ title            │         │ parent_id (FK)   │──┐ (self-ref
│ icon_url         │         │ content          │         │ content          │◀─┘  for threading)
│ banner_url       │         │ category_id      │         │ score            │
│ custom_css       │         │ score            │         │ inserted_at      │
│ owner_id (FK)    │         │ comment_count    │         └──────────────────┘
│ is_public        │         │ is_pinned        │
│ subscriber_count │         │ is_locked        │         ┌──────────────────┐
│ inserted_at      │         │ inserted_at      │         │     votes        │
└────────┬─────────┘         └──────────────────┘         ├──────────────────┤
         │                                                 │ id (PK)          │
         │                                                 │ user_id (FK)     │
         ▼                                                 │ voteable_type    │
┌──────────────────┐                                       │ voteable_id      │
│ forum_categories │                                       │ direction (+1/-1)│
├──────────────────┤                                       │ inserted_at      │
│ id (PK)          │                                       └──────────────────┘
│ forum_id (FK)    │
│ name             │         ┌──────────────────┐
│ slug             │         │  subscriptions   │
│ color            │         ├──────────────────┤
│ position         │         │ id (PK)          │
└──────────────────┘         │ user_id (FK)     │
                             │ forum_id (FK)    │
                             │ inserted_at      │
┌──────────────────┐         └──────────────────┘
│  forum_moderators│
├──────────────────┤
│ forum_id (FK)    │
│ user_id (FK)     │
│ permissions      │
│ appointed_at     │
└──────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    NOTIFICATIONS                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐
│  notifications   │         │   push_tokens    │
├──────────────────┤         ├──────────────────┤
│ id (PK)          │         │ id (PK)          │
│ user_id (FK)     │         │ user_id (FK)     │
│ actor_id (FK)    │         │ token            │
│ type             │         │ platform         │
│ title            │         │ device_name      │
│ body             │         │ last_used_at     │
│ data (jsonb)     │         │ inserted_at      │
│ read_at          │         └──────────────────┘
│ group_key        │
│ count            │
│ inserted_at      │
└──────────────────┘
```

---

## Table Reference

### users

The central table. Everything revolves around users.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| email | varchar(255) | YES | | Email address (null for anonymous users) |
| username | varchar(30) | NO | | Unique username, lowercase alphanumeric + underscores |
| display_name | varchar(100) | YES | | Display name shown in UI |
| password_hash | varchar(255) | YES | | Bcrypt hash (null for wallet-only users) |
| avatar_url | text | YES | | URL to avatar image |
| bio | varchar(500) | YES | | User biography |
| is_anonymous | boolean | NO | false | True for wallet-only users |
| wallet_address | varchar(42) | YES | | Ethereum wallet address |
| wallet_pin_hash | varchar(255) | YES | | Bcrypt hash of PIN for wallet users |
| status | varchar(20) | NO | 'offline' | online, away, dnd, offline |
| premium_until | timestamptz | YES | | Premium subscription expiry |
| email_verified_at | timestamptz | YES | | When email was verified |
| inserted_at | timestamptz | NO | now() | Created timestamp |
| updated_at | timestamptz | NO | now() | Updated timestamp |

**Constraints:**
- `users_pkey` PRIMARY KEY (id)
- `users_email_index` UNIQUE (email) WHERE email IS NOT NULL
- `users_username_index` UNIQUE (lower(username))
- `users_wallet_address_index` UNIQUE (wallet_address) WHERE wallet_address IS NOT NULL

**Notes:**
- We allow NULL email for anonymous/wallet users
- Username is case-insensitive (stored lowercase)
- Password can be null if using wallet auth exclusively

---

### friendships

Bidirectional friend relationships with status tracking.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| user_id | uuid | NO | | The user who initiated |
| friend_id | uuid | NO | | The target user |
| status | varchar(20) | NO | 'pending' | pending, accepted, declined, blocked |
| inserted_at | timestamptz | NO | now() | When request was sent |
| updated_at | timestamptz | NO | now() | Last status change |

**Constraints:**
- `friendships_pkey` PRIMARY KEY (id)
- `friendships_user_id_fkey` FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
- `friendships_friend_id_fkey` FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE
- `friendships_unique_pair` UNIQUE (user_id, friend_id)
- `friendships_no_self_friend` CHECK (user_id != friend_id)

**Notes:**
- We only store one row per friendship (user_id < friend_id by convention)
- Status 'blocked' means user_id blocked friend_id
- Query both directions when checking friendship status

---

### conversations

Container for direct messages (1:1 or group DMs).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| type | varchar(20) | NO | 'direct' | direct, group |
| name | varchar(100) | YES | | Name for group DMs |
| last_message_at | timestamptz | YES | | For sorting conversations |
| inserted_at | timestamptz | NO | now() | Created timestamp |

**Notes:**
- For 1:1, we reuse the same conversation if it exists
- Group DMs are different from server channels

---

### conversation_participants

Join table between users and conversations.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| conversation_id | uuid | NO | | FK to conversations |
| user_id | uuid | NO | | FK to users |
| joined_at | timestamptz | NO | now() | When user joined |
| last_read_at | timestamptz | YES | | Last message read timestamp |
| unread_count | integer | NO | 0 | Cached unread count |
| muted | boolean | NO | false | Notifications muted |

**Constraints:**
- Unique on (conversation_id, user_id)
- unread_count >= 0

---

### messages

Direct messages within conversations.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| conversation_id | uuid | NO | | FK to conversations |
| sender_id | uuid | NO | | FK to users |
| content | text | NO | | Message content (may be encrypted) |
| encrypted | boolean | NO | false | Whether content is E2EE |
| reply_to_id | uuid | YES | | FK to messages (threading) |
| edited_at | timestamptz | YES | | When last edited |
| deleted_at | timestamptz | YES | | Soft delete timestamp |
| expires_at | timestamptz | YES | | For disappearing messages |
| inserted_at | timestamptz | NO | now() | Sent timestamp |

**Indexes:**
- `messages_conversation_id_inserted_at_index` (conversation_id, inserted_at DESC)
- `messages_sender_id_index` (sender_id)

---

### groups

Discord-style servers with channels.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| name | varchar(100) | NO | | Server name |
| description | text | YES | | Server description |
| icon_url | text | YES | | Server icon |
| banner_url | text | YES | | Server banner |
| owner_id | uuid | NO | | FK to users |
| is_public | boolean | NO | false | Discoverable in search |
| member_count | integer | NO | 1 | Cached member count |
| inserted_at | timestamptz | NO | now() | Created timestamp |

---

### channels

Text and voice channels within groups.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| group_id | uuid | NO | | FK to groups |
| category_id | uuid | YES | | FK to channel_categories |
| name | varchar(100) | NO | | Channel name |
| type | varchar(20) | NO | 'text' | text, voice, announcement |
| topic | varchar(500) | YES | | Channel topic/description |
| position | integer | NO | 0 | Sort order |
| slowmode_seconds | integer | NO | 0 | Rate limit per user |
| nsfw | boolean | NO | false | Age-restricted content |
| inserted_at | timestamptz | NO | now() | Created timestamp |

---

### forums

Reddit-style communities.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| name | varchar(100) | NO | | Forum name |
| slug | varchar(100) | NO | | URL-safe identifier |
| description | text | YES | | Forum description |
| icon_url | text | YES | | Forum icon |
| banner_url | text | YES | | Forum banner |
| custom_css | text | YES | | Custom CSS (premium) |
| owner_id | uuid | NO | | FK to users |
| is_public | boolean | NO | true | Visible in listings |
| is_nsfw | boolean | NO | false | Adult content |
| subscriber_count | integer | NO | 0 | Cached subscriber count |
| inserted_at | timestamptz | NO | now() | Created timestamp |

**Constraints:**
- `forums_slug_index` UNIQUE (lower(slug))

---

### posts

Forum posts/threads.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| forum_id | uuid | NO | | FK to forums |
| author_id | uuid | NO | | FK to users |
| category_id | uuid | YES | | FK to forum_categories |
| title | varchar(300) | NO | | Post title |
| content | text | NO | | Post content (Markdown/BBCode) |
| content_format | varchar(20) | NO | 'markdown' | markdown, bbcode, plain |
| score | integer | NO | 0 | Upvotes - downvotes |
| comment_count | integer | NO | 0 | Cached comment count |
| view_count | integer | NO | 0 | View counter |
| is_pinned | boolean | NO | false | Pinned to top |
| is_locked | boolean | NO | false | Comments disabled |
| deleted_at | timestamptz | YES | | Soft delete |
| inserted_at | timestamptz | NO | now() | Posted timestamp |

**Indexes:**
- `posts_forum_id_score_index` (forum_id, score DESC) – for "hot" sorting
- `posts_forum_id_inserted_at_index` (forum_id, inserted_at DESC) – for "new"
- `posts_author_id_index` (author_id) – for user profile

---

### notifications

User notifications with grouping support.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| user_id | uuid | NO | | FK to users (recipient) |
| actor_id | uuid | YES | | FK to users (who triggered) |
| type | varchar(50) | NO | | Notification type enum |
| title | varchar(255) | NO | | Notification title |
| body | text | YES | | Notification body |
| data | jsonb | YES | {} | Additional context |
| read_at | timestamptz | YES | | When marked as read |
| clicked_at | timestamptz | YES | | When clicked (analytics) |
| group_key | varchar(100) | YES | | For grouping similar notifications |
| count | integer | NO | 1 | Grouped notification count |
| inserted_at | timestamptz | NO | now() | Created timestamp |

**Indexes:**
- `notifications_user_id_inserted_at_index` (user_id, inserted_at DESC)
- `notifications_user_id_read_at_index` (user_id) WHERE read_at IS NULL
- `notifications_group_key_index` (user_id, group_key) WHERE read_at IS NULL

---

## Index Strategy

We've learned the hard way that indexes can make or break performance. Here's our philosophy:

### Primary Access Patterns

| Query Pattern | Index | Why |
|---------------|-------|-----|
| Get user by email | `users_email_index` | Login lookups |
| Get user by username | `users_username_index` | Profile lookups |
| List messages in conversation | `messages_conversation_id_inserted_at_index` | Most common query |
| Get unread count | Stored in `conversation_participants` | Avoid COUNT(*) |
| Hot posts in forum | `posts_forum_id_score_index` | Sorted by score |
| New posts in forum | `posts_forum_id_inserted_at_index` | Sorted by date |
| User's notifications | `notifications_user_id_inserted_at_index` | Notification bell |

### Indexes We Considered But Didn't Add

| Pattern | Why Not |
|---------|---------|
| Full-text search on messages | Use pg_trgm + GIN instead |
| Index on message content | Too large, search is rare |
| Composite on all post columns | Maintenance overhead |

### Partial Indexes (Our Secret Weapon)

```sql
-- Only index unread notifications (90% are read)
CREATE INDEX notifications_unread_index 
ON notifications(user_id, inserted_at) 
WHERE read_at IS NULL;

-- Only index active users (many accounts are dormant)
CREATE INDEX users_active_index 
ON users(last_seen_at) 
WHERE last_seen_at > now() - interval '30 days';

-- Only index non-deleted messages
CREATE INDEX messages_active_index 
ON messages(conversation_id, inserted_at) 
WHERE deleted_at IS NULL;
```

---

## Migration Guide

### Running Migrations

```bash
# Development
cd apps/backend
mix ecto.migrate

# Check pending migrations
mix ecto.migrations

# Rollback one migration
mix ecto.rollback

# Rollback to specific version
mix ecto.rollback --to 20240101000000
```

### Production Migration Strategy

We use **zero-downtime migrations**. Here's the process:

1. **Deploy code that works with both old and new schema**
2. **Run migration**
3. **Deploy code that uses new schema**
4. **Clean up any backward-compatibility code**

Example: Adding a new column

```elixir
# Step 1: Add column as nullable
def change do
  alter table(:users) do
    add :phone_number, :string  # nullable by default
  end
end

# Step 2: Deploy code that writes to new column
# Step 3: Backfill existing rows
# Step 4: Add NOT NULL constraint (separate migration)
```

### Dangerous Operations to Avoid

❌ **Never do these in production:**

```elixir
# Adding NOT NULL column without default
add :required_field, :string, null: false  # 💥 Fails on existing rows

# Renaming columns
rename table(:users), :name, to: :display_name  # 💥 Breaks running code

# Changing column type destructively
modify :age, :integer  # (was :string) 💥 Data loss

# Adding index without CONCURRENTLY
create index(:messages, [:content])  # 💥 Locks table
```

✅ **Safe alternatives:**

```elixir
# Add column as nullable, backfill, then add constraint
add :required_field, :string
# ... deploy, backfill ...
alter table(:users) do
  modify :required_field, :string, null: false
end

# Add new column instead of renaming
add :display_name, :string
# ... migrate data in code, remove old column later ...

# Use CONCURRENTLY for indexes
execute "CREATE INDEX CONCURRENTLY messages_content_idx ON messages(content)"
```

---

## Backup and Recovery

### Automated Backups

Fly.io handles daily backups automatically, but we also run our own:

```bash
# Daily backup script (runs at 3 AM UTC via cron)
#!/bin/bash
set -e

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="cgraph_backup_${DATE}.sql.gz"

# Dump and compress
pg_dump $DATABASE_URL | gzip > /tmp/$BACKUP_FILE

# Upload to R2
aws s3 cp /tmp/$BACKUP_FILE s3://cgraph-backups/$BACKUP_FILE \
  --endpoint-url $R2_ENDPOINT

# Keep last 30 days locally
find /var/backups -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE"
```

### Restoration Process

```bash
# 1. Download backup
aws s3 cp s3://cgraph-backups/cgraph_backup_20240115.sql.gz ./

# 2. Stop application (or use read replica)
fly machines stop

# 3. Restore
gunzip -c cgraph_backup_20240115.sql.gz | psql $DATABASE_URL

# 4. Restart application
fly machines start
```

### Point-in-Time Recovery

Fly Postgres supports PITR for the last 7 days:

```bash
# Restore to specific timestamp
fly postgres restore --time "2024-01-15T14:30:00Z"
```

### Testing Backups

We test backup restoration monthly. Nothing worse than finding out your backups don't work when you need them!

```bash
# Monthly backup test (automated)
1. Spin up temporary Postgres instance
2. Restore latest backup
3. Run sanity checks (row counts, recent data)
4. Destroy temporary instance
5. Alert if anything fails
```

---

## Query Optimization

### Queries We've Optimized

#### 1. Getting Unread Message Count

**Before (slow):**
```sql
SELECT COUNT(*) 
FROM messages m
JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
WHERE cp.user_id = $1 
  AND m.inserted_at > cp.last_read_at;

-- 250ms at 100K messages 😱
```

**After (fast):**
```sql
-- We cache unread_count in conversation_participants
SELECT SUM(unread_count) 
FROM conversation_participants 
WHERE user_id = $1;

-- 2ms regardless of message count 🚀
```

#### 2. Hot Posts Algorithm

```sql
-- Reddit-style "hot" ranking
SELECT p.*, 
  -- Score decay over time (half-life of 12 hours)
  p.score / POWER(2, EXTRACT(EPOCH FROM (now() - p.inserted_at)) / 43200) 
    AS hot_score
FROM posts p
WHERE p.forum_id = $1
ORDER BY hot_score DESC
LIMIT 25;

-- With proper indexing: 15ms
```

#### 3. Friend Suggestions

```sql
-- Find users with mutual friends
SELECT u.*, COUNT(*) as mutual_count
FROM users u
JOIN friendships f1 ON f1.friend_id = u.id AND f1.status = 'accepted'
JOIN friendships f2 ON f2.user_id = f1.user_id AND f2.status = 'accepted'
WHERE f2.friend_id = $1  -- Current user
  AND u.id != $1
  AND NOT EXISTS (
    SELECT 1 FROM friendships 
    WHERE user_id = $1 AND friend_id = u.id
  )
GROUP BY u.id
ORDER BY mutual_count DESC
LIMIT 10;
```

### Using EXPLAIN ANALYZE

When in doubt, `EXPLAIN ANALYZE`:

```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM messages 
WHERE conversation_id = 'abc-123' 
ORDER BY inserted_at DESC 
LIMIT 50;

-- Look for:
-- ✅ Index Scan (good)
-- ❌ Seq Scan on large tables (bad)
-- ❌ High "actual time" values
-- ❌ Many buffer hits/misses
```

---

## Data Retention

### What We Keep and For How Long

| Data Type | Retention | Reasoning |
|-----------|-----------|-----------|
| User accounts | Forever | Needed for attribution |
| Messages | Forever* | Users expect history |
| Deleted messages | 30 days | Compliance, undo window |
| Notifications | 90 days | After that, who cares? |
| Session tokens | 30 days | Security |
| Audit logs | 1 year | Compliance |
| Analytics events | 90 days | Storage costs |

*Messages can be deleted by users; we soft-delete with 30-day hard delete.

### Automated Cleanup Jobs

```elixir
# Runs nightly via Oban cron
defmodule CGraph.Workers.DataRetention do
  use Oban.Worker
  
  @impl true
  def perform(_job) do
    # Hard delete soft-deleted messages older than 30 days
    Repo.delete_all(
      from m in Message,
      where: m.deleted_at < ago(30, "day")
    )
    
    # Delete old notifications
    Repo.delete_all(
      from n in Notification,
      where: n.inserted_at < ago(90, "day"),
      where: not is_nil(n.read_at)
    )
    
    # Delete expired sessions
    Repo.delete_all(
      from s in Session,
      where: s.expires_at < ^DateTime.utc_now()
    )
    
    :ok
  end
end
```

### GDPR Compliance

When a user requests data deletion:

```elixir
def delete_user_data(user) do
  Repo.transaction(fn ->
    # 1. Delete personal content
    delete_user_messages(user)
    delete_user_posts(user)
    delete_user_comments(user)
    
    # 2. Anonymize non-deletable references
    # (e.g., reactions, votes - we keep for integrity but remove user link)
    anonymize_user_reactions(user)
    
    # 3. Delete account
    Repo.delete!(user)
    
    # 4. Log for compliance
    AuditLog.record(:gdpr_deletion, user.id)
  end)
end
```

---

## Database Seeding

For development, we have realistic seed data:

```bash
# Seed development database
mix run priv/repo/seeds.exs
```

The seeds create:
- 50 users with realistic profiles
- 200 friendships
- 10 groups with channels
- 5 forums with posts and comments
- 1000+ messages across conversations

```elixir
# priv/repo/seeds.exs (excerpt)
defmodule Seeds do
  def run do
    # Create users
    users = for i <- 1..50 do
      %User{}
      |> User.changeset(%{
        email: "user#{i}@example.com",
        username: "user_#{i}",
        display_name: Faker.Person.name(),
        password: "password123"
      })
      |> Repo.insert!()
    end
    
    # Create friendships (randomly pair users)
    users
    |> Enum.shuffle()
    |> Enum.chunk_every(2)
    |> Enum.each(fn [a, b] ->
      Friends.send_request(a, b)
      Friends.accept_request(b, a)
    end)
    
    # ... more seeding
  end
end
```

---

## Questions?

Database questions → @marcus or #backend Slack channel

Common issues:
- "Why is this query slow?" → Check EXPLAIN ANALYZE first
- "Should I add an index?" → Probably yes, but profile first
- "Can I change this column type?" → Ask in #backend, migrations are tricky

---

*Last major update: December 2024. If the ERD looks wrong, someone forgot to update this doc.*
