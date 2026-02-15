# CGraph

<div align="center">

<img src="docs/assets/logo.png" alt="CGraph Logo" width="140" />

### The All-in-One Secure Communication Platform

#### Real-time messaging • Community forums • End-to-end encryption • Gamification • Subscription tiers

[![Version](https://img.shields.io/badge/version-0.9.26-green.svg)](CHANGELOG.md)
[![Status](https://img.shields.io/badge/status-production-brightgreen.svg)](#)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)

**Current version:** 0.9.26 (February 2026)

[🌐 Website](https://cgraph.org) · [📚 Documentation](https://docs.cgraph.org) ·
[🔌 API Reference](https://api.cgraph.org/docs)

</div>

---

## ⚠️ Proprietary Software

CGraph is **proprietary software**. Self-hosting is not permitted. All users must access CGraph
through the officially hosted platform at [cgraph.org](https://cgraph.org).

See [LICENSE](LICENSE) for complete terms.

---

## Why CGraph?

| Feature                   |              CGraph              | Competitors |
| ------------------------- | :------------------------------: | :---------: |
| **End-to-End Encryption** |     ✅ X3DH + Double Ratchet     |  ⚠️ Varies  |
| **OAuth Authentication**  |    ✅ Google, Apple, Facebook    |  ✅ Common  |
| **Community Forums**      |           ✅ Built-in            |     ❌      |
| **Gamification**          |   ✅ XP, Achievements, Quests    |     ❌      |
| **Subscription Tiers**    |   ✅ Free, Premium, Enterprise   |  ⚠️ Basic   |
| **Role Permissions**      |           ✅ Granular            |  ⚠️ Basic   |
| **Referral System**       | ✅ Tiered rewards & leaderboards |     ❌      |
| **Offline Support**       |    ✅ Full queue & auto-sync     | ⚠️ Limited  |

CGraph combines the best of modern communication platforms—real-time messaging, organized servers,
rich forums, end-to-end encryption, and gamification—all in one seamless experience.

---

## Features

### 💬 Real-Time Messaging

- Instant message delivery with typing indicators and read receipts
- End-to-end encryption using X3DH + Double Ratchet (Signal Protocol)
- Voice messages with waveform visualization
- Voice and video calls via WebRTC (1:1 and group calls)
- Message reactions, editing, deletion, and forwarding
- GIF search integration (Giphy/Tenor)
- Cross-platform sync (web, iOS, Android)

### 🏢 Servers & Channels

- Organized servers with unlimited channels
- Channel categories for organization
- Custom roles with 20+ granular permissions
- Invite links with expiration and usage limits
- Audit logs for moderation
- Custom emoji support

### 📰 Community Forums

- Forum posts with upvote/downvote
- Karma tracking and user rankings
- Nested comment threads with infinite depth
- Thread prefixes and categories
- Forum-specific leaderboards
- Moderator tools (pin, lock, remove, move)
- Rich text editor with code syntax highlighting
- RSS/Atom feed support for all forums

### 🎮 Gamification System

- **XP & Levels** - Earn experience from messaging, posting, and daily activity
- **Achievements** - 30+ achievements across 6 categories (Social, Content, Exploration, Mastery,
  Legendary, Secret)
- **Daily/Weekly Quests** - Complete objectives for bonus rewards
- **Streak System** - Maintain daily login streaks for XP multipliers (3+ days = 1.5x, 7+ days =
  2.0x)
- **Titles & Badges** - Unlock and equip cosmetic rewards
- **Virtual Currency** - Earn coins to spend in the marketplace
- **Leaderboards** - Compete globally and per-forum
- **Seasonal Events** - Time-limited challenges and rewards

### 🔐 Security & Privacy

- **E2EE Messaging** - AES-256-GCM encryption with X25519 key exchange (X3DH)
- **Double Ratchet** - Forward secrecy with per-message key derivation
- **Two-Factor Auth** - TOTP with backup codes
- **OAuth Support** - Google, Apple, Facebook, TikTok
- **HTTP-only Cookies** - XSS-immune token storage
- **Trusted Proxy Validation** - IP spoofing protection
- **MIME Type Verification** - Server-side file type validation via magic bytes
- **Zero-Knowledge Design** - Server cannot read encrypted messages
- **GDPR Compliance** - Full data export and deletion

### 💳 Subscription Tiers

| Tier           | Features                                              |
| -------------- | ----------------------------------------------------- |
| **Free**       | 5 forums/groups, basic features                       |
| **Starter**    | 10 forums/groups, custom themes                       |
| **Pro**        | 50 forums/groups, HD video, priority support          |
| **Business**   | Unlimited forums/groups, API access, analytics        |
| **Enterprise** | SSO/SAML, dedicated support, SLA, custom integrations |

### 📱 Mobile Apps

- Native iOS and Android apps via Expo
- Biometric authentication (Face ID, fingerprint)
- Push notifications
- Camera and media integration
- **Full offline support** - Queue messages, reactions, posts with auto-sync on reconnect
- Priority-based offline queue with exponential backoff
- Network state monitoring with automatic retry

### 🎁 Referral System

- Unique referral codes with easy sharing
- Tiered reward structure with progressive bonuses
- Real-time leaderboards (daily, weekly, monthly, all-time)
- Track referral status and conversions
- Claim rewards when tiers are reached
- Platform-aware sharing (iOS Share Sheet, Android intents)

---

## Getting Started

Visit **[cgraph.org](https://cgraph.org)** to create your account and start using CGraph.

### Web App

Access CGraph directly in your browser at [app.cgraph.org](https://app.cgraph.org).

### Mobile Apps

- **iOS**: Download from the [App Store](https://apps.apple.com/app/cgraph)
- **Android**: Download from [Google Play](https://play.google.com/store/apps/details?id=app.cgraph)

### API Access

For developers, CGraph provides a public API. See our
[API Documentation](https://api.cgraph.org/docs).

```bash
# Example: Get current user
curl -H "Authorization: Bearer YOUR_TOKEN" https://api.cgraph.org/v1/me
```

---

## Pricing

| Plan           | Price      | Features                                              |
| -------------- | ---------- | ----------------------------------------------------- |
| **Free**       | $0/forever | Unlimited messaging, 5 forums/groups, basic features  |
| **Starter**    | $4.99/mo   | 10 forums/groups, custom themes, file sharing (50MB)  |
| **Pro**        | $9.99/mo   | 50 forums/groups, HD video calls, 200MB uploads       |
| **Business**   | $19.99/mo  | Unlimited forums/groups, API access, analytics, 1GB   |
| **Enterprise** | Custom     | SSO/SAML, dedicated support, SLA, custom integrations |

Visit [cgraph.org/pricing](https://cgraph.org/pricing) for full details.

---

## Tech Stack

| Layer      | Technology                                         |
| ---------- | -------------------------------------------------- |
| Backend    | Elixir 1.17+ / Phoenix 1.8 / PostgreSQL 16         |
| Web        | React 19 / Vite / TailwindCSS / Zustand            |
| Mobile     | React Native 0.81 / Expo SDK 54                    |
| Real-time  | Phoenix Channels (WebSocket)                       |
| Encryption | X3DH + Double Ratchet / AES-256-GCM / X25519       |
| Payments   | Stripe (subscriptions, webhooks)                   |
| Hosting    | Fly.io (backend) / Vercel (web) / Cloudflare (CDN) |

---

## Architecture

CGraph uses a **dual-app architecture**:

```
┌──────────────────────┐              ┌──────────────────────┐
│     LANDING APP      │              │       WEB APP        │
│    cgraph.org        │              │   app.cgraph.org     │
│                      │              │                      │
│  • Marketing site    │   Login →    │  • Authenticated     │
│  • Pricing/Features  │  ─────────►  │  • Messages/Groups   │
│  • Legal pages       │              │  • Forums/Settings   │
│  • Company info      │              │  • Voice/Video       │
│                      │              │                      │
│   apps/landing/      │              │     apps/web/        │
└──────────────────────┘              └──────────────────────┘
          │                                      │
          └──────────────┬───────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │     BACKEND API      │
              │   api.cgraph.org     │
              │    (Fly.io)          │
              │                      │
              │  • Elixir/Phoenix    │
              │  • PostgreSQL        │
              │  • WebSocket         │
              │                      │
              │   apps/backend/      │
              └──────────────────────┘
```

### Why Two Apps?

Like many modern platforms (marketing site vs app):

- **Performance**: Landing page is lightweight (~200KB), app is feature-rich (~2MB)
- **SEO**: Landing app optimized for search engines and social sharing
- **Security**: Authenticated app doesn't expose marketing endpoints
- **Caching**: Landing can be CDN-cached, app is dynamic

### Deployment

| App     | URL            | Vercel Project Root | Purpose           |
| ------- | -------------- | ------------------- | ----------------- |
| Landing | cgraph.org     | `apps/landing`      | Marketing, SEO    |
| Web App | app.cgraph.org | `apps/web`          | Authenticated app |
| Backend | api.cgraph.org | `apps/backend`      | API (Fly.io)      |

See [CLAUDE.md](CLAUDE.md) for detailed architecture documentation.

---

## Support

- **Help Center**: [help.cgraph.org](https://help.cgraph.org)
- **Email**: hello@cgraph.org
- **Status**: [status.cgraph.org](https://status.cgraph.org)

---

## Legal

- [Terms of Service](https://cgraph.org/terms)
- [Privacy Policy](https://cgraph.org/privacy)
- [License](LICENSE)

---

<div align="center">

**[cgraph.org](https://cgraph.org)**

© 2025-2026 CGraph. All Rights Reserved.

</div>
