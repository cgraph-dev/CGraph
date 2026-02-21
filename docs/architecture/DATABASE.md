# CGraph Database Documentation

> Version 0.9.36 | Last updated: February 21, 2026  
> Schema modifications require updating this documentation.

---

## Table of Contents

1. [Entity-Relationship Diagram](#entity-relationship-diagram)
2. [Table Reference](#table-reference)
3. [New Tables (v0.7.56)](#new-tables-v0756)
4. [Index Strategy](#index-strategy)
5. [Migration Guide](#migration-guide)
6. [Backup and Recovery](#backup-and-recovery)
7. [Query Optimization](#query-optimization)
8. [Data Retention](#data-retention)

---

## Entity-Relationship Diagram

Full schema diagram:

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
    │ is_profile_private │       │  ← v0.7.32 (Privacy)
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

## New Tables (v0.7.56)

### Private Messaging System

#### pm_folders

User-created folders for organizing private messages.

| Column      | Type        | Nullable | Default           | Description                      |
| ----------- | ----------- | -------- | ----------------- | -------------------------------- |
| id          | uuid        | NO       | gen_random_uuid() | Primary key                      |
| user_id     | uuid        | NO       |                   | FK to users                      |
| name        | varchar     | NO       |                   | Folder name                      |
| color       | varchar     | YES      | #6366f1           | Folder color                     |
| icon        | varchar     | YES      |                   | Folder icon                      |
| is_system   | boolean     | NO       | false             | System folder (Inbox, Sent, etc) |
| order       | integer     | NO       | 0                 | Sort order                       |
| inserted_at | timestamptz | NO       | now()             | Created timestamp                |
| updated_at  | timestamptz | NO       | now()             | Updated timestamp                |

**Indexes:**

- `pm_folders_user_id_index` (user_id)
- `pm_folders_user_id_name_index` UNIQUE (user_id, name)

---

#### private_messages

Private messages between users.

| Column       | Type        | Nullable | Default           | Description            |
| ------------ | ----------- | -------- | ----------------- | ---------------------- |
| id           | uuid        | NO       | gen_random_uuid() | Primary key            |
| sender_id    | uuid        | NO       |                   | FK to users            |
| recipient_id | uuid        | NO       |                   | FK to users            |
| folder_id    | uuid        | YES      |                   | FK to pm_folders       |
| subject      | varchar     | YES      |                   | Message subject        |
| content      | text        | NO       |                   | Message body           |
| is_read      | boolean     | NO       | false             | Read status            |
| read_at      | timestamptz | YES      |                   | When read              |
| is_starred   | boolean     | NO       | false             | Starred flag           |
| is_important | boolean     | NO       | false             | Important flag         |
| reply_to_id  | uuid        | YES      |                   | FK to private_messages |
| inserted_at  | timestamptz | NO       | now()             | Created timestamp      |
| updated_at   | timestamptz | NO       | now()             | Updated timestamp      |

**Indexes:**

- `private_messages_sender_id_index` (sender_id)
- `private_messages_recipient_id_index` (recipient_id)
- `private_messages_folder_id_index` (folder_id)
- `private_messages_recipient_id_is_read_index` (recipient_id, is_read)
- `private_messages_inserted_at_index` (inserted_at)

---

#### pm_drafts

Saved message drafts.

| Column       | Type        | Nullable | Default           | Description       |
| ------------ | ----------- | -------- | ----------------- | ----------------- |
| id           | uuid        | NO       | gen_random_uuid() | Primary key       |
| sender_id    | uuid        | NO       |                   | FK to users       |
| recipient_id | uuid        | YES      |                   | FK to users       |
| subject      | varchar     | YES      |                   | Draft subject     |
| content      | text        | NO       |                   | Draft body        |
| inserted_at  | timestamptz | NO       | now()             | Created timestamp |
| updated_at   | timestamptz | NO       | now()             | Updated timestamp |

**Indexes:**

- `pm_drafts_sender_id_index` (sender_id)

---

### Calendar System

#### calendar_event_categories

Categories for organizing events.

| Column      | Type        | Nullable | Default           | Description          |
| ----------- | ----------- | -------- | ----------------- | -------------------- |
| id          | uuid        | NO       | gen_random_uuid() | Primary key          |
| name        | varchar     | NO       |                   | Category name        |
| description | text        | YES      |                   | Category description |
| color       | varchar     | YES      | #6366f1           | Category color       |
| icon        | varchar     | YES      |                   | Category icon        |
| order       | integer     | NO       | 0                 | Sort order           |
| inserted_at | timestamptz | NO       | now()             | Created timestamp    |
| updated_at  | timestamptz | NO       | now()             | Updated timestamp    |

**Indexes:**

- `calendar_event_categories_name_index` UNIQUE (name)

---

#### calendar_events

Calendar events with full metadata.

| Column              | Type        | Nullable | Default           | Description                     |
| ------------------- | ----------- | -------- | ----------------- | ------------------------------- |
| id                  | uuid        | NO       | gen_random_uuid() | Primary key                     |
| author_id           | uuid        | NO       |                   | FK to users                     |
| category_id         | uuid        | YES      |                   | FK to calendar_event_categories |
| forum_id            | uuid        | YES      |                   | FK to forums                    |
| title               | varchar     | NO       |                   | Event title                     |
| description         | text        | YES      |                   | Event description               |
| start_date          | timestamptz | NO       |                   | Event start                     |
| end_date            | timestamptz | YES      |                   | Event end                       |
| all_day             | boolean     | NO       | false             | All-day event                   |
| timezone            | varchar     | NO       | UTC               | Event timezone                  |
| event_type          | varchar     | NO       | single            | single, recurring               |
| is_recurring        | boolean     | NO       | false             | Recurring flag                  |
| recurrence_pattern  | jsonb       | YES      |                   | Recurrence rules                |
| recurrence_end_date | timestamptz | YES      |                   | Recurrence end                  |
| location            | varchar     | YES      |                   | Event location                  |
| location_url        | varchar     | YES      |                   | Location URL                    |
| visibility          | varchar     | NO       | public            | public, private, forum          |
| rsvp_enabled        | boolean     | NO       | false             | Allow RSVPs                     |
| rsvp_deadline       | timestamptz | YES      |                   | RSVP cutoff                     |
| max_attendees       | integer     | YES      |                   | Attendee limit                  |
| inserted_at         | timestamptz | NO       | now()             | Created timestamp               |
| updated_at          | timestamptz | NO       | now()             | Updated timestamp               |

**Indexes:**

- `calendar_events_author_id_index` (author_id)
- `calendar_events_category_id_index` (category_id)
- `calendar_events_forum_id_index` (forum_id)
- `calendar_events_start_date_index` (start_date)
- `calendar_events_visibility_index` (visibility)
- `calendar_events_start_date_end_date_index` (start_date, end_date)

---

#### calendar_event_rsvps

RSVP responses to events.

| Column      | Type        | Nullable | Default           | Description             |
| ----------- | ----------- | -------- | ----------------- | ----------------------- |
| id          | uuid        | NO       | gen_random_uuid() | Primary key             |
| event_id    | uuid        | NO       |                   | FK to calendar_events   |
| user_id     | uuid        | NO       |                   | FK to users             |
| status      | varchar     | NO       | going             | going, maybe, not_going |
| note        | varchar     | YES      |                   | RSVP note               |
| inserted_at | timestamptz | NO       | now()             | Created timestamp       |
| updated_at  | timestamptz | NO       | now()             | Updated timestamp       |

**Indexes:**

- `calendar_event_rsvps_event_id_index` (event_id)
- `calendar_event_rsvps_user_id_index` (user_id)
- `calendar_event_rsvps_event_id_user_id_index` UNIQUE (event_id, user_id)

---

### Referral System

#### referral_codes

User referral codes.

| Column      | Type        | Nullable | Default           | Description          |
| ----------- | ----------- | -------- | ----------------- | -------------------- |
| id          | uuid        | NO       | gen_random_uuid() | Primary key          |
| user_id     | uuid        | NO       |                   | FK to users (unique) |
| code        | varchar     | NO       |                   | Unique referral code |
| uses        | integer     | NO       | 0                 | Times used           |
| is_active   | boolean     | NO       | true              | Code is active       |
| inserted_at | timestamptz | NO       | now()             | Created timestamp    |
| updated_at  | timestamptz | NO       | now()             | Updated timestamp    |

**Indexes:**

- `referral_codes_code_index` UNIQUE (code)
- `referral_codes_user_id_index` UNIQUE (user_id)

---

#### referrals

Tracking who referred whom.

| Column      | Type        | Nullable | Default           | Description                  |
| ----------- | ----------- | -------- | ----------------- | ---------------------------- |
| id          | uuid        | NO       | gen_random_uuid() | Primary key                  |
| referrer_id | uuid        | NO       |                   | FK to users (referrer)       |
| referred_id | uuid        | NO       |                   | FK to users (new user)       |
| status      | varchar     | NO       | pending           | pending, confirmed, rewarded |
| rewarded_at | timestamptz | YES      |                   | When reward given            |
| inserted_at | timestamptz | NO       | now()             | Created timestamp            |
| updated_at  | timestamptz | NO       | now()             | Updated timestamp            |

**Indexes:**

- `referrals_referrer_id_index` (referrer_id)
- `referrals_referred_id_index` UNIQUE (referred_id)
- `referrals_status_index` (status)
- `referrals_inserted_at_index` (inserted_at)

---

#### referral_reward_tiers

Reward levels for referrals.

| Column             | Type        | Nullable | Default           | Description                     |
| ------------------ | ----------- | -------- | ----------------- | ------------------------------- |
| id                 | uuid        | NO       | gen_random_uuid() | Primary key                     |
| name               | varchar     | NO       |                   | Tier name (Bronze, Silver, etc) |
| description        | text        | YES      |                   | Tier description                |
| required_referrals | integer     | NO       |                   | Referrals needed                |
| reward_type        | varchar     | NO       |                   | badge, title, custom            |
| reward_value       | jsonb       | YES      |                   | Reward configuration            |
| icon               | varchar     | YES      |                   | Tier icon                       |
| order              | integer     | NO       | 0                 | Display order                   |
| inserted_at        | timestamptz | NO       | now()             | Created timestamp               |
| updated_at         | timestamptz | NO       | now()             | Updated timestamp               |

**Default Tiers (seeded):** | Name | Required | Reward | Icon | |------|----------|--------|------|
| Bronze Recruiter | 5 | badge | 🥉 | | Silver Recruiter | 10 | badge | 🥈 | | Gold Recruiter | 25 |
badge | 🥇 | | Diamond Recruiter | 50 | title | 💎 | | Legendary Recruiter | 100 | custom | 👑 |

---

#### referral_rewards

Claimed rewards by users.

| Column      | Type        | Nullable | Default           | Description                 |
| ----------- | ----------- | -------- | ----------------- | --------------------------- |
| id          | uuid        | NO       | gen_random_uuid() | Primary key                 |
| user_id     | uuid        | NO       |                   | FK to users                 |
| tier_id     | uuid        | NO       |                   | FK to referral_reward_tiers |
| status      | varchar     | NO       | claimed           | Reward status               |
| inserted_at | timestamptz | NO       | now()             | Created timestamp           |
| updated_at  | timestamptz | NO       | now()             | Updated timestamp           |

**Indexes:**

- `referral_rewards_user_id_index` (user_id)
- `referral_rewards_user_id_tier_id_index` UNIQUE (user_id, tier_id)

---

### Announcement System

#### announcement_dismissals

Tracks which users dismissed which announcements.

| Column          | Type        | Nullable | Default           | Description               |
| --------------- | ----------- | -------- | ----------------- | ------------------------- |
| id              | uuid        | NO       | gen_random_uuid() | Primary key               |
| user_id         | uuid        | NO       |                   | FK to users               |
| announcement_id | uuid        | NO       |                   | FK to forum_announcements |
| dismissed_at    | timestamptz | NO       | now()             | When dismissed            |
| inserted_at     | timestamptz | NO       | now()             | Created timestamp         |
| updated_at      | timestamptz | NO       | now()             | Updated timestamp         |

**Indexes:**

- `announcement_dismissals_user_id_index` (user_id)
- `announcement_dismissals_announcement_id_index` (announcement_id)
- `announcement_dismissals_user_id_announcement_id_index` UNIQUE (user_id, announcement_id)

---

### Reputation System Updates

#### reputation_entries (existing table - new indexes)

Added indexes for better query performance:

- `reputation_entries_from_user_id_index` (from_user_id)
- `reputation_entries_to_user_id_index` (to_user_id)
- `reputation_entries_post_id_index` (post_id)
- `reputation_entries_inserted_at_index` (inserted_at)

#### users (column addition)

| Column     | Type    | Nullable | Default | Description             |
| ---------- | ------- | -------- | ------- | ----------------------- |
| reputation | integer | NO       | 0       | Cached reputation total |

**New Index:**

- `users_reputation_index` (reputation)

---

## Table Reference

### users

The central table. Everything revolves around users.

| Column            | Type         | Nullable | Default           | Description                                           |
| ----------------- | ------------ | -------- | ----------------- | ----------------------------------------------------- |
| id                | uuid         | NO       | gen_random_uuid() | Primary key                                           |
| email             | varchar(255) | YES      |                   | Email address (null for anonymous users)              |
| username          | varchar(30)  | NO       |                   | Unique username, lowercase alphanumeric + underscores |
| display_name      | varchar(100) | YES      |                   | Display name shown in UI                              |
| password_hash     | varchar(255) | YES      |                   | Bcrypt hash (null for wallet-only users)              |
| avatar_url        | text         | YES      |                   | URL to avatar image                                   |
| bio               | varchar(500) | YES      |                   | User biography                                        |
| is_anonymous      | boolean      | NO       | false             | True for wallet-only users                            |
| wallet_address    | varchar(42)  | YES      |                   | Ethereum wallet address                               |
| wallet_pin_hash   | varchar(255) | YES      |                   | Bcrypt hash of PIN for wallet users                   |
| status            | varchar(20)  | NO       | 'offline'         | online, away, dnd, offline                            |
| premium_until     | timestamptz  | YES      |                   | Premium subscription expiry                           |
| email_verified_at | timestamptz  | YES      |                   | When email was verified                               |
| inserted_at       | timestamptz  | NO       | now()             | Created timestamp                                     |
| updated_at        | timestamptz  | NO       | now()             | Updated timestamp                                     |

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

| Column      | Type        | Nullable | Default           | Description                          |
| ----------- | ----------- | -------- | ----------------- | ------------------------------------ |
| id          | uuid        | NO       | gen_random_uuid() | Primary key                          |
| user_id     | uuid        | NO       |                   | The user who initiated               |
| friend_id   | uuid        | NO       |                   | The target user                      |
| status      | varchar(20) | NO       | 'pending'         | pending, accepted, declined, blocked |
| inserted_at | timestamptz | NO       | now()             | When request was sent                |
| updated_at  | timestamptz | NO       | now()             | Last status change                   |

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

| Column          | Type         | Nullable | Default           | Description               |
| --------------- | ------------ | -------- | ----------------- | ------------------------- |
| id              | uuid         | NO       | gen_random_uuid() | Primary key               |
| type            | varchar(20)  | NO       | 'direct'          | direct, group             |
| name            | varchar(100) | YES      |                   | Name for group DMs        |
| last_message_at | timestamptz  | YES      |                   | For sorting conversations |
| inserted_at     | timestamptz  | NO       | now()             | Created timestamp         |

**Notes:**

- For 1:1, we reuse the same conversation if it exists
- Group DMs are different from server channels

---

### conversation_participants

Join table between users and conversations.

| Column          | Type        | Nullable | Default           | Description                 |
| --------------- | ----------- | -------- | ----------------- | --------------------------- |
| id              | uuid        | NO       | gen_random_uuid() | Primary key                 |
| conversation_id | uuid        | NO       |                   | FK to conversations         |
| user_id         | uuid        | NO       |                   | FK to users                 |
| joined_at       | timestamptz | NO       | now()             | When user joined            |
| last_read_at    | timestamptz | YES      |                   | Last message read timestamp |
| unread_count    | integer     | NO       | 0                 | Cached unread count         |
| muted           | boolean     | NO       | false             | Notifications muted         |

**Constraints:**

- Unique on (conversation_id, user_id)
- unread_count >= 0

---

### messages

Direct messages within conversations.

| Column          | Type        | Nullable | Default           | Description                        |
| --------------- | ----------- | -------- | ----------------- | ---------------------------------- |
| id              | uuid        | NO       | gen_random_uuid() | Primary key                        |
| conversation_id | uuid        | NO       |                   | FK to conversations                |
| sender_id       | uuid        | NO       |                   | FK to users                        |
| content         | text        | NO       |                   | Message content (may be encrypted) |
| encrypted       | boolean     | NO       | false             | Whether content is E2EE            |
| reply_to_id     | uuid        | YES      |                   | FK to messages (threading)         |
| edited_at       | timestamptz | YES      |                   | When last edited                   |
| deleted_at      | timestamptz | YES      |                   | Soft delete timestamp              |
| expires_at      | timestamptz | YES      |                   | For disappearing messages          |
| inserted_at     | timestamptz | NO       | now()             | Sent timestamp                     |

**Indexes:**

- `messages_conversation_id_inserted_at_index` (conversation_id, inserted_at DESC)
- `messages_sender_id_index` (sender_id)

---

### groups

servers with channels.

| Column       | Type         | Nullable | Default           | Description            |
| ------------ | ------------ | -------- | ----------------- | ---------------------- |
| id           | uuid         | NO       | gen_random_uuid() | Primary key            |
| name         | varchar(100) | NO       |                   | Server name            |
| description  | text         | YES      |                   | Server description     |
| icon_url     | text         | YES      |                   | Server icon            |
| banner_url   | text         | YES      |                   | Server banner          |
| owner_id     | uuid         | NO       |                   | FK to users            |
| is_public    | boolean      | NO       | false             | Discoverable in search |
| member_count | integer      | NO       | 1                 | Cached member count    |
| inserted_at  | timestamptz  | NO       | now()             | Created timestamp      |

---

### channels

Text and voice channels within groups.

| Column           | Type         | Nullable | Default           | Description               |
| ---------------- | ------------ | -------- | ----------------- | ------------------------- |
| id               | uuid         | NO       | gen_random_uuid() | Primary key               |
| group_id         | uuid         | NO       |                   | FK to groups              |
| category_id      | uuid         | YES      |                   | FK to channel_categories  |
| name             | varchar(100) | NO       |                   | Channel name              |
| type             | varchar(20)  | NO       | 'text'            | text, voice, announcement |
| topic            | varchar(500) | YES      |                   | Channel topic/description |
| position         | integer      | NO       | 0                 | Sort order                |
| slowmode_seconds | integer      | NO       | 0                 | Rate limit per user       |
| nsfw             | boolean      | NO       | false             | Age-restricted content    |
| inserted_at      | timestamptz  | NO       | now()             | Created timestamp         |

---

### forums

communities.

| Column           | Type         | Nullable | Default           | Description             |
| ---------------- | ------------ | -------- | ----------------- | ----------------------- |
| id               | uuid         | NO       | gen_random_uuid() | Primary key             |
| name             | varchar(100) | NO       |                   | Forum name              |
| slug             | varchar(100) | NO       |                   | URL-safe identifier     |
| description      | text         | YES      |                   | Forum description       |
| icon_url         | text         | YES      |                   | Forum icon              |
| banner_url       | text         | YES      |                   | Forum banner            |
| custom_css       | text         | YES      |                   | Custom CSS (premium)    |
| owner_id         | uuid         | NO       |                   | FK to users             |
| is_public        | boolean      | NO       | true              | Visible in listings     |
| is_nsfw          | boolean      | NO       | false             | Adult content           |
| subscriber_count | integer      | NO       | 0                 | Cached subscriber count |
| inserted_at      | timestamptz  | NO       | now()             | Created timestamp       |

**Constraints:**

- `forums_slug_index` UNIQUE (lower(slug))

---

### posts

Forum posts/threads.

| Column         | Type         | Nullable | Default           | Description                    |
| -------------- | ------------ | -------- | ----------------- | ------------------------------ |
| id             | uuid         | NO       | gen_random_uuid() | Primary key                    |
| forum_id       | uuid         | NO       |                   | FK to forums                   |
| author_id      | uuid         | NO       |                   | FK to users                    |
| category_id    | uuid         | YES      |                   | FK to forum_categories         |
| title          | varchar(300) | NO       |                   | Post title                     |
| content        | text         | NO       |                   | Post content (Markdown/BBCode) |
| content_format | varchar(20)  | NO       | 'markdown'        | markdown, bbcode, plain        |
| score          | integer      | NO       | 0                 | Upvotes - downvotes            |
| comment_count  | integer      | NO       | 0                 | Cached comment count           |
| view_count     | integer      | NO       | 0                 | View counter                   |
| is_pinned      | boolean      | NO       | false             | Pinned to top                  |
| is_locked      | boolean      | NO       | false             | Comments disabled              |
| deleted_at     | timestamptz  | YES      |                   | Soft delete                    |
| inserted_at    | timestamptz  | NO       | now()             | Posted timestamp               |

**Indexes:**

- `posts_forum_id_score_index` (forum_id, score DESC) – for "hot" sorting
- `posts_forum_id_inserted_at_index` (forum_id, inserted_at DESC) – for "new"
- `posts_author_id_index` (author_id) – for user profile

---

### notifications

User notifications with grouping support.

| Column      | Type         | Nullable | Default           | Description                        |
| ----------- | ------------ | -------- | ----------------- | ---------------------------------- |
| id          | uuid         | NO       | gen_random_uuid() | Primary key                        |
| user_id     | uuid         | NO       |                   | FK to users (recipient)            |
| actor_id    | uuid         | YES      |                   | FK to users (who triggered)        |
| type        | varchar(50)  | NO       |                   | Notification type enum             |
| title       | varchar(255) | NO       |                   | Notification title                 |
| body        | text         | YES      |                   | Notification body                  |
| data        | jsonb        | YES      | {}                | Additional context                 |
| read_at     | timestamptz  | YES      |                   | When marked as read                |
| clicked_at  | timestamptz  | YES      |                   | When clicked (analytics)           |
| group_key   | varchar(100) | YES      |                   | For grouping similar notifications |
| count       | integer      | NO       | 1                 | Grouped notification count         |
| inserted_at | timestamptz  | NO       | now()             | Created timestamp                  |

**Indexes:**

- `notifications_user_id_inserted_at_index` (user_id, inserted_at DESC)
- `notifications_user_id_read_at_index` (user_id) WHERE read_at IS NULL
- `notifications_group_key_index` (user_id, group_key) WHERE read_at IS NULL

---

## Index Strategy

We've learned the hard way that indexes can make or break performance. Here's our philosophy:

### Primary Access Patterns

| Query Pattern                 | Index                                        | Why                    |
| ----------------------------- | -------------------------------------------- | ---------------------- |
| Get user by email             | `users_email_index`                          | Login lookups          |
| Get user by username          | `users_username_index`                       | Profile lookups        |
| List messages in conversation | `messages_conversation_id_inserted_at_index` | Most common query      |
| Get unread count              | Stored in `conversation_participants`        | Avoid COUNT(\*)        |
| Hot posts in forum            | `posts_forum_id_score_index`                 | Sorted by score        |
| New posts in forum            | `posts_forum_id_inserted_at_index`           | Sorted by date         |
| User's notifications          | `notifications_user_id_inserted_at_index`    | Notification bell      |
| Coin transaction history      | `coin_transactions_user_inserted_index`      | Gamification (v0.7.47) |
| 2FA rate limiting             | `two_factor_attempts_user_time_index`        | Security (v0.7.47)     |

### Security & Performance Indexes (v0.7.47)

Added in migration `20260111120000_add_comprehensive_security_indexes.exs`:

| Index                                        | Table               | Purpose                              |
| -------------------------------------------- | ------------------- | ------------------------------------ |
| `coin_transactions_user_inserted_index`      | coin_transactions   | Optimize user's coin history queries |
| `two_factor_attempts_user_time_index`        | two_factor_attempts | 2FA rate limiting lookups            |
| `users_subscription_expiry_partial_index`    | users               | Active premium user queries          |
| `messages_conversation_time_index`           | messages            | Message history pagination           |
| `channel_messages_channel_time_index`        | channel_messages    | Channel message history              |
| `friendships_pending_receiver_partial_index` | friendships         | Pending friend request list          |
| `notifications_unread_partial_index`         | notifications       | Unread notification badge            |
| `sessions_active_token_partial_index`        | sessions            | Session token validation             |

### Indexes We Considered But Didn't Add

| Pattern                       | Why Not                   |
| ----------------------------- | ------------------------- |
| Full-text search on messages  | Use pg_trgm + GIN instead |
| Index on message content      | Too large, search is rare |
| Composite on all post columns | Maintenance overhead      |

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

We test backup restoration monthly. Nothing worse than finding out your backups don't work when you
need them!

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
--  "hot" ranking
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

| Data Type        | Retention | Reasoning               |
| ---------------- | --------- | ----------------------- |
| User accounts    | Forever   | Needed for attribution  |
| Messages         | Forever\* | Users expect history    |
| Deleted messages | 30 days   | Compliance, undo window |
| Notifications    | 90 days   | After that, who cares?  |
| Session tokens   | 30 days   | Security                |
| Audit logs       | 1 year    | Compliance              |
| Analytics events | 90 days   | Storage costs           |

\*Messages can be deleted by users; we soft-delete with 30-day hard delete.

### Automated Cleanup Jobs

```elixir
# lib/cgraph/cron/cleanup.ex
# Runs nightly at 3 AM UTC via Oban
def cleanup_old_data do
  # ... implementation
end
```

## 8. Moderation System (v0.7.32)

See `apps/backend/priv/repo/migrations/20260105000001_create_moderation_tables.exs`.

**`reports`** table:

- `id` (PK, uuid)
- `reporter_id` (FK -> users)
- `target_type` (enum: user, message, group, forum, post, comment)
- `target_id` (uuid)
- `category` (enum: spam, harassment, hate_speech, etc.)
- `status` (enum: pending, reviewing, resolved, dismissed)
- `priority` (enum: critical, high, normal, low)

**`user_restrictions`** table:

- `user_id` (FK -> users)
- `type` (enum: suspended, banned)
- `reason` (text)
- `expires_at` (timestamp, null = permanent)

## 9. Messages Updates (v0.7.32)

Added fields to `messages` table:

- `is_pinned` (boolean)
- `pinned_at` (timestamp)
- `pinned_by_id` (FK -> users)
- `client_message_id` (string, unique per conversation/channel for idempotency)

### Cleanup Implementation

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

_Last major update: January 2026. If the ERD looks wrong, someone forgot to update this doc._
