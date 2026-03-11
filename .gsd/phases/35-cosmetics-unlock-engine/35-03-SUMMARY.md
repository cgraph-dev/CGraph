---
phase: 35-cosmetics-unlock-engine
plan: 03
status: complete
completed_at: 2026-03-12
commits:
  - 4acbd8cd feat(35-03): create cosmetics context module with inventory operations
  - 89cdaca2 feat(35-03): extend cosmetics controller with inventory/equip/unequip endpoints
  - 3b117ba7 feat(35-03): add badge/nameplate controllers, cosmetics routes, and router wiring
---

# Plan 35-03 — Execution Summary

## Objective
Create Cosmetics context module with inventory operations, extend CosmeticsController,
create Badge and Nameplate controllers with routes.

## Tasks Completed

### Task 1: Create cosmetics context module
- **File:** `apps/backend/lib/cgraph/cosmetics/cosmetics.ex` (NEW)
- Created `CGraph.Cosmetics` context with functions:
  - `list_user_inventory/2` — paginated, filterable by item_type and equipped status
  - `equip_item/3` — validates ownership, unequips same-type items, PubSub broadcast
  - `unequip_item/3` — validates ownership + equipped state, PubSub broadcast
  - `grant_item/4` — duplicate check + rarity_check against manifest schemas
  - `list_badges/1`, `get_badge/1`, `list_user_badges/1`
  - `list_nameplates/1`, `get_nameplate/1`, `list_user_nameplates/1`
  - `get_nameplate_settings/1`, `update_nameplate_settings/2`
- Rarity check validates items against Badge/Nameplate/ProfileEffect/ProfileFrame/NameStyle schemas

### Task 2: Extend CosmeticsController with inventory endpoints
- **File:** `apps/backend/lib/cgraph_web/controllers/cosmetics_controller.ex` (UPDATED)
- Added actions: `inventory/2` (GET), `equip/2` (PUT), `unequip/2` (DELETE)
- All use `render_data/2` and `render_error/3` from `CGraphWeb.ControllerHelpers`
- Added `serialize_inventory_item/1` to serializers module

### Task 3: Badge + Nameplate controllers, route module, router update
- **Files created:**
  - `apps/backend/lib/cgraph_web/controllers/api/v1/badge_controller.ex` — index, show, user_badges
  - `apps/backend/lib/cgraph_web/controllers/api/v1/nameplate_controller.ex` — index, show, user_nameplates, update_settings
  - `apps/backend/lib/cgraph_web/router/cosmetics_routes.ex` — macro module following GamificationRoutes pattern
- **File updated:** `apps/backend/lib/cgraph_web/router.ex` — added import + `cosmetics_routes()` call after `gamification_routes()`
- Routes do NOT duplicate existing border/theme/effect routes from GamificationRoutes
- Compilation verified: `mix compile` succeeds

## Must-Have Verification

| Truth | Status |
|-------|--------|
| Cosmetics context module CREATED with list_user_inventory/2, equip_item/3, unequip_item/3, grant_item/4 | ✅ |
| grant_item checks rarity_check against manifest counts | ✅ |
| equip_item validates item ownership before equipping | ✅ |
| CosmeticsController extended with inventory endpoints: GET /inventory, PUT /equip, DELETE /unequip | ✅ |
| BadgeController under api/v1/: index, show, user_badges (GET /users/:id/badges) | ✅ |
| NameplateController under api/v1/: index, show, user_nameplates, update_settings | ✅ |
| All controllers use render_data/render_error from CGraphWeb.ControllerHelpers | ✅ |
| Routes registered via CGraphWeb.Router.CosmeticsRoutes macro module | ✅ |
| router.ex updated: import + macro call for cosmetics_routes after gamification_routes() | ✅ |
