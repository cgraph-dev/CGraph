# CGraph

<div align="center">

<img src="docs/assets/cgraph-logo.svg" alt="CGraph Logo" width="140" />

### The All-in-One Secure Communication Platform

#### Real-time messaging • Community forums • End-to-end encryption • Web3 authentication • Gamification

[![Version](https://img.shields.io/badge/version-0.9.4-green.svg)](CHANGELOG.md)
[![Status](https://img.shields.io/badge/status-production-brightgreen.svg)](#)

**Current version:** 0.9.4 (January 2026)

[🌐 Website](https://cgraph.app) · [📚 Documentation](https://docs.cgraph.app) ·
[🔌 API Reference](https://api.cgraph.app/docs)

</div>

---

## Why CGraph?

| Feature                   |              CGraph              |    Competitors    |
| ------------------------- | :------------------------------: | :---------------: |
| **End-to-End Encryption** |        ✅ Double Ratchet         |     ⚠️ Varies     |
| **Web3/Wallet Auth**      |            ✅ Native             |        ❌         |
| **Community Forums**      |           ✅ Built-in            |        ❌         |
| **Gamification**          |   ✅ XP, Achievements, Quests    |        ❌         |
| **No Phone Required**     |                ✅                | ⚠️ Often required |
| **Role Permissions**      |           ✅ Granular            |     ⚠️ Basic      |
| **Referral System**       | ✅ Tiered rewards & leaderboards |        ❌         |
| **Offline Support**       |    ✅ Full queue & auto-sync     |    ⚠️ Limited     |

CGraph combines the best of modern communication platforms—real-time messaging, organized servers,
rich forums, end-to-end encryption, and gamification—all in one seamless experience.

---

## Features

### 💬 Real-Time Messaging

- Instant message delivery with typing indicators and read receipts
- End-to-end encryption using Double Ratchet protocol (industry-leading security)
- Voice messages with waveform visualization
- Voice and video calls via WebRTC (1:1 and group calls)
- Message reactions, editing, and deletion
- Cross-platform sync (web, iOS, Android)

### 🏢 Servers & Channels

- Organized servers with unlimited channels
- Channel categories for organization
- Custom roles with 20+ granular permissions
- Invite links with expiration and usage limits
- Audit logs for moderation
- Custom emoji support

### 📰 Community Forums

- Reddit-style posts with upvote/downvote
- Karma tracking and user rankings
- Nested comment threads
- Post categories and flairs
- Forum-specific leaderboards
- Moderator tools (pin, lock, remove)
- Rich text with code syntax highlighting

### 🎮 Gamification System

- **XP & Levels** - Earn experience from messaging, posting, and daily activity
- **Achievements** - 30+ achievements across 6 categories (Social, Content, Exploration, Mastery,
  Legendary, Secret)
- **Daily/Weekly Quests** - Complete objectives for bonus rewards
- **Streak System** - Maintain daily login streaks for XP multipliers (3+ days = 1.5x, 7+ days =
  2.0x)
- **Titles & Badges** - Unlock and equip cosmetic rewards
- **Virtual Currency** - Earn coins to spend in the shop
- **Leaderboards** - Compete globally and per-forum

### 🔐 Security & Privacy

- **E2EE Messaging** - AES-256-GCM encryption with X25519 key exchange
- **Wallet Authentication** - Login with Ethereum wallet (no email/password needed)
- **Two-Factor Auth** - TOTP with backup codes
- **OAuth Support** - Google, Apple, Facebook, TikTok
- **Zero-Knowledge Design** - Server cannot read encrypted messages
- **GDPR Compliance** - Full data export and deletion

### 🌐 Web3 Integration

- Ethereum wallet login (MetaMask, WalletConnect)
- NFT profile pictures
- Token-gated channels
- Cryptographic identity verification

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

Visit **[cgraph.app](https://cgraph.app)** to create your account and start using CGraph.

### Web App

Access CGraph directly in your browser at [app.cgraph.app](https://app.cgraph.app).

### Mobile Apps

- **iOS**: Download from the [App Store](https://apps.apple.com/app/cgraph)
- **Android**: Download from [Google Play](https://play.google.com/store/apps/details?id=app.cgraph)

### API Access

For developers, CGraph provides a public API. See our
[API Documentation](https://api.cgraph.app/docs).

```bash
# Example: Get current user
curl -H "Authorization: Bearer YOUR_TOKEN" https://api.cgraph.app/v1/me
```

---

## Pricing

| Plan           | Price      | Features                                         |
| -------------- | ---------- | ------------------------------------------------ |
| **Free**       | $0/forever | Unlimited messaging, 10 servers, basic features  |
| **Premium**    | $9/month   | Unlimited servers, HD video calls, custom themes |
| **Enterprise** | Custom     | SSO/SAML, API access, dedicated support, SLA     |

Visit [cgraph.app/pricing](https://cgraph.app/pricing) for full details.

---

## Support

- **Help Center**: [help.cgraph.app](https://help.cgraph.app)
- **Email**: support@cgraph.app
- **Status**: [status.cgraph.app](https://status.cgraph.app)

---

## Legal

- [Terms of Service](https://cgraph.app/terms)
- [Privacy Policy](https://cgraph.app/privacy)
- [License](LICENSE)

---

<div align="center">

**[cgraph.app](https://cgraph.app)**

© 2025-2026 CGraph. All Rights Reserved.

</div>
