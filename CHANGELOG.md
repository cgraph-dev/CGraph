# Changelog

All notable changes to the CGraph project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-03-13

### 🚀 Launch

- First public release of CGraph

### Features

#### Messaging & Communication

- End-to-end encrypted messaging (PQXDH + Triple Ratchet + ML-KEM-768)
- Real-time 1:1 and group messaging with typing indicators and read receipts
- Message editing, deletion, replies, reactions, forwarding, pinning, bookmarks
- Links preview with OpenGraph metadata
- Disappearing messages with configurable timer
- Voice messages with waveform visualization
- File sharing with encryption at rest
- GIF integration
- Scheduled messages
- Full-text search (Meilisearch + PostgreSQL fallback)
- Secret Chat mode with ghost mode and panic wipe

#### Voice & Video

- Group voice and video calls with E2EE (LiveKit SFU)
- Screen sharing
- Voice channels (persistent, Discord-style)

#### Forums & Communities

- Real-time forums with 50+ customization options
- Thread-based discussions with tags
- BBCode + markdown content formatting
- Forum creator monetization (free/gated/hybrid tiers)
- Custom CSS, widgets, plugins, permission granularity
- RSS feed generation, forum rankings
- AI-powered content moderation pipeline
- Thread archiving

#### Groups & Channels

- Group creation with invite system
- Channel-based organization within groups
- Role-based permissions (admin, moderator, member, custom)
- Automod with configurable rules
- Custom emoji per group

#### Social & Profiles

- User profiles with onboarding flow
- Presence system (online/idle/DND/invisible)
- QR code login
- User blocking and privacy controls
- Discovery system for finding communities

#### Gamification & Cosmetics

- XP, achievements, titles
- Cosmetic shop with 103 profile frames, 30 effects, 42 avatar borders
- Cosmetic rarity system (free → mythic)
- Unlock engine (purchase, achievement, reputation, seasonal)
- Pulse reputation system with 6 levels (iron → diamond)
- Reputation rewards with milestone-based Node grants

#### Monetization

- Nodes virtual currency with wallet system
- Tipping between users
- Content unlocking with Nodes
- Premium subscriptions: Free, Premium ($14.99/mo), Enterprise ($29.99/mo)
- Creator economy: paid DMs, premium threads, forum monetization tiers
- Stripe Connect for creator payouts
- Boost system (visibility, pinned, highlighted, profile spotlight)
- KYC/AML compliance for high-value transactions

#### Authentication & Security

- Email/password + email verification
- OAuth (Google, Apple, Facebook, TikTok)
- Ethereum wallet auth with SIWE (EIP-4361) + WalletConnect v2
- TOTP-based two-factor authentication
- JWT access/refresh tokens
- Biometric authentication (mobile)
- Enterprise SSO (SAML/OIDC)
- Audit logging
- Rate limiting per tier

#### Infrastructure

- Elixir/Phoenix backend with WebSocket real-time
- React 19 web client
- React Native / Expo mobile client
- Database sharding with consistent hashing
- Multi-tier caching (L1 ETS + L2 Redis)
- CDN integration for media
- Observability stack (Prometheus, Grafana, Loki, Tempo)
- Circuit breaker reconnection patterns

#### Mobile

- iOS and Android native apps via Expo
- WatermelonDB offline sync
- Deep linking and universal links
- Push notifications (APNs + FCM)

### Platform Support

- Web: React 19 + Vite + Tailwind CSS
- iOS: Expo / React Native
- Android: Expo / React Native
- Backend: Elixir 1.18 / Phoenix 1.7 / OTP 27
