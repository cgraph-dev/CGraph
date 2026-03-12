# Phase 37: Forum Transformation - Context

**Gathered:** 2026-03-11 **Status:** Ready for execution

<domain>
## Phase Boundary

Forums evolve to enterprise-grade with identity cards on posts, 10 forum themes with matching
cosmetics, thread tags, consolidated reputation, @mentions, PostCreationFlow async pipeline, admin
cosmetics CRUD, and full mobile forum parity. Corresponds to ATOMIC_PLAN v2.1 Phase 4 (Tasks
4.1–4.34).

Version target: v1.4.0

</domain>

<decisions>
## Implementation Decisions

### Identity Card System

- `user_nameplate_snapshot` JSONB on `thread_posts` — captures border, badges, title, nameplate,
  frame
- Snapshot populated on post creation (frozen at time of posting)
- Identity card component renders snapshot in forum threads

### PostCreationFlow Pipeline

- 3-worker async pipeline via Oban:
  - SearchIndexWorker → `forum_indexing` queue
  - ReputationCalcWorker → `reputation_calc` queue (60s delay for batching)
  - UpdateThreadStatsWorker → `critical` queue (immediate)
- Event-driven cache invalidation via `CGraph.Forums.Events`
- Events: post_created, cosmetic_purchased, thread_created

### Thread Tags

- `thread_tag.ex` schema with CRUD API
- Routes in forum routes macro (NOT directly in router.ex)
- Tag picker + filter UI on web and mobile

### Consolidated Reputation

- `user_reputation_scores` table consolidates from 3 scattered tables
- Milestone Node rewards (100 helpful votes → 100 Nodes)
- Display widget on profiles + forum posts

### Forum Themes

- 10 themes: Neon Cyber, Royal Gold, Midnight Ocean, Sakura Blossom, Lava Flow, Forest Mist, Retro
  Arcade, Ethereal Dream, Cyberpunk Metro, Zen Garden
- Each theme has CSS variables + matching cosmetic sets (borders, badges, titles, nameplates via
  `theme_id` FK)

### Thread Enhancements

- Use existing `prefix_color` + `icon_id` fields (NOT duplicate fields)
- Add `title_effect` field: none|glow|gradient|shimmer
- Sticky thread expiry
- @mention system with autocomplete + notification
- Quote reply: visual blocks + inline editing + multi-quote

### Mobile Parity

- `useBoardChannel` WebSocket hook
- Identity card component (compact variant)
- Threaded comment tree (upgrade from flat)
- BBCode editor integration
- Forum theme gallery, thread tags, reputation display, RSS feeds

</decisions>

<specifics>
## Specific Ideas

- Admin cosmetics CRUD: manage all 340+ items with bulk operations
- Custom user-created titles: moderated, max 18 per categories
- Forum analytics dashboard: engagement metrics, growth, top contributors
- Saved searches: query persistence with notification on new matches
- Thread subscription: follow threads for reply notifications
- Forum member directory: searchable, filterable by role/reputation
- Cross-forum identity banner: "Meet @user" card

</specifics>

<deferred>
## Deferred Ideas

- Drop old join tables (after 2-release sunset from Phase 35)
- Onboarding tutorial for forum features
- Advanced forum analytics (A/B testing, conversion tracking)

</deferred>

---

_Phase: 37-forum-transformation_ _Context gathered: 2026-03-11_
