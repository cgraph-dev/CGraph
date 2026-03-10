# 31-01 Summary — Discovery Backend

**Commit:** `33ff10a5`
**Status:** COMPLETE

## What was built

### New files (13)
| File | Purpose |
|------|---------|
| `priv/repo/migrations/20260724100000_create_discovery_tables.exs` | topics, user_frequencies, post_metrics tables + 12 seed topics |
| `priv/repo/migrations/20260724100001_add_thread_content_gating.exs` | ALTER threads: is_content_gated, gate_price_nodes, gate_preview_chars, weighted_resonates |
| `lib/cgraph/discovery/discovery.ex` | Facade context — delegates to Feed, CommunityHealth, manages topics/frequencies |
| `lib/cgraph/discovery/topic.ex` | Topic schema (name, icon, slug) |
| `lib/cgraph/discovery/user_frequency.ex` | UserFrequency schema (composite PK: user_id + topic_id, weight 0-100) |
| `lib/cgraph/discovery/post_metric.ex` | PostMetric schema (weighted_resonates, reply_depth_avg, read_time_signal, cross_community_refs) |
| `lib/cgraph/discovery/feed.ex` | Feed ranking engine — 5 modes with cursor pagination |
| `lib/cgraph/discovery/community_health.ex` | 5-factor health scoring with ETS cache (15min TTL) |
| `lib/cgraph_web/controllers/api/v1/feed_controller.ex` | GET /api/v1/feed?mode=X&cursor=Y |
| `lib/cgraph_web/controllers/api/v1/feed_json.ex` | JSON rendering for feed responses |
| `lib/cgraph_web/controllers/api/v1/topic_controller.ex` | GET /api/v1/topics, GET/PUT /api/v1/frequencies |
| `lib/cgraph_web/controllers/api/v1/topic_json.ex` | JSON rendering for topics/frequencies |
| `lib/cgraph_web/router/discovery_routes.ex` | DiscoveryRoutes macro |

### Modified files (2)
| File | Change |
|------|--------|
| `lib/cgraph/forums/thread.ex` | Added 4 content gating fields + updated changeset |
| `lib/cgraph_web/router.ex` | Added DiscoveryRoutes import + invocation |

## Feed modes
1. **Pulse** — Composite score: resonates×0.40 + depth×0.25 + read_time×0.20 + cross_refs×0.10 - age×0.05
2. **Fresh** — Chronological (newest first)
3. **Rising** — Last 24h, sorted by engagement velocity (resonates/hour)
4. **Deep Cut** — Posts >3 days old with high resonates but <50 views
5. **Frequency Surf** — Community-specific posts (requires community_id param)

## API endpoints
- `GET /api/v1/feed?mode=pulse&cursor=X&community_id=Y`
- `GET /api/v1/topics`
- `GET /api/v1/frequencies`
- `PUT /api/v1/frequencies` (body: `{frequencies: [{topic_id, weight}]}`)

## Verification
- Backend compiles cleanly — zero new warnings
- All 12 seed topics created in migration
- Existing CGraph.Forums context untouched except thread.ex field additions
