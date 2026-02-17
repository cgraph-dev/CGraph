# Database Schema Ownership

> **Version: 0.9.31** | Last Updated: January 2026

This document defines ownership and responsibility for all database tables in CGraph.

---

## Ownership Matrix

### Legend

| Symbol | Meaning                                       |
| ------ | --------------------------------------------- |
| 🔴     | Critical - Requires senior review for changes |
| 🟡     | Important - Requires team review              |
| 🟢     | Standard - Normal review process              |

---

## Core User Tables

| Table             | Owner Team     | Priority | Notes                       |
| ----------------- | -------------- | -------- | --------------------------- |
| `users`           | @backend-team  | 🔴       | Core identity, never delete |
| `user_profiles`   | @backend-team  | 🟡       | Extended user info          |
| `user_settings`   | @backend-team  | 🟢       | Preferences                 |
| `sessions`        | @security-team | 🔴       | Auth sessions               |
| `oauth_accounts`  | @security-team | 🔴       | OAuth provider links        |
| `two_factor_auth` | @security-team | 🔴       | 2FA configuration           |
| `user_devices`    | @security-team | 🟡       | Device tracking             |

---

## Authentication & Security

| Table                       | Owner Team     | Priority | Notes                |
| --------------------------- | -------------- | -------- | -------------------- |
| `api_tokens`                | @security-team | 🔴       | API access tokens    |
| `refresh_tokens`            | @security-team | 🔴       | JWT refresh tokens   |
| `password_reset_tokens`     | @security-team | 🔴       | Password resets      |
| `email_verification_tokens` | @security-team | 🟡       | Email verification   |
| `audit_logs`                | @security-team | 🔴       | Security audit trail |
| `blocked_ips`               | @security-team | 🟡       | IP blocklist         |

---

## E2EE & Encryption

| Table              | Owner Team     | Priority | Notes                     |
| ------------------ | -------------- | -------- | ------------------------- |
| `identity_keys`    | @security-team | 🔴       | P-256 ECDSA identity keys |
| `signed_prekeys`   | @security-team | 🔴       | Signed pre-keys           |
| `one_time_prekeys` | @security-team | 🔴       | Kyber + ECDH pre-keys     |
| `sessions_e2ee`    | @security-team | 🔴       | Triple Ratchet sessions   |

**⚠️ WARNING**: These tables store public keys only. Private keys NEVER leave the client.

---

## Messaging

| Table                       | Owner Team    | Priority | Notes                  |
| --------------------------- | ------------- | -------- | ---------------------- |
| `conversations`             | @backend-team | 🟡       | DM conversations       |
| `conversation_participants` | @backend-team | 🟡       | Conversation members   |
| `messages`                  | @backend-team | 🔴       | Encrypted messages     |
| `message_reactions`         | @backend-team | 🟢       | Emoji reactions        |
| `message_attachments`       | @backend-team | 🟡       | File attachments       |
| `typing_indicators`         | @backend-team | 🟢       | Ephemeral typing state |
| `read_receipts`             | @backend-team | 🟢       | Message read status    |

---

## Servers & Channels

| Table                | Owner Team    | Priority | Notes                      |
| -------------------- | ------------- | -------- | -------------------------- |
| `servers`            | @backend-team | 🟡       | Server (guild) definitions |
| `channels`           | @backend-team | 🟡       | Channel definitions        |
| `channel_categories` | @backend-team | 🟢       | Channel groupings          |
| `server_members`     | @backend-team | 🟡       | Server membership          |
| `roles`              | @backend-team | 🟡       | Permission roles           |
| `role_permissions`   | @backend-team | 🟡       | Granular permissions       |
| `server_invites`     | @backend-team | 🟢       | Invite links               |
| `server_bans`        | @backend-team | 🟡       | Ban records                |

---

## Forums

| Table                  | Owner Team    | Priority | Notes                |
| ---------------------- | ------------- | -------- | -------------------- |
| `forums`               | @backend-team | 🟡       | Forum definitions    |
| `posts`                | @backend-team | 🟡       | Forum posts          |
| `comments`             | @backend-team | 🟢       | Post comments        |
| `post_votes`           | @backend-team | 🟢       | Upvotes/downvotes    |
| `post_tags`            | @backend-team | 🟢       | Post categorization  |
| `thread_subscriptions` | @backend-team | 🟢       | Thread notifications |

---

## Gamification

| Table                 | Owner Team    | Priority | Notes                   |
| --------------------- | ------------- | -------- | ----------------------- |
| `xp_events`           | @backend-team | 🟢       | XP earning events       |
| `achievements`        | @backend-team | 🟢       | Achievement definitions |
| `user_achievements`   | @backend-team | 🟢       | Unlocked achievements   |
| `quests`              | @backend-team | 🟢       | Quest definitions       |
| `user_quest_progress` | @backend-team | 🟢       | Quest tracking          |
| `leaderboards`        | @backend-team | 🟢       | Leaderboard snapshots   |
| `streaks`             | @backend-team | 🟢       | Login streaks           |

---

## Payments & Subscriptions

| Table                | Owner Team     | Priority | Notes                   |
| -------------------- | -------------- | -------- | ----------------------- |
| `subscriptions`      | @payments-team | 🔴       | Stripe subscriptions    |
| `subscription_tiers` | @payments-team | 🟡       | Tier definitions        |
| `payments`           | @payments-team | 🔴       | Payment records         |
| `invoices`           | @payments-team | 🔴       | Invoice records         |
| `stripe_customers`   | @payments-team | 🔴       | Stripe customer mapping |
| `stripe_webhooks`    | @payments-team | 🟡       | Webhook event log       |

---

## Referrals

| Table                   | Owner Team    | Priority | Notes              |
| ----------------------- | ------------- | -------- | ------------------ |
| `referral_codes`        | @backend-team | 🟢       | Referral codes     |
| `referrals`             | @backend-team | 🟢       | Referral tracking  |
| `referral_reward_tiers` | @backend-team | 🟢       | Reward definitions |
| `referral_rewards`      | @backend-team | 🟢       | Claimed rewards    |

---

## Calendar & Events

| Table                       | Owner Team    | Priority | Notes             |
| --------------------------- | ------------- | -------- | ----------------- |
| `calendar_events`           | @backend-team | 🟢       | Event definitions |
| `calendar_event_categories` | @backend-team | 🟢       | Event categories  |
| `calendar_event_rsvps`      | @backend-team | 🟢       | RSVP tracking     |
| `calendar_reminders`        | @backend-team | 🟢       | Reminder settings |

---

## Notifications

| Table                      | Owner Team    | Priority | Notes                  |
| -------------------------- | ------------- | -------- | ---------------------- |
| `notifications`            | @backend-team | 🟢       | In-app notifications   |
| `push_subscriptions`       | @backend-team | 🟢       | Web push subscriptions |
| `notification_preferences` | @backend-team | 🟢       | User preferences       |

---

## Media & Files

| Table            | Owner Team    | Priority | Notes                |
| ---------------- | ------------- | -------- | -------------------- |
| `uploads`        | @backend-team | 🟡       | File upload records  |
| `upload_chunks`  | @backend-team | 🟢       | Resumable uploads    |
| `media_metadata` | @backend-team | 🟢       | Image/video metadata |

---

## Moderation

| Table                | Owner Team    | Priority | Notes                 |
| -------------------- | ------------- | -------- | --------------------- |
| `reports`            | @backend-team | 🟡       | User reports          |
| `warnings`           | @backend-team | 🟡       | User warnings         |
| `moderation_actions` | @backend-team | 🟡       | Mod action log        |
| `content_filters`    | @backend-team | 🟢       | Auto-moderation rules |

---

## Customization

| Table            | Owner Team     | Priority | Notes                 |
| ---------------- | -------------- | -------- | --------------------- |
| `themes`         | @frontend-team | 🟢       | Theme definitions     |
| `user_themes`    | @frontend-team | 🟢       | User theme selections |
| `avatar_borders` | @frontend-team | 🟢       | Border definitions    |
| `user_cosmetics` | @frontend-team | 🟢       | User cosmetic unlocks |

---

## System & Infrastructure

| Table               | Owner Team   | Priority | Notes                |
| ------------------- | ------------ | -------- | -------------------- |
| `oban_jobs`         | @devops-team | 🟡       | Background job queue |
| `oban_peers`        | @devops-team | 🟢       | Oban cluster peers   |
| `schema_migrations` | @devops-team | 🔴       | Migration history    |
| `feature_flags`     | @devops-team | 🟡       | Feature toggles      |
| `system_settings`   | @devops-team | 🟡       | Runtime config       |

---

## Change Management Rules

### 🔴 Critical Tables

1. **Requires**: Tech lead + security review
2. **Migration**: Must be reversible
3. **Testing**: Production-like data required
4. **Notification**: Announce in #backend channel 24h before

### 🟡 Important Tables

1. **Requires**: Team lead review
2. **Migration**: Should be reversible
3. **Testing**: Seed data sufficient

### 🟢 Standard Tables

1. **Requires**: Peer review
2. **Migration**: Best effort reversibility
3. **Testing**: Unit tests sufficient

---

## Deprecation Policy

1. **Mark deprecated** in schema comments
2. **Add migration** to rename with `_deprecated` suffix
3. **Wait 2 releases** before removal
4. **Remove** with data migration to new structure

---

## Contact

| Team           | Slack Channel | Email               |
| -------------- | ------------- | ------------------- |
| @backend-team  | #backend      | backend@cgraph.app  |
| @security-team | #security     | security@cgraph.app |
| @payments-team | #payments     | payments@cgraph.app |
| @frontend-team | #frontend     | frontend@cgraph.app |
| @devops-team   | #devops       | devops@cgraph.app   |

---

<sub>**CGraph Schema Ownership** • Version 0.9.31 • Last updated: January 2026</sub>
