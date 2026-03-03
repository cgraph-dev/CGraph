# CGraph v1.0 Requirements

> Generated: 2026-02-27 | Source: Research + User Scoping | Total: 98 requirements

---

## v1 Requirements

### Authentication & Onboarding (AUTH)

- [ ] **AUTH-01**: User can register with email and password on web and mobile
- [ ] **AUTH-02**: User receives email verification and can verify account on both platforms
- [ ] **AUTH-03**: User can reset password via email link on both platforms
- [ ] **AUTH-04**: User can log in via OAuth (Google, Apple) on both platforms
- [ ] **AUTH-05**: User can enable/disable TOTP 2FA with recovery codes on both platforms
- [ ] **AUTH-06**: User can authenticate with biometrics (Face ID / fingerprint) on mobile
- [ ] **AUTH-07**: User can manage active sessions and revoke devices on both platforms
- [ ] **AUTH-08**: User can delete account (GDPR) with full data export on both platforms
- [ ] **AUTH-09**: User completes onboarding wizard on first login (avatar → find friends → join
      community → send first message) on both platforms
- [ ] **AUTH-10**: User completes profile setup (display name, avatar, bio) on first login
- [ ] **AUTH-11**: User can log into web by scanning QR code from mobile app
- [ ] **AUTH-12**: User can authenticate via Privy (embedded wallet + social login) on both
      platforms
- [ ] **AUTH-13**: User can authenticate via Ethereum wallet signature on both platforms
- [ ] **AUTH-14**: Auth token refresh handles concurrent requests without logging user out (refresh
      mutex)

### Messaging (MSG)

- [ ] **MSG-01**: User can send and receive 1:1 text messages in real-time on both platforms
- [ ] **MSG-02**: User can send and receive group messages in real-time on both platforms
- [ ] **MSG-03**: User can send messages in channels within groups on both platforms
- [ ] **MSG-04**: User can edit their own messages with edit history visible on both platforms
- [ ] **MSG-05**: User can delete their own messages (soft-delete with "message deleted" indicator)
      on both platforms
- [ ] **MSG-06**: User sees typing indicators when contacts are composing messages on both platforms
- [ ] **MSG-07**: User can reply to / quote specific messages with thread context on both platforms
- [ ] **MSG-08**: User can forward messages across conversations on both platforms
- [ ] **MSG-09**: User can react to messages with emoji on both platforms
- [ ] **MSG-10**: User can send voice messages with waveform visualization on both platforms
- [ ] **MSG-11**: User can share files and images (up to tier limit) on both platforms
- [ ] **MSG-12**: User can search and send GIFs inline on both platforms
- [ ] **MSG-13**: User can pin messages in conversations on both platforms
- [ ] **MSG-14**: User can save/bookmark messages for later reference on both platforms
- [ ] **MSG-15**: User can schedule messages for future delivery on both platforms
- [ ] **MSG-16**: User sees link previews with OG metadata for shared URLs on both platforms
- [ ] **MSG-17**: User can enable disappearing messages with configurable timer per conversation on
      both platforms
- [ ] **MSG-18**: User sees read receipts (with opt-out option) on both platforms
- [ ] **MSG-19**: User sees delivery receipts confirming message arrival on both platforms
- [ ] **MSG-20**: User can search message history with filters on both platforms
- [ ] **MSG-21**: User can create and browse message threads in channels on both platforms
- [ ] **MSG-22**: Messages sync across devices via offline sync protocol (WatermelonDB on mobile)

### E2EE & Privacy (E2EE)

- [ ] **E2EE-01**: All 1:1 messages are encrypted end-to-end using PQXDH + Triple Ratchet on both
      platforms
- [ ] **E2EE-02**: Group messages are encrypted end-to-end with key distribution on both platforms
- [ ] **E2EE-03**: User can verify contact identity via safety numbers / QR code on both platforms
- [ ] **E2EE-04**: E2EE key sync works seamlessly when user adds a new device
- [ ] **E2EE-05**: File attachments are encrypted client-side before upload on both platforms
- [ ] **E2EE-06**: Voice message metadata is encrypted end-to-end on both platforms
- [ ] **E2EE-07**: Voice and video call media is encrypted end-to-end (SFrame / Insertable Streams)
      on both platforms
- [ ] **E2EE-08**: Client-side key storage is secured (Keychain on iOS, Keystore on Android,
      encrypted on web)
- [ ] **E2EE-09**: E2EE bootstrap occurs automatically after login (prekey fetch → ratchet init)
      without user action

### Community — Forums (FORUM)

- [ ] **FORUM-01**: User can create and manage forums with full admin controls on both platforms
- [ ] **FORUM-02**: User can create boards/sub-forums with categories on both platforms
- [ ] **FORUM-03**: User can create threads with text, formatting (BBCode), and attachments on both
      platforms
- [ ] **FORUM-04**: User can post, reply, and comment with nested discussion on both platforms
- [ ] **FORUM-05**: User can create and vote in polls within threads on both platforms
- [ ] **FORUM-06**: User can upvote/downvote posts with reputation impact on both platforms
- [ ] **FORUM-07**: Forum owner can customize 50+ options (themes, CSS, layouts, colors, fonts,
      widgets, sidebar, header, post templates, custom fields, badges, leaderboard, karma names,
      rank images, etc.)
- [ ] **FORUM-08**: Forum owner can install and configure built-in plugins on both platforms
- [ ] **FORUM-09**: Forum updates display in real-time (new posts, replies, votes) on both platforms
- [ ] **FORUM-10**: Forum has full-text search across threads and posts on both platforms
- [ ] **FORUM-11**: Forum has dedicated moderation tools (reports, actions, automod rules) on both
      platforms
- [ ] **FORUM-12**: Forum supports per-board permissions and permission templates
- [ ] **FORUM-13**: Forum supports custom emoji packs and post icons
- [ ] **FORUM-14**: Forum has RSS feeds for boards and threads
- [ ] **FORUM-15**: Forum supports user groups with secondary group membership
- [ ] **FORUM-16**: Forum has ranking engine and leaderboard tied to gamification

### Community — Groups & Channels (GROUP)

- [ ] **GROUP-01**: User can create groups with avatar, description, and settings on both platforms
- [ ] **GROUP-02**: User can create channels with categories within groups on both platforms
- [ ] **GROUP-03**: Group owner can define roles with granular permissions on both platforms
- [ ] **GROUP-04**: Group owner can set per-channel permission overrides on both platforms
- [ ] **GROUP-05**: User can invite others via invite link on both platforms
- [ ] **GROUP-06**: Group admin can ban/kick members with reason logging on both platforms
- [ ] **GROUP-07**: Group can have custom emoji uploaded by members on both platforms
- [ ] **GROUP-08**: Group has automod rules (spam filter, word filter, link filter) on both
      platforms
- [ ] **GROUP-09**: User can discover and browse public groups/communities via explore page on both
      platforms

### Gamification & Customization (GAME)

- [ ] **GAME-01**: User earns XP from messaging, forum participation, social actions with daily caps
      to prevent inflation
- [ ] **GAME-02**: User can view and earn achievements/badges for milestones on both platforms
- [ ] **GAME-03**: User can accept and complete daily/weekly quests for XP rewards on both platforms
- [ ] **GAME-04**: User can view leaderboards (global, per-group, per-forum) on both platforms
- [ ] **GAME-05**: User can purchase battle pass and progress through seasonal tiers on both
      platforms
- [ ] **GAME-06**: User can earn and spend virtual currency (coins) in the shop on both platforms
- [ ] **GAME-07**: User can buy cosmetics (avatar borders, chat effects, profile themes, titles) on
      both platforms
- [ ] **GAME-08**: User can list and trade items on the marketplace on both platforms
- [ ] **GAME-09**: Gamification is community-first (progressive disclosure: XP/achievements early,
      quests/pass/marketplace revealed as user levels up)
- [ ] **GAME-10**: Forum participation (posts, helpful answers, moderation) awards XP with
      forum-specific leaderboards
- [ ] **GAME-11**: Animated avatar borders and username effects render performantly on both
      platforms
- [ ] **GAME-12**: User can equip titles that display throughout the app on both platforms

### Voice & Video (CALL)

- [ ] **CALL-01**: User can make 1:1 voice calls on both platforms (WebRTC peer-to-peer)
- [ ] **CALL-02**: User can make 1:1 video calls on both platforms
- [ ] **CALL-03**: User can make group voice calls (LiveKit SFU) on both platforms
- [ ] **CALL-04**: User can make group video calls (LiveKit SFU) on both platforms
- [ ] **CALL-05**: User can share screen during calls on both platforms
- [ ] **CALL-06**: User can join persistent voice channels (always-on, Discord-style) on both
      platforms
- [ ] **CALL-07**: User can view call history and call back contacts on both platforms
- [ ] **CALL-08**: All calls are end-to-end encrypted (SFrame or Insertable Streams)

### Monetization & Payments (PAY)

- [ ] **PAY-01**: User can subscribe to premium tiers (Free, Pro, Business) on web via Stripe
- [ ] **PAY-02**: User can subscribe to premium tiers on mobile via Apple IAP / Google Play Billing
- [ ] **PAY-03**: Premium features are gated by tier (AI, advanced forums, gamification extras,
      video quality) on both platforms
- [ ] **PAY-04**: User can purchase virtual currency (coins) with real money on both platforms
- [ ] **PAY-05**: User can manage subscription, view invoices, change plans via billing portal
- [ ] **PAY-06**: Forum owner can create paid subscriptions for their forum with custom pricing
      tiers
- [ ] **PAY-07**: Forum owner can set paid content gates (premium threads, boards, or features)
- [ ] **PAY-08**: Forum owner can track earnings and withdraw revenue with clear payout flow
- [ ] **PAY-09**: Creator monetization system has transparent fee structure and analytics dashboard
- [ ] **PAY-10**: Stripe webhooks reliably sync subscription state with idempotent processing

### Notifications & Presence (NOTIF)

- [ ] **NOTIF-01**: User receives push notifications on mobile (Expo push → APNs/FCM) for messages,
      mentions, calls
- [ ] **NOTIF-02**: User receives web push notifications for messages and mentions
- [ ] **NOTIF-03**: User has in-app notification center with activity feed on both platforms
- [ ] **NOTIF-04**: User can configure notification preferences per conversation, channel, and forum
- [ ] **NOTIF-05**: User sees online/offline presence for contacts on both platforms
- [ ] **NOTIF-06**: User can set custom status text on both platforms
- [ ] **NOTIF-07**: User can enable Do Not Disturb mode (with schedule option) on both platforms
- [ ] **NOTIF-08**: User receives email digest for lapsed engagement (configurable frequency)

### Search & Discovery (SEARCH)

- [ ] **SEARCH-01**: User can search messages with filters (sender, date, channel) on both platforms
- [ ] **SEARCH-02**: User can search users by name/username on both platforms
- [ ] **SEARCH-03**: User can search forum threads and posts on both platforms
- [ ] **SEARCH-04**: User can use quick switcher (⌘K / Ctrl+K) for fast navigation on web
- [ ] **SEARCH-05**: User can browse and discover public communities via explore page on both
      platforms

### Moderation & Safety (MOD)

- [ ] **MOD-01**: User can report content (messages, posts, users) with categories on both platforms
- [ ] **MOD-02**: Moderators can review reports, take actions, and log decisions on both platforms
- [ ] **MOD-03**: User can block other users (blocks messaging, presence visibility, search) on both
      platforms
- [ ] **MOD-04**: Automod rules filter spam, banned words, and malicious links automatically
- [ ] **MOD-05**: AI-powered content moderation flags toxic content for review (step-by-step
      integration with provider API)
- [ ] **MOD-06**: Admin panel provides moderation dashboard with metrics on both platforms
- [ ] **MOD-07**: Appeal system allows users to contest moderation decisions

### Design System & UX (DESIGN)

- [ ] **DESIGN-01**: Professional design system with consistent design tokens (colors, typography,
      spacing, elevation, radii)
- [ ] **DESIGN-02**: Color palette follows existing gradient with industry-standard contrast ratios
      (WCAG AA minimum)
- [ ] **DESIGN-03**: Component library with consistent variants, states, and responsive behavior
      across all UI components
- [ ] **DESIGN-04**: Smooth animations and transitions throughout (loading states, page transitions,
      micro-interactions) using Framer Motion (web) and Reanimated (mobile)
- [ ] **DESIGN-05**: Dark mode and light mode with system preference detection on both platforms
- [ ] **DESIGN-06**: Professional empty states, error states, and skeleton loading patterns
      throughout

### Infrastructure & Scale (INFRA)

- [ ] **INFRA-01**: System handles 10,000+ concurrent WebSocket connections without degradation
- [ ] **INFRA-02**: All package versions synced to 0.9.47 baseline, increment together going forward
- [ ] **INFRA-03**: Backend routes audited — all erroring routes identified and fixed
- [ ] **INFRA-04**: Load tested with realistic traffic patterns (messaging, channels, presence,
      forums)
- [ ] **INFRA-05**: Reconnection handles gracefully (no thundering herd, exponential backoff with
      jitter)
- [ ] **INFRA-06**: Feature flags enable gradual rollout of new features
- [ ] **INFRA-07**: Rate limiting protects all public endpoints (Hammer + Redis)
- [ ] **INFRA-08**: Mobile app builds successfully for iOS and Android (Expo EAS)
- [ ] **INFRA-09**: Landing page updated to reflect v1.0 features and value proposition
- [ ] **INFRA-10**: App Store and Google Play submissions approved and published

---

## v2 Requirements (Deferred)

- [ ] Sealed sender (metadata protection) — complex, requires protocol-level changes
- [ ] Encrypted backups — requires secure cloud key escrow design
- [ ] Key transparency log — audit infrastructure not in scope for v1
- [ ] Desktop native app (Electron/Tauri) — web covers desktop for now
- [ ] Self-hosting support — single deployment target (Fly.io) for launch
- [ ] Database sharding — PostgreSQL handles alpha scale, shard post-100K users
- [ ] Noise suppression for calls — requires RNNoise/Krisp integration
- [ ] Call recording — conflicts with E2EE privacy promise
- [ ] Advanced AI features (smart replies, summarizer) — not differentiating for alpha
- [ ] Collaborative document editing — nice-to-have, not core
- [ ] Slow mode for channels — low priority moderation feature
- [ ] External security audit — budget not allocated ($25K–$120K), post-alpha

---

## Out of Scope

- **GraphQL API** — REST + Channels is sufficient, adding GraphQL increases complexity without value
- **Janus/mediasoup SFU** — LiveKit is the selected SFU for voice/video
- **Tailwind v4 migration** — too risky mid-project, CSS-first rewrite
- **React Native 0.83+ / Expo 55** — save for v1.1, breaking native modules risk
- **Elasticsearch** — MeiliSearch is simpler, sufficient for scale
- **Redis PubSub for Phoenix** — PG2 adapter is correct for Elixir clustering
- **Custom WebRTC SFU** — LiveKit handles this, no need to build from scratch
- **Third-party analytics (Mixpanel, Amplitude)** — OpenTelemetry + custom metrics sufficient
- **Facebook/TikTok OAuth** — low priority providers, defer

---

## Traceability

<!-- Updated by roadmap creation — maps REQ-IDs to phases -->

| REQ-ID    | Phase                    | Status      |
| --------- | ------------------------ | ----------- |
| AUTH-01   | Phase 1 — Foundation     | Not started |
| AUTH-02   | Phase 1 — Foundation     | Not started |
| AUTH-03   | Phase 1 — Foundation     | Not started |
| AUTH-04   | Phase 1 — Foundation     | Not started |
| AUTH-05   | Phase 1 — Foundation     | Not started |
| AUTH-06   | Phase 2 — Messaging Core | Not started |
| AUTH-07   | Phase 1 — Foundation     | Not started |
| AUTH-08   | Phase 3 — Social         | Not started |
| AUTH-09   | Phase 3 — Social         | Not started |
| AUTH-10   | Phase 3 — Social         | Not started |
| AUTH-11   | Phase 3 — Social         | Not started |
| AUTH-12   | Phase 10 — Launch        | Not started |
| AUTH-13   | Phase 10 — Launch        | Not started |
| AUTH-14   | Phase 1 — Foundation     | Not started |
| MSG-01    | Phase 2 — Messaging Core | Not started |
| MSG-02    | Phase 4 — Groups         | Not started |
| MSG-03    | Phase 4 — Groups         | Not started |
| MSG-04    | Phase 2 — Messaging Core | Not started |
| MSG-05    | Phase 2 — Messaging Core | Not started |
| MSG-06    | Phase 2 — Messaging Core | Not started |
| MSG-07    | Phase 2 — Messaging Core | Not started |
| MSG-08    | Phase 3 — Social         | Not started |
| MSG-09    | Phase 2 — Messaging Core | Not started |
| MSG-10    | Phase 9 — Scale & Polish | Not started |
| MSG-11    | Phase 9 — Scale & Polish | Not started |
| MSG-12    | Phase 9 — Scale & Polish | Not started |
| MSG-13    | Phase 3 — Social         | Not started |
| MSG-14    | Phase 3 — Social         | Not started |
| MSG-15    | Phase 9 — Scale & Polish | Not started |
| MSG-16    | Phase 3 — Social         | Not started |
| MSG-17    | Phase 3 — Social         | Not started |
| MSG-18    | Phase 2 — Messaging Core | Not started |
| MSG-19    | Phase 2 — Messaging Core | Not started |
| MSG-20    | Phase 9 — Scale & Polish | Not started |
| MSG-21    | Phase 4 — Groups         | Not started |
| MSG-22    | Phase 2 — Messaging Core | Not started |
| E2EE-01   | Phase 2 — Messaging Core | Not started |
| E2EE-02   | Phase 4 — Groups         | Not started |
| E2EE-03   | Phase 2 — Messaging Core | Not started |
| E2EE-04   | Phase 2 — Messaging Core | Not started |
| E2EE-05   | Phase 9 — Scale & Polish | Not started |
| E2EE-06   | Phase 9 — Scale & Polish | Not started |
| E2EE-07   | Phase 5 — Voice & Video  | Not started |
| E2EE-08   | Phase 2 — Messaging Core | Not started |
| E2EE-09   | Phase 2 — Messaging Core | Not started |
| FORUM-01  | Phase 6 — Forums         | Not started |
| FORUM-02  | Phase 6 — Forums         | Not started |
| FORUM-03  | Phase 6 — Forums         | Not started |
| FORUM-04  | Phase 6 — Forums         | Not started |
| FORUM-05  | Phase 6 — Forums         | Not started |
| FORUM-06  | Phase 6 — Forums         | Not started |
| FORUM-07  | Phase 6 — Forums         | Not started |
| FORUM-08  | Phase 6 — Forums         | Not started |
| FORUM-09  | Phase 6 — Forums         | Not started |
| FORUM-10  | Phase 6 — Forums         | Not started |
| FORUM-11  | Phase 6 — Forums         | Not started |
| FORUM-12  | Phase 6 — Forums         | Not started |
| FORUM-13  | Phase 6 — Forums         | Not started |
| FORUM-14  | Phase 6 — Forums         | Not started |
| FORUM-15  | Phase 6 — Forums         | Not started |
| FORUM-16  | Phase 6 — Forums         | Not started |
| GROUP-01  | Phase 4 — Groups         | Not started |
| GROUP-02  | Phase 4 — Groups         | Not started |
| GROUP-03  | Phase 4 — Groups         | Not started |
| GROUP-04  | Phase 4 — Groups         | Not started |
| GROUP-05  | Phase 4 — Groups         | Not started |
| GROUP-06  | Phase 4 — Groups         | Not started |
| GROUP-07  | Phase 4 — Groups         | Not started |
| GROUP-08  | Phase 4 — Groups         | Not started |
| GROUP-09  | Phase 4 — Groups         | Not started |
| GAME-01   | Phase 7 — Gamification   | Not started |
| GAME-02   | Phase 7 — Gamification   | Not started |
| GAME-03   | Phase 7 — Gamification   | Not started |
| GAME-04   | Phase 7 — Gamification   | Not started |
| GAME-05   | Phase 7 — Gamification   | Not started |
| GAME-06   | Phase 7 — Gamification   | Not started |
| GAME-07   | Phase 7 — Gamification   | Not started |
| GAME-08   | Phase 7 — Gamification   | Not started |
| GAME-09   | Phase 7 — Gamification   | Not started |
| GAME-10   | Phase 7 — Gamification   | Not started |
| GAME-11   | Phase 7 — Gamification   | Not started |
| GAME-12   | Phase 7 — Gamification   | Not started |
| CALL-01   | Phase 5 — Voice & Video  | Not started |
| CALL-02   | Phase 5 — Voice & Video  | Not started |
| CALL-03   | Phase 5 — Voice & Video  | Not started |
| CALL-04   | Phase 5 — Voice & Video  | Not started |
| CALL-05   | Phase 5 — Voice & Video  | Not started |
| CALL-06   | Phase 5 — Voice & Video  | Not started |
| CALL-07   | Phase 5 — Voice & Video  | Not started |
| CALL-08   | Phase 5 — Voice & Video  | Not started |
| PAY-01    | Phase 8 — Monetization   | Not started |
| PAY-02    | Phase 8 — Monetization   | Not started |
| PAY-03    | Phase 8 — Monetization   | Not started |
| PAY-04    | Phase 8 — Monetization   | Not started |
| PAY-05    | Phase 8 — Monetization   | Not started |
| PAY-06    | Phase 8 — Monetization   | Not started |
| PAY-07    | Phase 8 — Monetization   | Not started |
| PAY-08    | Phase 8 — Monetization   | Not started |
| PAY-09    | Phase 8 — Monetization   | Not started |
| PAY-10    | Phase 8 — Monetization   | Not started |
| NOTIF-01  | Phase 3 — Social         | Not started |
| NOTIF-02  | Phase 3 — Social         | Not started |
| NOTIF-03  | Phase 3 — Social         | Not started |
| NOTIF-04  | Phase 3 — Social         | Not started |
| NOTIF-05  | Phase 3 — Social         | Not started |
| NOTIF-06  | Phase 3 — Social         | Not started |
| NOTIF-07  | Phase 3 — Social         | Not started |
| NOTIF-08  | Phase 3 — Social         | Not started |
| SEARCH-01 | Phase 9 — Scale & Polish | Not started |
| SEARCH-02 | Phase 3 — Social         | Not started |
| SEARCH-03 | Phase 6 — Forums         | Not started |
| SEARCH-04 | Phase 9 — Scale & Polish | Not started |
| SEARCH-05 | Phase 9 — Scale & Polish | Not started |
| MOD-01    | Phase 4 — Groups         | Not started |
| MOD-02    | Phase 4 — Groups         | Not started |
| MOD-03    | Phase 3 — Social         | Not started |
| MOD-04    | Phase 4 — Groups         | Not started |
| MOD-05    | Phase 9 — Scale & Polish | Not started |
| MOD-06    | Phase 9 — Scale & Polish | Not started |
| MOD-07    | Phase 9 — Scale & Polish | Not started |
| DESIGN-01 | Phase 1 — Foundation     | Not started |
| DESIGN-02 | Phase 1 — Foundation     | Not started |
| DESIGN-03 | Phase 9 — Scale & Polish | Not started |
| DESIGN-04 | Phase 9 — Scale & Polish | Not started |
| DESIGN-05 | Phase 1 — Foundation     | Not started |
| DESIGN-06 | Phase 9 — Scale & Polish | Not started |
| INFRA-01  | Phase 9 — Scale & Polish | Not started |
| INFRA-02  | Phase 1 — Foundation     | Not started |
| INFRA-03  | Phase 1 — Foundation     | Not started |
| INFRA-04  | Phase 9 — Scale & Polish | Not started |
| INFRA-05  | Phase 1 — Foundation     | Not started |
| INFRA-06  | Phase 9 — Scale & Polish | Not started |
| INFRA-07  | Phase 9 — Scale & Polish | Not started |
| INFRA-08  | Phase 1 — Foundation     | Not started |
| INFRA-09  | Phase 10 — Launch        | Not started |
| INFRA-10  | Phase 10 — Launch        | Not started |

---

_Requirements: 136 across 13 categories | v2 deferred: 12 | Out of scope: 9_ _Generated: 2026-02-27
from research + user scoping | Traceability updated: 2026-02-27_
