---
phase: 26-great-delete
plan: 01
status: complete
commit: feat(phase-26): plan 01 — backend gamification delete
files_changed: 45
lines_added: 87
lines_deleted: 8506
---

# Plan 26-01 Summary: Backend Gamification Delete

## What Was Done

Deleted all backend gamification modules that are not part of the pivot scope (achievements, titles,
shop items, cosmetics, XP/coin/streak). Stripped routes, controllers, and JSON views to
achievement-only. Fixed all dangling references. Added database migration.

## Files Deleted (37)

### Gamification Modules (19)

- `gamification/battle_pass_tier.ex`
- `gamification/coin_transaction.ex`
- `gamification/currency_system.ex`
- `gamification/event_lifecycle_worker.ex`
- `gamification/event_system.ex`
- `gamification/events.ex`
- `gamification/events/content.ex`
- `gamification/events/crud.ex`
- `gamification/events/participation.ex`
- `gamification/feature_gates.ex`
- `gamification/leaderboard.ex`
- `gamification/leaderboard_system.ex`
- `gamification/marketplace.ex`
- `gamification/marketplace_item.ex`
- `gamification/prestige_reward.ex`
- `gamification/seasonal_event.ex`
- `gamification/user_event_progress.ex`
- `gamification/user_prestige.ex`
- `marketplace.ex` (top-level context)

### Workers (3)

- `workers/event_exporter.ex`
- `workers/event_reward_distributor.ex`
- `workers/leaderboard_warm.ex`

### Channels (3)

- `channels/events_channel.ex`
- `channels/gamification_channel.ex`
- `channels/marketplace_channel.ex`

### Controllers (8)

- `controllers/admin/events_controller.ex`
- `controllers/admin/marketplace_controller.ex`
- `controllers/admin/marketplace_controller/settings_actions.ex`
- `controllers/events_controller.ex`
- `controllers/events_controller/helpers.ex`
- `controllers/marketplace_controller.ex`
- `controllers/marketplace_controller/helpers.ex`
- `controllers/prestige_controller.ex`

### Plugs & Validation (3)

- `plugs/level_gate_plug.ex`
- `plugs/premium_gate_plug.ex`
- `validation/gamification_params.ex`

## Files Edited (8)

1. **gamification.ex** — Removed stale aliases (CoinTransaction, CurrencySystem, EventSystem,
   FeatureGates, Leaderboard, LeaderboardSystem), all delegations to deleted modules,
   CoinTransaction struct usage, prestige functions. Simplified award_coins/spend_coins to direct
   Ecto changesets.
2. **gamification_routes.ex** — Stripped to achievement (3 routes) +
   coins/premium/IAP/shop/titles/cosmetics routes. Removed level gate pipelines,
   prestige/events/marketplace/stats/leaderboard/streak routes.
3. **gamification_controller.ex** — Stripped to 3 achievement actions only.
4. **gamification_json.ex** — Stripped to achievement rendering only.
5. **user_socket.ex** — Removed gamification, marketplace, events channel registrations.
6. **admin_routes.ex** — Removed all events and marketplace admin routes.
7. **forum_leaderboard_controller.ex** — Changed LeaderboardSystem alias to Forums.UserLeaderboard.
8. **tier_features.ex** — Updated moduledoc to remove deleted plug references.

## Files Created (1)

- `priv/repo/migrations/20260723120000_drop_gamification_tables.exs` — Drops 14 defunct tables
  (xp_transactions, xp_configs, daily_caps, user_quests, quests, prestige_rewards, user_prestige,
  user_event_progress, battle_pass_tiers, seasonal_events, marketplace_items, leaderboard_entries,
  feature_gate_configs, coin_transactions).

## Files Kept (correct per plan)

- Achievement: achievement.ex, achievement_system.ex, achievement_triggers.ex, user_achievement.ex,
  repositories/, repositories.ex
- Cosmetic: avatar_border.ex, user_avatar_border.ex, chat_effect.ex, user_chat_effect.ex,
  profile_theme.ex, user_profile_theme.ex, title.ex, user_title.ex, shop_item.ex, user_purchase.ex
- Restored: title_shop_system.ex (incorrectly deleted initially — ShopController/TitleController
  depend on it)

## Verification

- `mix compile` — success, zero warnings related to deleted modules
- All pre-existing unrelated warnings unchanged

## Deviations From Plan

- Plan listed ~50 files to delete by name, but many (xp_transaction.ex, quest_system.ex, etc.) don't
  exist in the codebase. Deleted what actually existed while following the plan's intent.
- Kept title_shop_system.ex (plan said delete) because ShopController and TitleController depend on
  Gamification delegations to it.
- Simplified award_coins/spend_coins (removed CoinTransaction struct usage) rather than deleting
  them, since coins are still used.
