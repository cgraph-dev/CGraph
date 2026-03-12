# CGraph API Contracts
> Single source of truth. Backend MUST update after every endpoint change.
> Frontend MUST read before implementing any API call.

## Base URLs
- Dev: http://localhost:4000/api/v1
- Prod: https://api.cgraph.app/api/v1
- WebSocket Dev: ws://localhost:4000/socket
- WebSocket Prod: wss://api.cgraph.app/socket

## Auth
All authenticated requests: Authorization: Bearer <jwt>
Web clients: httpOnly cookie auto-translated by CookieAuth plug

## WebSocket Channels
| Topic Pattern   | Purpose                    |
|-----------------|----------------------------|
| conversation:*  | DM/group chat, typing      |
| group:*         | Group events, members      |
| user:*          | Notifications, presence    |
| presence:*      | User presence tracking     |
| ai:*            | Streaming AI responses     |
| document:*      | Yjs CRDT sync              |
| forum:*         | Forum real-time updates    |
| call:*          | WebRTC signaling           |
| voice:*         | Voice state updates        |
| webrtc:lobby    | WebRTC lobby signaling     |
| thread:*        | Thread real-time updates   |
| board:*         | Board real-time updates    |
| secret_chat:*   | E2EE secret chat sessions  |
| qr_auth:*       | QR code login auth         |

## Shared Types
All types in packages/shared-types/src/ — NEVER redefine them in apps.

## Endpoints
### Auth
- POST /auth/register    → {user, access_token, refresh_token}
- POST /auth/login       → {user, access_token, refresh_token}
- POST /auth/refresh     → {access_token}
- POST /auth/logout      → {ok: true}
- POST /auth/oauth/:provider → {user, access_token, refresh_token}

### Discovery (Phase 34)
- GET /feed               → {posts[], mode, page}  — 5 feed modes (Pulse/Fresh/Rising/DeepCut/Frequency)
- GET /topics             → {topics[]}
- GET /frequencies        → {frequencies[]}
- PUT /frequencies        → {frequency}

### Nodes Economy (Phase 34)
- GET /nodes/wallet       → {wallet}
- GET /nodes/transactions → {transactions[], pagination}
- GET /nodes/bundles      → {bundles[]}
- POST /nodes/checkout    → {checkout_session}
- POST /nodes/tip         → {transaction}
- POST /nodes/unlock      → {transaction, content}
- POST /nodes/withdraw    → {withdrawal_request}

### Customization (Phase 34)
- GET /me/customizations     → {customizations}
- PATCH /me/customizations   → {customizations}

### Cosmetics (Phase 35)
- GET /cosmetics/inventory   → {items[], equipped[]}
- PUT /cosmetics/equip       → {equipped_item}
- DELETE /cosmetics/unequip  → {ok: true}
- GET /badges                → {badges[]}
- GET /badges/:id            → {badge}
- GET /users/:id/badges      → {badges[]}
- GET /nameplates            → {nameplates[]}
- GET /nameplates/:id        → {nameplate}
- PUT /nameplates/settings   → {settings}
- GET /users/:id/nameplates  → {nameplates[]}

### Creator Economy (Phase 36)
- POST /creator/onboard              → {onboarding_url}
- GET /creator/status                → {creator_profile}
- POST /creator/onboard/refresh      → {refresh_url}
- PUT /forums/:id/monetization       → {monetization_config}
- POST /forums/:id/subscribe         → {subscription}
- DELETE /forums/:id/subscribe       → {ok: true}
- GET /creator/balance               → {balance}
- POST /creator/payout               → {payout}
- GET /creator/payouts               → {payouts[], pagination}
- GET /creator/analytics/overview    → {analytics}
- GET /creator/analytics/earnings    → {earnings[]}
- GET /creator/analytics/subscribers → {subscribers[]}
- GET /creator/analytics/content     → {content_stats[]}
- POST /creator/premium-threads      → {premium_thread}
- PUT /threads/:id/purchase          → {access_token}
- GET /creator/tiers                 → {tiers[]}
- POST /creator/tiers                → {tier}
- PUT /creator/tiers/:id             → {tier}
- GET /creator/revenue-splits        → {splits[]}

### Paid DM (Phase 36)
- POST /paid-dm/send      → {message}
- PUT /paid-dm/:id/unlock  → {file}
- GET /paid-dm/pending     → {pending_files[]}
- GET /paid-dm/settings    → {settings}
- PUT /paid-dm/settings    → {settings}

### Boosts (Phase 36)
- POST /boosts            → {boost}
- GET /boosts             → {boosts[]}
- DELETE /boosts/:id      → {ok: true}

### Forum Identity & Tags (Phase 37)
- GET /identity-cards/:user_id  → {identity_card}
- PUT /identity-cards            → {identity_card}
- GET /forums/:forum_id/tags     → {tags[]}
- POST /forums/:forum_id/threads/:thread_id/tags → {tag}
- DELETE /forums/:forum_id/threads/:thread_id/tags/:id → {ok: true}

### Forum Admin & Moderation (Phase 37)
- POST /forum-admin/forums                     → {forum}
- PUT /forum-admin/forums/:id                  → {forum}
- POST /forum-admin/forums/:id/members         → {member}
- GET /forum-admin/forums/:id/moderation-log   → {log_entries[], pagination}
- GET /forums/:forum_id/moderation/queue         → {queue_items[]}
- POST /forums/:forum_id/moderation/action        → {action_result}
- GET /forums/:forum_id/moderation/warnings       → {warnings[]}
- POST /forums/:forum_id/moderation/warn          → {warning}
- GET /forums/:forum_id/moderation/automod        → {automod_config}
- PUT /forums/:forum_id/moderation/automod        → {automod_config}
- GET /forums/:forum_id/moderation/stats          → {stats}

## Changelog
| Date       | Change                                        |
|------------|-----------------------------------------------|
| 2026-03-12 | Added all Phase 33-38 endpoints and channels  |
| 2026-03-03 | Initial contract file created                 |
