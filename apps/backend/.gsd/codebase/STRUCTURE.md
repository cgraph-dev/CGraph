# CGraph Directory Structure

> Generated: 2026-03-04 | Version: 0.9.48 | Last updated: arch context (creators, SIWE, monetization)

## 1. Top-Level Layout

```
/CGraph/
├── apps/                          # Application packages
│   ├── backend/                   # Elixir/Phoenix API server
│   ├── web/                       # React 19 SPA (Vite)
│   ├── mobile/                    # React Native (Expo 54)
│   └── landing/                   # Marketing landing page (Vite)
├── packages/                      # Shared TypeScript packages
│   ├── animation-constants/       # Cross-platform animation values
│   ├── api-client/                # Resilient HTTP client (circuit breaker)
│   ├── crypto/                    # Signal Protocol E2EE implementation
│   ├── shared-types/              # TypeScript interfaces (API, models, events)
│   ├── socket/                    # Phoenix Channel typed client
│   └── utils/                     # Format, validation, permissions, HTTP factory
├── docs/                          # Project documentation
├── docs-website/                  # Docusaurus documentation site
├── infrastructure/                # Deployment, observability, IaC
├── scripts/                       # Codemods and maintenance scripts
├── package.json                   # Root package.json (workspaces, turbo scripts)
├── pnpm-workspace.yaml            # Workspace: apps/* + packages/*
├── turbo.json                     # Turborepo task definitions (build, dev, test, lint)
├── tsconfig.base.json             # Shared TypeScript config (ES2022, strict)
├── eslint.config.js               # Root ESLint config
├── commitlint.config.js           # Conventional commits enforcement
├── docker-compose.dev.yml         # Local dev services
├── vercel.json                    # Vercel deployment config
├── renovate.json                  # Dependency update automation
├── .size-limit.json               # Bundle size budgets
├── .pre-commit-config.yaml        # Pre-commit hooks (secret scanning)
├── .secrets.baseline              # detect-secrets baseline
├── .husky/                        # Git hooks (commitlint, lint-staged)
├── .github/                       # GitHub Actions, skills, issue templates
└── ...                            # Plus: LICENSE, README.md, CHANGELOG.md, SECURITY.md, etc.
```

---

## 2. `apps/backend/` — Elixir/Phoenix API

```
apps/backend/
├── mix.exs                        # Project config, deps (Phoenix 1.8, Ecto, Guardian, Oban, etc.)
├── mix.lock                       # Dependency lock file
├── Dockerfile                     # Production Docker build
├── fly.toml                       # Fly.io deployment config
├── fly.iad.toml                   # Fly.io IAD region config
├── config/
│   ├── config.exs                 # Base config (all envs)
│   ├── dev.exs                    # Development overrides
│   ├── test.exs                   # Test environment config
│   ├── prod.exs                   # Production compile-time config
│   ├── runtime.exs                # Runtime config (env vars, secrets, DB, Redis, S3)
│   └── stripe.exs                 # Stripe API configuration
├── lib/
│   ├── cgraph_web.ex              # Web module macros (controller, router, channel helpers)
│   ├── cgraph_web/
│   │   ├── endpoint.ex            # Phoenix endpoint (HTTP + WebSocket config)
│   │   ├── router.ex              # Main router (imports domain route modules)
│   │   ├── router/
│   │   │   ├── admin_routes.ex    # Admin dashboard, GDPR, moderation
│   │   │   ├── ai_routes.ex       # AI feature endpoints
│   │   │   ├── auth_routes.ex     # Login, register, OAuth, 2FA, wallet
│   │   │   ├── creator_routes.ex  # Creator monetization: Connect, paid forums, payouts, analytics
│   │   │   ├── forum_routes.ex    # Forum CRUD, boards, threads, subscribe/unsubscribe
│   │   │   ├── gamification_routes.ex  # XP, quests, shop, marketplace, coin bundles
│   │   │   ├── health_routes.ex   # Health checks, Stripe webhooks
│   │   │   ├── messaging_routes.ex # Conversations, messages, groups
│   │   │   ├── public_routes.ex   # Public forums, tiers, RSS
│   │   │   ├── sync_routes.ex     # Offline data sync
│   │   │   └── user_routes.ex     # Profiles, settings, friends, notifications
│   │   ├── controllers/
│   │   │   ├── api/
│   │   │   │   ├── v1/            # Versioned API controllers (100+ files)
│   │   │   │   │   ├── auth_controller.ex / auth_json.ex
│   │   │   │   │   ├── conversation_controller.ex / conversation_json.ex
│   │   │   │   │   ├── message_controller.ex / message_json.ex
│   │   │   │   │   ├── group_controller.ex / group_json.ex
│   │   │   │   │   ├── forum_controller.ex / forum_json.ex
│   │   │   │   │   ├── e2ee_controller.ex / e2ee_json.ex
│   │   │   │   │   ├── ... (100+ controller/json pairs)
│   │   │   │   │   └── web_push_controller.ex
│   │   │   │   ├── admin/         # Admin-specific controllers
│   │   │   │   ├── payment_controller.ex
│   │   │   │   ├── subscription_controller.ex
│   │   │   │   └── username_controller.ex
│   │   │   ├── admin/             # Admin dashboard controllers
│   │   │   ├── fallback_controller.ex  # Standardized error responses
│   │   │   ├── changeset_json.ex      # Ecto changeset error rendering
│   │   │   ├── error_json.ex          # Error JSON views
│   │   │   ├── health_controller.ex   # Health check endpoint
│   │   │   ├── stripe_webhook_controller.ex
│   │   │   └── ... (gamification, shop, cosmetics controllers)
│   │   ├── channels/
│   │   │   ├── user_socket.ex          # WebSocket entry point (JWT auth)
│   │   │   ├── conversation_channel.ex # DM/group chat real-time
│   │   │   ├── group_channel.ex        # Group events
│   │   │   ├── user_channel.ex         # Per-user notifications
│   │   │   ├── presence_channel.ex     # Online/offline tracking
│   │   │   ├── call_channel.ex         # WebRTC signaling
│   │   │   ├── webrtc_lobby_channel.ex # Call initiation
│   │   │   ├── forum_channel.ex        # Forum real-time
│   │   │   ├── thread_channel.ex       # Thread real-time
│   │   │   ├── gamification_channel.ex # XP/achievement events
│   │   │   ├── marketplace_channel.ex  # Marketplace updates
│   │   │   ├── events_channel.ex       # Seasonal events
│   │   │   ├── ai_channel.ex           # Streaming AI responses
│   │   │   ├── document_channel.ex     # Collaborative editing (Yjs)
│   │   │   ├── backpressure.ex         # Message flood prevention
│   │   │   ├── socket_security.ex      # Top-level socket security module
│   │   │   └── socket_security/        # Channel-level authorization
│   │   ├── plugs/
│   │   │   ├── auth_pipeline.ex        # Guardian JWT pipeline
│   │   │   ├── require_auth.ex         # Authentication guard
│   │   │   ├── require_admin.ex        # Admin authorization guard
│   │   │   ├── rate_limiter_v2.ex      # Sliding window rate limiter (tiered)
│   │   │   ├── security_headers.ex     # HSTS, CSP, X-Frame-Options
│   │   │   ├── cookie_auth.ex          # Cookie-to-Bearer translation
│   │   │   ├── api_version_plug.ex     # API versioning
│   │   │   ├── idempotency_plug.ex     # Idempotent requests
│   │   │   ├── audit_log_plug.ex       # Audit logging
│   │   │   ├── request_tracing.ex      # Distributed tracing
│   │   │   ├── correlation_id.ex       # Request correlation IDs
│   │   │   ├── sentry_context.ex       # Sentry error context
│   │   │   ├── etag_plug.ex            # HTTP ETag caching
│   │   │   ├── cors.ex                 # CORS configuration
│   │   │   └── ... (current_user, geo_router, raw_body, etc.)
│   │   ├── api/
│   │   │   ├── input_validation/       # Input validation modules
│   │   │   ├── input_validation.ex     # Request input validation
│   │   │   └── response.ex            # Standardized API responses
│   │   ├── error_tracker/             # Error tracking integration
│   │   ├── helpers/                   # View helpers
│   │   ├── templates/                 # HTML templates (email, admin)
│   │   ├── telemetry/                 # Web telemetry events
│   │   ├── validation/                # Request validation
│   │   ├── error_tracker.ex           # Error tracker module
│   │   ├── gettext.ex                 # i18n
│   │   ├── presence.ex               # Phoenix Presence module
│   │   └── telemetry.ex              # Web telemetry module
│   │
│   ├── cgraph/                        # === DOMAIN CONTEXTS ===
│   │   ├── application.ex             # OTP Application supervisor (entry point)
│   │   ├── repo.ex                    # Primary Ecto repository
│   │   ├── read_repo.ex               # Read replica repository
│   │   ├── snowflake.ex               # Distributed Snowflake ID generator
│   │   ├── pagination.ex              # Cursor-based pagination
│   │   ├── circuit_breaker.ex         # Circuit breaker pattern
│   │   │
│   │   ├── accounts/                  # User management context
│   │   │   ├── user.ex               # User Ecto schema
│   │   │   ├── user/                  # User sub-modules
│   │   │   ├── authentication.ex      # Login/credential verification
│   │   │   ├── registration.ex        # User registration
│   │   │   ├── session.ex            # Session schema
│   │   │   ├── sessions.ex           # Session management
│   │   │   ├── profile.ex            # User profile
│   │   │   ├── settings.ex           # User settings
│   │   │   ├── friend_system.ex      # Friend requests/management
│   │   │   ├── friendship.ex         # Friendship schema
│   │   │   ├── friends/              # Friend sub-modules
│   │   │   ├── wallet_auth/          # Ethereum wallet authentication (SIWE EIP-4361)
│   │   │   ├── token.ex              # Auth token schema
│   │   │   ├── push_token.ex         # Push notification token
│   │   │   ├── email_verification.ex # Email verification
│   │   │   ├── password_reset.ex     # Password reset flow
│   │   │   ├── recovery_code.ex      # 2FA recovery codes
│   │   │   ├── username_service.ex   # Username management
│   │   │   └── ... (search, sync, lookup, member_directory)
│   │   ├── accounts.ex               # Accounts context facade
│   │   │
│   │   ├── creators/                  # Creator monetization context
│   │   │   ├── creators.ex            # Creators context facade (delegates to sub-modules)
│   │   │   ├── connect_onboarding.ex  # Stripe Connect Express account creation + KYC flow
│   │   │   ├── paid_subscription.ex   # Paid forum subscription management (Stripe Subscriptions)
│   │   │   ├── earnings.ex            # Earnings ledger, balance calculation, analytics
│   │   │   ├── payout.ex              # Creator payout/withdrawal requests (Stripe Transfers)
│   │   │   ├── content_gate.ex        # Content gating for paid forums (teaser vs full access)
│   │   │   ├── creator_earning.ex     # CreatorEarning Ecto schema (earnings ledger rows)
│   │   │   ├── creator_payout.ex      # CreatorPayout Ecto schema (withdrawal records)
│   │   │   └── paid_forum_subscription.ex # PaidForumSubscription Ecto schema
│   │   │
│   │   ├── messaging/                 # Messaging context
│   │   │   ├── message.ex            # Message schema
│   │   │   ├── conversation.ex       # Conversation schema
│   │   │   ├── conversations.ex      # Conversation queries
│   │   │   ├── messages.ex           # Message CRUD
│   │   │   ├── core_messages.ex      # Core message operations
│   │   │   ├── message_operations.ex # Complex message operations
│   │   │   ├── reaction.ex           # Reaction schema
│   │   │   ├── reactions.ex          # Reaction actions
│   │   │   ├── read_receipts.ex      # Read receipt tracking
│   │   │   ├── delivery_tracking.ex  # Delivery status tracking
│   │   │   ├── delivery_receipt.ex   # Delivery receipt schema
│   │   │   ├── saved_messages.ex     # Saved/bookmarked messages
│   │   │   ├── private_message.ex    # PM schema
│   │   │   ├── private_message_system.ex # PM operations
│   │   │   ├── voice_message/        # Voice message recording/playback
│   │   │   ├── repositories/         # Data access layer
│   │   │   └── ... (search, sync, pm_draft, pm_folder)
│   │   ├── messaging.ex              # Messaging context facade
│   │   │
│   │   ├── groups/                    # Groups context (Discord-like)
│   │   │   ├── group.ex              # Group schema
│   │   │   ├── channel.ex            # Channel schema
│   │   │   ├── channel_category.ex   # Channel category schema
│   │   │   ├── member.ex             # Group member schema
│   │   │   ├── role.ex               # Role schema
│   │   │   ├── invite.ex             # Invite schema
│   │   │   ├── group_ban.ex          # Ban schema
│   │   │   ├── custom_emoji.ex       # Custom emoji schema
│   │   │   ├── automod.ex            # Auto-moderation rules
│   │   │   ├── permission_overwrite.ex # Per-channel permission overrides
│   │   │   ├── repositories/         # Data access layer
│   │   │   └── ... (operations, channels, members, roles, invites, emojis, sync)
│   │   ├── groups.ex                  # Groups context facade
│   │   │
│   │   ├── forums/                    # Forums context (full forum engine)
│   │   │   ├── forum.ex              # Forum schema
│   │   │   ├── board.ex              # Board schema
│   │   │   ├── thread.ex             # Thread schema
│   │   │   ├── post.ex               # Post schema
│   │   │   ├── comment.ex            # Comment schema
│   │   │   ├── category.ex           # Category schema
│   │   │   ├── poll.ex / poll_vote.ex # Polling system
│   │   │   ├── vote.ex / voting.ex   # Voting system
│   │   │   ├── subscription.ex       # Forum subscriptions
│   │   │   ├── custom_emoji.ex       # Forum custom emojis
│   │   │   ├── moderation.ex         # Forum moderation
│   │   │   ├── leaderboard.ex        # Forum leaderboard
│   │   │   ├── rss.ex               # RSS feed generation
│   │   │   ├── ranking_engine.ex     # Post ranking algorithm
│   │   │   ├── core/                 # Core forum operations
│   │   │   ├── repositories/         # Data access layer
│   │   │   └── ... (60+ files: permissions, search, feeds, plugins, etc.)
│   │   ├── forums.ex                  # Forums context facade
│   │   │
│   │   ├── gamification/              # Gamification context
│   │   │   ├── achievement.ex         # Achievement schema
│   │   │   ├── quest.ex              # Quest schema
│   │   │   ├── shop_item.ex          # Shop item schema
│   │   │   ├── marketplace_item.ex   # Marketplace item schema
│   │   │   ├── coin_transaction.ex   # Virtual currency transactions
│   │   │   ├── xp_transaction.ex     # XP transactions
│   │   │   ├── title.ex              # User title schema
│   │   │   ├── avatar_border.ex      # Avatar border schema
│   │   │   ├── chat_effect.ex        # Chat effect schema
│   │   │   ├── seasonal_event.ex     # Seasonal event schema
│   │   │   ├── battle_pass_tier.ex   # Battle pass schema
│   │   │   ├── achievement_system.ex # Achievement logic
│   │   │   ├── quest_system.ex       # Quest logic
│   │   │   ├── currency_system.ex    # Economy logic
│   │   │   ├── leaderboard_system.ex # Leaderboard logic
│   │   │   ├── marketplace.ex        # Marketplace logic
│   │   │   ├── event_system.ex       # Event logic
│   │   │   ├── title_shop_system.ex  # Title shop logic
│   │   │   ├── events/               # Event sub-modules
│   │   │   ├── repositories/         # Data access layer
│   │   │   └── ... (34 entries total — schemas, systems, events, repositories)
│   │   ├── gamification.ex            # Gamification context facade
│   │   │
│   │   ├── notifications/             # Notifications context
│   │   │   ├── notification.ex        # Schema
│   │   │   ├── notifications.ex       # CRUD
│   │   │   ├── delivery.ex           # Delivery logic
│   │   │   ├── push_service/         # Push notification service
│   │   │   ├── push_service.ex       # Push notification top-level module
│   │   │   ├── push_tokens.ex        # Device push token management
│   │   │   └── queries.ex            # Query helpers
│   │   │
│   │   ├── encryption/                # Encryption context
│   │   │   ├── core.ex               # Core encryption ops
│   │   │   ├── encrypted_field.ex    # Ecto encrypted field type
│   │   │   ├── encrypted_map.ex      # Ecto encrypted map type
│   │   │   ├── hashing.ex            # Hashing utilities
│   │   │   └── key_management.ex     # Key management
│   │   │
│   │   ├── crypto.ex                  # Crypto context facade
│   │   ├── crypto/                    # Backend E2EE crypto context
│   │   │   ├── encryption.ex         # Encryption utilities
│   │   │   ├── hashing.ex            # Hashing utilities
│   │   │   ├── e2ee.ex               # E2EE top-level module
│   │   │   └── e2ee/                 # E2EE sub-modules
│   │   │
│   │   ├── ai/                        # AI context
│   │   │   ├── llm_client.ex         # LLM API client (via Req)
│   │   │   ├── sentiment.ex          # Sentiment analysis
│   │   │   ├── smart_replies.ex      # AI-generated reply suggestions
│   │   │   ├── moderation.ex         # AI content moderation
│   │   │   └── summarizer.ex         # Conversation summarization
│   │   │
│   │   ├── collaboration/             # Real-time collaboration context
│   │   │   ├── document.ex           # Document schema
│   │   │   └── document_server.ex    # GenServer for Yjs CRDT sync
│   │   │
│   │   ├── webrtc/                    # WebRTC context
│   │   │   ├── webrtc.ex             # WebRTC facade
│   │   │   ├── signaling.ex          # WebRTC signaling
│   │   │   ├── room.ex               # Call room schema
│   │   │   ├── participant.ex        # Call participant schema
│   │   │   ├── calls.ex              # Call operations
│   │   │   ├── call_history.ex       # Call history tracking
│   │   │   └── room_utils.ex         # Room utilities
│   │   │
│   │   ├── auth/                      # Auth utilities
│   │   │   ├── token_manager/        # JWT token lifecycle management
│   │   │   └── token_manager.ex      # Token manager module
│   │   │
│   │   ├── security/                  # Security context
│   │   │   ├── abuse_detection.ex    # Abuse pattern detection
│   │   │   ├── account_lockout/      # Progressive account lockout
│   │   │   ├── account_lockout.ex    # Account lockout module
│   │   │   ├── input_validator.ex    # Input sanitization
│   │   │   ├── jwt_key_rotation.ex   # JWT key rotation
│   │   │   ├── password_breach_check.ex # HaveIBeenPwned check
│   │   │   ├── token_blacklist/      # JWT revocation (Redis)
│   │   │   ├── token_blacklist.ex    # Token blacklist module
│   │   │   ├── totp/                 # TOTP 2FA implementation
│   │   │   └── totp.ex               # TOTP module
│   │   │
│   │   ├── cache/                     # 3-tier caching
│   │   │   ├── l1.ex                 # L1 ETS cache
│   │   │   ├── l2.ex                 # L2 Cachex cache
│   │   │   ├── l3.ex                 # L3 Redis cache
│   │   │   ├── tiered.ex            # Tiered cache orchestrator
│   │   │   ├── unified.ex           # Unified cache interface
│   │   │   ├── distributed/         # Distributed cache logic
│   │   │   ├── distributed.ex       # Distributed cache module
│   │   │   ├── redis_pool.ex        # Redis connection pool
│   │   │   ├── stampede.ex          # Stampede/thundering herd protection
│   │   │   ├── tags.ex              # Cache tag-based invalidation
│   │   │   └── telemetry.ex         # Cache hit/miss metrics
│   │   │
│   │   ├── moderation/                # Moderation context
│   │   │   ├── report.ex             # Report schema
│   │   │   ├── reports.ex            # Reports context
│   │   │   ├── appeal.ex             # Appeal schema
│   │   │   ├── appeals.ex            # Appeals context
│   │   │   ├── enforcement.ex        # Enforcement actions
│   │   │   ├── review_action.ex      # Review action schema
│   │   │   ├── user_restriction.ex   # User restrictions
│   │   │   └── stats.ex              # Moderation statistics
│   │   │
│   │   ├── search/                    # Search context
│   │   │   ├── search_engine/        # Full-text search engine
│   │   │   ├── search_engine.ex      # Search engine facade
│   │   │   ├── backend.ex            # Search backend
│   │   │   ├── indexer.ex            # Search indexer
│   │   │   ├── messages.ex           # Message search
│   │   │   └── users.ex             # User search
│   │   │
│   │   ├── workers/                   # Oban background workers
│   │   │   ├── notification_worker.ex
│   │   │   ├── scheduled_message_worker.ex
│   │   │   ├── search_index_worker.ex
│   │   │   ├── message_archival_worker.ex
│   │   │   ├── leaderboard_warm.ex
│   │   │   ├── event_reward_distributor.ex
│   │   │   ├── cleanup_worker.ex
│   │   │   ├── database_backup.ex
│   │   │   ├── webhook_delivery_worker.ex
│   │   │   ├── hard_delete_user.ex    # GDPR hard delete
│   │   │   ├── orchestrator/          # Multi-step job orchestrator
│   │   │   └── ... (email, push, dead letter, partition manager)
│   │   │
│   │   ├── supervisors/               # OTP supervisors
│   │   │   ├── cache_supervisor.ex    # Cache service supervision
│   │   │   ├── security_supervisor.ex # Security service supervision
│   │   │   └── worker_supervisor.ex   # Worker/Oban supervision
│   │   │
│   │   ├── oauth/                     # OAuth providers
│   │   │   ├── providers.ex           # Provider configuration
│   │   │   ├── apple.ex              # Apple Sign In
│   │   │   ├── config.ex             # OAuth config
│   │   │   └── user_manager.ex       # OAuth user creation/linking
│   │   │
│   │   ├── subscriptions/             # Premium tiers
│   │   │   ├── subscriptions.ex      # Subscriptions context facade
│   │   │   ├── tier_limits/          # Feature gating per tier
│   │   │   ├── tier_limits.ex        # Tier limits module
│   │   │   ├── tier_feature.ex       # Feature schema
│   │   │   ├── tier_limit.ex         # Limit schema
│   │   │   └── user_tier_override.ex # Per-user tier overrides
│   │   │
│   │   ├── presence/                  # Online presence tracking
│   │   │   ├── tracker.ex            # Presence tracker
│   │   │   ├── store.ex              # Presence store
│   │   │   ├── sampled.ex            # Sampled presence module
│   │   │   ├── sampled/              # Sampled presence for scale
│   │   │   └── queries.ex            # Presence queries
│   │   │
│   │   ├── webhooks/                  # Outbound webhooks
│   │   │   ├── endpoint.ex           # Webhook endpoint schema
│   │   │   ├── endpoints.ex          # Webhook endpoints context
│   │   │   ├── delivery.ex           # Delivery schema
│   │   │   ├── deliveries.ex         # Delivery tracking context
│   │   │   └── signature.ex          # HMAC signature verification
│   │   │
│   │   ├── data_export/               # GDPR data export
│   │   │   ├── processor.ex          # Export pipeline
│   │   │   ├── formatter.ex          # Data formatting
│   │   │   ├── delivery.ex           # Export delivery
│   │   │   ├── server.ex             # Export GenServer
│   │   │   └── storage.ex            # Export storage
│   │   │
│   │   ├── storage/                   # File storage (S3/R2)
│   │   ├── uploads/                   # File upload management
│   │   ├── redis/                     # Redis wrapper
│   │   ├── rate_limiter/              # Rate limiting
│   │   ├── guardian/                  # Guardian JWT config
│   │   ├── permissions/               # RBAC permission checking
│   │   ├── feature_flags/             # Runtime feature toggles
│   │   ├── telemetry/                 # Application telemetry
│   │   ├── tracing/                   # OpenTelemetry tracing
│   │   ├── metrics/                   # Prometheus metrics
│   │   ├── api_versioning/            # API version management
│   │   ├── idempotency/               # Idempotent request handling
│   │   ├── batch_processor/           # Batch processing
│   │   ├── calendar/                  # Calendar events
│   │   ├── announcements/             # System announcements
│   │   ├── customizations/            # User customizations
│   │   ├── reputation/                # Reputation scoring
│   │   ├── referrals/                 # Referral system
│   │   ├── audit/                     # Audit logging
│   │   ├── events/                    # Typed domain events
│   │   ├── chaos/                     # Chaos testing support
│   │   ├── http/                      # HTTP client utilities
│   │   ├── mailer/                    # Email sending (Swoosh)
│   │   ├── jobs/                      # Job queue management
│   │   ├── query/                     # Query optimization utilities
│   │   ├── request_context/           # Request context propagation
│   │   ├── error_reporter/            # Error reporting utilities
│   │   ├── health_check/              # Health check logic
│   │   ├── ... (many contexts also have companion .ex facade files, e.g. accounts.ex, messaging.ex, etc.)
│   │   ├── services/registry/         # Service registry
│   │   ├── services/registry.ex       # Service registry module
│   │   ├── performance/               # Performance monitoring
│   │   ├── admin/                     # Admin context
│   │   │   └── metrics.ex            # Admin metrics
│   │   └── repo/                      # Repository extensions
│   │       └── healthcheck.ex         # Database health checks
│   │
│   └── mix/                           # Custom Mix tasks
│
├── priv/
│   ├── repo/
│   │   ├── migrations/                # 90+ Ecto migrations (2024-12 to 2026-03)
│   │   │   ├── 20241201000001_create_users.exs
│   │   │   ├── 20241201000003_create_conversations_and_messages.exs
│   │   │   ├── 20241201000004_create_groups.exs
│   │   │   ├── 20241201000005_create_forums.exs
│   │   │   ├── 20260111000002_create_gamification_tables.exs
│   │   │   ├── 20260213000001_partition_messages_table.exs
│   │   │   ├── 20260220000001_create_e2ee_kyber_prekeys.exs
│   │   │   ├── 20260220120000_create_collaboration_documents.exs
│   │   │   ├── 20260302600005_add_creator_monetization.exs  # Creator tables: earnings, payouts, paid_forum_subscriptions
│   │   │   ├── *_seed_remaining_achievements_and_quests.exs  # Gamification seed data
│   │   │   └── ... (90+ migration files total)
│   │   ├── seeds.exs                  # Database seed script
│   │   └── seeds/                     # Seed data modules
│   └── static/                        # Static assets served by Phoenix
│
├── test/                              # ExUnit test suite
├── .credo.exs                         # Credo linting config
├── .sobelow-conf                      # Security scanner config
├── .tool-versions                     # asdf version manager (Elixir/Erlang versions)
└── coveralls.json                     # Test coverage config
```

---

## 3. `apps/web/` — React 19 Web Application

```
apps/web/
├── package.json                       # @cgraph/web — React 19, Vite, Zustand, TanStack Query
├── vite.config.ts                     # Vite config with SWC, path aliases (@/ → src/)
├── tsconfig.json                      # TypeScript config
├── tsconfig.app.json                  # App-specific TS config
├── tsconfig.node.json                 # Node/Vite TS config
├── tailwind.config.js                 # Tailwind CSS config
├── postcss.config.js                  # PostCSS config
├── eslint.config.js                   # ESLint with architecture enforcement
├── .eslint-architecture.yaml          # Architecture boundary rules
├── index.html                         # SPA entry HTML
├── playwright.config.ts               # E2E test config
├── Dockerfile                         # Production Docker build
├── vercel.json                        # Vercel deployment overrides
│
├── src/
│   ├── main.tsx                       # ★ Entry point — React root, providers, QueryClient
│   ├── App.tsx                        # Root component — routes, global handlers, auth init
│   ├── vite-env.d.ts                  # Vite type declarations
│   ├── index.css                      # Global CSS (Tailwind base)
│   ├── i18n.ts                        # i18next initialization
│   │
│   ├── routes/                        # Routing layer
│   │   ├── app-routes.tsx             # Complete route tree
│   │   ├── auth-initializer.tsx       # Token refresh on app load
│   │   ├── guards.tsx                 # ProtectedRoute, AdminRoute, ProfileRedirectRoute
│   │   ├── lazyPages.ts              # React.lazy() page imports
│   │   ├── __tests__/                 # Route tests
│   │   └── route-groups/             # Modular route group definitions
│   │       ├── index.ts
│   │       ├── auth-routes.tsx
│   │       ├── dev-routes.tsx
│   │       ├── forum-routes.tsx
│   │       ├── public-routes.tsx
│   │       └── settings-routes.tsx
│   │
│   ├── modules/                       # ★ Feature modules (DDD-style)
│   │   ├── auth/                      # Authentication module
│   │   │   ├── api/                   # Auth API calls
│   │   │   ├── components/            # Login, Register, OAuth buttons
│   │   │   ├── hooks/                 # useAuth, useOAuth hooks
│   │   │   ├── store/                 # useAuthStore (Zustand)
│   │   │   ├── types/                 # Auth types
│   │   │   └── index.ts
│   │   ├── chat/                      # Messaging module
│   │   │   ├── api/                   # Chat API calls
│   │   │   ├── components/            # MessageList, ChatInput, ConversationList
│   │   │   ├── hooks/                 # useMessages, useConversation
│   │   │   ├── store/                 # useChatStore (Zustand)
│   │   │   ├── types/                 # Chat types
│   │   │   └── index.ts
│   │   ├── calls/                     # Voice/video calls module
│   │   │   ├── components/            # CallScreen, IncomingCallHandler
│   │   │   ├── store/                 # useIncomingCallStore
│   │   │   └── index.ts
│   │   ├── forums/                    # Forums module
│   │   │   ├── api/ | components/ | hooks/ | store/ | types/ | pages/ | utils/
│   │   │   └── index.ts
│   │   ├── gamification/              # Gamification module
│   │   │   ├── api/ | components/ | hooks/ | store/ | types/
│   │   │   └── index.ts
│   │   ├── groups/                    # Groups module
│   │   │   ├── api/ | components/ | hooks/ | store/ | types/
│   │   │   └── index.ts
│   │   ├── moderation/                # Moderation module
│   │   ├── premium/                   # Premium/subscription module
│   │   ├── search/                    # Search module
│   │   ├── settings/                  # Settings module (includes customization store)
│   │   ├── social/                    # Social module (friends, profile, notifications)
│   │   └── admin/                     # Admin dashboard module
│   │
│   ├── stores/                        # ★ Unified store exports
│   │   ├── index.ts                   # Re-exports all Zustand stores from modules
│   │   ├── __tests__/                 # Store tests
│   │   └── theme/                     # Theme store
│   │       ├── store.ts | themeStore.ts
│   │       ├── actions.ts | selectors.ts | presets.ts
│   │       ├── index.ts
│   │       ├── __tests__/
│   │       └── types.ts
│   │
│   ├── pages/                         # ★ Page components (route targets)
│   │   ├── messages/                  # Messages pages
│   │   ├── groups/                    # Groups pages
│   │   ├── forums/                    # Forums pages
│   │   ├── auth/                      # Auth pages (login, register)
│   │   ├── profile/                   # Profile pages
│   │   ├── settings/                  # Settings pages
│   │   ├── gamification/              # Gamification pages
│   │   ├── premium/                   # Premium pages
│   │   ├── admin/                     # Admin pages
│   │   ├── calls/                     # Call pages
│   │   ├── friends/                   # Friends pages
│   │   ├── calendar/                  # Calendar page
│   │   ├── community/ | customize/ | leaderboard/ | members/
│   │   ├── notifications/ | referrals/ | search/ | security/ | social/
│   │   └── not-found.tsx              # 404 page
│   │
│   ├── components/                    # Shared components
│   │   ├── ui/                        # ★ Atomic UI primitives (Radix-based)
│   │   │   ├── button.tsx | card.tsx | dialog.tsx | input.tsx
│   │   │   ├── avatar.tsx | badge.tsx | modal.tsx | select.tsx
│   │   │   ├── tooltip.tsx | popover.tsx | tabs.tsx | switch.tsx
│   │   │   ├── skeleton.tsx | toast.tsx | glass-card.tsx
│   │   │   ├── animated-avatar/ | animated-border.tsx
│   │   │   └── ... (50 UI components with Storybook stories)
│   │   ├── navigation/               # Nav components
│   │   ├── layout/                    # Layout primitives
│   │   ├── content/                   # Content display components
│   │   ├── user/                      # User-related components
│   │   ├── media/                     # Media components
│   │   ├── enhanced/                  # Enhanced/animated variants
│   │   ├── feedback/                  # Feedback UI (spinners, progress, etc.)
│   │   ├── bbcode-editor/            # BBCode rich text editor
│   │   ├── three/                     # Three.js 3D components
│   │   ├── shaders/                   # WebGL shaders
│   │   ├── theme/                     # Theme-related components
│   │   ├── animated-logo/            # Animated logo component
│   │   ├── error-boundary.tsx        # React error boundary
│   │   ├── dev/                       # Dev-only components
│   │   ├── index.ts                   # Component barrel exports
│   │   ├── __tests__/                 # Component tests
│   │   └── logo/                      # Logo component
│   │
│   ├── shared/                        # Cross-cutting shared code
│   │   ├── index.ts                  # Shared barrel exports
│   │   ├── components/                # Shared compound components
│   │   │   ├── quick-switcher.tsx    # ⌘K quick switcher
│   │   │   ├── page-transition.tsx   # Route transitions
│   │   │   ├── keyboard-shortcuts-modal.tsx
│   │   │   ├── presence-status-selector.tsx
│   │   │   ├── push-notification-prompt.tsx
│   │   │   ├── animated-empty-state.tsx
│   │   │   ├── avatar-lightbox.tsx
│   │   │   ├── last-seen-badge.tsx
│   │   │   ├── notification-actions.tsx
│   │   │   ├── index.ts
│   │   │   ├── feedback/              # Feedback components
│   │   │   ├── layout/               # Shared layout components
│   │   │   ├── ui/                    # Shared UI components
│   │   │   └── __tests__/             # Component tests
│   │   ├── hooks/                     # Shared custom hooks
│   │   ├── types/                     # Shared types
│   │   └── utils/                     # Shared utilities
│   │
│   ├── layouts/                       # Page layouts
│   │   ├── app-layout/               # App layout module
│   │   ├── app-layout.tsx            # Main authenticated layout (sidebar + content)
│   │   ├── auth-layout.tsx           # Login/register layout
│   │   ├── customize-layout.tsx      # Customization layout
│   │   └── social-layout.tsx         # Social section layout
│   │
│   ├── hooks/                         # Global custom hooks
│   │   ├── facades/                   # Hook facades for complex logic
│   │   ├── __tests__/                 # Hook tests
│   │   ├── index.ts                   # Hook re-exports
│   │   ├── useDebounce.ts | useLocalStorage.ts | useMediaQuery.ts
│   │   ├── useClickOutside.ts | useCopyToClipboard.ts
│   │   ├── useAdaptiveInterval.ts | useAdaptiveMotion.ts
│   │   ├── useNotification.ts | useToast.ts | useWindowSize.ts
│   │   └── useReducedMotion.ts
│   │
│   ├── lib/                           # Core libraries
│   │   ├── api.ts                    # ★ Base API client (Fetch + CircuitBreaker)
│   │   ├── tokenService.ts           # JWT token management
│   │   ├── socket/                    # Phoenix socket manager
│   │   │   ├── socket-manager.ts     # Connection lifecycle
│   │   │   ├── conversationChannel.ts | groupChannel.ts | userChannel.ts
│   │   │   ├── forumChannel.ts | threadChannel.ts
│   │   │   ├── presenceManager.ts    # Presence tracking
│   │   │   ├── channelHandlers.ts    # Channel event handlers
│   │   │   ├── connectionLifecycle.ts # Connection lifecycle
│   │   │   ├── socket-manager-forum-thread.ts # Forum thread socket
│   │   │   ├── socketUtils.ts        # Socket utilities
│   │   │   ├── index.ts | types.ts
│   │   │   └── __tests__/
│   │   ├── crypto/                    # E2EE client implementation
│   │   │   ├── e2ee.ts              # Main E2EE interface
│   │   │   ├── doubleRatchet.ts     # Double Ratchet session
│   │   │   ├── sessionManager.ts    # Session management
│   │   │   ├── secureStorage.ts     # Encrypted key storage
│   │   │   ├── e2eeStore.ts         # E2EE state store
│   │   │   ├── e2ee.secure.ts       # Secure E2EE operations
│   │   │   ├── migrateToSecureStorage.ts # Storage migration
│   │   │   ├── index.ts
│   │   │   ├── double-ratchet/      # Double Ratchet sub-modules
│   │   │   ├── e2ee/                # E2EE sub-modules
│   │   │   ├── e2ee-secure/         # Secure E2EE operations
│   │   │   ├── e2ee-store/          # E2EE store sub-modules
│   │   │   ├── protocol/            # Protocol implementation
│   │   │   ├── secure-storage/      # Secure storage sub-modules
│   │   │   ├── session-manager/     # Session management sub-modules
│   │   │   └── __tests__/
│   │   ├── webrtc/                    # WebRTC client
│   │   │   ├── webrtcService.ts     # WebRTC service
│   │   │   ├── peerConnection.ts    # Peer connection management
│   │   │   ├── useCall.ts           # Call hook
│   │   │   ├── index.ts | types.ts
│   │   │   └── __tests__/
│   │   ├── ai/                        # AI features client
│   │   │   ├── aiService.ts          # AI API integration
│   │   │   ├── ai-message-engine.ts  # AI message processing
│   │   │   ├── smartReplies.ts       # Smart reply suggestions
│   │   │   ├── sentimentAnalysis.ts  # Sentiment analysis
│   │   │   ├── summarizer.ts         # Chat summarization
│   │   │   ├── contentModeration.ts  # Content moderation
│   │   │   ├── conversationInsights.ts # Conversation insights
│   │   │   ├── topicExtraction.ts    # Topic extraction
│   │   │   ├── theme-engine/         # AI-powered theme generation
│   │   │   ├── theme-engine.ts       # Theme engine module
│   │   │   ├── languageDetection.ts
│   │   │   ├── data.ts | index.ts | types.ts
│   │   │   └── __tests__/
│   │   ├── collaboration/             # Collaborative editing
│   │   │   ├── useCollaborativeEditor.ts # Yjs editor hook
│   │   │   └── phoenix-provider.ts   # Phoenix channel provider for Yjs
│   │   ├── security/                  # Security utilities
│   │   │   ├── xss-csrf.ts          # XSS/CSRF protection
│   │   │   ├── css-sanitization.ts   # CSS sanitization
│   │   │   └── validation.ts         # Input validation
│   │   ├── animations/               # Animation utilities
│   │   ├── audio/                     # Audio utilities
│   │   ├── bbcode/                    # BBCode parser
│   │   ├── chat/                      # Chat utilities
│   │   ├── error-tracking.ts         # Sentry integration
│   │   ├── logger.ts                 # Structured logging
│   │   ├── queryKeys.ts              # TanStack Query key factory
│   │   ├── oauth.ts                  # OAuth utility
│   │   ├── stripe.tsx                # Stripe integration
│   │   └── store/ | store-helpers/    # Store utilities
│   │
│   ├── services/                      # Application services
│   │   ├── billing.ts                # Billing service
│   │   ├── webPushService.ts         # Web push notification service
│   │   └── web-push/                 # Push notification utilities
│   │
│   ├── contexts/                      # React contexts
│   │   ├── theme-context.tsx         # Base theme context
│   │   ├── theme-context-enhanced.tsx # Enhanced theme with animations
│   │   ├── theme-enhanced/           # Theme enhanced module
│   │   └── __tests__/                # Context tests
│   │
│   ├── providers/                     # React providers
│   │   ├── notification-provider/    # Notification provider module
│   │   └── notification-provider.tsx  # Notification system provider
│   │
│   ├── themes/                        # Theme system
│   ├── styles/                        # Global styles
│   ├── types/                         # Global TypeScript types
│   ├── utils/                         # Global utilities
│   ├── data/                          # Static data (achievements, titles, borders, etc.)
│   ├── assets/                        # Static assets (images, fonts)
│   ├── mocks/                         # MSW API mocks
│   ├── test/                          # Test utilities
│   ├── __dev__/                       # Development/debug utilities
│   └── __tests__/                     # Global tests
│
├── e2e/                               # Playwright E2E tests
├── playwright/                        # Playwright utilities
├── public/                            # Public static files
├── .storybook/                        # Storybook configuration
├── scripts/                           # Web-specific scripts
└── docs/                              # Web-specific documentation
```

---

## 4. `apps/mobile/` — React Native (Expo)

```
apps/mobile/
├── package.json                       # @cgraph/mobile — Expo 54, RN 0.81
├── app.config.js                      # Expo config
├── app.json                           # Expo app metadata
├── App.tsx                            # ★ App entry component
├── App.js                             # App entry (JS)
├── index.js                           # ★ registerRootComponent entry
├── metro.config.js                    # Metro bundler config
├── babel.config.js                    # Babel config
├── eslint.config.js                   # ESLint flat config
├── eas.json                           # EAS Build config
├── jest.config.js                     # Jest test config
├── tsconfig.json                      # TypeScript config
├── expo-env.d.ts                      # Expo type declarations
│
├── src/
│   ├── screens/                       # ★ Screen components (57+ screens)
│   │   ├── auth/                      # Login, Register, ForgotPassword
│   │   ├── messages/                  # ConversationList, Chat, MessageDetail
│   │   ├── groups/                    # GroupList, GroupDetail, Channels
│   │   ├── friends/                   # FriendList, FriendRequests
│   │   ├── forums/ | forum/           # ForumList, BoardView, ThreadView
│   │   ├── gamification/              # Quests, Achievements, Leaderboard
│   │   ├── profile/                   # UserProfile, EditProfile
│   │   ├── settings/                  # Settings screens
│   │   ├── premium/                   # Premium subscription screens
│   │   ├── calls/                     # Call screens
│   │   ├── search/                    # Search screens
│   │   ├── notifications/             # Notification screens
│   │   ├── social/ | community/ | admin/ | calendar/ | content/
│   │   ├── customize/ | leaderboard/ | legal/ | moderation/ | referrals/ | security/
│   │   ├── account/                   # Account management
│   │   └── loading-screen.tsx         # App loading screen
│   │
│   ├── navigation/                    # ★ Navigation structure
│   │   ├── root-navigator.tsx         # Auth/Main switch based on auth state
│   │   ├── auth-navigator.tsx         # Unauthenticated stack
│   │   ├── main-navigator.tsx         # Authenticated tab navigator
│   │   ├── messages-navigator.tsx     # Messages stack
│   │   ├── groups-navigator.tsx       # Groups stack
│   │   ├── friends-navigator.tsx      # Friends stack
│   │   ├── forums-navigator.tsx       # Forums stack
│   │   ├── search-navigator.tsx       # Search stack
│   │   ├── notifications-navigator.tsx # Notifications stack
│   │   ├── settings-navigator.tsx     # Settings stack
│   │   ├── transition-config.ts       # Navigation transition config
│   │   └── components/                # Navigation components
│   │
│   ├── modules/                       # Feature modules (mirrors web)
│   │   ├── auth/ | calls/ | chat/ | forums/ | gamification/
│   │   ├── groups/ | moderation/ | premium/ | search/
│   │   ├── settings/ | social/
│   │   └── index.ts
│   │
│   ├── features/                      # Cross-cutting feature implementations
│   │   ├── auth/ | forums/ | gamification/ | groups/
│   │   ├── messaging/ | premium/
│   │   └── index.ts
│   │
│   ├── stores/                        # Zustand stores
│   │   ├── __tests__/                 # Store tests
│   │   ├── authStore.ts | chatStore.ts | friendStore.ts
│   │   ├── gamificationStore.ts | groupStore.ts | marketplaceStore.ts
│   │   ├── notificationStore.ts | settingsStore.ts | themeStore.ts
│   │   ├── customizationStore.ts
│   │   └── index.ts                   # Unified exports
│   │
│   ├── components/                    # ★ Shared components (80+ components)
│   │   ├── ui/                        # UI primitives
│   │   ├── chat/                      # Chat components
│   │   ├── conversation/              # Conversation components
│   │   ├── forum/ | forums/           # Forum components
│   │   ├── gamification/              # Gamification components
│   │   ├── groups/                    # Group components
│   │   ├── premium/                   # Premium components
│   │   ├── enhanced/                  # Enhanced/animated components
│   │   ├── attachment-picker/         # Media attachment picker
│   │   ├── voice-message-recorder/    # Voice recording
│   │   ├── voice-message-player.tsx   # Voice playback
│   │   ├── avatar.tsx | button.tsx | card.tsx | header.tsx
│   │   ├── input.tsx | modal.tsx | select.tsx | skeleton.tsx
│   │   └── ... (80+ components)
│   │
│   ├── hooks/                         # Custom hooks
│   │   ├── useSocket.ts | useE2EE.ts | useRealtimeChannel.ts
│   │   ├── useGamification.ts | useGroups.ts | useFriendPresence.ts
│   │   ├── usePushNotifications.ts | useNotifications.ts
│   │   ├── useOfflineQueue.ts | useHaptics.ts | useBubbleCustomization.ts
│   │   └── ... (23+ hooks)
│   │
│   ├── services/                      # API services
│   │   ├── api.ts                     # Base API client
│   │   ├── friendsService.ts | groupsService.ts | gamificationService.ts
│   │   ├── calendarService.ts | notificationsService.ts | premiumService.ts
│   │   ├── pushNotifications.ts | referralService.ts | searchService.ts
│   │   ├── settingsService.ts | tierService.ts
│   │   └── index.ts
│   │
│   ├── lib/                           # Core libraries
│   │   ├── api.ts                     # API configuration
│   │   ├── socket.ts                  # Phoenix socket connection
│   │   ├── crypto/                    # E2EE (same @cgraph/crypto)
│   │   ├── webrtc/                    # WebRTC for calls
│   │   ├── offline/                   # Offline queue/sync
│   │   ├── animations/ | animations.ts  # Animation utilities
│   │   ├── biometrics.ts             # Biometric authentication
│   │   ├── deepLinks.ts              # Deep link handling
│   │   ├── storage.ts                # Secure storage
│   │   ├── performance/              # Performance monitoring
│   │   ├── design/                    # Design system utilities
│   │   ├── customization/            # Customization utilities
│   │   ├── effects/                   # Visual effects
│   │   ├── interactions/             # Gesture/interaction utilities
│   │   ├── error-tracking.ts         # Sentry integration
│   │   ├── errorTracking.ts          # Error tracking utilities
│   │   ├── logger.ts                 # Structured logging
│   │   ├── dateUtils.ts              # Date utilities
│   │   ├── imageUtils.ts             # Image utilities
│   │   ├── normalizers.ts            # Data normalizers
│   │   ├── oauth.ts                  # OAuth utilities
│   │   ├── queryClient.ts            # TanStack Query client
│   │   ├── payment.ts               # Payment utilities
│   │   ├── __tests__/                # Lib tests
│   │   └── database/                  # Local database
│   │
│   ├── platform/                      # Platform-specific code
│   │   ├── platform-adapter.ts        # Platform abstraction layer
│   │   ├── android/                   # Android-specific
│   │   └── ios/                       # iOS-specific
│   │
│   ├── shared/                        # Shared utilities
│   ├── types/                         # TypeScript types
│   ├── test/                          # Test utilities
│   └── assets/                        # Images, fonts
│
├── assets/                            # Expo static assets
├── e2e/                               # Detox E2E tests
└── .storybook/                        # React Native Storybook
```

---

## 5. `apps/landing/` — Marketing Landing Page

```
apps/landing/
├── package.json                       # Vite + React
├── vite.config.ts                     # Vite config
├── vitest.config.ts                   # Vitest config
├── tailwind.config.js                 # Tailwind config
├── index.html                         # Entry HTML
├── lighthouserc.json                  # Lighthouse CI config (performance budget)
├── postcss.config.js                  # PostCSS config
├── tsconfig.json                      # TypeScript config
├── README.md                          # Landing app documentation
├── playwright.config.ts               # E2E test config
│
├── src/
│   ├── main.tsx                       # ★ Entry point
│   ├── index.css                      # Global styles
│   ├── constants.ts                   # Landing page constants
│   ├── pages/
│   │   ├── LandingPage.tsx            # Main landing page
│   │   ├── NotFound.tsx               # 404 page
│   │   ├── company/                   # Company pages (about, careers)
│   │   ├── legal/                     # Legal pages (terms, privacy)
│   │   └── resources/                 # Resource pages
│   ├── components/
│   │   ├── marketing/                 # Marketing UI components
│   │   ├── interactive-demo/          # Interactive product demo
│   │   ├── forum-showcase/            # Forum feature showcase
│   │   ├── customization-demo/        # Customization demo
│   │   ├── effects/                   # Visual effects
│   │   ├── Logo.tsx | SEO.tsx | ErrorBoundary.tsx
│   │   └── ...
│   ├── lib/                           # Utilities
│   ├── data/                          # Static data
│   ├── assets/                        # Images
│   ├── styles/                        # CSS
│   ├── __tests__/                     # Tests
│   └── vite-env.d.ts                  # Vite type declarations
│
├── e2e/                               # Playwright E2E tests
├── public/                            # Static public files
└── test-results/                      # Test output
```

---

## 6. `packages/` — Shared TypeScript Packages

### `packages/shared-types/`

```
src/
├── index.ts       # Main exports
├── api.ts         # API request/response types
├── models.ts      # Domain model interfaces (User, Message, Group, etc.)
├── events.ts      # Real-time event type definitions
└── tiers.ts       # Subscription tier types
```

### `packages/api-client/`

```
src/
├── index.ts       # Main exports
├── client.ts      # Base API client factory
├── resilience.ts  # CircuitBreaker, retry, timeout patterns
└── __tests__/     # Tests
```

### `packages/crypto/`

```
src/
├── index.ts            # Main exports
├── aes.ts              # AES-256-GCM symmetric encryption
├── x3dh.ts             # X3DH key exchange
├── pqxdh.ts            # Post-quantum X3DH (X3DH + ML-KEM-768)
├── doubleRatchet.ts    # Signal Double Ratchet protocol
├── tripleRatchet.ts    # Triple Ratchet (ECDH + ML-KEM-768)
├── spqr.ts             # Sub-Protocol Quantum Resistance
├── scka.ts             # Session Continuity Key Agreement
├── kem.ts              # ML-KEM-768 (Kyber) KEM
├── stores.ts           # Key storage interfaces
├── types.ts            # Crypto type definitions
├── types-portable.ts   # Portable type definitions
├── utils.ts            # Crypto utilities
├── errors.ts           # Error types
└── __tests__/          # Property-based tests (fast-check)
```

### `packages/socket/`

```
src/
├── index.ts              # Main exports
├── phoenixClient.ts      # Phoenix.Socket wrapper
├── types.ts              # Socket/channel types
├── backoff.ts            # Exponential backoff with jitter
├── backoff.test.ts       # Backoff tests
└── channels/
    ├── conversationChannel.ts  # Typed conversation channel
    ├── groupChannel.ts         # Typed group channel
    ├── forumChannel.ts         # Typed forum channel
    └── userChannel.ts          # Typed user channel
```

### `packages/utils/`

```
src/
├── index.ts          # Main exports
├── format.ts         # Formatting utilities (dates, numbers, text)
├── validation.ts     # Zod-based validation schemas
├── permissions.ts    # Permission bitfield utilities
├── helpers.ts        # General helpers
├── httpClient.ts     # HTTP client factory (Axios-based)
└── __tests__/        # Tests
```

### `packages/animation-constants/`

```
src/
├── index.ts       # Main exports
├── durations.ts   # Animation duration constants
├── easings.ts     # Easing function constants
├── springs.ts     # Spring physics constants
└── stagger.ts     # Stagger timing constants
```

---

## 7. `infrastructure/` — Deployment & Observability

```
infrastructure/
├── docker-compose.observability.yml   # Full observability stack
├── .env.observability                 # Observability env vars
│
├── terraform/                         # Cloudflare IaC
│   ├── main.tf                       # Provider config
│   ├── dns.tf                        # DNS records
│   ├── waf.tf                        # Web Application Firewall rules
│   ├── rate_limiting.tf              # Cloudflare rate limiting
│   ├── cache.tf                      # Caching rules
│   ├── headers.tf                    # Response headers
│   ├── pages.tf                      # Cloudflare Pages
│   ├── zone_settings.tf              # Zone settings
│   ├── variables.tf                  # Input variables
│   ├── outputs.tf                    # Output values
│   ├── production.tfvars.example     # Production variable template
│   └── README.md                     # Terraform documentation
│
├── fly/                               # Fly.io deployment
│   ├── fly.toml.reference            # Reference config
│   ├── fly.web.toml                  # Web app Fly config
│   └── README.md                     # Fly.io documentation
│
├── docker/
│   └── init-db.sql/                  # Database initialization
│
├── grafana/                           # Grafana dashboards & provisioning
│   ├── dashboards/                   # Pre-built dashboards
│   ├── provisioning/                 # Auto-provisioning configs
│   ├── alerts/                       # Alert rules
│   ├── alloy-config.alloy            # Grafana Alloy config
│   ├── alloy-env.example             # Alloy environment template
│   └── grafana-cloud-remote-write.yml # Grafana Cloud remote write config
│
├── prometheus/
│   ├── prometheus.yml                # Prometheus config
│   └── rules/                        # Alert rules
│
├── alertmanager/                      # Alert routing & notifications
├── loki/                              # Log aggregation config
├── promtail/                          # Log shipping config
├── tempo/                             # Distributed tracing config
│
├── pgbouncer/                         # Connection pooling config
├── cloudflare/                        # Additional Cloudflare configs
│
├── load-tests/                        # Performance testing
│   ├── k6/                           # k6 load test scripts
│   ├── results/                      # Test results
│   └── run-load-test.sh              # Test runner
│
└── scripts/                           # Infrastructure scripts
    ├── setup-dev.sh                  # Development environment setup
    ├── deploy-fly.sh                 # Fly.io deployment
    ├── health-check.sh               # Health check script
    ├── backup_database.sh            # Database backup
    ├── restore_database.sh           # Database restore
    ├── chaos-test.sh                 # Chaos testing
    ├── db.sh                         # Database utilities
    └── warning-codes.sh              # Warning code reference
```

---

## 8. `docs/` — Project Documentation

```
docs/
├── README.md                          # Documentation index
├── ROADMAP.md                         # Product roadmap
├── CGRAPH_ESSENTIALS.md               # Core concepts guide
├── PROJECT_STATUS.md                  # Current project status
├── V1_ACTION_PLAN.md                  # V1 release plan
│
├── architecture/                      # Architecture documentation
├── ARCHITECTURE_DIAGRAMS.md           # Visual architecture diagrams
├── ARCHITECTURE_ENFORCEMENT.md        # ESLint architectural rules
├── ARCHITECTURE_TRANSFORMATION_PLAN.md # Architecture evolution plan
│
├── API_DOCUMENTATION.md               # API reference
├── api/                               # Detailed API docs
│
├── adr/                               # Architecture Decision Records
│   ├── 001-monorepo-structure.md
│   ├── 002-dual-app-architecture.md
│   ├── 003-zustand-state-management.md
│   ├── 004-signal-protocol-e2ee.md
│   ├── 005-phoenix-channels-realtime.md
│   ├── 011-post-quantum-triple-ratchet.md
│   ├── 018-reanimated-v4-migration.md
│   ├── 019-elixir-phoenix-backend.md
│   ├── 020-postgresql-database.md
│   ├── 021-ddd-feature-structure.md
│   └── README.md
│
├── guides/                            # Developer guides
├── CURRENT_STATE_DASHBOARD.md         # Real-time status dashboard
├── QUALITY_GATES.md                   # Quality gate definitions
├── TESTING_STRATEGY.md                # Testing approach
│
├── SECURITY_AUDIT_CHECKLIST.md        # Security audit items
├── SECURITY_REVIEW_TRACKING.md        # Security review status
├── SECURITY_TESTING.md                # Security testing approach
├── THREAT_MODEL.md                    # Threat model
│
├── SCHEMA_OWNERSHIP.md                # Database schema owners
├── QUERY_PERFORMANCE_AUDIT.md         # Query performance analysis
├── DATABASE_SHARDING_ROADMAP.md       # Sharding strategy
│
├── OPERATIONAL_RUNBOOKS.md            # Ops runbooks
├── OPERATIONAL_MATURITY_REGISTRY.md   # Ops maturity tracking
├── SLO_DOCUMENT.md                    # Service level objectives
├── LOAD_TEST_RESULTS.md               # Load testing results
├── WORLD_CLASS_GAP_ANALYSIS.md        # Gap analysis
│
├── release-notes/                     # Release notes
├── archive/                           # Archived documentation
├── assets/                            # Documentation assets
├── LEGAL/                             # Legal documentation
└── PrivateFolder/                     # Private documentation
```

---

## 9. `scripts/` — Codemods & Maintenance

```
scripts/
├── add-jsdoc.mjs                     # Add JSDoc comments to files
├── add-specs.mjs                     # Add TypeScript @spec annotations
├── add-reset-to-stores.mjs           # Add reset methods to Zustand stores
├── merge-duplicate-imports.mjs        # Deduplicate imports
├── fix-all-errors.mjs                # Batch fix TypeScript errors
├── fix-circular-barrel.mjs           # Fix circular barrel imports
├── fix-jsx-errors.mjs                # Fix JSX-specific errors
├── fix-non-null-assertions.mjs       # Remove non-null assertions
├── fix-type-assertions.mjs           # Fix type assertion patterns
├── fix-unused-vars.mjs               # Remove unused variables
├── fix-remaining-errors.mjs          # Fix remaining TS errors
├── fix-jsdoc-desc.mjs                # Fix JSDoc descriptions
├── clean-jsdoc-directives.mjs        # Clean JSDoc directives
├── rename-to-kebab.mjs               # Rename files to kebab-case
├── rename-dirs-to-kebab.mjs          # Rename directories to kebab-case
├── codemod-react-fc.py               # Convert React.FC patterns (Python)
├── codemod-springs.mjs               # Migrate spring animations
├── codemod-transitions.mjs           # Migrate transition animations
├── codemod-web-durations.mjs         # Migrate web animation durations
├── codemod-mobile-durations.mjs      # Migrate mobile animation durations
├── codemod-structured-logging.mjs    # Migrate to structured logging
├── list-web-errors.mjs               # List all web TypeScript errors
├── find-null-warnings.mjs            # Find null safety issues
└── monitor_code.sh                   # Code monitoring script
```

---

## 10. Key File Locations Summary

### Entry Points

| App     | Entry File                               |
| ------- | ---------------------------------------- |
| Backend | `apps/backend/lib/cgraph/application.ex` |
| Web     | `apps/web/src/main.tsx`                  |
| Mobile  | `apps/mobile/index.js` → `App.tsx`       |
| Landing | `apps/landing/src/main.tsx`              |

### Configuration Files

| File                              | Purpose                  |
| --------------------------------- | ------------------------ |
| `package.json`                    | Root workspace + scripts |
| `turbo.json`                      | Turborepo task config    |
| `tsconfig.base.json`              | Shared TypeScript config |
| `pnpm-workspace.yaml`             | Workspace packages       |
| `apps/backend/mix.exs`            | Elixir dependencies      |
| `apps/backend/config/runtime.exs` | Runtime secrets & config |
| `apps/web/vite.config.ts`         | Vite build config        |
| `apps/mobile/app.config.js`       | Expo config              |

### Schema & Migration Files

| Path                                           | Description              |
| ---------------------------------------------- | ------------------------ |
| `apps/backend/priv/repo/migrations/`           | 90+ Ecto migration files |
| `apps/backend/lib/cgraph/accounts/user.ex`     | User schema              |
| `apps/backend/lib/cgraph/messaging/message.ex` | Message schema           |
| `apps/backend/lib/cgraph/groups/group.ex`      | Group schema             |
| `apps/backend/lib/cgraph/forums/forum.ex`      | Forum schema             |

### Router & API Definitions

| Path                                                  | Description                   |
| ----------------------------------------------------- | ----------------------------- |
| `apps/backend/lib/cgraph_web/router.ex`               | Main API router               |
| `apps/backend/lib/cgraph_web/router/`                 | Domain-specific route modules |
| `apps/backend/lib/cgraph_web/controllers/api/v1/`     | V1 API controllers            |
| `apps/backend/lib/cgraph_web/channels/user_socket.ex` | WebSocket channel routes      |

---

## 11. Naming Conventions

| Area                 | Convention                      | Example                                |
| -------------------- | ------------------------------- | -------------------------------------- |
| **Directories**      | kebab-case                      | `animation-constants/`, `api-client/`  |
| **TypeScript files** | camelCase                       | `authStore.ts`, `useSocket.ts`         |
| **React components** | PascalCase                      | `LandingPage.tsx`, `ErrorBoundary.tsx` |
| **Elixir modules**   | PascalCase                      | `CGraph.Accounts`, `CGraphWeb.Router`  |
| **Elixir files**     | snake_case                      | `user_socket.ex`, `auth_controller.ex` |
| **Migration files**  | timestamp_snake_case            | `20241201000001_create_users.exs`      |
| **Package names**    | @cgraph/kebab-case              | `@cgraph/shared-types`                 |
| **CSS modules**      | PascalCase.module.css           | `GlassCard.module.css`                 |
| **Test files**       | `__tests__/` dirs or `.test.ts` | `__tests__/auth.test.ts`               |
| **Storybook**        | `.stories.tsx`                  | `button.stories.tsx`                   |
