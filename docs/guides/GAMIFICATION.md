# Gamification Guide (v0.9.1)

## Scope
- XP/Levels, streaks, karma
- Achievements & quests
- Titles & badges
- Shop & coin economy
- Leaderboards (global + friends)

## API Surface
- `GET /api/v1/gamification/stats`
- `GET /api/v1/gamification/level-info`
- `GET /api/v1/gamification/xp/history`
- `GET /api/v1/gamification/achievements` / `GET /:id` / `POST /:id/unlock`
- `GET /api/v1/quests` / `GET /active` / `GET /daily` / `GET /weekly` / `POST /:id/accept` / `POST /:id/claim`
- `GET /api/v1/titles` / `GET /owned` / `POST /:id/equip` / `POST /unequip` / `POST /:id/purchase`
- `GET /api/v1/shop` / `GET /categories` / `GET /purchases` / `GET /:id` / `POST /:id/purchase`
- `GET /api/v1/coins` / `GET /history` / `GET /packages` / `GET /earn`
- `GET /api/v1/leaderboard` (global) / `GET /api/v1/gamification/leaderboard/:category`

## Data Model Highlights
- Users carry `xp`, `level`, `streak_days`, `karma`, `total_messages_sent`, `total_posts_created`.
- Leaderboards support categories: `xp`, `level`, `karma`, `streak`, `messages`, `posts`, `friends`.
- Periods: `daily`, `weekly`, `monthly`, `alltime`.
- Friend leaderboard counts accepted friendships.

## Behavior
- Streaks: claim via `POST /gamification/streak/claim` (resets on miss).
- Achievements/quests: unlock and claim award XP/coins.
- Titles: equip/unequip per user; purchasable.
- Shop: coins spent on items; purchases tracked.
- Coins: balance + history + earn methods + packages.

## Incomplete / TODO
- Rank change history not yet persisted (returned as `previous_rank: null`).
- Friend leaderboard pagination count approximated; add exact count.
- No anti-abuse limits documented for streak/quest claims—specify rate limits.
- Need client UX docs for claim flows and error states.
