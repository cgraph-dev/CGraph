# Features Research — CGraph E2EE Messaging + Community Platform

> Dimension: FEATURES | Date: 2026-02-27 | Type: Brownfield (~85% code built) Competitors analyzed:
> Signal, WhatsApp, Telegram, Discord, MyBB, Discourse, Guilded, Element/Matrix

---

## Executive Summary

CGraph already has **remarkable breadth** — authentication, E2EE (PQXDH + Triple Ratchet),
1:1/group/channel messaging, full forum engine, deep gamification, voice/video signaling, push
notifications, search, premium tiers, moderation, and AI features all exist in code. The gap to
alpha is **not missing features** but **polish, integration, and a few table-stakes holes** (message
editing/deletion, typing indicators in UI, disappearing messages, proper onboarding flow). The
differentiator strategy should lean into: (1) post-quantum E2EE as a trust story, (2) 50+ forum
customizations as a MyBB-killer, (3) gamification integrated with forums for stickiness, (4) forum
owner monetization as a growth flywheel.

---

## 1. Authentication & Onboarding

| Feature                       | User Value                        | Complexity | CGraph Has Code?                                                 | Classification     |
| ----------------------------- | --------------------------------- | ---------- | ---------------------------------------------------------------- | ------------------ |
| Email + password registration | Entry point to product            | LOW        | ✅ Yes — `registration.ex`, `auth_controller.ex`                 | TABLE STAKES       |
| Email verification            | Spam prevention, trust            | LOW        | ✅ Yes — `email_verification.ex`                                 | TABLE STAKES       |
| Password reset flow           | Can't lock users out              | LOW        | ✅ Yes — `password_reset.ex`                                     | TABLE STAKES       |
| OAuth (Google, Apple, GitHub) | Reduce friction 50-70%            | MEDIUM     | ✅ Yes — `oauth/` (Apple, providers)                             | TABLE STAKES       |
| Two-factor auth (TOTP)        | Security expectation for E2EE app | MEDIUM     | ✅ Yes — `security/totp/`, `two_factor_controller.ex`            | TABLE STAKES       |
| 2FA recovery codes            | Prevents lockout                  | LOW        | ✅ Yes — `recovery_code.ex`                                      | TABLE STAKES       |
| Biometric auth (mobile)       | Convenience, modern UX            | MEDIUM     | ✅ Yes — `useBiometricAuth` hook (Expo)                          | TABLE STAKES       |
| Wallet auth (Ethereum)        | Web3 audience niche               | HIGH       | ✅ Yes — `wallet_auth/`                                          | DIFFERENTIATOR     |
| Guided onboarding flow        | First-session retention           | MEDIUM     | ⚠️ Partial — welcome email exists, no in-app tutorial            | TABLE STAKES (gap) |
| Profile setup wizard          | Drives engagement immediately     | LOW        | ❌ No dedicated flow                                             | TABLE STAKES (gap) |
| QR code login (mobile→web)    | Telegram/WhatsApp pattern         | MEDIUM     | ❌ No                                                            | NICE-TO-HAVE       |
| Session management            | Multi-device control              | LOW        | ✅ Yes — `useSessions` hook, `sessions.ex`                       | TABLE STAKES       |
| Account deletion (GDPR)       | Legal compliance                  | MEDIUM     | ✅ Yes — `account_deletion_controller.ex`, `hard_delete_user.ex` | TABLE STAKES       |

### Gaps to Close

- **Onboarding flow**: Users who sign up and see an empty app churn immediately. Need a 3-5 step
  wizard: set avatar → find friends → join a community → send first message.
- **Profile setup wizard**: Prompt for display name, avatar, bio on first login.

---

## 2. Messaging (1:1, Group, Channels)

| Feature                       | User Value                  | Complexity | CGraph Has Code?                                                            | Classification                 |
| ----------------------------- | --------------------------- | ---------- | --------------------------------------------------------------------------- | ------------------------------ |
| 1:1 direct messages           | Core product loop           | HIGH       | ✅ Yes — `conversation_controller.ex`, `message_controller.ex`, chat module | TABLE STAKES                   |
| Group conversations           | Social, collaboration       | HIGH       | ✅ Yes — `group_controller.ex`, group channels                              | TABLE STAKES                   |
| Channels (in groups)          | Organized discussion        | HIGH       | ✅ Yes — `channel_controller.ex`, channel categories                        | TABLE STAKES                   |
| Channel categories            | Organization at scale       | MEDIUM     | ✅ Yes — `channel_category_controller.ex`                                   | TABLE STAKES                   |
| Text messages with formatting | Expressiveness              | MEDIUM     | ✅ Yes — BBCode editor, markdown                                            | TABLE STAKES                   |
| Message reactions (emoji)     | Low-friction engagement     | LOW        | ✅ Yes — `reaction_controller.ex`, `reactions.ex`                           | TABLE STAKES                   |
| Message editing               | Error correction, trust     | LOW        | ⚠️ Backend likely exists (`message_operations.ex`), verify UI               | TABLE STAKES (verify)          |
| Message deletion              | Privacy, mistakes           | LOW        | ⚠️ Backend likely exists, verify UI                                         | TABLE STAKES (verify)          |
| Reply/quote messages          | Contextual threading        | LOW        | ⚠️ Likely partial                                                           | TABLE STAKES                   |
| Forward messages              | Cross-conversation sharing  | LOW        | ❌ Unclear                                                                  | TABLE STAKES                   |
| Voice messages                | Convenience, expressiveness | MEDIUM     | ✅ Yes — full `voice_message/` system with waveform, transcoding            | TABLE STAKES                   |
| File/image sharing            | Core communication          | MEDIUM     | ✅ Yes — `upload_controller.ex`, S3/R2 storage                              | TABLE STAKES                   |
| GIF support                   | Fun, engagement             | LOW        | ✅ Yes — `gif_controller.ex`                                                | TABLE STAKES                   |
| Custom emoji (per group)      | Community identity          | MEDIUM     | ✅ Yes — `custom_emoji_controller.ex`, `group_emoji_controller.ex`          | DIFFERENTIATOR                 |
| Typing indicators             | Presence, liveness feel     | LOW        | ⚠️ Likely via Phoenix channels, verify frontend                             | TABLE STAKES                   |
| Read receipts                 | Know message was seen       | LOW        | ✅ Yes — `read_receipts.ex`                                                 | TABLE STAKES                   |
| Delivery receipts             | Confirm message arrived     | LOW        | ✅ Yes — `delivery_tracking.ex`, `delivery_receipt.ex`                      | TABLE STAKES                   |
| Pinned messages               | Important content surfacing | LOW        | ✅ Yes — `pinned_message_controller.ex`                                     | TABLE STAKES                   |
| Saved/bookmarked messages     | Personal reference          | LOW        | ✅ Yes — `saved_message_controller.ex`                                      | TABLE STAKES                   |
| Scheduled messages            | Async communication         | MEDIUM     | ✅ Yes — `scheduled_message_worker.ex`                                      | DIFFERENTIATOR                 |
| Threads (in channels)         | Discord-like threading      | MEDIUM     | ✅ Yes — `thread_controller.ex`, thread channels                            | TABLE STAKES (Discord parity)  |
| Message search                | Find past conversations     | MEDIUM     | ✅ Yes — MeiliSearch, `search_controller.ex`                                | TABLE STAKES                   |
| Offline message sync          | Mobile reliability          | HIGH       | ✅ Yes — `sync_controller.ex`                                               | TABLE STAKES                   |
| Link previews / embeds        | Rich content inline         | MEDIUM     | ⚠️ Likely partial                                                           | TABLE STAKES                   |
| Disappearing messages         | Privacy-first users         | MEDIUM     | ❌ No code found                                                            | DIFFERENTIATOR (Signal parity) |
| Slow mode (channels)          | Moderation tool             | LOW        | ⚠️ Likely in automod                                                        | NICE-TO-HAVE                   |
| Private messages (forum PM)   | Forum user communication    | LOW        | ✅ Yes — `pm_controller.ex`, `private_message_system.ex`                    | TABLE STAKES                   |

### Gaps to Close

- **Message editing/deletion UI**: Verify both web and mobile surfaces expose edit/delete. Users
  will feel the app is broken without it.
- **Typing indicators in UI**: Backend channel events likely exist; ensure frontend shows them.
- **Link previews**: Need Open Graph metadata fetching and rendering.
- **Disappearing messages**: High-value for E2EE positioning. Timer-based auto-delete
  per-conversation.

---

## 3. E2EE & Privacy

| Feature                               | User Value                           | Complexity | CGraph Has Code?                                                                              | Classification                    |
| ------------------------------------- | ------------------------------------ | ---------- | --------------------------------------------------------------------------------------------- | --------------------------------- |
| E2EE for 1:1 messages                 | Core trust promise                   | HIGH       | ✅ Yes — `packages/crypto/` (PQXDH, Triple Ratchet, Double Ratchet, X3DH)                     | TABLE STAKES                      |
| E2EE for group messages               | Group privacy                        | HIGH       | ✅ Yes — backend `crypto/e2ee/`, key distribution                                             | TABLE STAKES                      |
| Post-quantum key exchange (PQXDH)     | Future-proof against quantum attacks | HIGH       | ✅ Yes — `pqxdh.ts`, `kem.ts` (Kyber), migration `create_e2ee_kyber_prekeys`                  | DIFFERENTIATOR (industry-leading) |
| Triple Ratchet protocol               | Enhanced forward secrecy             | HIGH       | ✅ Yes — `tripleRatchet.ts`                                                                   | DIFFERENTIATOR (unique)           |
| Key verification (safety numbers)     | Prove no MITM attack                 | MEDIUM     | ⚠️ Backend crypto exists, need UI                                                             | TABLE STAKES for E2EE app         |
| Encrypted file attachments            | Full E2EE promise                    | HIGH       | ✅ Yes — integration test `e2ee_messaging_integration_test.exs` shows encrypted file metadata | TABLE STAKES                      |
| Encrypted voice message metadata      | Voice privacy                        | HIGH       | ✅ Yes — integration test shows encrypted voice metadata                                      | DIFFERENTIATOR                    |
| Secure key storage (client)           | Protect keys at rest                 | MEDIUM     | ✅ Yes — `secureStorage.ts`, `e2ee.secure.ts`                                                 | TABLE STAKES                      |
| Multi-device key sync                 | Use E2EE across devices              | HIGH       | ⚠️ Key registration per device exists, full sync unclear                                      | TABLE STAKES                      |
| Disappearing messages                 | Ephemeral communication              | MEDIUM     | ❌ No                                                                                         | DIFFERENTIATOR                    |
| Screen security (prevent screenshots) | Anti-leak for sensitive chats        | LOW        | ❌ No                                                                                         | NICE-TO-HAVE                      |
| Sealed sender (metadata protection)   | Hides who talks to whom              | HIGH       | ❌ No                                                                                         | FUTURE (Signal-level)             |
| Encrypted backups                     | Protect message history              | HIGH       | ❌ No                                                                                         | NICE-TO-HAVE                      |
| Key transparency log                  | Auditable key changes                | HIGH       | ❌ No                                                                                         | FUTURE                            |

### Gaps to Close

- **Key verification UI**: Users need to compare safety numbers/QR codes to verify identities.
  Essential for an E2EE app to be taken seriously by privacy-conscious users.
- **Multi-device E2EE sync**: Per-device key bundles exist, but seamless "add a new device" flow
  with cross-signing needs verification.
- **Disappearing messages**: Strong differentiator for privacy positioning. Timer per conversation,
  server-side enforcement.

---

## 4. Community (Forums & Groups)

### 4a. Forums

| Feature                      | User Value                            | Complexity | CGraph Has Code?                                                              | Classification |
| ---------------------------- | ------------------------------------- | ---------- | ----------------------------------------------------------------------------- | -------------- |
| Forum creation & management  | Core community feature                | HIGH       | ✅ Yes — `forum_controller.ex`, full `forums/` context (60+ files)            | TABLE STAKES   |
| Boards / sub-forums          | Content organization                  | MEDIUM     | ✅ Yes — `board.ex`, `boards.ex`, `board_controller.ex`                       | TABLE STAKES   |
| Threads & posts              | Discussion primitive                  | HIGH       | ✅ Yes — `thread.ex`, `post.ex`, `thread_controller.ex`, `post_controller.ex` | TABLE STAKES   |
| Comments on posts            | Nested discussion                     | LOW        | ✅ Yes — `comment.ex`, `comment_controller.ex`                                | TABLE STAKES   |
| Categories                   | Content taxonomy                      | LOW        | ✅ Yes — `category.ex`, `category_controller.ex`                              | TABLE STAKES   |
| Polls                        | Engagement, decision-making           | MEDIUM     | ✅ Yes — `poll.ex`, `poll_vote.ex`, `polls.ex`                                | TABLE STAKES   |
| Voting (upvote/downvote)     | Content quality signal                | LOW        | ✅ Yes — `vote.ex`, `voting.ex`, `forum_voting.ex`                            | TABLE STAKES   |
| RSS feeds                    | Content distribution                  | LOW        | ✅ Yes — `rss.ex`, `rss_controller.ex`                                        | NICE-TO-HAVE   |
| Forum search                 | Find content                          | MEDIUM     | ✅ Yes — `forums/search.ex`                                                   | TABLE STAKES   |
| Forum leaderboard            | Engagement, recognition               | LOW        | ✅ Yes — `forums/leaderboard.ex`                                              | DIFFERENTIATOR |
| Forum moderation             | Safety, quality                       | MEDIUM     | ✅ Yes — `forums/moderation.ex`, `moderator.ex`, `content_report.ex`          | TABLE STAKES   |
| Custom themes (per forum)    | Unique identity, "50+ customizations" | MEDIUM     | ✅ Yes — `forum_theme.ex`, tier feature `forums.custom_css`                   | DIFFERENTIATOR |
| Custom CSS                   | Deep visual control                   | LOW        | ✅ Yes — tier gated `forums.custom_css`                                       | DIFFERENTIATOR |
| Forum plugins                | Extensibility                         | HIGH       | ✅ Yes — `forum_plugin.ex`, `plugins.ex`                                      | DIFFERENTIATOR |
| Permission templates         | Easy setup                            | MEDIUM     | ✅ Yes — `permission_template.ex`                                             | DIFFERENTIATOR |
| Board permissions            | Granular access                       | MEDIUM     | ✅ Yes — `board_permission.ex`                                                | TABLE STAKES   |
| Forum announcements          | Admin communication                   | LOW        | ✅ Yes — `forum_announcement.ex`                                              | TABLE STAKES   |
| Post icons                   | Visual flair                          | LOW        | ✅ Yes — `post_icon.ex`                                                       | DIFFERENTIATOR |
| User groups (forum-specific) | Community segmentation                | MEDIUM     | ✅ Yes — `forum_user_group.ex`, `user_groups.ex`                              | DIFFERENTIATOR |
| Secondary groups             | Multi-role users                      | LOW        | ✅ Yes — `member_secondary_group.ex`, `secondary_groups_controller.ex`        | DIFFERENTIATOR |
| Thread attachments           | Rich content                          | LOW        | ✅ Yes — `thread_attachment.ex`                                               | TABLE STAKES   |
| Thread polls                 | In-thread polling                     | LOW        | ✅ Yes — `thread_poll.ex`                                                     | DIFFERENTIATOR |
| Forum subscriptions          | Follow content                        | LOW        | ✅ Yes — `subscription.ex`, `subscription_service.ex`                         | TABLE STAKES   |
| Ranking engine               | Content quality algorithm             | MEDIUM     | ✅ Yes — `ranking_engine.ex`                                                  | DIFFERENTIATOR |
| Digest emails                | Re-engagement                         | MEDIUM     | ✅ Yes — `digest_worker.ex`                                                   | DIFFERENTIATOR |
| Auto-moderation rules        | Scalable safety                       | MEDIUM     | ✅ Yes — `group_auto_rule.ex`, `automod_controller.ex`                        | TABLE STAKES   |
| Real-time forum updates      | Live feel                             | MEDIUM     | ✅ Yes — `forum_channel.ex`, `thread_channel.ex`                              | DIFFERENTIATOR |
| Emoji packs (per forum)      | Community personality                 | LOW        | ✅ Yes — `emoji_pack.ex`, `emoji_category.ex`                                 | DIFFERENTIATOR |
| BBCode editor                | Classic forum formatting              | MEDIUM     | ✅ Yes — `bbcode-editor/` component, `bbcode/` parser                         | DIFFERENTIATOR |

### 4b. Groups (Discord-like servers)

| Feature                          | User Value           | Complexity | CGraph Has Code?                                                         | Classification                |
| -------------------------------- | -------------------- | ---------- | ------------------------------------------------------------------------ | ----------------------------- |
| Group creation                   | Community foundation | MEDIUM     | ✅ Yes — `group_controller.ex`                                           | TABLE STAKES                  |
| Roles & permissions              | Access control       | HIGH       | ✅ Yes — `role.ex`, `role_controller.ex`, `permissions/`                 | TABLE STAKES                  |
| Per-channel permission overrides | Granular control     | HIGH       | ✅ Yes — `permission_overwrite.ex`, `permission_overwrite_controller.ex` | TABLE STAKES (Discord parity) |
| Invites (link-based)             | Growth mechanism     | LOW        | ✅ Yes — `invite.ex`, `invite_controller.ex`                             | TABLE STAKES                  |
| Bans                             | Safety               | LOW        | ✅ Yes — `group_ban.ex`                                                  | TABLE STAKES                  |
| Member management                | Admin control        | MEDIUM     | ✅ Yes — `group_member_controller.ex`, `member_controller.ex`            | TABLE STAKES                  |
| Custom emoji (per group)         | Community identity   | MEDIUM     | ✅ Yes — `custom_emoji.ex`, `group_emoji_controller.ex`                  | DIFFERENTIATOR                |
| Automod                          | Scalable moderation  | MEDIUM     | ✅ Yes — `automod.ex`, `automod_controller.ex`                           | TABLE STAKES                  |
| Group settings                   | Admin configuration  | LOW        | ✅ Yes — `settings_controller.ex`                                        | TABLE STAKES                  |

### Gaps to Close

- Forum customization is CGraph's killer feature claim — ensure **at least 50 distinct customization
  options** are enumerable: themes, CSS, layouts, colors, fonts, widget positions, sidebar config,
  header style, post templates, custom fields, badge display, leaderboard visibility, karma names,
  rank images, etc.
- Ensure the **forum plugin system** is functional enough for alpha (even if limited to built-in
  plugins).

---

## 5. Gamification & Customization

| Feature                            | User Value                 | Complexity | CGraph Has Code?                                                                                | Classification |
| ---------------------------------- | -------------------------- | ---------- | ----------------------------------------------------------------------------------------------- | -------------- |
| XP system                          | Progress feeling           | MEDIUM     | ✅ Yes — `xp_transaction.ex`, `gamification_controller.ex`                                      | DIFFERENTIATOR |
| Achievements / badges              | Recognition, goals         | MEDIUM     | ✅ Yes — `achievement.ex`, `achievement_system.ex`, `user_achievement.ex`                       | DIFFERENTIATOR |
| Quests (daily/weekly)              | Recurring engagement loop  | HIGH       | ✅ Yes — `quest.ex`, `quest_system.ex`, `user_quest.ex`                                         | DIFFERENTIATOR |
| Leaderboards                       | Competition, status        | MEDIUM     | ✅ Yes — `leaderboard_system.ex`, `leaderboard_controller.ex`                                   | DIFFERENTIATOR |
| Virtual currency (coins)           | Economy layer              | HIGH       | ✅ Yes — `coin_transaction.ex`, `currency_system.ex`                                            | DIFFERENTIATOR |
| Shop (cosmetics)                   | Monetization + expression  | HIGH       | ✅ Yes — `shop_item.ex`, gamification routes for shop                                           | DIFFERENTIATOR |
| Marketplace (user-to-user trading) | Community economy          | HIGH       | ✅ Yes — `marketplace_item.ex`, `marketplace.ex`, `marketplace_channel.ex`                      | DIFFERENTIATOR |
| Titles (user display)              | Status signaling           | LOW        | ✅ Yes — `title.ex`, `title_shop_system.ex`, `user_title.ex`                                    | DIFFERENTIATOR |
| Avatar borders (animated)          | Visual flair, premium feel | MEDIUM     | ✅ Yes — `avatar_border.ex`, `user_avatar_border.ex`, `animated-border.tsx`, `animated-avatar/` | DIFFERENTIATOR |
| Chat effects                       | Fun, expression            | MEDIUM     | ✅ Yes — `chat_effect.ex`, `user_chat_effect.ex`                                                | DIFFERENTIATOR |
| Profile themes                     | Personal expression        | MEDIUM     | ✅ Yes — `profile_theme.ex`, `user_profile_theme.ex`                                            | DIFFERENTIATOR |
| Battle pass (seasonal)             | Sustained engagement       | HIGH       | ✅ Yes — `battle_pass_tier.ex`, tier feature `gamification.battle_pass`                         | DIFFERENTIATOR |
| Seasonal events                    | Limited-time engagement    | HIGH       | ✅ Yes — `seasonal_event.ex`, `event_system.ex`, `events_channel.ex`                            | DIFFERENTIATOR |
| Prestige system                    | Long-term retention        | MEDIUM     | ✅ Yes — `prestige_reward.ex`, `user_prestige.ex`                                               | DIFFERENTIATOR |
| Gamification real-time events      | Instant feedback           | MEDIUM     | ✅ Yes — `gamification_channel.ex`                                                              | DIFFERENTIATOR |
| Streaks                            | Habit formation            | LOW        | ✅ Yes — gamification routes include streaks                                                    | DIFFERENTIATOR |
| Reputation system                  | Trust signaling            | MEDIUM     | ✅ Yes — `reputation/` context                                                                  | DIFFERENTIATOR |
| Referral system                    | Growth loop                | MEDIUM     | ✅ Yes — `referrals/`, `referral_controller.ex`                                                 | DIFFERENTIATOR |

### Assessment

Gamification is CGraph's **deepest differentiator**. No competitor comes close to this breadth:

- **Discord**: Nitro cosmetics, no quests/XP/marketplace
- **Telegram**: Zero gamification
- **Signal/WhatsApp**: Zero gamification
- **MyBB**: Plugin-based, fragmented

**Risk**: Over-complexity can overwhelm users. Need progressive disclosure — show XP/achievements
early, reveal quests/battle pass/marketplace as user levels up.

---

## 6. Voice & Video

| Feature                                   | User Value                  | Complexity | CGraph Has Code?                                                        | Classification                  |
| ----------------------------------------- | --------------------------- | ---------- | ----------------------------------------------------------------------- | ------------------------------- |
| 1:1 voice calls                           | Core communication          | HIGH       | ✅ Yes — `webrtc/`, `call_channel.ex`, `webrtcService.ts`               | TABLE STAKES                    |
| 1:1 video calls                           | Core communication          | HIGH       | ✅ Yes — same WebRTC infrastructure                                     | TABLE STAKES                    |
| Group voice calls                         | Team collaboration          | HIGH       | ⚠️ WebRTC room/participant schemas exist; verify SFU/mesh               | NICE-TO-HAVE (alpha)            |
| Screen sharing                            | Collaboration, support      | HIGH       | ⚠️ Tier feature `messaging.screen_sharing` gated, verify implementation | NICE-TO-HAVE                    |
| Call history                              | Reference, call back        | LOW        | ✅ Yes — `call_history.ex`                                              | TABLE STAKES                    |
| Voice channels (persistent, Discord-like) | Always-on community voice   | HIGH       | ❌ Not clearly distinct from call rooms                                 | DIFFERENTIATOR (post-alpha)     |
| Noise suppression                         | Call quality                | MEDIUM     | ❌ No (would need RNNoise/Krisp-like)                                   | NICE-TO-HAVE                    |
| E2EE for calls                            | Privacy promise consistency | HIGH       | ⚠️ WebRTC DTLS-SRTP is default; verify E2E frames                       | TABLE STAKES for E2EE app       |
| Call recording                            | Reference                   | MEDIUM     | ❌ No                                                                   | ANTI-FEATURE (privacy conflict) |

### Gaps to Close

- **E2EE for calls**: WebRTC already encrypts media via DTLS-SRTP, but for the E2EE promise CGraph
  makes, consider SFrame or Insertable Streams for E2E media encryption.
- **Group calls**: For alpha, 1:1 calls are sufficient. Group calls need an SFU (Selective
  Forwarding Unit) for scale — defer to post-alpha unless already configured.

---

## 7. Monetization (Premium & Forum Owner Revenue)

| Feature                         | User Value                                    | Complexity | CGraph Has Code?                                                                   | Classification              |
| ------------------------------- | --------------------------------------------- | ---------- | ---------------------------------------------------------------------------------- | --------------------------- |
| Premium subscription tiers      | Revenue, feature gating                       | HIGH       | ✅ Yes — `subscriptions/`, `tier_controller.ex`, Stripe config                     | TABLE STAKES (for business) |
| Tier-gated features             | Monetization lever                            | MEDIUM     | ✅ Yes — `tier_limits/`, `tier_feature.ex` — gates AI, forums, gamification, video | TABLE STAKES                |
| In-app purchases (mobile)       | Mobile monetization                           | HIGH       | ✅ Yes — `useSubscription` hook, `paymentService`                                  | TABLE STAKES                |
| Virtual currency purchase       | Premium economy                               | MEDIUM     | ✅ Yes — coins system, gamification routes                                         | DIFFERENTIATOR              |
| Cosmetic shop                   | Monetization + engagement                     | MEDIUM     | ✅ Yes — shop items, avatar borders, effects, themes                               | DIFFERENTIATOR              |
| Marketplace (user trading)      | Community economy                             | HIGH       | ✅ Yes — marketplace system with real-time channel                                 | DIFFERENTIATOR              |
| Forum owner revenue share       | Growth flywheel — incentivizes forum creation | HIGH       | ⚠️ Tier features exist for forums; revenue share logic unclear                     | DIFFERENTIATOR (key vision) |
| Forum-specific premium features | Forum owners monetize their communities       | MEDIUM     | ✅ Yes — custom CSS, themes, analytics gated by tier                               | DIFFERENTIATOR              |
| Stripe integration              | Payment processing                            | HIGH       | ✅ Yes — `stripe_webhook_controller.ex`, `stripe.tsx`, `stripe.exs` config         | TABLE STAKES                |
| Webhooks (for integrations)     | Developer ecosystem                           | MEDIUM     | ✅ Yes — `webhooks/`, `webhook_delivery_worker.ex`                                 | DIFFERENTIATOR              |
| API access (paid)               | Developer monetization                        | MEDIUM     | ✅ Yes — tier feature `api.access`                                                 | DIFFERENTIATOR              |

### Gaps to Close

- **Forum owner revenue share**: This is a key vision item. Need clear revenue model: does the forum
  owner get a cut of premium subscriptions driven by their forum? Or do forum owners set up their
  own paid tiers? Define and implement the economics.
- **Billing portal**: Users need to manage subscriptions, view invoices, change plans. Verify Stripe
  Customer Portal integration.

---

## 8. Notifications & Presence

| Feature                                | User Value                        | Complexity | CGraph Has Code?                                                       | Classification |
| -------------------------------------- | --------------------------------- | ---------- | ---------------------------------------------------------------------- | -------------- |
| Push notifications (mobile)            | Re-engagement                     | HIGH       | ✅ Yes — `push_service/`, `push_token_controller.ex`, `push_tokens.ex` | TABLE STAKES   |
| Web push notifications                 | Web re-engagement                 | MEDIUM     | ✅ Yes — `web_push_controller.ex`, `webPushService.ts`                 | TABLE STAKES   |
| In-app notification center             | Activity awareness                | MEDIUM     | ✅ Yes — `notification_controller.ex`, `notifications/` context        | TABLE STAKES   |
| Notification preferences               | User control (anti-spam)          | LOW        | ⚠️ Likely in settings, verify granularity                              | TABLE STAKES   |
| Online/offline presence                | Social awareness                  | MEDIUM     | ✅ Yes — `presence/`, `presence_channel.ex`, `presenceManager.ts`      | TABLE STAKES   |
| Custom status                          | Self-expression                   | LOW        | ⚠️ Verify UI — `presence_status_selector.tsx` exists                   | TABLE STAKES   |
| Last seen timestamp                    | Social context                    | LOW        | ✅ Yes — `last-seen-badge.tsx`                                         | TABLE STAKES   |
| Do Not Disturb mode                    | User control                      | LOW        | ⚠️ Likely in settings/presence                                         | TABLE STAKES   |
| Email notifications (digest)           | Re-engagement for lapsed users    | MEDIUM     | ✅ Yes — `digest_worker.ex`, mailer                                    | TABLE STAKES   |
| Notification actions (mark read, etc.) | Efficiency                        | LOW        | ✅ Yes — `notification-actions.tsx`                                    | TABLE STAKES   |
| Per-channel notification settings      | Granular control (Discord parity) | LOW        | ⚠️ Verify                                                              | TABLE STAKES   |

### Gaps to Close

- **Notification preferences granularity**: Users must be able to mute individual conversations,
  channels, forums. Per-type toggles (mentions only, all messages, nothing). Without this, users
  will either be overwhelmed or miss important messages.
- **Do Not Disturb schedule**: Allow time-based DND.

---

## 9. Search & Discovery

| Feature                       | User Value              | Complexity | CGraph Has Code?                                                        | Classification     |
| ----------------------------- | ----------------------- | ---------- | ----------------------------------------------------------------------- | ------------------ |
| Message search                | Find past conversations | HIGH       | ✅ Yes — MeiliSearch backend, `search_controller.ex`, `search/` context | TABLE STAKES       |
| User search                   | Find people             | LOW        | ✅ Yes — `search/users.ex`                                              | TABLE STAKES       |
| Forum/thread search           | Find content            | MEDIUM     | ✅ Yes — `forums/search.ex`                                             | TABLE STAKES       |
| Quick switcher (⌘K)           | Power user navigation   | MEDIUM     | ✅ Yes — `quick-switcher.tsx`                                           | DIFFERENTIATOR     |
| Group/community discovery     | Find new communities    | MEDIUM     | ❌ No dedicated discovery/explore page                                  | TABLE STAKES (gap) |
| Friend suggestions            | Social graph growth     | LOW        | ✅ Yes — `friend_suggestion_controller.ex`                              | NICE-TO-HAVE       |
| Full-text search with filters | Advanced search         | MEDIUM     | ⚠️ MeiliSearch configured; verify filter UI                             | TABLE STAKES       |

### Gaps to Close

- **Community/group discovery**: Discord has Server Discovery, Telegram has channel search. CGraph
  needs an explore/discover page where users can find public groups and forums. Without this,
  organic growth is crippled.

---

## 10. Moderation & Safety

| Feature                         | User Value                 | Complexity | CGraph Has Code?                                                     | Classification        |
| ------------------------------- | -------------------------- | ---------- | -------------------------------------------------------------------- | --------------------- |
| User reporting                  | Safety foundation          | MEDIUM     | ✅ Yes — `report_controller.ex`, `moderation/report.ex`              | TABLE STAKES          |
| Report review / actions         | Moderation workflow        | MEDIUM     | ✅ Yes — `review_action.ex`, `enforcement.ex`                        | TABLE STAKES          |
| Appeals system                  | Fairness                   | MEDIUM     | ✅ Yes — `appeal.ex`, `appeals.ex`                                   | DIFFERENTIATOR        |
| User bans (group-level)         | Community safety           | LOW        | ✅ Yes — `group_ban.ex`, `forums/ban.ex`                             | TABLE STAKES          |
| User restrictions               | Graduated enforcement      | MEDIUM     | ✅ Yes — `user_restriction.ex`                                       | TABLE STAKES          |
| Auto-moderation (keyword/regex) | Scale safety               | MEDIUM     | ✅ Yes — `automod.ex`, `automod_controller.ex`, `group_auto_rule.ex` | TABLE STAKES          |
| AI content moderation           | Smart safety               | HIGH       | ✅ Yes — `ai/moderation.ex`, `contentModeration.ts`                  | DIFFERENTIATOR        |
| AI sentiment analysis           | Proactive safety           | HIGH       | ✅ Yes — `ai/sentiment.ex`, `sentimentAnalysis.ts`                   | DIFFERENTIATOR        |
| Moderation statistics           | Admin insight              | LOW        | ✅ Yes — `moderation/stats.ex`                                       | TABLE STAKES          |
| Admin dashboard                 | Platform management        | HIGH       | ✅ Yes — `admin_controller.ex`, admin routes, web admin module       | TABLE STAKES          |
| Abuse detection                 | Proactive protection       | HIGH       | ✅ Yes — `security/abuse_detection.ex`                               | DIFFERENTIATOR        |
| Rate limiting (tiered)          | Anti-spam                  | MEDIUM     | ✅ Yes — `rate_limiter_v2.ex` (sliding window, tiered)               | TABLE STAKES          |
| Account lockout (progressive)   | Anti-brute-force           | MEDIUM     | ✅ Yes — `security/account_lockout/`                                 | TABLE STAKES          |
| Content age restrictions        | Legal compliance           | LOW        | ❌ No                                                                | NICE-TO-HAVE          |
| Audit logging                   | Accountability, compliance | MEDIUM     | ✅ Yes — `audit/`, `audit_log_plug.ex`                               | TABLE STAKES          |
| GDPR data export                | Legal compliance           | HIGH       | ✅ Yes — `data_export/` with pipeline, formatter, delivery           | TABLE STAKES          |
| Block user                      | Personal safety            | LOW        | ⚠️ Likely exists in friend/messaging system, verify                  | TABLE STAKES (verify) |

### Gaps to Close

- **Block user UI**: Verify that blocking a user prevents them from messaging you, seeing your
  presence, and appearing in your feeds. Critical safety feature.

---

## 11. Anti-Features (Things to Avoid or Gate Carefully)

| Anti-Feature                    | Problem It Creates                      | Mitigation                                                                                    |
| ------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------- |
| Read receipts without opt-out   | Social pressure, anxiety                | ✅ Must be toggleable per-conversation. CGraph has `read_receipts.ex` — ensure opt-out exists |
| Mandatory online status         | Privacy violation                       | Must support "invisible" mode and per-user visibility control                                 |
| Over-complex permissions        | Admin overwhelm, misconfiguration       | ✅ Permission templates exist — lead with templates, allow advanced mode                      |
| Too many notification types     | Alert fatigue → users mute everything   | Progressive defaults: mentions-only for channels, all for DMs                                 |
| Gamification leaderboard shame  | Low-ranking users feel bad              | Show personal progress prominently, leaderboard as opt-in or top-N only                       |
| Marketplace scam potential      | Trust erosion                           | Escrow system, trade confirmations, cooldown periods, reporting                               |
| AI moderation false positives   | User frustration, censorship perception | Always allow appeals, show reasons, human review queue                                        |
| Chat effects everywhere         | Distraction, accessibility issues       | Respect prefers-reduced-motion, allow per-user disable                                        |
| Battle pass FOMO                | Psychological pressure                  | Ensure free tier is meaningful, don't gate essential features behind pass                     |
| Call recording                  | E2EE trust violation                    | **Do not implement** — conflicts with E2EE privacy promise                                    |
| Forum custom CSS XSS            | Security vulnerability                  | ✅ `css-sanitization.ts` exists — ensure server-side sanitization too                         |
| Unlimited file uploads          | Storage cost explosion                  | Tier-based limits already exist — enforce strictly                                            |
| Disappearing messages in forums | Breaks community knowledge base         | Only for DMs/group chats, never forums                                                        |

---

## 12. Feature Dependencies

```
Authentication
├── Email/Password Registration
│   └── Email Verification
│       └── Password Reset
├── OAuth Providers
├── 2FA (TOTP)
│   └── Recovery Codes
├── Biometric Auth (requires: auth token stored)
└── Wallet Auth

Messaging (requires: Authentication)
├── 1:1 Conversations
│   ├── Text Messages
│   │   ├── Reactions
│   │   ├── Replies/Quotes
│   │   ├── Editing
│   │   ├── Deletion
│   │   └── Formatting (BBCode/Markdown)
│   ├── Voice Messages
│   ├── File Sharing
│   ├── GIF Support
│   ├── Read/Delivery Receipts
│   ├── Typing Indicators
│   └── Message Search
├── E2EE Layer (requires: Key Exchange infra)
│   ├── X3DH/PQXDH Key Agreement
│   │   └── Double/Triple Ratchet Session
│   │       ├── Encrypted Messages
│   │       ├── Encrypted File Metadata
│   │       └── Encrypted Voice Metadata
│   ├── Key Verification UI (requires: E2EE + Identity)
│   └── Disappearing Messages (requires: E2EE for trust)
└── Pinned / Saved Messages

Groups (requires: Authentication + Messaging)
├── Group Creation
│   ├── Channels
│   │   ├── Channel Categories
│   │   ├── Threads (in channels)
│   │   └── Per-channel Permissions
│   ├── Roles & Permissions
│   ├── Invites
│   ├── Bans
│   ├── Custom Emoji
│   └── Auto-moderation
└── Group Discovery (requires: Groups to exist)

Forums (requires: Authentication)
├── Forum Creation
│   ├── Boards/Categories
│   │   └── Threads/Posts
│   │       ├── Comments
│   │       ├── Polls
│   │       ├── Voting
│   │       └── Attachments
│   ├── Forum Moderation
│   ├── Forum Search
│   └── Forum Subscriptions
├── Customization Layer (requires: Forum Creation)
│   ├── Themes
│   ├── Custom CSS
│   ├── Plugins
│   ├── Post Icons
│   └── Emoji Packs
└── Forum Monetization (requires: Customization + Premium Tiers)

Gamification (requires: Authentication, partially Messaging/Forums for triggers)
├── XP System (foundation — everything builds on XP events)
│   ├── Achievements (requires: XP events to trigger)
│   │   └── Titles/Badges (requires: Achievements)
│   ├── Leaderboards (requires: XP data)
│   ├── Quests (requires: XP + event tracking)
│   │   └── Battle Pass (requires: Quest framework)
│   ├── Streaks (requires: daily activity tracking)
│   └── Prestige (requires: leveling to max)
├── Currency System (requires: XP system for earning)
│   ├── Shop (requires: Currency)
│   │   ├── Avatar Borders (requires: Shop)
│   │   ├── Chat Effects (requires: Shop)
│   │   └── Profile Themes (requires: Shop)
│   └── Marketplace (requires: Currency + Trading logic)
└── Seasonal Events (requires: full gamification stack)

Voice/Video (requires: Authentication + WebRTC infra)
├── 1:1 Voice Calls
│   └── 1:1 Video Calls
├── Group Calls (requires: SFU)
└── Screen Sharing (requires: Video Calls)

Premium (requires: Stripe integration + Tier system)
├── Subscription Management
├── Feature Gating
├── In-app Purchases
└── Forum Owner Revenue (requires: Forums + Premium)

Notifications (requires: Authentication)
├── Push Notifications (requires: device token registration)
├── Web Push (requires: service worker)
├── In-app Notifications
├── Email Notifications/Digest
└── Presence (requires: WebSocket connection)
```

---

## 13. MVP Definition (Alpha Release)

Given CGraph has ~85% of code built, the alpha MVP is about **closing gaps and polishing** rather
than building new systems.

### Must Have for Alpha (Blocking)

These are features where absence makes the product feel broken:

- [x] ~~Authentication (email, OAuth, 2FA)~~ — **DONE**
- [x] ~~1:1 messaging with E2EE~~ — **DONE**
- [x] ~~Group messaging with channels~~ — **DONE**
- [x] ~~Reactions, pinning, saving messages~~ — **DONE**
- [x] ~~Voice messages~~ — **DONE**
- [x] ~~File/image sharing~~ — **DONE**
- [x] ~~Push notifications~~ — **DONE**
- [x] ~~Message search~~ — **DONE**
- [x] ~~Forums (basic: boards, threads, posts)~~ — **DONE**
- [x] ~~User profiles~~ — **DONE**
- [x] ~~Friend system~~ — **DONE**
- [x] ~~Online presence~~ — **DONE**
- [ ] **Message editing & deletion** — Verify backend + build/polish UI on web and mobile
- [ ] **Typing indicators** — Verify channel events flow to frontend components
- [ ] **Link previews** — OG metadata fetch + render (backend + frontend)
- [ ] **Onboarding flow** — 3-5 step wizard on first login (set avatar, join community, send first
      message)
- [ ] **Block user** — Verify full block behavior (messaging, presence, search)
- [ ] **Key verification UI** — Safety number comparison screen for E2EE trust
- [ ] **Notification preferences** — Per-conversation/channel mute, mention-only mode
- [ ] **Community/group discovery** — Explore page for public groups/forums
- [ ] **Reply/quote messages** — Verify UI surfaces this for both web + mobile

### Should Have for Alpha (Important but not blocking)

- [ ] Disappearing messages — Timer-based auto-delete for DMs
- [ ] Custom status / invisible mode
- [ ] 1:1 voice/video calls (code exists, needs testing)
- [ ] Basic gamification visible (XP, level, a few achievements)
- [ ] Forum customization (themes, at least 10 options demonstrated)
- [ ] Premium tier signup flow (Stripe checkout)
- [ ] Do Not Disturb mode
- [ ] Per-channel notification settings

### Defer to Post-Alpha (v1.1+)

- [ ] Group voice/video calls (SFU needed)
- [ ] Screen sharing
- [ ] Battle pass & seasonal events
- [ ] Full marketplace with trading
- [ ] Forum owner revenue share model
- [ ] AI features (smart replies, summarization) — currently gated by tier
- [ ] Sealed sender / metadata protection
- [ ] Encrypted backups
- [ ] Voice channels (persistent)
- [ ] Advanced forum plugins
- [ ] Full prestige system
- [ ] Calendar/events system
- [ ] Collaborative editing (Yjs)

---

## 14. Feature Prioritization Matrix

| Feature                      | User Value (1-5) | Impl. Cost (1-5) | Already Built? | Priority |
| ---------------------------- | :--------------: | :--------------: | :------------: | :------: |
| Message editing/deletion UI  |        5         |        1         |    Partial     |  **P0**  |
| Typing indicators (frontend) |        4         |        1         |    Partial     |  **P0**  |
| Onboarding wizard            |        5         |        2         |       No       |  **P0**  |
| Block user (full)            |        5         |        1         |     Verify     |  **P0**  |
| Key verification UI          |        4         |        2         |       No       |  **P0**  |
| Link previews                |        3         |        2         |       No       |  **P1**  |
| Community discovery page     |        4         |        3         |       No       |  **P1**  |
| Notification preferences     |        4         |        2         |    Partial     |  **P1**  |
| Reply/quote UI (verify)      |        4         |        1         |    Partial     |  **P1**  |
| Disappearing messages        |        4         |        3         |       No       |  **P1**  |
| Custom status                |        3         |        1         |    Partial     |  **P2**  |
| 1:1 voice/video testing      |        4         |        2         |     Built      |  **P2**  |
| Forum 50+ customizations     |        5         |        3         |    Partial     |  **P2**  |
| Premium checkout flow        |        4         |        2         |     Built      |  **P2**  |
| Battle pass                  |        3         |        4         |     Built      |  **P3**  |
| Group calls (SFU)            |        3         |        5         |    Partial     |  **P3**  |
| Forum owner revenue          |        5         |        5         |       No       |  **P3**  |
| Marketplace trading          |        3         |        4         |     Built      |  **P3**  |
| Collaborative editing        |        2         |        4         |     Built      |  **P4**  |
| Sealed sender                |        3         |        5         |       No       |  **P4**  |

---

## 15. Competitive Positioning Summary

| Dimension                 | Signal             | WhatsApp           | Telegram    | Discord                   | MyBB/Discourse    | **CGraph**                                        |
| ------------------------- | ------------------ | ------------------ | ----------- | ------------------------- | ----------------- | ------------------------------------------------- |
| E2EE (1:1)                | ✅ Signal Protocol | ✅ Signal Protocol | ❌ Optional | ❌ No                     | N/A               | ✅ **PQXDH + Triple Ratchet**                     |
| E2EE (group)              | ✅                 | ✅                 | ❌          | ❌                        | N/A               | ✅                                                |
| Post-quantum              | ❌ Exploring       | ❌                 | ❌          | ❌                        | N/A               | ✅ **Kyber KEM**                                  |
| Forums                    | ❌                 | ❌                 | ❌          | ❌ (Forum channels basic) | ✅ Core product   | ✅ **60+ file forum engine**                      |
| Forum customization       | N/A                | N/A                | N/A         | ❌                        | ✅ Themes/plugins | ✅ **50+ planned**                                |
| Gamification              | ❌                 | ❌                 | ❌          | ⚠️ Nitro perks only       | ❌ Plugins only   | ✅ **Deep: XP, quests, battle pass, marketplace** |
| Monetization (user)       | ❌                 | ❌                 | ⚠️ Premium  | ✅ Nitro                  | ❌                | ✅ **Premium + shop + marketplace**               |
| Monetization (owner)      | N/A                | N/A                | ❌          | ⚠️ Server boosts          | N/A               | ✅ **Forum owner revenue (planned)**              |
| Voice/Video               | ✅                 | ✅                 | ✅          | ✅                        | ❌                | ✅ (WebRTC)                                       |
| Bot/integration ecosystem | ❌                 | ⚠️ Business API    | ✅ Bots     | ✅ Rich bots              | ✅ Plugins        | ⚠️ Webhooks + plugins (early)                     |
| Open source               | ✅                 | ❌                 | ❌          | ❌                        | ✅ (MyBB)         | ⚠️ Transitioning                                  |

### CGraph's Winning Narrative

> "The only platform with post-quantum E2EE, full forum customization, and deep gamification.
> Signal's privacy + Discord's community features + MyBB's forum depth — in one app."

---

## Appendix: CGraph Code Coverage by Category

| Category       |                Backend Contexts                |        Web Modules         |    Mobile Features    | Assessment                             |
| -------------- | :--------------------------------------------: | :------------------------: | :-------------------: | -------------------------------------- |
| Authentication | ✅ `accounts/`, `auth/`, `oauth/`, `security/` |         ✅ `auth/`         |      ✅ `auth/`       | **Complete**                           |
| Messaging      |                ✅ `messaging/`                 |         ✅ `chat/`         |    ✅ `messages/`     | **~90% — polish needed**               |
| E2EE           |          ✅ `crypto/`, `encryption/`           |      ✅ `lib/crypto/`      | Uses `@cgraph/crypto` | **~85% — key verification UI missing** |
| Groups         |                  ✅ `groups/`                  |        ✅ `groups/`        |     ✅ `groups/`      | **Complete**                           |
| Forums         |            ✅ `forums/` (60+ files)            |        ✅ `forums/`        |      ⚠️ Limited       | **~90% — mobile forums limited**       |
| Gamification   |        ✅ `gamification/` (34 entries)         |     ✅ `gamification/`     |    ⚠️ Hooks exist     | **~80% — UI integration needed**       |
| Voice/Video    |                  ✅ `webrtc/`                  | ✅ `lib/webrtc/`, `calls/` |    ✅ Expo WebRTC     | **~70% — testing needed**              |
| Premium        |              ✅ `subscriptions/`               |       ✅ `premium/`        |     ✅ `premium/`     | **~85%**                               |
| Notifications  |              ✅ `notifications/`               |      ✅ Push + in-app      |        ✅ Push        | **~80% — preferences gaps**            |
| Search         |           ✅ `search/` (MeiliSearch)           |        ✅ `search/`        |       ⚠️ Basic        | **~80%**                               |
| Moderation     |            ✅ `moderation/`, `ai/`             |      ✅ `moderation/`      |    ⚠️ Report only     | **~85%**                               |
| Admin          |                  ✅ `admin/`                   |        ✅ `admin/`         |          N/A          | **~75%**                               |
