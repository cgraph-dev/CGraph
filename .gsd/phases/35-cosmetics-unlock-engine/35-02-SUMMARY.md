---
plan: 35-02
phase: 35-cosmetics-unlock-engine
status: complete
started: 2026-03-12
completed: 2026-03-12
commits:
  - hash: 24b38180
    message: 'feat(35-02): unified cosmetics inventory schema and migration'
  - hash: 077ab06b
    message: 'feat(35-02): nameplate settings and name style schemas with migrations'
files_created:
  - apps/backend/lib/cgraph/cosmetics/inventory.ex
  - apps/backend/lib/cgraph/cosmetics/nameplate_setting.ex
  - apps/backend/lib/cgraph/cosmetics/name_style.ex
  - apps/backend/priv/repo/migrations/20260312100010_create_user_inventory.exs
  - apps/backend/priv/repo/migrations/20260312100011_create_nameplate_settings.exs
  - apps/backend/priv/repo/migrations/20260312100012_create_name_styles.exs
---

# Plan 35-02 Summary: Cosmetics Inventory, Nameplate Settings & Name Styles

## Objective

Create the unified cosmetics inventory (polymorphic), nameplate customization settings, and name
style schema with migrations.

## Tasks Completed

### Task 1: Unified Inventory Schema (2.5)

Created `CGraph.Cosmetics.Inventory` — a polymorphic inventory table that tracks all cosmetic items
a user owns.

- **Schema**: `user_inventory` with `user_id`, `item_type` (validated string), `item_id`
  (binary_id/UUID), `equipped_at`, `obtained_at`, `obtained_via`
- **Validation**: `item_type` validated against 9 cosmetic categories (border, title, badge,
  nameplate, profile_effect, profile_frame, chat_effect, profile_theme, name_style); `obtained_via`
  validated against 8 acquisition channels
- **Keys**: `@primary_key {:id, :binary_id, autogenerate: true}`, `@foreign_key_type :binary_id`,
  `@timestamps_opts [type: :utc_datetime_usec]`
- **Constraints**: Unique composite index on `[user_id, item_type, item_id]` prevents duplicate
  ownership entries
- **Migration**: Foreign key on `user_id` → `users`, additional indexes on `user_id`, `item_type`,
  `[user_id, item_type]`

### Task 2: Nameplate Settings & Name Style (2.6, 2.7)

**NameplateSetting** (`CGraph.Cosmetics.NameplateSetting`):

- Per-user nameplate customization overrides: `custom_text_color`, `custom_border_color`, `layout`
- `belongs_to` user and nameplate; hex color validation on color fields
- Unique constraint on `[user_id, nameplate_id]`

**NameStyle** (`CGraph.Cosmetics.NameStyle`):

- Display name styling definitions: `slug`, `name`, `font_family`, `color_scheme` (JSONB for
  gradient stops, primary, secondary), `animation`, `rarity`, `previewable`, `sort_order`,
  `is_active`
- Rarity validated via `Rarity.string_values()` — same pattern as `avatar_border.ex`
- Unique constraint on `slug`; indexes on `rarity` and `is_active`
- Supports the 50 name styles defined in the cosmetics manifest

## Design Decisions

- **item_id is binary_id (UUID)**: All cosmetic tables use binary_id PKs, so the polymorphic
  reference must match
- **item_type uses :string + validate_inclusion**: Avoids Ecto.Enum to stay flexible for future
  cosmetic types without migrations
- **Supplements legacy tables**: The unified inventory runs alongside user_avatar_borders,
  user_titles, user_chat_effects, user_profile_themes during dual-read; legacy tables drop in Phase
  37
- **NameplateSetting references inventory by binary_id**: Uses a loose FK (binary_id field, no
  DB-level FK constraint on nameplate_id) to allow flexibility during the migration period

## Verification

Both tasks verified with `mix compile` — no errors, no warnings related to new schemas.
