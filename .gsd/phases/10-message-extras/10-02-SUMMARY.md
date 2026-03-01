# Summary: Plan 10-02 — Server-Side Link Preview Engine

**Status:** ✅ Complete
**Commit:** `788aca36` — `feat(10-02): server-side link preview engine with OG metadata`
**Files changed:** 15 (5 created, 10 modified)

## What Was Done

### Backend
- **Migration** `20260301000001_create_link_preview_cache.exs`: Created `link_preview_cache` table with `url_hash` (unique index), `url`, `title`, `description`, `image_url`, `favicon_url`, `site_name`, `type`, `fetched_at`, `expires_at` (7-day TTL)
- **Created** `link_preview_cache.ex`: Ecto schema with TTL defaults and changeset validation
- **Created** `link_preview_service.ex`: URL extraction via regex, OG/Twitter/title meta tag parsing, Req HTTP client with 5s timeout, cache-first lookup
- **Created** `fetch_link_preview.ex`: Oban worker (queue: `:link_previews`, max_attempts: 2) — fetches metadata and broadcasts `link_preview_updated` event
- **Created** `cleanup_link_preview_cache.ex`: Daily Oban cron — deletes cache entries older than 7 days
- **Config** (`config.exs`): Added `:link_previews` queue (5 workers dev, 10 prod) + daily cleanup cron
- **Core messages** (`core_messages.ex`): After message creation, detects URLs and enqueues `FetchLinkPreview` worker
- **JSON view** (`message_json.ex`): Added `linkPreview` top-level field in message serialization

### Web
- **conversationChannel.ts** + **groupChannel.ts**: Handle `link_preview_updated` socket event — update message in store with preview data
- **chatStore.types.ts**: Added `linkPreview` field on Message type

### Mobile
- **useConversationSocket.ts**: Handle `link_preview_updated` event — update message with preview
- **types/index.ts**: Added linkPreview to message type

## Requirements Covered

- **MSG-16**: Link previews with OG metadata — ✅ Server-side fetching, caching, real-time delivery

## Deviations

- Used **regex** for HTML meta tag parsing instead of Floki (Floki is test-only dependency)
- Used **Req** HTTP client instead of Tesla/HTTPoison (Req already in deps)
- Broadcast includes full message (simpler client handling vs. partial update)
- `linkPreview` added as top-level JSON field (not nested under metadata)
