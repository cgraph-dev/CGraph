# CGraph — Comprehensive Atomic Implementation Plan v2.1

> **Version:** 2.1.0 | **Date:** March 11, 2026 | **Status:** Verified & Corrected **Scope:**
> Implement ALL 247 features from 5 design documents + 73 verified gaps **Standard:** Discord/Meta
> engineering quality — Fortune 500 codebase readability **Sources:**
> `CGraph Complete Cosmetics.txt`, `CGRAPH-FORUMS-NEXT-GEN-PLAN.md`,
> `CGRAPH-FORUMS-INFRASTRUCTURE.md`, `Nodes are already a solid.txt`, `WEB_MOBILE_FEATURE_MAP.md`
> **Audit:** Verified against `INTEGRATION_PLAN_REVIEW.md` (73 gaps, 7 numeric conflicts, 16
> architecture gaps) **Verification:** All 29 inconsistencies from `ATOMIC_PLAN_VERIFICATION.md`
> resolved (8 critical, 10 major, 11 minor)

### Changelog (v2.0 → v2.1)

- **[C1/C2]** Fixed controller namespace (`Api` → `API`) and documented both pattern A (top-level)
  and B (namespaced V1)
- **[C3]** Fixed `modules/messaging/` → `modules/chat/` in Task 1.4
- **[C4]** Rewrote mobile store pattern to manual AsyncStorage (removed `persist` middleware)
- **[C5]** Changed rarity field type from `Ecto.Enum` to `:string` + `validate_inclusion/3` across
  all schemas
- **[C6]** Added P0.9 task for `@cgraph/shared-types` exports map fix
- **[C7]** Fixed mobile HTTP client pattern to use `../lib/api` (not `@cgraph/api-client`)
- **[C8]** Expanded P0.4 scope to handle ALL uppercase→lowercase rarity in animation-constants
- **[M1]** Documented macro-based route modules (gamification_routes.ex) for route registration
- **[M2]** Changed Task 2.9 from "Create" to "Extend existing CosmeticsController"
- **[M3]** Changed serialization pattern to `Serializers/` subdirectory for all gamification
  controllers
- **[M4]** Changed Task 1.16 to use `screens/`+`stores/`+`services/` pattern (not empty `modules/`)
- **[M5]** Changed Task 1.16 to import from existing `lib/crypto/pq-bridge.ts`
- **[M6]** Added Task 2.35 for data migration from 4 existing join tables to unified inventory
- **[M7]** Added architecture decision note on UnlockEngine extending existing
  achievement_triggers.ex
- **[M8]** Fixed web store pattern: `.impl.ts` is dominant (17 files), `.selectors.ts`/`.schema.ts`
  optional
- **[M9]** Changed Task 4.14 to use existing `prefix_color`/`icon_id` instead of adding duplicate
  fields
- **[M10]** Renamed mobile wallet screen to `nodes-wallet-screen.tsx` to avoid collision with
  blockchain wallet
- **[N1]** Fixed P0.3: `uncommon` already exists, only `free` needs adding
- **[N2]** Added note about active `features/` directory in mobile standards
- **[N3]** Added note about web `data/` directory for badge/theme collections
- **[N6]** Added note about missing NodesChannel in `@cgraph/socket`
- **[N7]** Fixed store import example: `useAuthStore` from `@/modules/auth/store`
- **[N8]** Acknowledged api-client architectural shift from generic to typed SDK
- **[N9]** Added note about gamification repository pattern for cosmetics context
- **[N10]** Added overlap warning for mobile customize screens
- **[N11]** Added P0.10 task for expanding Oban queue config + inline notes on planned workers
- **+3 new tasks** (P0.9, P0.10, 2.35) — Total: 177 tasks, 1,354h

---

## Table of Contents

1. [Engineering Standards](#part-0-engineering-standards)
2. [Pre-Phase: Canonical Reconciliation](#pre-phase-canonical-reconciliation)
3. [Phase 1: Parity + Mobile Nodes](#phase-1-parity--mobile-nodes)
4. [Phase 2: Cosmetics + Unlock Engine](#phase-2-cosmetics--unlock-engine)
5. [Phase 3: Creator Economy](#phase-3-creator-economy)
6. [Phase 4: Forum Transformation](#phase-4-forum-transformation)
7. [Phase 5: Infrastructure Scaling](#phase-5-infrastructure-scaling)
8. [Phase 6: Enterprise + Desktop](#phase-6-enterprise--desktop)
9. [Cross-Cutting Concerns](#cross-cutting-concerns)
10. [Dependency Graph](#dependency-graph)
11. [Effort Summary](#effort-summary)
12. [Risk Matrix](#risk-matrix)
13. [Success Metrics](#success-metrics)

---

## Part 0: Engineering Standards

> Every file created in this plan MUST follow these standards. Non-compliant PRs are auto-rejected.

### 0.1 Elixir/Phoenix Backend Standards

**Module Documentation — REQUIRED on every module:**

```elixir
defmodule CGraph.Cosmetics.Rarity do
  @moduledoc """
  Unified rarity tier system for all CGraph cosmetics.

  ## Key Concepts

  - **Tier** — one of 7 rarity levels (FREE → MYTHIC) used across borders,
    titles, badges, nameplates, profile effects, and chat cosmetics.
  - **Color** — hex color associated with each rarity for consistent UI rendering.
  - **Ordering** — tiers are ordered by ascending scarcity for sorting/filtering.

  ## Usage

      iex> CGraph.Cosmetics.Rarity.tiers()
      [:free, :common, :uncommon, :rare, :epic, :legendary, :mythic]

      iex> CGraph.Cosmetics.Rarity.color(:epic)
      "#F97316"
  """
end
```

**Function Documentation — REQUIRED on every public function:**

```elixir
@doc "Evaluates unlock conditions for a user and grants newly eligible cosmetics."
@spec check_and_grant(String.t(), atom()) :: {:ok, list()} | {:error, term()}
def check_and_grant(user_id, event_type) when is_binary(user_id) do
```

**Schema Conventions (matches existing codebase):**

- `@primary_key {:id, :binary_id, autogenerate: true}`
- `@foreign_key_type :binary_id`
- `@timestamps_opts [type: :utc_datetime_usec]`
- `@type t :: %__MODULE__{}`
- `@derive {Jason.Encoder, only: [...]}` — explicit field whitelist
- Enums: Use `:string` + `validate_inclusion/3` for rarity fields (matching existing
  `avatar_border.ex`, `chat_effect.ex`, `profile_theme.ex`, `title.ex`). Only use `Ecto.Enum` for
  new fields where the values are fully controlled and no existing data needs migration.
- Section comments: `# ==================== SECTION NAME ====================`

**Context Module Pattern:**

- Import `Ecto.Query` at module level
- Alias `Repo` for writes, `ReadRepo` for reads
- Multi-alias: `alias CGraph.Cosmetics.{Border, Title, Badge, Nameplate}`
- Guard clauses: `when is_binary(user_id)`
- Constants as module attributes: `@platform_cut_percent 20`

**Controller Patterns (two coexist — use the correct one):**

_Pattern A — Top-level (Gamification domain: cosmetics, badges, nameplates, shop, titles):_

- File: `apps/backend/lib/cgraph_web/controllers/{resource}_controller.ex`
- Serializer: `apps/backend/lib/cgraph_web/controllers/{resource}_controller/serializers/{type}.ex`
- Example: `CGraphWeb.CosmeticsController` (existing, 14 actions)
- Routes registered in macro-based route module:
  `apps/backend/lib/cgraph_web/router/gamification_routes.ex`

_Pattern B — Namespaced V1 (Auth, User, Customization):_

- File: `apps/backend/lib/cgraph_web/controllers/api/v1/{resource}_controller.ex`
- View: `apps/backend/lib/cgraph_web/controllers/api/v1/{resource}_json.ex`
- Example: `CGraphWeb.API.V1.AuthController`
- Routes registered in their respective route module macro

_Common to both:_

- Plug pipeline: `action_fallback CGraphWeb.FallbackController`
- Rate limiting via plug: `plug CGraphWeb.Plugs.RateLimiter, max: 60, window: 60_000`

> **⚠️ All new gamification-domain controllers MUST use Pattern A (top-level) to match existing
> `CosmeticsController`, `ShopController`, `TitleController`.** API namespace is `CGraphWeb.API.V1.`
> (uppercase `API`), NOT `CGraphWeb.Api.V1.`.

**Worker Pattern:**

- Module: `CGraph.Workers.{Name}Worker`
- `use Oban.Worker, queue: :queue_name, max_attempts: 3`
- `@impl Oban.Worker` on `perform/1`
- Telemetry events on start/stop/error

**Router Architecture — Macro-Based Route Modules:**

- Routes are NOT added directly to `router.ex`
- 15 macro-based route modules exist (e.g., `CGraphWeb.Router.GamificationRoutes`)
- New cosmetics/badge/nameplate routes go in `gamification_routes.ex`
- Each macro module is imported into `router.ex` via `use`

**Testing:**

- `test/cgraph/{context}/{module}_test.exs` — unit tests
- Pattern A: `test/cgraph_web/controllers/{controller}_controller_test.exs` — gamification
  integration
- Pattern B: `test/cgraph_web/controllers/api/v1/{controller}_controller_test.exs` — API integration
- Minimum 80% coverage per module
- Property-based tests (StreamData) for unlock engine evaluators
- All schemas test valid + invalid changesets

### 0.2 React/TypeScript Web Standards

**File Documentation — REQUIRED on every file:**

```typescript
/**
 * @module CosmeticRenderer
 * @version 1.0.0
 * @since v1.2.0
 *
 * Surface-aware cosmetic rendering component. Renders the correct subset
 * of cosmetics based on the display context (DM header, forum post, etc.).
 */
```

**Component Pattern:**

```typescript
// ── Types ──────────────────────────────────────────────────────────────────
interface CosmeticRendererProps {
  readonly userId: string;
  readonly surface: CosmeticSurface;
  readonly className?: string;
}

// ── Component ──────────────────────────────────────────────────────────────
export function CosmeticRenderer({ userId, surface, className }: CosmeticRendererProps) {
```

**Store Pattern (Zustand):**

```typescript
// File: apps/web/src/modules/{domain}/store/{storeName}.ts            ← barrel export
// Types: apps/web/src/modules/{domain}/store/{storeName}.types.ts     ← always
// Impl: apps/web/src/modules/{domain}/store/{storeName}.impl.ts       ← dominant pattern (17 stores)
// Selectors: apps/web/src/modules/{domain}/store/{storeName}.selectors.ts   ← optional, complex stores only
// Schema: apps/web/src/modules/{domain}/store/{storeName}.schema.ts         ← optional, complex stores only

export const useCosmetics = create<CosmeticsState>()(
  persist(
    (set, get) => ({
      // ── State ──────────────────────────────────────
      inventory: [],
      equipped: {},
      isLoading: false,
      error: null as string | null,

      // ── Actions ────────────────────────────────────
      fetchInventory: async () => { ... },
      equipItem: async (itemId: string, slot?: number) => { ... },
    }),
    {
      name: 'cgraph-cosmetics',
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (state) => ({ equipped: state.equipped }),
    }
  )
);
```

**Naming Conventions:**

- Files: kebab-case for components (`cosmetic-renderer.tsx`), camelCase for stores
  (`cosmeticsStore.ts`)
- Exports: named exports for everything, `export default` only for page components (note: some
  existing components like `thread-view.tsx` use both named + default — prefer named-only for new
  code)
- Hooks: `use` prefix — `useCosmeticsStore`, `useUnlockEngine`
- Types: PascalCase interfaces (`CosmeticItem`, `UnlockCondition`)
- Constants: UPPER_SNAKE_CASE (`RARITY_COLORS`, `MAX_EQUIPPED_BADGES`)
- Path aliases: `@/*` — catch-all alias for `src/`, plus specific aliases for common modules

**Import Order:**

```typescript
// 1. React/framework
import { useState, useCallback } from 'react';
// 2. Third-party
import { motion } from 'framer-motion';
// 3. Internal packages
import type { CosmeticItem } from '@cgraph/shared-types';
// 4. Internal modules
import { useAuthStore } from '@/modules/auth/store';
// 5. Relative
import { CosmeticCard } from './cosmetic-card';
```

**No `any` types. No `// @ts-ignore`. No `as unknown as`. Strict TypeScript.**

### 0.3 React Native Mobile Standards

**Store Pattern (matches existing codebase — manual AsyncStorage, NO persist middleware):**

```typescript
/**
 * @module nodesStore
 * @version 1.0.0
 * @since v1.1.0
 */

// ============================================================================
// Types
// ============================================================================
interface NodesState { ... }

// ============================================================================
// Store
// ============================================================================
export const useNodesStore = create<NodesState>((set, get) => ({
  // ── State ──────────────────────────────────────────────────────
  balance: 0,
  transactions: [],
  isLoading: false,
  error: null as string | null,

  // ── Actions ────────────────────────────────────────────────────
  fetchBalance: async () => {
    set({ isLoading: true });
    try {
      const data = await api.get('/api/v1/nodes/wallet');
      set({ balance: data.balance, isLoading: false });
      // Manual persist to AsyncStorage (matches all 13 existing stores)
      await AsyncStorage.setItem('nodes_balance', JSON.stringify(data.balance));
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  // Hydrate from AsyncStorage on app start
  hydrate: async () => {
    const stored = await AsyncStorage.getItem('nodes_balance');
    if (stored) set({ balance: JSON.parse(stored) });
  },
}));
```

> **⚠️ IMPORTANT:** ALL 13 existing mobile stores use `create()` (no middleware) with manual
> `AsyncStorage.getItem/setItem` inside actions. Do NOT use Zustand's `persist` middleware on mobile
> — it is architecturally inconsistent with the entire codebase. If a future migration to `persist`
> middleware is desired, add it as a dedicated migration task covering all 13+ stores.

**Screen Pattern:**

```typescript
/**
 * @module WalletScreen
 * @version 1.0.0
 * @since v1.1.0
 */
export function WalletScreen() {
  // Hooks first
  const { balance, fetchBalance } = useNodesStore();
  // Effects
  useEffect(() => { fetchBalance(); }, []);
  // Render
  return ( ... );
}
```

**Navigation:** Register in `apps/mobile/src/navigation/` following existing patterns.

> **⚠️ VERIFIED (N2):** Active feature code exists in `features/forums/`, `features/messaging/`,
> `features/groups/` with `@cgraph/shared-types` imports. New features may also use the `features/`
> directory pattern for cross-cutting feature logic, alongside `screens/`+`stores/`+`services/`.

### 0.4 Shared Package Standards

**`@cgraph/shared-types`:**

- One file per domain: `cosmetics.ts`, `nodes.ts`, `forums.ts`
- `null` over `undefined` for nullable fields: `emailVerifiedAt: string | null`
- Re-export from barrel `index.ts`: `export * from './cosmetics'`
- **⚠️ CRITICAL (C6):** The `package.json` `exports` map only exposes `.`, `./api`, `./models`,
  `./events`. Every NEW file (`rarity.ts`, `cosmetics.ts`, `nodes.ts`) MUST get a corresponding
  entry added to the `exports` map, e.g., `"./rarity": { "import": "./src/rarity.ts" }`. Without
  this, deep imports like `from '@cgraph/shared-types/rarity'` will fail with "Module not found".
- Also fix: 4 existing files (`forum-emoji.ts`, `forum-moderation.ts`, `forum-plugin.ts`,
  `forum-rss.ts`) are not re-exported from `index.ts` — add them.

**`@cgraph/api-client`:**

- One file per domain: `cosmetics.ts`, `nodes.ts`, `forums.ts`
- Typed request/response: `async getCosmeticsInventory(): Promise<CosmeticItem[]>`
- Re-export from barrel `index.ts`
- **⚠️ NOTE (N8):** Currently a generic HTTP client factory (`client.ts`, `resilience.ts`). Adding
  domain-specific files is a deliberate architectural shift from "generic client library" to "typed
  API SDK". This is the INTENDED direction — document in ADR.

**⚠️ Mobile HTTP Client (C7):**

- Mobile does NOT use `@cgraph/api-client`. Mobile uses `@cgraph/utils`'s `createHttpClient` via
  `lib/api.ts`
- All 16 existing mobile services import from `../lib/api` (e.g., `forumService.ts`)
- New mobile services (e.g., `nodesService.ts`) MUST follow this pattern:
  `import api from '../lib/api'` then `api.get('/api/v1/...')`
- `@cgraph/api-client` additions are for WEB consumption only (unless a future migration unifies
  clients)

### 0.5 Documentation Requirements

Every PR must include:

1. **Inline docs** — `@moduledoc`/JSDoc on every module/file
2. **README update** — if adding a new directory, add section to nearest README
3. **API docs** — new endpoints documented in `docs/api/`
4. **ADR** — architecture decisions in `docs/adr/` (use next sequential number)
5. **Changelog** — entry in CHANGELOG.md per semver standard
6. **Type exports** — new types added to `@cgraph/shared-types`

### 0.6 Git Conventions

- Branch: `feat/{phase}-{short-desc}` (e.g., `feat/p1-mobile-nodes-wallet`)
- Commits: Conventional Commits — `feat(nodes): add mobile wallet screen`
- PR template: title, description, testing checklist, screenshot/video for UI
- Squash merge to `main`

---

## Pre-Phase: Canonical Reconciliation (v1.0.1)

> **Goal:** Resolve all source document conflicts, unify rarity system, audit API endpoints, and
> establish the single source of truth BEFORE any feature work begins. **Duration:** ~2 weeks |
> **Hours:** ~36h | **Team:** 1 backend + 1 fullstack

### P0.1 — Create Canonical Cosmetics Manifest

| Field          | Value                                                        |
| -------------- | ------------------------------------------------------------ |
| **ID**         | P0.1                                                         |
| **Title**      | Create canonical cosmetics manifest — single source of truth |
| **Priority**   | P0 (Blocking)                                                |
| **Estimate**   | 6h                                                           |
| **Depends On** | —                                                            |

**Description:** The 5 source documents conflict on asset counts (badges: 60 vs 70, titles: 55 vs
70, nameplates: 30 vs 45, rarity: 4 vs 7 tiers). Create a single `COSMETICS_MANIFEST.md` that
resolves every conflict with a definitive number, and a `cosmetics_manifest.json` that serves as the
seed data source of truth.

**Resolution Strategy:**

- Badges: **70** — Use Cosmetics doc's 60 with full unlock conditions + Forums doc's 10 extras (fill
  unlock conditions from Forums categories)
- Titles: **70** — Cosmetics doc's 55 + Forums doc's 15 (rank/tier 12 + event 3). Custom
  user-created titles (18, moderated) as Phase 4 feature, not seed data
- Nameplates: **45** — Cosmetics doc's 30 with unlock specs + Forums doc's 15 extras (fill unlock
  conditions from activity milestones)
- Rarity: **7 tiers** — `free | common | uncommon | rare | epic | legendary | mythic`. Forums doc's
  4-tier SQL ENUMs are redesigned to 7
- Profile Themes: **25** — 5 free + 5 earned + 15 shop (Cosmetics doc target)
- Name Styles: **50** — Forums doc's granular breakdown (8 fonts + 12 effects + 15 colors + 10
  prefixes + 5 suffixes)
- Profile Frames: **50+** — Forums doc specification, entirely new cosmetic type
- Forum Themes: **10** — Forums doc's named set (Neon Cyber → Zen Garden)

**Files to Create:**

```
docs/COSMETICS_MANIFEST.md                              — Human-readable canonical reference
apps/backend/priv/repo/seeds/cosmetics_manifest.json     — Machine-readable seed source
```

**Acceptance Criteria:**

- [ ] Every cosmetic item has: `id`, `slug`, `name`, `rarity`, `category`, `track`, `unlock_type`
      (activity/shop/seasonal/admin), `unlock_condition` (JSON), `nodes_cost` (if shop)
- [ ] All 7 rarity tiers represented across all cosmetic types
- [ ] Zero numeric conflicts between section counts and item lists
- [ ] Reviewed and approved by project lead

---

### P0.2 — Unified Rarity Module (Backend)

| Field          | Value                                                            |
| -------------- | ---------------------------------------------------------------- |
| **ID**         | P0.2                                                             |
| **Title**      | Create `CGraph.Cosmetics.Rarity` — single rarity source of truth |
| **Priority**   | P0 (Blocking)                                                    |
| **Estimate**   | 3h                                                               |
| **Depends On** | P0.1                                                             |

**Description:** Create a shared Elixir module that ALL cosmetics schemas import rarity from.
Eliminates per-schema rarity inconsistency.

**File to Create:**

```
apps/backend/lib/cgraph/cosmetics/rarity.ex
```

**Implementation:**

```elixir
defmodule CGraph.Cosmetics.Rarity do
  @moduledoc """
  Unified rarity tier system for all CGraph cosmetics.

  ## Key Concepts

  - **Tier** — one of 7 rarity levels used across all cosmetic types
  - **Color** — hex color for consistent UI rendering
  - **Ordering** — tiers sorted by ascending scarcity
  """

  @tiers [:free, :common, :uncommon, :rare, :epic, :legendary, :mythic]

  @colors %{
    free:      "#9CA3AF",
    common:    "#22C55E",
    uncommon:  "#3B82F6",
    rare:      "#A855F7",
    epic:      "#F97316",
    legendary: "#EF4444",
    mythic:    "#EAB308"
  }

  @doc "Returns all rarity tiers in ascending order."
  @spec tiers() :: [atom()]
  def tiers, do: @tiers

  @doc "Returns the string values list for schema validation (used with validate_inclusion/3)."
  @spec string_values() :: [String.t()]
  def string_values, do: Enum.map(@tiers, &Atom.to_string/1)

  @doc "Returns the atom values for internal use."
  @spec atom_values() :: [atom()]
  def atom_values, do: @tiers

  @doc "Returns the hex color for a rarity tier."
  @spec color(atom()) :: String.t()
  def color(tier) when tier in @tiers, do: Map.fetch!(@colors, tier)

  @doc "Returns the numeric rank (0-6) for sorting."
  @spec rank(atom()) :: non_neg_integer()
  def rank(tier) when tier in @tiers, do: Enum.find_index(@tiers, &(&1 == tier))

  @doc "Compares two tiers. Returns :lt, :eq, or :gt."
  @spec compare(atom(), atom()) :: :lt | :eq | :gt
  def compare(a, b) when a in @tiers and b in @tiers do
    cond do
      rank(a) < rank(b) -> :lt
      rank(a) > rank(b) -> :gt
      true -> :eq
    end
  end
end
```

**Acceptance Criteria:**

- [ ] Module compiles and all functions pass tests
- [ ] Existing schemas (`avatar_border.ex`, `chat_effect.ex`, `profile_theme.ex`) updated to import
      from this module
- [ ] `@rarities` module attributes in existing schemas replaced with
      `CGraph.Cosmetics.Rarity.string_values()` in `validate_inclusion/3` calls

---

### P0.3 — Rarity Migration (Backend)

| Field          | Value                                                                       |
| -------------- | --------------------------------------------------------------------------- |
| **ID**         | P0.3                                                                        |
| **Title**      | Migration to normalize all existing cosmetic rarity values to 7-tier system |
| **Priority**   | P0 (Blocking)                                                               |
| **Estimate**   | 3h                                                                          |
| **Depends On** | P0.2                                                                        |

**Files to Create:**

```
apps/backend/priv/repo/migrations/YYYYMMDD_unify_rarity_tiers.exs
```

**Implementation:**

- Add `free` to any schemas missing it (`uncommon` already exists in all 4 schemas)
- Remove `unique`, `seasonal`, `event` from rarity value lists (these are `source` categories, not
  rarity)
- Add `source` field
  (`Ecto.Enum, values: [:earned, :purchased, :seasonal, :event, :admin_granted, :gifted]`) to
  schemas that used rarity for source tracking
- Backfill: items currently marked `seasonal` → rarity = their intended rarity, source = `:seasonal`

**Acceptance Criteria:**

- [ ] Migration runs successfully on dev + test databases
- [ ] Rollback (`down/0`) restores previous state
- [ ] All existing `avatar_border`, `chat_effect`, `profile_theme` records have valid 7-tier rarity
- [ ] Only `free` was added (verified: `uncommon` already exists in all schemas)
- [ ] New `source` field populated correctly

---

### P0.4 — Rarity Unification (Frontend)

| Field          | Value                                                                         |
| -------------- | ----------------------------------------------------------------------------- |
| **ID**         | P0.4                                                                          |
| **Title**      | Unify rarity across web constants, animation-constants, and mobile themeStore |
| **Priority**   | P0 (Blocking)                                                                 |
| **Estimate**   | 4h                                                                            |
| **Depends On** | P0.2                                                                          |

**Files to Modify:**

```
apps/web/src/pages/customize/identity-customization/constants.ts    — Add UNCOMMON tier
packages/animation-constants/src/registries/borders.ts              — ALL rarity values UPPERCASE → lowercase
packages/animation-constants/src/registries/nameplates.ts           — ALL rarity values UPPERCASE → lowercase (includes MYTHICAL → mythic)
packages/animation-constants/src/registries/profileEffects.ts       — ALL rarity values UPPERCASE → lowercase
apps/mobile/src/stores/themeStore.ts                                 — Verify 7-tier alignment
```

> **⚠️ SCOPE EXPANSION (from verification C8):** The original task only addressed
> `MYTHICAL → mythic`. In reality, ALL rarity values in `animation-constants` are UPPERCASE (`FREE`,
> `COMMON`, `RARE`, `EPIC`, `LEGENDARY`, `MYTHIC/MYTHICAL`). This task must convert the ENTIRE
> casing convention to lowercase across `borders.ts` (532 lines), `nameplates.ts`, and
> `profileEffects.ts`, plus update all consumers of these values.

**File to Create:**

```
packages/shared-types/src/rarity.ts
```

**Implementation of `rarity.ts`:**

```typescript
/**
 * @module rarity
 * @version 1.0.0
 * @since v1.0.1
 *
 * Canonical rarity tier system. Every cosmetic type uses these tiers.
 * Mirrors CGraph.Cosmetics.Rarity (backend).
 */

export const RARITY_TIERS = [
  'free',
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
  'mythic',
] as const;
export type RarityTier = (typeof RARITY_TIERS)[number];

export const RARITY_COLORS: Record<RarityTier, string> = {
  free: '#9CA3AF',
  common: '#22C55E',
  uncommon: '#3B82F6',
  rare: '#A855F7',
  epic: '#F97316',
  legendary: '#EF4444',
  mythic: '#EAB308',
} as const;

export const RARITY_LABELS: Record<RarityTier, string> = {
  free: 'Free',
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
  mythic: 'Mythic',
} as const;

export function rarityRank(tier: RarityTier): number {
  return RARITY_TIERS.indexOf(tier);
}

export function compareRarity(a: RarityTier, b: RarityTier): number {
  return rarityRank(a) - rarityRank(b);
}
```

**Acceptance Criteria:**

- [ ] `shared-types` exports `RarityTier`, `RARITY_TIERS`, `RARITY_COLORS`
- [ ] `shared-types` `package.json` exports map updated with `"./rarity"` entry
- [ ] Web `constants.ts` uses `RARITY_TIERS` from `@cgraph/shared-types` (includes UNCOMMON)
- [ ] `animation-constants` uses lowercase rarity values throughout (`free`, `common`, `uncommon`,
      `rare`, `epic`, `legendary`, `mythic`) — NOT uppercase
- [ ] `animation-constants` `MYTHICAL` unified to `mythic` across all registries
- [ ] Mobile `themeStore.ts` rarity colors match shared definition
- [ ] TypeScript compiles with zero errors across web + mobile

---

### P0.5 — API Endpoint Audit & Unification

| Field          | Value                                                                      |
| -------------- | -------------------------------------------------------------------------- |
| **ID**         | P0.5                                                                       |
| **Title**      | Audit all API endpoints across web/mobile, create unified endpoint catalog |
| **Priority**   | P1                                                                         |
| **Estimate**   | 6h                                                                         |
| **Depends On** | —                                                                          |

**Description:** Web uses `PATCH /api/v1/me/customizations`, mobile uses different paths and verbs.
Audit all usage, create canonical endpoint list, deprecate divergent paths.

**Files to Create:**

```
docs/api/ENDPOINT_CATALOG.md                      — Every endpoint, verb, request/response types
packages/api-client/src/endpoints.ts              — Typed endpoint constants
```

**Approach:**

1. `grep -r "api/v1" apps/web/src/ apps/mobile/src/ packages/api-client/` → collect all endpoint
   usage
2. `grep -r "scope.*api.*v1\|get.*\"/\|post.*\"/\|put.*\"/\|patch.*\"/\|delete.*\"/" apps/backend/lib/cgraph_web/router.ex`
   → collect all backend routes
3. Cross-reference: identify mismatches (PATCH vs PUT, different paths for same resource)
4. Create unified catalog with canonical verb + path
5. Add typed constants to `@cgraph/api-client`

**Acceptance Criteria:**

- [ ] Every backend route has a matching frontend usage entry
- [ ] Web and mobile use identical paths/verbs for the same resources
- [ ] Deprecated endpoints marked with sunset date
- [ ] `docs/api/ENDPOINT_CATALOG.md` complete and reviewed

---

### P0.6 — Exchange Rate & Display Constants

| Field          | Value                                                 |
| -------------- | ----------------------------------------------------- |
| **ID**         | P0.6                                                  |
| **Title**      | Define Node exchange rate constant and wallet display |
| **Priority**   | P1                                                    |
| **Estimate**   | 2h                                                    |
| **Depends On** | —                                                     |

**Description:** 1 Node = €0.008. This rate is mentioned in the Nodes doc but never defined in code.
Add as backend config + shared-types constant.

**Files to Create/Modify:**

```
apps/backend/lib/cgraph/nodes/nodes.ex                — Add @exchange_rate_eur 0.008
packages/shared-types/src/nodes.ts                     — Add NODES_EXCHANGE_RATE_EUR
apps/backend/config/config.exs                         — Add :cgraph, :nodes_exchange_rate config
```

**Acceptance Criteria:**

- [ ] Exchange rate sourced from application config (overridable per environment)
- [ ] Wallet modal displays "≈ €X.XX" next to Node balance using this rate
- [ ] Shared types export `NODES_EXCHANGE_RATE_EUR`

---

### P0.7 — Profile Theme Name Reconciliation

| Field          | Value                                                                            |
| -------------- | -------------------------------------------------------------------------------- |
| **ID**         | P0.7                                                                             |
| **Title**      | Reconcile backend 22 presets vs frontend 18 themes — create unified 25-theme set |
| **Priority**   | P1                                                                               |
| **Estimate**   | 4h                                                                               |
| **Depends On** | P0.1                                                                             |

**Description:** Backend `profile_theme.ex` has 22 presets (`minimalist-dark`, `ocean-deep`,
`steampunk-brass`, ...). Frontend `profileThemes.ts` has 18 completely different themes
(`8bit-arcade`, `jp-zen`, `anime-power`, ...). Zero naming overlap. Cosmetics doc targets 25 total
(5 free + 5 earned + 15 shop).

**Approach:** Create new merged set of 25 with consistent naming. Update both layers.

**Files to Modify:**

```
apps/backend/lib/cgraph/gamification/profile_theme.ex    — Replace @presets with 25-theme set
packages/animation-constants/src/registries/profileThemes.ts  — Match backend naming
```

**File to Create:**

```
apps/backend/priv/repo/migrations/YYYYMMDD_reconcile_profile_themes.exs
```

**Acceptance Criteria:**

- [ ] Backend and frontend use identical theme slugs
- [ ] 25 themes: 5 free (always available) + 5 earned (milestone unlocks) + 15 shop (Nodes purchase)
- [ ] Existing user selections migrated to nearest matching new theme
- [ ] Migration has `down/0` rollback

---

### P0.8 — Shared Cosmetics Types Package

| Field          | Value                                                                             |
| -------------- | --------------------------------------------------------------------------------- |
| **ID**         | P0.8                                                                              |
| **Title**      | Create `@cgraph/shared-types/src/cosmetics.ts` with all cosmetic type definitions |
| **Priority**   | P0 (Blocking for Phase 2)                                                         |
| **Estimate**   | 4h                                                                                |
| **Depends On** | P0.1, P0.4                                                                        |

**File to Create:**

```
packages/shared-types/src/cosmetics.ts
```

**Types to Define:**

```typescript
// Cosmetic base
export interface CosmeticItem {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly rarity: RarityTier;
  readonly cosmeticType: CosmeticType;
  readonly imageUrl: string | null;
  readonly animationType: AnimationType | null;
  readonly unlockType: UnlockType;
  readonly unlockCondition: UnlockCondition | null;
  readonly nodesCost: number | null;
  readonly isSeasonal: boolean;
  readonly seasonExpiresAt: string | null;
  readonly themeId: string | null;
  readonly createdAt: string;
}

export type CosmeticType =
  | 'border'
  | 'title'
  | 'badge'
  | 'nameplate'
  | 'profile_effect'
  | 'profile_frame'
  | 'chat_bubble'
  | 'particle'
  | 'secret_theme'
  | 'name_style';
export type UnlockType =
  | 'earned'
  | 'purchased'
  | 'seasonal'
  | 'admin_granted'
  | 'free'
  | 'subscription';
export type AnimationType = 'none' | 'glow' | 'pulse' | 'shimmer' | 'rotate';

// Unlock conditions
export interface UnlockCondition {
  readonly type: UnlockConditionType;
  readonly threshold: number;
  readonly additionalRequirements?: Record<string, unknown>;
}
export type UnlockConditionType =
  | 'messages_sent'
  | 'posts_created'
  | 'friends_added'
  | 'groups_joined'
  | 'voice_hours'
  | 'tips_sent'
  | 'nodes_earned'
  | 'account_age_days'
  | 'secret_chat_days'
  | 'e2ee_verifications'
  | 'helpful_votes'
  | 'forum_members'
  | 'referrals'
  | 'security_features';

// User inventory
export interface UserCosmeticInventory {
  readonly id: string;
  readonly userId: string;
  readonly cosmeticType: CosmeticType;
  readonly cosmeticId: string;
  readonly source: UnlockType;
  readonly equipped: boolean;
  readonly equippedSlot: number | null;
  readonly acquiredAt: string;
  readonly expiresAt: string | null;
}

// Visibility
export type CosmeticSurface =
  | 'dm-header'
  | 'forum-post'
  | 'group-list'
  | 'friend-list'
  | 'full-profile'
  | 'search-result';

export interface CosmeticVisibilityRule {
  readonly surface: CosmeticSurface;
  readonly showAvatar: boolean;
  readonly showBorder: boolean;
  readonly showTitle: boolean;
  readonly maxBadges: number;
  readonly nameplateVariant: 'full' | 'compact' | 'hidden';
  readonly showEffects: boolean;
}
```

**Acceptance Criteria:**

- [ ] All types compile with strict TypeScript
- [ ] Re-exported from `packages/shared-types/src/index.ts`
- [ ] Used by both web and mobile without modification

---

### Pre-Phase Totals

|    ID     | Task                            |  Hours  |
| :-------: | ------------------------------- | :-----: |
|   P0.1    | Canonical cosmetics manifest    |   6h    |
|   P0.2    | Unified rarity module (backend) |   3h    |
|   P0.3    | Rarity migration (backend)      |   3h    |
|   P0.4    | Rarity unification (frontend)   |   4h    |
|   P0.5    | API endpoint audit              |   6h    |
|   P0.6    | Exchange rate constants         |   2h    |
|   P0.7    | Profile theme reconciliation    |   4h    |
|   P0.8    | Shared cosmetics types          |   4h    |
|   P0.9    | Shared-types exports map fix    |   2h    |
|   P0.10   | Oban queue config expansion     |   1h    |
| **Total** | **10 tasks**                    | **35h** |

---

### P0.9 — Shared-Types Exports Map Fix

| Field          | Value                                                                |
| -------------- | -------------------------------------------------------------------- |
| **ID**         | P0.9                                                                 |
| **Title**      | Update `@cgraph/shared-types` package.json exports map for new files |
| **Priority**   | P0 (Blocking)                                                        |
| **Estimate**   | 2h                                                                   |
| **Depends On** | —                                                                    |

**Description (from verification C6):** The `@cgraph/shared-types` package.json `exports` field only
maps `.`, `./api`, `./models`, `./events`. Any new file (e.g., `rarity.ts`, `cosmetics.ts`,
`nodes.ts`) needs a corresponding exports entry or deep imports will fail with "Module not found".

**File to Modify:**

```
packages/shared-types/package.json
```

**Changes Required:**

1. Add exports entries for each new domain file:
   - `"./rarity": { "import": "./src/rarity.ts", "types": "./src/rarity.ts" }`
   - `"./cosmetics": { "import": "./src/cosmetics.ts", "types": "./src/cosmetics.ts" }`
   - `"./nodes": { "import": "./src/nodes.ts", "types": "./src/nodes.ts" }`
   - `"./forums": { "import": "./src/forums.ts", "types": "./src/forums.ts" }`
2. Fix 4 existing files not re-exported from `index.ts`:
   - `forum-emoji.ts`, `forum-moderation.ts`, `forum-plugin.ts`, `forum-rss.ts`
3. Add exports entries for the 4 existing orphaned files

**Acceptance Criteria:**

- [ ] `import { RarityTier } from '@cgraph/shared-types/rarity'` resolves correctly
- [ ] All 4 orphaned forum files importable via their export paths
- [ ] TypeScript compiles with zero module resolution errors

---

### P0.10 — Oban Queue Configuration Expansion

| Field          | Value                                                     |
| -------------- | --------------------------------------------------------- |
| **ID**         | P0.10                                                     |
| **Title**      | Add missing Oban queues to config.exs for planned workers |
| **Priority**   | P1                                                        |
| **Estimate**   | 1h                                                        |
| **Depends On** | —                                                         |

**Description (from verification N11):** Several planned workers use Oban queues that don't exist in
the current 22-queue config.

**File to Modify:**

```
apps/backend/config/config.exs
```

**Queues to Add:** | Queue Name | Concurrency | Used By | |------------|:-----------:|---------| |
`payments` | 5 | `HeldNodesReleaseWorker` (1.3), `PayoutProcessingWorker` (3.21) | | `cosmetics` |
10 | `CosmeticGrantWorker` (2.16), `SeasonalRotationWorker` (2.20) | | `reputation_calc` | 5 |
`ReputationCalcWorker` (4.3) | | `forum_indexing` | 10 | `SearchIndexWorker` (4.3) | | `critical` |
20 | `UpdateThreadStatsWorker` (4.3) | | `unlocks` | 10 | UnlockEngine batch processing (2.12) |

**Acceptance Criteria:**

- [ ] All 6 new queues added to Oban config
- [ ] Application compiles and Oban starts without errors
- [ ] Existing 22 queues unchanged

---

## Phase 1: Parity + Mobile Nodes (v1.1 — Q2 2026)

> **Goal:** Every CGraph user on mobile can use Nodes, discover content, access Secret Chat, and has
> customization parity with web. Tip button available in DMs and profiles on web. **Duration:** ~5
> weeks | **Hours:** ~162h | **Parallel Tracks:** 1A (Nodes), 1B (Secret Chat), 1C (Parity)

### Track 1A: Mobile Nodes + Web Tip Wiring

#### 1.1 — Backend: Add Tip Minimum Constant

| Field          | Value                                             |
| -------------- | ------------------------------------------------- |
| **ID**         | 1.1                                               |
| **Title**      | Add `@min_tip` constant and validation to `tip/3` |
| **Priority**   | P1                                                |
| **Estimate**   | 1h                                                |
| **Depends On** | —                                                 |

**File to Modify:**

```
apps/backend/lib/cgraph/nodes/nodes.ex
```

**Changes:**

- Add `@min_tip 10` module attribute
- Add guard clause to `tip/3`: validate `amount >= @min_tip`
- Return `{:error, :tip_below_minimum}` if validation fails
- Add `@doc` and `@spec` to `tip/3` if missing

**Acceptance Criteria:**

- [ ] `tip(sender_id, receiver_id, 5)` returns `{:error, :tip_below_minimum}`
- [ ] `tip(sender_id, receiver_id, 10)` succeeds (valid minimum)
- [ ] Unit test covers minimum validation edge cases

---

#### 1.2 — Backend: Tip Rate Limiter Plug

| Field          | Value                                                        |
| -------------- | ------------------------------------------------------------ |
| **ID**         | 1.2                                                          |
| **Title**      | Create tip-specific rate limiter (10 tips/min per user pair) |
| **Priority**   | P2                                                           |
| **Estimate**   | 2h                                                           |
| **Depends On** | —                                                            |

**File to Create:**

```
apps/backend/lib/cgraph_web/plugs/tip_rate_limiter.ex
```

**Implementation:**

- Use ETS-backed counter keyed by `{sender_id, receiver_id}`
- Window: 60 seconds, max: 10 tips per pair
- Global per-user limit: 50 tips/minute regardless of recipient
- Return `429 Too Many Requests` with `Retry-After` header

**Acceptance Criteria:**

- [ ] 11th tip in 60s returns 429
- [ ] Different recipient pairs have independent limits
- [ ] Counter resets after window expires
- [ ] Plug registered on `/api/v1/nodes/tip` route

---

#### 1.3 — Backend: Held Nodes Release Worker

| Field          | Value                                                           |
| -------------- | --------------------------------------------------------------- |
| **ID**         | 1.3                                                             |
| **Title**      | Create `HeldNodesReleaseWorker` — releases 21-day held earnings |
| **Priority**   | P1                                                              |
| **Estimate**   | 3h                                                              |
| **Depends On** | —                                                               |

**File to Create:**

```
apps/backend/lib/cgraph/workers/held_nodes_release_worker.ex
```

**Implementation:**

- `use Oban.Worker, queue: :payments, max_attempts: 5`
- **⚠️ NOTE (N11):** The `:payments` queue does not exist in the current Oban config (22 queues).
  Add `payments: 5` to `config :cgraph, Oban, queues:` in `config.exs` before deploying this worker.
- Oban Cron: runs daily at 03:00 UTC
- Query: `NodeTransaction |> where([t], t.status == :held and t.held_until <= ^now) |> Repo.all()`
- For each: update status to `:released`, credit wallet balance
- Telemetry: `[:cgraph, :nodes, :hold_released]` with count + total amount
- Batch process in chunks of 100

**Acceptance Criteria:**

- [ ] Transactions held for 21+ days are released
- [ ] Wallet balance updated atomically (row-level lock)
- [ ] Worker is idempotent (re-running doesn't double-credit)
- [ ] Oban Cron registered in `config.exs`

---

#### 1.4 — Web: TipButton in DM Message Actions

| Field          | Value                                          |
| -------------- | ---------------------------------------------- |
| **ID**         | 1.4                                            |
| **Title**      | Add TipButton to DM message hover/context menu |
| **Priority**   | P1                                             |
| **Estimate**   | 3h                                             |
| **Depends On** | —                                              |

**Files to Modify:**

```
apps/web/src/modules/chat/components/message-actions.tsx    — Add tip action (NOTE: module is `chat`, NOT `messaging`)
apps/web/src/modules/nodes/components/tip-modal.tsx              — Accept context prop
```

**Implementation:**

- Add "Tip" icon button to message action bar (existing pattern: reply, react, pin)
- On click: open existing `TipModal` with `context: 'dm'` and `recipientId` pre-filled
- Show tip amount in message after successful tip: "💰 Tipped X Nodes"
- Respect feature flag: `useFeatureFlag('nodes.dm_tipping')`

**Acceptance Criteria:**

- [ ] Tip button visible on hover of received messages in DMs
- [ ] Tip button NOT shown on own messages
- [ ] TipModal opens with correct recipient
- [ ] Successful tip shows inline indicator
- [ ] Feature-flagged

---

#### 1.5 — Web: TipButton on Profile Card

| Field          | Value                              |
| -------------- | ---------------------------------- |
| **ID**         | 1.5                                |
| **Title**      | Add TipButton to user profile card |
| **Priority**   | P1                                 |
| **Estimate**   | 2h                                 |
| **Depends On** | —                                  |

**Files to Modify:**

```
apps/web/src/modules/social/components/profile-card/profile-card.tsx
```

**Implementation:**

- Add "Tip" button next to "Add Friend" / "Message" actions
- Hidden on own profile
- Opens `TipModal` with `context: 'profile'` and user ID

**Acceptance Criteria:**

- [ ] Tip button visible on other users' profile cards
- [ ] Hidden on own profile
- [ ] TipModal context set to 'profile'

---

#### 1.6 — Web: Tip Minimum Validation in Modal

| Field          | Value                                       |
| -------------- | ------------------------------------------- |
| **ID**         | 1.6                                         |
| **Title**      | Add minimum tip validation to tip-modal.tsx |
| **Priority**   | P2                                          |
| **Estimate**   | 1h                                          |
| **Depends On** | 1.1                                         |

**File to Modify:**

```
apps/web/src/modules/nodes/components/tip-modal.tsx
```

**Changes:**

- Disable "Send Tip" button when amount < 10
- Show inline error: "Minimum tip is 10 Nodes"
- Import `MIN_TIP` from `@cgraph/shared-types/src/nodes.ts`

---

#### 1.7 — Web: Content Unlock Overlay

| Field          | Value                                                        |
| -------------- | ------------------------------------------------------------ |
| **ID**         | 1.7                                                          |
| **Title**      | Build content unlock overlay component for gated forum posts |
| **Priority**   | P1                                                           |
| **Estimate**   | 4h                                                           |
| **Depends On** | —                                                            |

**File to Create:**

```
apps/web/src/modules/nodes/components/content-unlock-overlay.tsx
```

**Implementation:**

- Blurred content preview with centered "🔒 Unlock for X Nodes" button
- Shows teaser (title, first 100 chars of content)
- On click: confirm dialog → `POST /api/v1/nodes/unlock` → remove overlay, show full content
- Handles loading + error states
- Reusable: accepts `contentId`, `price`, `contentType` props

**Acceptance Criteria:**

- [ ] Renders blurred overlay on gated content
- [ ] Unlock flow deducts Nodes and reveals content
- [ ] Error state shows "Insufficient Nodes" with link to shop
- [ ] Accessible: screen reader announces "locked content, X Nodes to unlock"

---

#### 1.8 — Web: Integrate Unlock Overlay in Thread View

| Field          | Value                                                 |
| -------------- | ----------------------------------------------------- |
| **ID**         | 1.8                                                   |
| **Title**      | Integrate content-unlock-overlay in forum thread-view |
| **Priority**   | P1                                                    |
| **Estimate**   | 2h                                                    |
| **Depends On** | 1.7                                                   |

**File to Modify:**

```
apps/web/src/modules/forums/components/thread-view/thread-view.tsx
```

**Changes:**

- Check `thread.isContentGated && !thread.userHasAccess`
- Wrap post content with `<ContentUnlockOverlay>` component
- After unlock: refetch thread data to update access state

---

#### 1.9 — Mobile: Nodes Store (Zustand)

| Field          | Value                                                  |
| -------------- | ------------------------------------------------------ |
| **ID**         | 1.9                                                    |
| **Title**      | Create `nodesStore.ts` — mobile Nodes state management |
| **Priority**   | P0                                                     |
| **Estimate**   | 4h                                                     |
| **Depends On** | P0.6                                                   |

**File to Create:**

```
apps/mobile/src/stores/nodesStore.ts
```

**State Shape:**

```typescript
interface NodesState {
  // ── State ──────────────────────────────────────
  balance: number;
  transactions: NodeTransaction[];
  bundles: NodeBundle[];
  isLoading: boolean;
  error: string | null;

  // ── Actions ────────────────────────────────────
  fetchBalance: () => Promise<void>;
  fetchTransactions: (page?: number) => Promise<void>;
  fetchBundles: () => Promise<void>;
  sendTip: (recipientId: string, amount: number, context: TipContext) => Promise<boolean>;
  unlockContent: (contentId: string, price: number) => Promise<boolean>;
  purchaseBundle: (bundleId: string) => Promise<void>;
  requestWithdrawal: (amount: number) => Promise<void>;
}
```

**Acceptance Criteria:**

- [ ] All actions call correct API endpoints via `api` from `../lib/api`
- [ ] Balance persisted via manual `AsyncStorage.setItem` (NOT persist middleware)
- [ ] Loading + error states handled for every action
- [ ] Store includes `hydrate()` method called on app start
- [ ] Optimistic balance update on tip/unlock with rollback on failure

---

#### 1.10 — Mobile: Nodes Service

| Field          | Value                                          |
| -------------- | ---------------------------------------------- |
| **ID**         | 1.10                                           |
| **Title**      | Create `nodesService.ts` — API calls for Nodes |
| **Priority**   | P0                                             |
| **Estimate**   | 3h                                             |
| **Depends On** | P0.5                                           |

**File to Create:**

```
apps/mobile/src/services/nodesService.ts
```

> **⚠️ VERIFIED (C7):** Mobile does NOT use `@cgraph/api-client`. All 16 existing mobile services
> import from `../lib/api` (using `@cgraph/utils`'s `createHttpClient`). Follow this pattern:
> `import api from '../lib/api'` then `api.get('/api/v1/...')`.

**Implementation Pattern (matching `forumService.ts`):**

```typescript
import api from '../lib/api';

export const nodesService = {
  getWallet: () => api.get('/api/v1/nodes/wallet'),
  getTransactions: (page = 1) => api.get(`/api/v1/nodes/transactions?page=${page}`),
  getBundles: () => api.get('/api/v1/nodes/bundles'),
  sendTip: (recipientId: string, amount: number) =>
    api.post('/api/v1/nodes/tip', { recipientId, amount }),
  unlockContent: (contentId: string) => api.post('/api/v1/nodes/unlock', { contentId }),
  requestWithdrawal: (amount: number) => api.post('/api/v1/nodes/withdraw', { amount }),
};
```

**Endpoints:**

- `GET /api/v1/nodes/wallet` → balance, pending
- `GET /api/v1/nodes/transactions?page=N` → paginated history
- `GET /api/v1/nodes/bundles` → available purchase bundles
- `POST /api/v1/nodes/tip` → send tip
- `POST /api/v1/nodes/unlock` → unlock content
- `POST /api/v1/nodes/withdraw` → withdrawal request

---

#### 1.11 — Mobile: Wallet Screen

| Field          | Value                                                        |
| -------------- | ------------------------------------------------------------ |
| **ID**         | 1.11                                                         |
| **Title**      | Create wallet screen — balance, transaction history, filters |
| **Priority**   | P0                                                           |
| **Estimate**   | 8h                                                           |
| **Depends On** | 1.9, 1.10                                                    |

**File to Create:**

```
apps/mobile/src/screens/nodes/nodes-wallet-screen.tsx
```

> **⚠️ VERIFIED (M10):** `lib/wallet/` already exists for WalletConnect/MetaMask blockchain wallet.
> To avoid confusion between blockchain wallet and Nodes virtual currency wallet, this screen is
> named `nodes-wallet-screen.tsx` (NOT `wallet-screen.tsx`). Navigation route: `NodesWallet` (not
> `Wallet`).

**UI Specification:**

- Header: large balance display with "≈ €X.XX" subtitle (using exchange rate)
- Action buttons: "Buy Nodes", "Send Tip", "Withdraw"
- Transaction list: FlatList with pull-to-refresh, date grouping, type icons
- Filters: All / Tips Sent / Tips Received / Purchases / Unlocks / Withdrawals
- Empty state: illustration + "Your Nodes journey starts here"

**Acceptance Criteria:**

- [ ] Displays current balance from API
- [ ] Transaction list loads with infinite scroll
- [ ] Filters work correctly
- [ ] Pull-to-refresh updates balance + transactions
- [ ] Handles zero-balance state gracefully

---

#### 1.12 — Mobile: Nodes Shop Screen

| Field          | Value                                                        |
| -------------- | ------------------------------------------------------------ |
| **ID**         | 1.12                                                         |
| **Title**      | Create shop screen — 5 bundles with Stripe/IAP purchase flow |
| **Priority**   | P0                                                           |
| **Estimate**   | 8h                                                           |
| **Depends On** | 1.9, 1.10                                                    |

**File to Create:**

```
apps/mobile/src/screens/nodes/shop-screen.tsx
```

**UI Specification:**

- Grid of 5 bundle cards (matching web: 100, 500, 1000, 5000, 10000 Nodes)
- Each card: Node amount, price in local currency, "best value" tag on largest
- Purchase flow: Stripe Payment Sheet (or IAP adapter for App Store review)
- Post-purchase: success animation → balance update → back to wallet

---

#### 1.13 — Mobile: Tip Button & Modal

| Field          | Value                                                     |
| -------------- | --------------------------------------------------------- |
| **ID**         | 1.13                                                      |
| **Title**      | Create tip button (DM long-press + profile) and tip modal |
| **Priority**   | P0                                                        |
| **Estimate**   | 6h                                                        |
| **Depends On** | 1.9                                                       |

**Files to Create:**

```
apps/mobile/src/components/nodes/tip-button.tsx
apps/mobile/src/components/nodes/tip-modal.tsx
```

**Implementation:**

- `TipButton`: Small icon button, renders in DM message long-press menu + profile card actions
- `TipModal`: Bottom sheet with preset amounts (10/50/100/500), custom input, breakdown display
- "Tip again" shortcut: remembers last tip amount per recipient
- Minimum validation: 10 Nodes
- Success haptic feedback + confetti animation

---

#### 1.14 — Mobile: Content Unlock Button

| Field          | Value                                              |
| -------------- | -------------------------------------------------- |
| **ID**         | 1.14                                               |
| **Title**      | Create content unlock button for gated forum posts |
| **Priority**   | P1                                                 |
| **Estimate**   | 4h                                                 |
| **Depends On** | 1.9                                                |

**File to Create:**

```
apps/mobile/src/components/nodes/content-unlock-button.tsx
```

---

#### 1.15 — Mobile: Withdrawal Screen

| Field          | Value                    |
| -------------- | ------------------------ |
| **ID**         | 1.15                     |
| **Title**      | Create withdrawal screen |
| **Priority**   | P1                       |
| **Estimate**   | 4h                       |
| **Depends On** | 1.9, 1.10                |

**File to Create:**

```
apps/mobile/src/screens/nodes/withdrawal-screen.tsx
```

**UI:** Amount input (min 1000), payout method selection, fee breakdown, confirm button.

---

### Track 1B: Mobile Secret Chat

#### 1.16 — Mobile: Secret Chat Module

| Field          | Value                                                                   |
| -------------- | ----------------------------------------------------------------------- |
| **ID**         | 1.16                                                                    |
| **Title**      | Implement full Secret Chat — PQXDH key exchange, ghost mode, panic wipe |
| **Priority**   | P0                                                                      |
| **Estimate**   | 40h                                                                     |
| **Depends On** | —                                                                       |

> **⚠️ VERIFIED (M4):** Mobile `modules/` directory is empty scaffolding (all 11 subdirectories
> contain only `export {}`). Real feature code lives in `screens/`, `stores/`, `services/`,
> `features/`, and `lib/`. Secret chat MUST follow the existing pattern, NOT the modules/
> convention.
>
> **⚠️ VERIFIED (M5):** `lib/crypto/pq-bridge.ts` already wraps `@cgraph/crypto`'s ML-KEM-768,
> PQXDH, and Triple Ratchet primitives. `lib/crypto/e2ee.ts` provides higher-level encryption API.
> Do NOT create new crypto wrappers — import from existing `lib/crypto/`.

**Files to Create (following existing codebase patterns):**

```
apps/mobile/src/screens/secret-chat/
  ├── secret-chat-screen.tsx
  └── secret-chat-settings-screen.tsx
apps/mobile/src/stores/secretChatStore.ts          — plain create() with manual AsyncStorage
apps/mobile/src/services/secretChatService.ts      — import api from '../lib/api'
apps/mobile/src/components/secret-chat/
  ├── secret-chat-header.tsx
  ├── secret-chat-message.tsx
  ├── secret-chat-input.tsx
  ├── ghost-mode-indicator.tsx
  ├── key-verification-screen.tsx
  └── panic-wipe-button.tsx
```

**Implementation Notes:**

- Import PQXDH from existing `lib/crypto/pq-bridge.ts` and E2EE from `lib/crypto/e2ee.ts` — do NOT
  recreate
- `secretChatService.ts` follows `forumService.ts` pattern: `import api from '../lib/api'`
- `secretChatStore.ts` follows manual AsyncStorage pattern (no persist middleware)
- Ghost mode: messages auto-delete after configurable time (5s → 24h)
- Panic wipe: one-tap button that locally purges all secret chat data + sends wipe signal
- Theme support: use existing 12 secret themes (void, midnight, signal, etc.)
- Screenshot detection: disable screenshots in secret chat (Android: `FLAG_SECURE`, iOS: screen
  recording notification)

**Acceptance Criteria:**

- [ ] End-to-end encryption with PQXDH key exchange
- [ ] Messages decrypt correctly on both devices
- [ ] Ghost mode auto-deletes messages after timer
- [ ] Panic wipe clears all local secret chat data
- [ ] 12 secret themes apply correctly
- [ ] Key verification screen shows safety number comparison

---

### Track 1C: Mobile Parity

#### 1.17 — Mobile: Discovery Store + Feed Modes

| Field          | Value                                          |
| -------------- | ---------------------------------------------- |
| **ID**         | 1.17                                           |
| **Title**      | Create discoveryStore + implement 5 feed modes |
| **Priority**   | P1                                             |
| **Estimate**   | 8h                                             |
| **Depends On** | —                                              |

**Files to Create:**

```
apps/mobile/src/stores/discoveryStore.ts
```

**Feed Modes (matching web):**

- `trending` — Hot items by engagement velocity
- `fresh` — Chronological newest first
- `following` — From followed users/forums
- `recommended` — Algorithm-based suggestions
- `nearby` — Location-based (if enabled)

---

#### 1.18 — Mobile: Discovery Feed UI

| Field          | Value                                          |
| -------------- | ---------------------------------------------- |
| **ID**         | 1.18                                           |
| **Title**      | Update explore screens with feed mode selector |
| **Priority**   | P1                                             |
| **Estimate**   | 8h                                             |
| **Depends On** | 1.17                                           |

**Files to Modify:**

```
apps/mobile/src/screens/explore/    — Update existing 3 files
```

**File to Create:**

```
apps/mobile/src/components/discovery/frequency-picker.tsx
apps/mobile/src/components/discovery/topic-selector.tsx
```

---

#### 1.19 — Mobile: Theme Category Browser

| Field          | Value                                           |
| -------------- | ----------------------------------------------- |
| **ID**         | 1.19                                            |
| **Title**      | Theme browser with 4 categories + secret themes |
| **Priority**   | P1                                              |
| **Estimate**   | 6h                                              |
| **Depends On** | —                                               |

**File to Create:**

```
apps/mobile/src/screens/customize/theme-browser-screen.tsx
```

**Categories:** Profile, Chat, Forum, App + Secret (unlockable section)

---

#### 1.20–1.24 — Mobile: Effects & Customization Parity

> **⚠️ VERIFIED (N10):** Mobile already has `badge-selection-screen.tsx`,
> `effects-customization-screen.tsx`, `identity-customization-screen.tsx`,
> `title-selection-screen.tsx`. New screens below EXTEND the customization system — verify no UI
> overlap with existing screens before implementation.

|  ID  | Task                                        | Est. | Depends |
| :--: | ------------------------------------------- | :--: | :-----: |
| 1.20 | Particle effects screen                     |  8h  |    —    |
| 1.21 | Background effects screen                   |  6h  |    —    |
| 1.22 | UI animation presets screen                 |  4h  |    —    |
| 1.23 | Name styles screen (font + effect + colors) |  6h  |    —    |
| 1.24 | Profile layouts selector (5 templates)      |  4h  |    —    |

**Files to Create:**

```
apps/mobile/src/screens/customize/particle-effects-screen.tsx
apps/mobile/src/screens/customize/background-effects-screen.tsx
apps/mobile/src/screens/customize/animation-presets-screen.tsx
apps/mobile/src/screens/customize/name-styles-screen.tsx
apps/mobile/src/screens/customize/profile-layouts-screen.tsx
```

---

#### 1.25 — Mobile: Privacy Settings Expansion

| Field          | Value                                                            |
| -------------- | ---------------------------------------------------------------- |
| **ID**         | 1.25                                                             |
| **Title**      | Expand mobile privacy settings from 6 to 15 toggles (web parity) |
| **Priority**   | P2                                                               |
| **Estimate**   | 4h                                                               |
| **Depends On** | —                                                                |

**File to Modify:**

```
apps/mobile/src/screens/settings/privacy-screen.tsx
```

**Missing toggles (from Feature Map):** Online status visibility, read receipts, typing indicators,
profile visibility, friend request filtering, message request filtering, block list management, data
sharing preferences, activity status.

---

#### 1.26 — Mobile: Chat Effects Store

| Field          | Value                              |
| -------------- | ---------------------------------- |
| **ID**         | 1.26                               |
| **Title**      | Create chatEffectsStore for mobile |
| **Priority**   | P2                                 |
| **Estimate**   | 4h                                 |
| **Depends On** | —                                  |

**File to Create:**

```
apps/mobile/src/stores/chatEffectsStore.ts
```

---

#### 1.27 — Mobile: Navigator Updates

| Field          | Value                                          |
| -------------- | ---------------------------------------------- |
| **ID**         | 1.27                                           |
| **Title**      | Register all new Phase 1 screens in navigation |
| **Priority**   | P1                                             |
| **Estimate**   | 3h                                             |
| **Depends On** | 1.11–1.26                                      |

**Files to Modify:**

```
apps/mobile/src/navigation/    — Multiple navigator files
```

---

#### 1.28 — Web: Friend Favorites + Nicknames (Parity)

| Field          | Value                                                         |
| -------------- | ------------------------------------------------------------- |
| **ID**         | 1.28                                                          |
| **Title**      | Add friend favorites and nicknames to web (mobile→web parity) |
| **Priority**   | P2                                                            |
| **Estimate**   | 4h                                                            |
| **Depends On** | —                                                             |

---

#### 1.29 — Web: Mutual Friends/Groups on Profile

| Field          | Value                                                     |
| -------------- | --------------------------------------------------------- |
| **ID**         | 1.29                                                      |
| **Title**      | Show mutual friends and mutual groups on web profile card |
| **Priority**   | P2                                                        |
| **Estimate**   | 3h                                                        |
| **Depends On** | —                                                         |

---

#### 1.30 — Shared: Nodes Types + API Client

| Field          | Value                                                         |
| -------------- | ------------------------------------------------------------- |
| **ID**         | 1.30                                                          |
| **Title**      | Add Nodes types to shared-types and API methods to api-client |
| **Priority**   | P1                                                            |
| **Estimate**   | 5h                                                            |
| **Depends On** | P0.5                                                          |

**Files to Create:**

```
packages/shared-types/src/nodes.ts      — NodeWallet, NodeTransaction, NodeBundle, TipContext types
packages/api-client/src/nodes.ts        — tipUser, unlockContent, getWallet, getBundles, withdraw
```

> **⚠️ NOTE (N6):** No `NodesChannel` exists in `@cgraph/socket` (only ForumChannel, UserChannel,
> ConversationChannel, GroupChannel). If Nodes tips need real-time delivery (balance updates, tip
> notifications), consider adding a `NodesChannel` to `@cgraph/socket` or broadcasting via existing
> `UserChannel`. Evaluate this during implementation.
>
> **⚠️ NOTE (N3):** Web has a `data/` directory (`apps/web/src/data/`) containing
> `badgesCollection.ts` and `profileThemes.ts`. These are NOT inside any module. Tasks 2.21 and 2.22
> that expand these collections should locate files in `data/`.

---

### Phase 1 Totals

| Track                       |    Tasks     |         Hours         |
| --------------------------- | :----------: | :-------------------: |
| 1A: Mobile Nodes + Web Tips |   15 tasks   |          55h          |
| 1B: Mobile Secret Chat      |    1 task    |          40h          |
| 1C: Mobile Parity           |   12 tasks   |          62h          |
| Shared                      |    1 task    |          5h           |
| **Total**                   | **29 tasks** | **162h (~4.1 weeks)** |

---

## Phase 2: Cosmetics + Unlock Engine (v1.2 — Q3 2026)

> **Goal:** Every cosmetic has a purpose. The unlock engine evaluates conditions and grants rewards.
> All cosmetic types have backend schemas. Unified inventory. Visibility matrix. Seasonal system.
> **Duration:** ~6 weeks | **Hours:** ~232h | **Parallel Tracks:** 2A (Schemas), 2B (Unlock Engine),
> 2C (Frontend), 2D (Seed Data)

### Track 2A: Backend Schemas

#### 2.1 — Badge Ecto Schema + Migration

| Field          | Value                                                           |
| -------------- | --------------------------------------------------------------- |
| **ID**         | 2.1                                                             |
| **Title**      | Create `badge.ex` schema + migration — CRITICAL missing backend |
| **Priority**   | P0                                                              |
| **Estimate**   | 6h                                                              |
| **Depends On** | P0.2                                                            |

**Files to Create:**

```
apps/backend/lib/cgraph/gamification/badge.ex
apps/backend/priv/repo/migrations/YYYYMMDD_create_badges.exs
```

**Schema Fields:**

```elixir
schema "badges" do
  field :slug, :string
  field :name, :string
  field :description, :string
  field :icon_url, :string
  field :category, Ecto.Enum, values: [:achievement, :role, :status, :seasonal, :exclusive, :messaging, :forum, :group, :social, :creator, :security, :shop]
  field :rarity, :string  # validated via validate_inclusion(changeset, :rarity, CGraph.Cosmetics.Rarity.string_values())
  field :unlock_type, Ecto.Enum, values: [:earned, :purchased, :seasonal, :admin_granted, :free]
  field :unlock_condition, :map  # JSONB
  field :nodes_cost, :decimal, default: nil
  field :max_equip, :integer, default: 5
  field :is_active, :boolean, default: true
  field :theme_id, :binary_id  # FK to forum_themes (nullable)
  timestamps()
end
```

---

#### 2.2 — Nameplate Ecto Schema + Migration

| Field          | Value                                                               |
| -------------- | ------------------------------------------------------------------- |
| **ID**         | 2.2                                                                 |
| **Title**      | Create `nameplate.ex` schema + migration — CRITICAL missing backend |
| **Priority**   | P0                                                                  |
| **Estimate**   | 6h                                                                  |
| **Depends On** | P0.2                                                                |

**Files to Create:**

```
apps/backend/lib/cgraph/gamification/nameplate.ex
apps/backend/priv/repo/migrations/YYYYMMDD_create_nameplates.exs
```

**Schema Fields:**

```elixir
schema "cosmetic_nameplates" do
  field :slug, :string
  field :name, :string
  field :display_name, :string
  field :description, :string
  field :rarity, :string  # validated via validate_inclusion/3
  field :background_gradient_start, :string
  field :background_gradient_end, :string
  field :text_color, :string
  field :border_style, Ecto.Enum, values: [:solid, :gradient, :neon, :holographic]
  field :icon_url, :string
  field :animation_type, Ecto.Enum, values: [:none, :glow, :pulse, :shimmer]
  field :unlock_type, Ecto.Enum, values: [:earned, :purchased, :seasonal, :admin_granted, :free]
  field :unlock_condition, :map
  field :nodes_cost, :decimal
  field :is_seasonal, :boolean, default: false
  field :season_expires_at, :utc_datetime_usec
  field :theme_id, :binary_id
  timestamps()
end
```

---

#### 2.3 — Profile Effect Schema + Migration

| Field          | Value                                        |
| -------------- | -------------------------------------------- |
| **ID**         | 2.3                                          |
| **Title**      | Create standalone `profile_effect.ex` schema |
| **Priority**   | P1                                           |
| **Estimate**   | 4h                                           |
| **Depends On** | P0.2                                         |

**Files to Create:**

```
apps/backend/lib/cgraph/gamification/profile_effect.ex
apps/backend/priv/repo/migrations/YYYYMMDD_create_profile_effects.exs
```

---

#### 2.4 — Profile Frame Schema + Migration

| Field          | Value                                                                  |
| -------------- | ---------------------------------------------------------------------- |
| **ID**         | 2.4                                                                    |
| **Title**      | Create `profile_frame.ex` — entirely new cosmetic type from Forums doc |
| **Priority**   | P1                                                                     |
| **Estimate**   | 5h                                                                     |
| **Depends On** | P0.2                                                                   |

**Files to Create:**

```
apps/backend/lib/cgraph/gamification/profile_frame.ex
apps/backend/priv/repo/migrations/YYYYMMDD_create_profile_frames.exs
```

**Schema Fields:**

```elixir
schema "cosmetic_profile_frames" do
  field :slug, :string
  field :name, :string
  field :border_style, :string
  field :background_pattern, :string
  field :color_primary, :string
  field :color_secondary, :string
  field :rarity, :string  # validated via validate_inclusion/3
  field :nodes_cost, :decimal
  field :theme_id, :binary_id
  timestamps()
end
```

---

#### 2.5 — Unified User Cosmetic Inventory

| Field          | Value                                                                   |
| -------------- | ----------------------------------------------------------------------- |
| **ID**         | 2.5                                                                     |
| **Title**      | Create `user_cosmetic_inventory` — single table for all owned cosmetics |
| **Priority**   | P0                                                                      |
| **Estimate**   | 6h                                                                      |
| **Depends On** | 2.1, 2.2, 2.3, 2.4                                                      |

**Files to Create:**

```
apps/backend/lib/cgraph/cosmetics/user_cosmetic_inventory.ex
apps/backend/priv/repo/migrations/YYYYMMDD_create_user_cosmetic_inventory.exs
```

**Schema:**

```elixir
schema "user_cosmetic_inventory" do
  belongs_to :user, CGraph.Accounts.User
  field :cosmetic_type, Ecto.Enum, values: [:border, :title, :badge, :nameplate, :profile_effect, :profile_frame, :chat_bubble, :particle, :secret_theme, :name_style]
  field :cosmetic_id, :binary_id
  field :source, Ecto.Enum, values: [:earned, :purchased, :seasonal, :gifted, :admin_granted, :free]
  field :equipped, :boolean, default: false
  field :equipped_slot, :integer  # for badges (slots 1-5)
  field :acquired_at, :utc_datetime_usec
  field :expires_at, :utc_datetime_usec  # for seasonal/temporary items
  timestamps()
end
```

**Indexes:**

- Unique: `{user_id, cosmetic_type, cosmetic_id}`
- Query: `{user_id, cosmetic_type}` — "what badges does user X own?"
- Query: `{user_id, equipped: true}` — "what is user X wearing?"

> **⚠️ VERIFIED (M6):** 4 existing join tables contain user-cosmetic data that MUST be migrated:
> `user_avatar_border`, `user_chat_effect`, `user_profile_theme`, `user_title`. The existing
> `CosmeticsController` queries these individually.

**Additional Sub-Tasks (M6 — Data Migration):**

1. **Migration script:** Copy all rows from 4 join tables → `user_cosmetic_inventory` with correct
   `cosmetic_type` mapping (`user_avatar_border` → `border`, etc.)
2. **Controller updates:** Update existing `CGraphWeb.CosmeticsController` border/theme/effect
   actions to query `user_cosmetic_inventory` instead of individual join tables
3. **Deprecation:** Add `@deprecated` comments to old join table schemas. Plan 2-release sunset:
   keep dual-reading for 2 releases, then drop old tables.
4. **Rollback safety:** Migration `down/0` must restore data to original tables if needed

---

#### 2.6 — User Nameplate Settings Table

| Field          | Value                                                                      |
| -------------- | -------------------------------------------------------------------------- |
| **ID**         | 2.6                                                                        |
| **Title**      | Create `user_nameplate_settings` — active selections + visibility controls |
| **Priority**   | P1                                                                         |
| **Estimate**   | 4h                                                                         |
| **Depends On** | 2.1, 2.2                                                                   |

**Files to Create:**

```
apps/backend/lib/cgraph/cosmetics/user_nameplate_settings.ex
apps/backend/priv/repo/migrations/YYYYMMDD_create_user_nameplate_settings.exs
```

**Schema:**

```elixir
schema "user_nameplate_settings" do
  belongs_to :user, CGraph.Accounts.User
  field :active_nameplate_id, :binary_id
  field :active_badge_ids, {:array, :binary_id}  # up to 5
  field :active_title_id, :binary_id
  field :active_border_id, :binary_id
  field :active_frame_id, :binary_id
  field :visible_in_forums, :boolean, default: true
  field :visible_in_groups, :boolean, default: true
  field :visible_in_dms, :boolean, default: true
  timestamps()
end
```

---

#### 2.7 — Name Style Backend Storage

| Field          | Value                                                |
| -------------- | ---------------------------------------------------- |
| **ID**         | 2.7                                                  |
| **Title**      | Add `display_name_style` fields to UserCustomization |
| **Priority**   | P1                                                   |
| **Estimate**   | 3h                                                   |
| **Depends On** | —                                                    |

**Files to Modify:**

```
apps/backend/lib/cgraph/customizations/user_customization.ex   — Add 4 fields
```

**New Fields:** `display_name_font`, `display_name_effect`, `display_name_primary_color`,
`display_name_secondary_color`

---

#### 2.8 — Cosmetics Context Module

| Field          | Value                                                              |
| -------------- | ------------------------------------------------------------------ |
| **ID**         | 2.8                                                                |
| **Title**      | Create `CGraph.Cosmetics` context — CRUD, inventory, equip/unequip |
| **Priority**   | P0                                                                 |
| **Estimate**   | 8h                                                                 |
| **Depends On** | 2.5, 2.6                                                           |

**File to Create:**

```
apps/backend/lib/cgraph/cosmetics/cosmetics.ex
```

> **⚠️ NOTE (N9):** The gamification domain uses a repository pattern —
> `CGraph.Gamification.Repositories.AchievementRepository` exists. Consider following this pattern
> for the cosmetics context (e.g., `CGraph.Cosmetics.Repositories.InventoryRepository`) for
> consistency, OR document in ADR why a flat context module is preferred for cosmetics.

**Public API:**

```elixir
# Inventory
def get_user_inventory(user_id, opts \\ [])
def get_equipped_cosmetics(user_id)
def grant_cosmetic(user_id, cosmetic_type, cosmetic_id, source)
def revoke_cosmetic(user_id, cosmetic_type, cosmetic_id)

# Equip
def equip_item(user_id, cosmetic_type, cosmetic_id, slot \\ nil)
def unequip_item(user_id, cosmetic_type, cosmetic_id)

# Shop
def purchase_cosmetic(user_id, cosmetic_type, cosmetic_id)
def get_shop_catalog(cosmetic_type \\ nil)

# Nameplate settings
def get_nameplate_settings(user_id)
def update_nameplate_settings(user_id, attrs)
def get_nameplate_snapshot(user_id)  # For embedding in forum posts
```

---

#### 2.9 — Extend Existing Cosmetics Controller + Serializers

| Field          | Value                                                                                   |
| -------------- | --------------------------------------------------------------------------------------- |
| **ID**         | 2.9                                                                                     |
| **Title**      | Extend existing `CGraphWeb.CosmeticsController` with inventory/shop/nameplate endpoints |
| **Priority**   | P0                                                                                      |
| **Estimate**   | 6h                                                                                      |
| **Depends On** | 2.8                                                                                     |

> **⚠️ VERIFIED (M2):** `CGraphWeb.CosmeticsController` already exists at
> `controllers/cosmetics_controller.ex` with 14 actions (border list/equip/purchase, theme
> list/activate/customize, effect get/sync/activate). Uses
> `CGraphWeb.CosmeticsController.Serializers` subdirectory for JSON rendering (Pattern A, NOT
> `_json.ex`). This task EXTENDS the existing controller — do NOT create a new one.

**File to Modify:**

```
apps/backend/lib/cgraph_web/controllers/cosmetics_controller.ex          — Add new actions
apps/backend/lib/cgraph_web/controllers/cosmetics_controller/serializers/ — Add new serializers
```

**Routes to add in `gamification_routes.ex` (NOT router.ex — see M1):**

- `GET /api/v1/cosmetics/inventory` — user's owned cosmetics
- `GET /api/v1/cosmetics/shop` — browsable catalog
- `POST /api/v1/cosmetics/purchase` — buy with Nodes
- `PUT /api/v1/cosmetics/equip` — equip item (slot for badges)
- `DELETE /api/v1/cosmetics/equip` — unequip item
- `GET /api/v1/cosmetics/nameplate` — current nameplate config
- `PUT /api/v1/cosmetics/nameplate` — update nameplate settings
- `GET /api/v1/cosmetics/:type` — list all of a specific type

---

#### 2.10 — Badge Controller + Serializers

| Field          | Value                                                                      |
| -------------- | -------------------------------------------------------------------------- |
| **ID**         | 2.10                                                                       |
| **Title**      | Create BadgeController (top-level pattern) — list, unlocked, equip/unequip |
| **Priority**   | P0                                                                         |
| **Estimate**   | 4h                                                                         |
| **Depends On** | 2.1                                                                        |

> **Follows Pattern A (top-level).** Routes registered in `gamification_routes.ex`.

**Files to Create:**

```
apps/backend/lib/cgraph_web/controllers/badge_controller.ex
apps/backend/lib/cgraph_web/controllers/badge_controller/serializers/badge.ex
```

---

#### 2.11 — Nameplate Controller + Serializers

| Field          | Value                                                                             |
| -------------- | --------------------------------------------------------------------------------- |
| **ID**         | 2.11                                                                              |
| **Title**      | Create NameplateController (top-level pattern) — list, equip, visibility settings |
| **Priority**   | P0                                                                                |
| **Estimate**   | 4h                                                                                |
| **Depends On** | 2.2                                                                               |

> **Follows Pattern A (top-level).** Routes registered in `gamification_routes.ex`.

**Files to Create:**

```
apps/backend/lib/cgraph_web/controllers/nameplate_controller.ex
apps/backend/lib/cgraph_web/controllers/nameplate_controller/serializers/nameplate.ex
```

---

### Track 2B: Unlock Engine

#### 2.12 — Unlock Engine Core

| Field          | Value                                                                                   |
| -------------- | --------------------------------------------------------------------------------------- |
| **ID**         | 2.12                                                                                    |
| **Title**      | Create `UnlockEngine` — generalized event-driven cosmetic + achievement granting system |
| **Priority**   | P0                                                                                      |
| **Estimate**   | 16h                                                                                     |
| **Depends On** | 2.5, 2.8                                                                                |

> **⚠️ VERIFIED (M7):** `achievement_system.ex` + `achievement_triggers.ex` already implement
> event-driven unlock logic (`try_unlock_achievement/2`, slug-based matching, streak checks).
> `gamification.ex` delegates to these modules. The UnlockEngine must GENERALIZE this existing
> pattern into a multi-type system (achievements + cosmetics + badges + titles), NOT create a
> parallel competing system.
>
> **Architecture Decision:** The UnlockEngine wraps/extends `achievement_triggers.ex`, adding
> support for cosmetic unlocks. `achievement_triggers.ex` becomes one of several "evaluator"
> backends. Existing achievement unlock flows remain unchanged; new cosmetic unlock flows are added
> as additional evaluator modules.

**Files to Create:**

```
apps/backend/lib/cgraph/cosmetics/unlock_engine.ex
apps/backend/lib/cgraph/cosmetics/unlock_condition.ex
```

**Architecture (event-sourced with GenServer batching):**

```
Domain Events (PubSub) → UnlockTrigger GenServer (5s batch window)
  → Per-Track Evaluators → CosmeticGrantWorker (Oban)
```

**UnlockEngine API:**

```elixir
@doc "Receives a domain event and schedules evaluation."
@spec handle_event(String.t(), atom(), map()) :: :ok
def handle_event(user_id, event_type, metadata)

@doc "Evaluates all unlock conditions for a user after batch window."
@spec evaluate_user(String.t(), [atom()]) :: {:ok, [granted_item()]}
def evaluate_user(user_id, triggered_event_types)

@doc "Backfills unlock state for existing users (admin tool)."
@spec backfill_user(String.t()) :: {:ok, non_neg_integer()}
def backfill_user(user_id)
```

---

#### 2.13 — Unlock Condition Parser

| Field          | Value                                                                    |
| -------------- | ------------------------------------------------------------------------ |
| **ID**         | 2.13                                                                     |
| **Title**      | Create condition parser — converts JSONB conditions to evaluable structs |
| **Priority**   | P0                                                                       |
| **Estimate**   | 8h                                                                       |
| **Depends On** | 2.12                                                                     |

**File to Create:**

```
apps/backend/lib/cgraph/cosmetics/unlock_condition.ex
```

**Condition Types:**

```elixir
# Simple threshold
%{type: "messages_sent", threshold: 500}

# Compound (AND)
%{type: "compound", operator: "and", conditions: [
  %{type: "messages_sent", threshold: 5000},
  %{type: "e2ee_verifications", threshold: 1}
]}

# Duration-based
%{type: "account_age_days", threshold: 365}
%{type: "secret_chat_days", threshold: 60}
```

---

#### 2.14 — Per-Track Evaluators (6 modules)

| Field          | Value                                |
| -------------- | ------------------------------------ |
| **ID**         | 2.14                                 |
| **Title**      | Create 6 per-track evaluator modules |
| **Priority**   | P0                                   |
| **Estimate**   | 24h                                  |
| **Depends On** | 2.13                                 |

**Files to Create:**

```
apps/backend/lib/cgraph/cosmetics/evaluators/messaging_evaluator.ex
apps/backend/lib/cgraph/cosmetics/evaluators/forum_evaluator.ex
apps/backend/lib/cgraph/cosmetics/evaluators/group_evaluator.ex
apps/backend/lib/cgraph/cosmetics/evaluators/social_evaluator.ex
apps/backend/lib/cgraph/cosmetics/evaluators/security_evaluator.ex
apps/backend/lib/cgraph/cosmetics/evaluators/creator_evaluator.ex
```

Each evaluator:

- Queries user stats for its domain
- Compares against all unlock conditions for that track
- Returns list of newly-qualified cosmetic IDs
- Property-based tested with StreamData

---

#### 2.15 — Event-Driven Unlock Triggers

| Field          | Value                                 |
| -------------- | ------------------------------------- |
| **ID**         | 2.15                                  |
| **Title**      | Hook unlock engine into domain events |
| **Priority**   | P0                                    |
| **Estimate**   | 8h                                    |
| **Depends On** | 2.12                                  |

**File to Create:**

```
apps/backend/lib/cgraph/cosmetics/unlock_triggers.ex
```

**Events to Hook:**

```elixir
# Subscribe in Application start
Phoenix.PubSub.subscribe(CGraph.PubSub, "messaging:events")
Phoenix.PubSub.subscribe(CGraph.PubSub, "forums:events")
Phoenix.PubSub.subscribe(CGraph.PubSub, "social:events")
Phoenix.PubSub.subscribe(CGraph.PubSub, "nodes:events")
Phoenix.PubSub.subscribe(CGraph.PubSub, "accounts:events")
```

**Event → Track Mapping:**

- `message_sent` → messaging_evaluator
- `post_created` → forum_evaluator
- `friend_added` → social_evaluator
- `group_joined`, `group_created` → group_evaluator
- `tip_sent`, `nodes_earned` → creator_evaluator
- `security_feature_enabled` → security_evaluator

---

#### 2.16 — Cosmetic Grant Worker (Oban)

| Field          | Value                                               |
| -------------- | --------------------------------------------------- |
| **ID**         | 2.16                                                |
| **Title**      | Create CosmeticGrantWorker — processes unlock queue |
| **Priority**   | P1                                                  |
| **Estimate**   | 4h                                                  |
| **Depends On** | 2.12                                                |

**File to Create:**

```
apps/backend/lib/cgraph/workers/cosmetic_grant_worker.ex
```

**Implementation:**

- `use Oban.Worker, queue: :default, max_attempts: 3`
- Insert into `user_cosmetic_inventory`
- Push `user:cosmetic_unlocked` notification via UserChannel
- Invalidate ETS cache for user
- Telemetry: `[:cgraph, :cosmetics, :granted]`

---

#### 2.17 — Chat Bubble/Effect Unlock Data

| Field          | Value                                              |
| -------------- | -------------------------------------------------- |
| **ID**         | 2.17                                               |
| **Title**      | Add unlock conditions for chat bubbles and effects |
| **Priority**   | P0                                                 |
| **Estimate**   | 4h                                                 |
| **Depends On** | 2.12                                               |

**Description:** From Cosmetics doc — glass bubble at 1K msgs, neon at 5K + E2EE, message effects at
500 msgs or 30-day streak. These unlock conditions need to be added to the `chat_effect.ex` schema
or the seed data.

---

#### 2.18 — Secret Theme Unlock Progression

| Field          | Value                                                                           |
| -------------- | ------------------------------------------------------------------------------- |
| **ID**         | 2.18                                                                            |
| **Title**      | Implement 3-tier secret theme unlock (3 free → 6 at 10+ sessions → 3 LEGENDARY) |
| **Priority**   | P1                                                                              |
| **Estimate**   | 3h                                                                              |
| **Depends On** | 2.12                                                                            |

---

#### 2.19 — Particle/Effect Tiering

| Field          | Value                                                                       |
| -------------- | --------------------------------------------------------------------------- |
| **ID**         | 2.19                                                                        |
| **Title**      | Add progression/monetization path for particles, backgrounds, UI animations |
| **Priority**   | P1                                                                          |
| **Estimate**   | 3h                                                                          |
| **Depends On** | 2.12                                                                        |

**Tiering (from Cosmetics doc):**

- 3 particle presets: Free
- 9 particle presets: UNCOMMON unlock OR 300 Nodes each
- 5 background presets: UNCOMMON or 300 Nodes
- 5 background presets: RARE or 500 Nodes
- 8 UI animation sets: Premium subscription only

---

#### 2.20 — Seasonal Rotation System

| Field          | Value                                                              |
| -------------- | ------------------------------------------------------------------ |
| **ID**         | 2.20                                                               |
| **Title**      | Create SeasonalManager — quarterly rotation, limited stock, expiry |
| **Priority**   | P1                                                                 |
| **Estimate**   | 10h                                                                |
| **Depends On** | 2.5                                                                |

**Files to Create:**

```
apps/backend/lib/cgraph/cosmetics/seasonal_manager.ex
apps/backend/lib/cgraph/workers/seasonal_rotation_worker.ex
```

**Features:**

- Season definition (Q1/Q2/Q3/Q4, custom events)
- `is_seasonal: true` + `season_expires_at` on cosmetics
- Stock-limited items (decremented on purchase, cap per season)
- Oban cron: end-of-season worker retires expired items
- Seasonal nameplate rotation (not purchasable after season ends)

---

### Track 2C: Frontend

#### 2.21 — Web: Update Badges Collection to 70

| Field          | Value                                           |
| -------------- | ----------------------------------------------- |
| **ID**         | 2.21                                            |
| **Title**      | Expand `badgesCollection.ts` from 36 → 70 items |
| **Priority**   | P1                                              |
| **Estimate**   | 4h                                              |
| **Depends On** | P0.1                                            |

---

#### 2.22 — Web: Expand Nameplate Registry to 45

| Field          | Value                                          |
| -------------- | ---------------------------------------------- |
| **ID**         | 2.22                                           |
| **Title**      | Expand nameplate registry from 24 → 45 entries |
| **Priority**   | P1                                             |
| **Estimate**   | 4h                                             |
| **Depends On** | P0.1                                           |

---

#### 2.23 — Web: Cosmetics Visibility Matrix Component

| Field          | Value                                                  |
| -------------- | ------------------------------------------------------ |
| **ID**         | 2.23                                                   |
| **Title**      | Create `CosmeticRenderer` with surface-aware rendering |
| **Priority**   | P1                                                     |
| **Estimate**   | 8h                                                     |
| **Depends On** | P0.8                                                   |

**File to Create:**

```
apps/web/src/modules/forums/components/cosmetic-renderer/
  ├── cosmetic-renderer.tsx
  ├── cosmetic-renderer.types.ts
  └── index.ts
```

**Visibility Matrix (from Cosmetics doc):**

| Surface      | Avatar | Border | Title | Badges | Nameplate | Effects |
| ------------ | :----: | :----: | :---: | :----: | :-------: | :-----: |
| DM Header    |   ✅   |   ✅   |  ✅   |   ❌   |  compact  |   ❌    |
| Forum Post   |   ✅   |   ✅   |  ✅   | max 3  |    ❌     |   ❌    |
| Group List   |   ✅   |   ✅   |  ✅   |   ❌   |    ❌     |   ❌    |
| Friend List  |   ✅   |   ✅   |  ❌   |   ❌   |    ❌     |   ❌    |
| Full Profile |   ✅   |   ✅   |  ✅   | max 5  |   full    |   ✅    |
| Search       |   ✅   |   ✅   |  ❌   |   ❌   |    ❌     |   ❌    |

---

#### 2.24 — Mobile: Cosmetic Renderer (4-Variant Nameplate)

| Field          | Value                                                     |
| -------------- | --------------------------------------------------------- |
| **ID**         | 2.24                                                      |
| **Title**      | Create mobile cosmetic renderer with 4 nameplate variants |
| **Priority**   | P1                                                        |
| **Estimate**   | 8h                                                        |
| **Depends On** | P0.8                                                      |

**Files to Create:**

```
apps/mobile/src/components/cosmetics/
  ├── cosmetic-renderer.tsx
  ├── nameplate-compact.tsx
  ├── nameplate-card-modal.tsx
  └── index.ts
```

**Variants (from Forums doc):**

- `full` — Full nameplate with all cosmetics (profile page)
- `compact` — Avatar + Name + 1 badge + level (forum posts)
- `header-only` — Username + badge count only (thread list)
- `hidden` — No cosmetics shown

---

#### 2.25 — Web: Nodes Shop Cosmetics Integration

| Field          | Value                                    |
| -------------- | ---------------------------------------- |
| **ID**         | 2.25                                     |
| **Title**      | Add cosmetics section to Nodes shop page |
| **Priority**   | P1                                       |
| **Estimate**   | 6h                                       |
| **Depends On** | 2.9                                      |

---

#### 2.26 — Web: WatermelonDB Setup for Cosmetics (Mobile)

| Field          | Value                                                |
| -------------- | ---------------------------------------------------- |
| **ID**         | 2.26                                                 |
| **Title**      | WatermelonDB offline caching for cosmetics inventory |
| **Priority**   | P2                                                   |
| **Estimate**   | 8h                                                   |
| **Depends On** | 2.5                                                  |

**Files to Create:**

```
apps/mobile/src/database/tables/cosmetics.ts         — WatermelonDB table definition
apps/mobile/src/database/sync/syncCosmetics.ts        — Sync logic
```

---

### Track 2D: Seed Data

#### 2.27 — Seed 42 Borders with Unlock Conditions

| Field          | Value                                                                |
| -------------- | -------------------------------------------------------------------- |
| **ID**         | 2.27                                                                 |
| **Title**      | Rewrite border seeds — all 42 borders with 7-track unlock conditions |
| **Priority**   | P0                                                                   |
| **Estimate**   | 6h                                                                   |
| **Depends On** | P0.1, 2.5                                                            |

**File to Modify:** `apps/backend/priv/repo/seeds/seed_borders.exs`

**Tracks (from Cosmetics doc):** Messaging (7), Forum (8), Group (5), Social (5), Security (5),
Creator (5), Shop (7)

---

#### 2.28 — Seed 70 Titles

|  ID  | Est. | Depends |
| :--: | :--: | :-----: |
| 2.28 |  4h  |  P0.1   |

---

#### 2.29 — Seed 70 Badges

|  ID  | Est. |  Depends  |
| :--: | :--: | :-------: |
| 2.29 |  6h  | P0.1, 2.1 |

---

#### 2.30 — Seed 45 Nameplates

|  ID  | Est. |  Depends  |
| :--: | :--: | :-------: |
| 2.30 |  4h  | P0.1, 2.2 |

---

#### 2.31 — Seed 50+ Profile Frames

|  ID  | Est. |  Depends  |
| :--: | :--: | :-------: |
| 2.31 |  4h  | P0.1, 2.4 |

---

#### 2.32 — Seed 10 Profile Effects

|  ID  | Est. |  Depends  |
| :--: | :--: | :-------: |
| 2.32 |  2h  | P0.1, 2.3 |

---

#### 2.33 — Seed 25 Profile Themes

|  ID  | Est. | Depends |
| :--: | :--: | :-----: |
| 2.33 |  3h  |  P0.7   |

---

#### 2.34 — Shared: Cosmetics API Client

| Field          | Value                               |
| -------------- | ----------------------------------- |
| **ID**         | 2.34                                |
| **Title**      | Create cosmetics API client methods |
| **Priority**   | P1                                  |
| **Estimate**   | 4h                                  |
| **Depends On** | 2.9, P0.8                           |

**File to Create:**

```
packages/api-client/src/cosmetics.ts
```

---

### Phase 2 Totals

| Track                     |    Tasks     |         Hours         |
| ------------------------- | :----------: | :-------------------: |
| 2A: Schemas + Controllers |   11 tasks   |          51h          |
| 2A+: Join Table Migration |    1 task    |          8h           |
| 2B: Unlock Engine         |   9 tasks    |          80h          |
| 2C: Frontend              |   6 tasks    |          38h          |
| 2D: Seed Data             |   7 tasks    |          29h          |
| Shared                    |    1 task    |          4h           |
| **Total**                 | **35 tasks** | **240h (~6.0 weeks)** |

---

### 2.35 — Migrate Existing Join Tables to Unified Inventory

| Field          | Value                                                                      |
| -------------- | -------------------------------------------------------------------------- |
| **ID**         | 2.35                                                                       |
| **Title**      | Data migration: 4 existing join tables → unified `user_cosmetic_inventory` |
| **Priority**   | P0                                                                         |
| **Estimate**   | 8h                                                                         |
| **Depends On** | 2.5, 2.9                                                                   |

**Description (from verification M6):** 4 join tables exist with user-cosmetic ownership data:
`user_avatar_border`, `user_chat_effect`, `user_profile_theme`, `user_title`. The existing
`CosmeticsController` queries these individually. After creating the unified inventory table (2.5),
this data must be migrated.

**Files to Create:**

```
apps/backend/priv/repo/migrations/YYYYMMDD_migrate_join_tables_to_inventory.exs
```

**Implementation:**

1. **Copy data:** Insert rows from each join table into `user_cosmetic_inventory`:
   - `user_avatar_border` → `cosmetic_type: :border`
   - `user_chat_effect` → `cosmetic_type: :chat_bubble`
   - `user_profile_theme` → `cosmetic_type: :profile_effect`
   - `user_title` → `cosmetic_type: :title`
2. **Update CosmeticsController:** Modify all 14 existing actions to read from
   `user_cosmetic_inventory`
3. **Dual-read period:** For 2 releases, read from both old and new tables (new takes priority)
4. **Deprecation markers:** Add
   `@deprecated "Use CGraph.Cosmetics.UserCosmeticInventory — sunset in v1.4"` to old schemas
5. **Drop old tables:** Schedule for Phase 4 (after 2-release sunset)

**Acceptance Criteria:**

- [ ] All existing user-cosmetic ownership data migrated with zero loss
- [ ] Migration `down/0` restores data to original tables
- [ ] CosmeticsController works with unified table
- [ ] Old join table schemas marked `@deprecated`
- [ ] Integration tests verify equip/unequip flows with new table

---

## Phase 3: Creator Economy (v1.3 — Q4 2026)

> **Goal:** Full creator/consumer economy. Paid DM files, forum monetization with Node tiers,
> boosts, KYC/AML, tax receipts. Economic guardrails prevent abuse. **Duration:** ~5 weeks |
> **Hours:** ~187h

### 3.1 — Paid DM Files: Schema + Migration

| Field          | Value                                            |
| -------------- | ------------------------------------------------ |
| **ID**         | 3.1                                              |
| **Title**      | Create `paid_file_attachment` schema + migration |
| **Priority**   | P0                                               |
| **Estimate**   | 6h                                               |
| **Depends On** | —                                                |

**Files to Create:**

```
apps/backend/lib/cgraph/messaging/paid_file_attachment.ex
apps/backend/priv/repo/migrations/YYYYMMDD_create_paid_file_attachments.exs
```

**Schema Fields:**

```elixir
schema "paid_file_attachments" do
  belongs_to :message, CGraph.Messaging.Message
  belongs_to :seller, CGraph.Accounts.User
  field :price_nodes, :decimal
  field :category, Ecto.Enum, values: [:software, :art, :guide, :replay, :music, :document, :other]
  field :license_notes, :string
  field :is_flagged, :boolean, default: false
  field :flag_reason, :string
  timestamps()
end
```

---

### 3.2 — Paid DM Files: API

| Field          | Value                                                           |
| -------------- | --------------------------------------------------------------- |
| **ID**         | 3.2                                                             |
| **Title**      | Create paid file controller — sell-file + unlock-file endpoints |
| **Priority**   | P0                                                              |
| **Estimate**   | 8h                                                              |
| **Depends On** | 3.1                                                             |

**Endpoints:**

- `POST /api/v1/messages/:id/sell-file` — set price + category + license
- `POST /api/v1/messages/:id/unlock-file` — charge Nodes, grant access

---

### 3.3 — Paid DM Files: Transaction Flow

| Field          | Value                                                                          |
| -------------- | ------------------------------------------------------------------------------ |
| **ID**         | 3.3                                                                            |
| **Title**      | Implement purchase flow — debit buyer, credit seller with 20% cut, 21-day hold |
| **Priority**   | P0                                                                             |
| **Estimate**   | 4h                                                                             |
| **Depends On** | 3.1                                                                            |

---

### 3.4 — Paid DM Files: Max Price Cap + Group Restrictions

| Field          | Value                                                                    |
| -------------- | ------------------------------------------------------------------------ |
| **ID**         | 3.4                                                                      |
| **Title**      | Add guardrails — max price without review, DM group size ≤20 restriction |
| **Priority**   | P1                                                                       |
| **Estimate**   | 3h                                                                       |
| **Depends On** | 3.1                                                                      |

---

### 3.5 — Paid DM Files: Scam Flagging

| Field          | Value                                                |
| -------------- | ---------------------------------------------------- |
| **ID**         | 3.5                                                  |
| **Title**      | Report/flag system for scam files + mod review queue |
| **Priority**   | P1                                                   |
| **Estimate**   | 4h                                                   |
| **Depends On** | 3.2                                                  |

---

### 3.6 — Content Gating Types

| Field          | Value                                                              |
| -------------- | ------------------------------------------------------------------ |
| **ID**         | 3.6                                                                |
| **Title**      | Add `gate_type` enum to threads (one_time, time_based, tier_based) |
| **Priority**   | P1                                                                 |
| **Estimate**   | 4h                                                                 |
| **Depends On** | —                                                                  |

---

### 3.7 — Time-Based Unlock Logic

| ID  | Est. | 6h  |
| :-: | :--: | :-: |

---

### 3.8 — Forum Monetization Modes

| Field          | Value                                                                |
| -------------- | -------------------------------------------------------------------- |
| **ID**         | 3.8                                                                  |
| **Title**      | Replace boolean `monetization_enabled` with enum (free/gated/hybrid) |
| **Priority**   | P1                                                                   |
| **Estimate**   | 4h                                                                   |
| **Depends On** | —                                                                    |

---

### 3.9 — Forum Node Tiers (3 tiers per forum)

| Field          | Value                                                               |
| -------------- | ------------------------------------------------------------------- |
| **ID**         | 3.9                                                                 |
| **Title**      | Create `forum_subscription_tier` schema — 3 tiers with Node pricing |
| **Priority**   | P1                                                                  |
| **Estimate**   | 8h                                                                  |
| **Depends On** | 3.8                                                                 |

**Schema:** Supporter (500/mo), Pro (2000/mo), Founder (50K one-time). Each maps to feature flags
(private boards, attach size, threads/day).

---

### 3.10 — Forum Node Subscription Flow

| ID  | Est. | 6h  | Depends: 3.9 |
| :-: | :--: | :-: | :----------: |

---

### 3.11 — Configurable Revenue Share

| Field          | Value                                                                    |
| -------------- | ------------------------------------------------------------------------ |
| **ID**         | 3.11                                                                     |
| **Title**      | Add `revenue_share_pct` field to forum schema (default 80, configurable) |
| **Priority**   | P1                                                                       |
| **Estimate**   | 2h                                                                       |
| **Depends On** | 3.8                                                                      |

---

### 3.12 — Reputation Gating for File Sellers

| Field          | Value                                                                       |
| -------------- | --------------------------------------------------------------------------- |
| **ID**         | 3.12                                                                        |
| **Title**      | Only users with sufficient reputation can sell files or create gated forums |
| **Priority**   | P1                                                                          |
| **Estimate**   | 4h                                                                          |
| **Depends On** | 3.1                                                                         |

---

### 3.13 — Forum Tier Feature Flags

| Field          | Value                                                                          |
| -------------- | ------------------------------------------------------------------------------ |
| **ID**         | 3.13                                                                           |
| **Title**      | Map forum tiers to permission flags (private boards, attach size, threads/day) |
| **Priority**   | P0                                                                             |
| **Estimate**   | 8h                                                                             |
| **Depends On** | 3.9                                                                            |

---

### 3.14–3.16 — Boosts (Schema + API + Discovery Integration)

|  ID  | Task                                                              | Est. | Depends |
| :--: | ----------------------------------------------------------------- | :--: | :-----: |
| 3.14 | Boost schema (boostable_type, boostable_id, duration, expires_at) |  4h  |    —    |
| 3.15 | Boost API (POST forums/threads/profiles) + guardrails             |  6h  |  3.14   |
| 3.16 | Boost discovery integration — score multiplier with organic floor |  6h  |  3.15   |

---

### 3.17–3.19 — Compliance

|  ID  | Task                                                  | Est. | Priority |
| :--: | ----------------------------------------------------- | :--: | :------: |
| 3.17 | KYC threshold enforcement (€500 lifetime)             |  6h  |    P2    |
| 3.18 | AML flagging (circular tips, high-frequency patterns) |  8h  |    P2    |
| 3.19 | Tax receipt generation (monthly/yearly PDF)           |  8h  |    P2    |

---

### 3.20 — Refund/Reversal Audit Log

| ID  | Est. | 4h  | Priority: P2 |
| :-: | :--: | :-: | :----------: |

---

### 3.21 — Payout Processing Worker (Weekly Oban)

| ID  | Est. | 4h  | Priority: P2 |
| :-: | :--: | :-: | :----------: |

---

### 3.22–3.27 — Frontend (Web)

|  ID  | Task                                                    | Est. | Priority |
| :--: | ------------------------------------------------------- | :--: | :------: |
| 3.22 | Paid DM file toggle UI ("Sell this file")               |  8h  |    P0    |
| 3.23 | Paid file unlock UI ("Unlock for X Nodes")              |  6h  |    P0    |
| 3.24 | Content gating admin panel (gate type, price, duration) |  6h  |    P1    |
| 3.25 | Forum monetization settings (3 modes + tier editor)     |  8h  |    P1    |
| 3.26 | Boost UI (boost button + modal on forums/threads)       |  6h  |    P1    |
| 3.27 | Creator tax receipts page                               |  4h  |    P2    |

---

### 3.28–3.31 — Frontend (Mobile)

|  ID  | Task                                   | Est. | Priority |
| :--: | -------------------------------------- | :--: | :------: |
| 3.28 | Paid file toggle in DM file picker     |  6h  |    P1    |
| 3.29 | Paid file unlock in DM                 |  4h  |    P1    |
| 3.30 | Boost button (forum/thread long-press) |  4h  |    P2    |
| 3.31 | Creator dashboard screen               |  8h  |    P2    |

---

### Phase 3 Totals

| Category  |    Tasks     |         Hours         |
| --------- | :----------: | :-------------------: |
| Backend   |   21 tasks   |         105h          |
| Web       |   6 tasks    |          38h          |
| Mobile    |   4 tasks    |          22h          |
| **Total** | **31 tasks** | **187h (~4.7 weeks)** |

---

## Phase 4: Forum Transformation (v1.4 — Q1 2027)

> **Goal:** Forums evolve to enterprise-grade with identity cards, 10 themes, thread tags,
> consolidated reputation, @mentions, full mobile parity. PostCreationFlow pipeline defined.
> **Duration:** ~5.5 weeks | **Hours:** ~209h

### 4.1 — Identity Card: Post Snapshot Schema

| Field          | Value                                                 |
| -------------- | ----------------------------------------------------- |
| **ID**         | 4.1                                                   |
| **Title**      | Add `user_nameplate_snapshot` JSONB to `thread_posts` |
| **Priority**   | P0                                                    |
| **Estimate**   | 4h                                                    |
| **Depends On** | 2.6                                                   |

**Schema Change:** Add `user_nameplate_snapshot` field (JSONB with border_id, badge_ids, title_id,
nameplate_id, frame_id) to `CGraph.Forums.ThreadPost`.

---

### 4.2 — Identity Card: Snapshot Population on Post Creation

| Field          | Value                                                            |
| -------------- | ---------------------------------------------------------------- |
| **ID**         | 4.2                                                              |
| **Title**      | On post creation, snapshot user's active cosmetics into the post |
| **Priority**   | P0                                                               |
| **Estimate**   | 4h                                                               |
| **Depends On** | 4.1                                                              |

---

### 4.3 — PostCreationFlow Pipeline (3-Worker Async)

| Field          | Value                                                                              |
| -------------- | ---------------------------------------------------------------------------------- |
| **ID**         | 4.3                                                                                |
| **Title**      | Implement async post-creation pipeline: SearchIndex + ReputationCalc + ThreadStats |
| **Priority**   | P0                                                                                 |
| **Estimate**   | 8h                                                                                 |
| **Depends On** | 4.2                                                                                |

**Files to Create:**

```
apps/backend/lib/cgraph/forums/post_creation_flow.ex
apps/backend/lib/cgraph/workers/search_index_worker.ex
apps/backend/lib/cgraph/workers/reputation_calc_worker.ex
apps/backend/lib/cgraph/workers/update_thread_stats_worker.ex
```

**Pipeline:**

```
User creates post → Repo.insert(Post) → return {:ok, post}
  └── Async (Oban):
      ├── SearchIndexWorker    → forum_indexing queue
      ├── ReputationCalcWorker → reputation_calc queue (60s delay for batching)
      └── UpdateThreadStatsWorker → critical queue (immediate)
```

> **⚠️ NOTE:** Queues `forum_indexing`, `reputation_calc`, and `critical` do not exist in the
> current Oban config (22 queues). Add these 3 queues to `config.exs` before deploying.

---

### 4.4 — Forum Events System

| Field          | Value                                                                    |
| -------------- | ------------------------------------------------------------------------ |
| **ID**         | 4.4                                                                      |
| **Title**      | Create `CGraph.Forums.Events` — event-driven cache invalidation + PubSub |
| **Priority**   | P1                                                                       |
| **Estimate**   | 6h                                                                       |
| **Depends On** | 4.3                                                                      |

**Events:**

- `post_created` → invalidate thread cache, board cache, recalculate reputation, broadcast via
  PubSub
- `cosmetic_purchased` → invalidate user nameplate cache everywhere
- `thread_created` → update board stats, notify subscribers

---

### 4.5 — Thread Tags Schema + API

| Field          | Value                                    |
| -------------- | ---------------------------------------- |
| **ID**         | 4.5                                      |
| **Title**      | Create `thread_tag.ex` schema + CRUD API |
| **Priority**   | P1                                       |
| **Estimate**   | 7h                                       |
| **Depends On** | —                                        |

**Files to Create:**

```
apps/backend/lib/cgraph/forums/thread_tag.ex
apps/backend/priv/repo/migrations/YYYYMMDD_create_thread_tags.exs
apps/backend/lib/cgraph_web/controllers/thread_tag_controller.ex           — top-level pattern (forums domain)
apps/backend/lib/cgraph_web/controllers/thread_tag_controller/serializers/thread_tag.ex
```

> Routes registered in a forum routes macro (e.g., `forum_routes.ex`), NOT directly in `router.ex`.

---

### 4.6 — Consolidated Reputation Table

| Field          | Value                                                                  |
| -------------- | ---------------------------------------------------------------------- |
| **ID**         | 4.6                                                                    |
| **Title**      | Create `user_reputation_scores` — consolidated from 3 scattered tables |
| **Priority**   | P1                                                                     |
| **Estimate**   | 8h                                                                     |
| **Depends On** | —                                                                      |

---

### 4.7 — Reputation-Linked Node Rewards

| Field          | Value                                                  |
| -------------- | ------------------------------------------------------ |
| **ID**         | 4.7                                                    |
| **Title**      | Milestone Node rewards (100 helpful votes → 100 Nodes) |
| **Priority**   | P2                                                     |
| **Estimate**   | 6h                                                     |
| **Depends On** | 4.6                                                    |

---

### 4.8 — Seed 10 Forum Themes

| Field          | Value                                                            |
| -------------- | ---------------------------------------------------------------- |
| **ID**         | 4.8                                                              |
| **Title**      | Seed 10 forum themes with CSS variables + matching cosmetic sets |
| **Priority**   | P0                                                               |
| **Estimate**   | 8h                                                               |
| **Depends On** | —                                                                |

**Themes:** Neon Cyber, Royal Gold, Midnight Ocean, Sakura Blossom, Lava Flow, Forest Mist, Retro
Arcade, Ethereal Dream, Cyberpunk Metro, Zen Garden

Each theme includes matching borders, badges, titles, nameplates via `theme_id` FK.

---

### 4.9 — @Mention System

| Field          | Value                                           |
| -------------- | ----------------------------------------------- |
| **ID**         | 4.9                                             |
| **Title**      | Forum @mention with autocomplete + notification |
| **Priority**   | P1                                              |
| **Estimate**   | 8h                                              |
| **Depends On** | —                                               |

**Backend:** Parse `@username` in post content, create mention records, send notifications. **Web:**
Autocomplete dropdown in post editor when typing `@`. **Mobile:** Same autocomplete in mobile post
editor.

---

### 4.10 — Quote Reply Enhancement

| Field          | Value                                                           |
| -------------- | --------------------------------------------------------------- |
| **ID**         | 4.10                                                            |
| **Title**      | Visual quote block styling + inline quote editing + multi-quote |
| **Priority**   | P1                                                              |
| **Estimate**   | 6h                                                              |
| **Depends On** | —                                                               |

---

### 4.11 — Saved Searches

| ID  | Est. | 4h  | Priority: P2 |
| :-: | :--: | :-: | :----------: |

---

### 4.12 — Thread Subscription System

| ID  | Est. | 6h  | Priority: P2 |
| :-: | :--: | :-: | :----------: |

---

### 4.13 — Forum Member Directory

| ID  | Est. | 8h  | Priority: P2 |
| :-: | :--: | :-: | :----------: |

---

### 4.14 — Thread Title Color + Icon Enhancement

| Field          | Value                                                                         |
| -------------- | ----------------------------------------------------------------------------- |
| **ID**         | 4.14                                                                          |
| **Title**      | Enhance thread title styling using existing `prefix_color` + `icon_id` fields |
| **Priority**   | P2                                                                            |
| **Estimate**   | 3h                                                                            |
| **Depends On** | —                                                                             |

> **⚠️ VERIFIED (M9):** Thread already has `prefix_color` (HEX for thread prefix) and
> `belongs_to :post_icon` via `:icon_id` FK (structured icon reference). Do NOT add duplicate
> `color` or `icon_emoji` fields.
>
> **Revised Approach:**
>
> - Extend `prefix_color` usage to also color the thread title (not just prefix)
> - Use existing `icon_id` FK with expanded icon set instead of adding `icon_emoji`
> - Add `title_effect` field (`:string`, values: `none|glow|gradient|shimmer`) for premium styling

---

### 4.15 — Sticky Thread Expiry

| ID  | Est. | 4h  | Priority: P2 |
| :-: | :--: | :-: | :----------: |

---

### 4.16 — Forum Analytics Dashboard

| ID  | Est. | 12h | Priority: P2 |
| :-: | :--: | :-: | :----------: |

---

### 4.17 — Admin Cosmetics CRUD

| Field          | Value                                           |
| -------------- | ----------------------------------------------- |
| **ID**         | 4.17                                            |
| **Title**      | Admin panel for CRUD on all 340+ cosmetic items |
| **Priority**   | P1                                              |
| **Estimate**   | 12h                                             |
| **Depends On** | 2.9                                             |

---

### 4.18 — Custom User-Created Titles (Moderated)

| ID  | Est. | 6h  | Priority: P2 |
| :-: | :--: | :-: | :----------: |

---

### 4.19 — Onboarding Tutorial

| ID  | Est. | 6h  | Priority: P2 |
| :-: | :--: | :-: | :----------: |

---

### 4.20–4.25 — Web Frontend

|  ID  | Task                                                         | Est. |
| :--: | ------------------------------------------------------------ | :--: |
| 4.20 | Identity card component (nameplate + badges + title on post) | 12h  |
| 4.21 | Integrate identity card in thread view                       |  4h  |
| 4.22 | Thread tag picker + filter                                   |  7h  |
| 4.23 | Forum theme gallery (10-theme selector)                      |  6h  |
| 4.24 | Reputation display widget                                    |  4h  |
| 4.25 | Cross-forum identity banner ("Meet @user")                   |  4h  |

---

### 4.26–4.34 — Mobile Frontend

|  ID  | Task                                                    | Est. |
| :--: | ------------------------------------------------------- | :--: |
| 4.26 | Mobile `useBoardChannel` WebSocket hook                 |  4h  |
| 4.27 | Identity card component (mobile, compact variant)       |  8h  |
| 4.28 | Threaded comment tree (upgrade from flat)               |  8h  |
| 4.29 | BBCode editor integration (renderer exists, add editor) |  5h  |
| 4.30 | Forum announcements display                             |  4h  |
| 4.31 | Forum theme gallery (mobile)                            |  6h  |
| 4.32 | Thread tags display + filter                            |  4h  |
| 4.33 | Reputation display (mobile)                             |  3h  |
| 4.34 | RSS feeds (mobile)                                      |  4h  |

---

### Phase 4 Totals

| Category  |    Tasks     |         Hours         |
| --------- | :----------: | :-------------------: |
| Backend   |   19 tasks   |         126h          |
| Web       |   6 tasks    |          37h          |
| Mobile    |   9 tasks    |          46h          |
| **Total** | **34 tasks** | **209h (~5.2 weeks)** |

---

## Phase 5: Infrastructure Scaling (v1.5 — Q2 2027)

> **Goal:** Scale from 100K to 1M+ concurrent users. Database sharding, 3-tier caching, archival,
> queue optimization, monitoring, operational readiness. **Duration:** ~6 weeks | **Hours:** ~215h

### Database Sharding (5.1–5.6)

| ID  | Task                                                                      | Est. |
| :-: | ------------------------------------------------------------------------- | :--: |
| 5.1 | `Repo.Router` module — `get_shard/1` with `rem(forum_id, 16)`             |  8h  |
| 5.2 | `Repo.ShardN` dynamic repos (16 repos)                                    |  8h  |
| 5.3 | Forum context shard-aware queries — route all reads/writes through router | 24h  |
| 5.4 | Cosmetics DB separation — dedicated replicated Postgres instance          |  8h  |
| 5.5 | Read replica configuration (3 per shard, 48 total)                        |  8h  |
| 5.6 | Connection pool expansion (300 → 800) + PgBouncer reconfiguration         |  4h  |

### Caching Layer (5.7–5.10)

|  ID  | Task                                                                  | Est. |
| :--: | --------------------------------------------------------------------- | :--: |
| 5.7  | ETS cosmetics cache (TTL 1hr, ~500MB per instance)                    |  8h  |
| 5.8  | Redis forum data cache (TTL 5min) — boards, threads, top posts        |  8h  |
| 5.9  | Cache invalidation events — event-driven on post/thread/board changes |  6h  |
| 5.10 | Cache warming on startup + key naming convention documentation        |  4h  |

### Archival & Storage Tiers (5.11–5.14)

|  ID  | Task                                                     | Est. |
| :--: | -------------------------------------------------------- | :--: |
| 5.11 | TimescaleDB integration — hypertable for 30-90 day posts | 12h  |
| 5.12 | S3 cold archival worker — posts >90 days → Parquet       |  8h  |
| 5.13 | Transparent query routing (hot/warm/cold by post age)    |  8h  |
| 5.14 | Forum post archival worker (Oban, nightly)               |  4h  |

### Queue Optimization (5.15–5.17)

|  ID  | Task                                                                                          | Est. |
| :--: | --------------------------------------------------------------------------------------------- | :--: |
| 5.15 | Dedicated Oban queues (7 from Infra doc with exact concurrency limits)                        |  3h  |
| 5.16 | Forum notification worker (high-concurrency)                                                  |  4h  |
| 5.17 | Selective Meilisearch indexer (4 conditions: not deleted, <30d, not archived, has engagement) |  6h  |

### Meilisearch Configuration (5.18)

| Field          | Value                                                |
| -------------- | ---------------------------------------------------- |
| **ID**         | 5.18                                                 |
| **Title**      | Configure Meilisearch index with documented settings |
| **Priority**   | P1                                                   |
| **Estimate**   | 4h                                                   |
| **Depends On** | 5.17                                                 |

**Settings (from Infra doc):**

- `maxTotalHits: 10000`
- `typoTolerance: { oneTypo: 5, twoTypos: 9 }`
- Bulk indexing: 5,000 chunk size
- Resources: 4 CPU / 16GB RAM

### Presence Optimization (5.19–5.20)

|  ID  | Task                                                   | Est. |
| :--: | ------------------------------------------------------ | :--: |
| 5.19 | Sharded presence (partition by forum/channel)          |  8h  |
| 5.20 | Presence batching (batch diffs, reduce WS frame count) |  6h  |

### CDN Asset Strategy (5.21)

| Field          | Value                                                         |
| -------------- | ------------------------------------------------------------- |
| **ID**         | 5.21                                                          |
| **Title**      | Configure R2 bucket paths + cache headers for cosmetic assets |
| **Priority**   | P1                                                            |
| **Estimate**   | 4h                                                            |
| **Depends On** | —                                                             |

**R2 Paths:** `cosmetics-borders/`, `cosmetics-badges/`, `cosmetics-nameplates/`,
`cosmetics-themes/` **Cache:** SVG 1yr (immutable), CSS 1hr, PNG 30d

### Monitoring & Alerting (5.22–5.23)

|  ID  | Task                                                | Est. |
| :--: | --------------------------------------------------- | :--: |
| 5.22 | Prometheus metrics (6 groups) + Grafana dashboards  | 16h  |
| 5.23 | Alerting rules (11 total: 5 infra + 6 SLO-specific) |  8h  |

### Dual-Write Migration Strategy (5.24)

| Field          | Value                                                                  |
| -------------- | ---------------------------------------------------------------------- |
| **ID**         | 5.24                                                                   |
| **Title**      | Implement dual-write migration — mirror → dual-write → gradual cutover |
| **Priority**   | P0                                                                     |
| **Estimate**   | 16h                                                                    |
| **Depends On** | 5.1–5.5                                                                |

**Steps (from Infra doc):**

1. Deploy shard topology (read-only mirror)
2. Add dual-write logic (write to both main + shards)
3. Gradual cutover by forum ID range (0-50K → shard 0, etc.)
4. Rollback: reads revert to main DB instantly

### Error Budget Policy (5.25)

| ID  | Est. | 2h  |
| :-: | :--: | :-: |

### Operational Readiness (5.26–5.28)

|  ID  | Task                                                                  | Est. |
| :--: | --------------------------------------------------------------------- | :--: |
| 5.26 | Pre-launch checklist (13 items) — formalized launch gates             |  4h  |
| 5.27 | Operational runbook (daily/weekly/monthly/quarterly tasks)            |  6h  |
| 5.28 | Cost model documentation (~$75K/month breakdown + optimization paths) |  4h  |

### DR & SLO (5.29–5.30)

|  ID  | Task                                                       | Est. |
| :--: | ---------------------------------------------------------- | :--: |
| 5.29 | Disaster recovery drills + documentation (RPO/RTO targets) |  6h  |
| 5.30 | SLO dashboard + burn rate alerts                           |  6h  |

### Phase 5 Totals

| Category   |    Tasks     |         Hours         |
| ---------- | :----------: | :-------------------: |
| Sharding   |   6 tasks    |          60h          |
| Caching    |   4 tasks    |          26h          |
| Archival   |   4 tasks    |          32h          |
| Queues     |   3 tasks    |          13h          |
| Search     |    1 task    |          4h           |
| Presence   |   2 tasks    |          14h          |
| CDN        |    1 task    |          4h           |
| Monitoring |   2 tasks    |          24h          |
| Migration  |    1 task    |          16h          |
| Operations |   5 tasks    |          22h          |
| **Total**  | **30 tasks** | **215h (~5.4 weeks)** |

---

## Phase 6: Enterprise + Desktop (v2.0 — H2 2027)

> **Goal:** Enterprise features, self-hosting, SSO, admin console, desktop apps. **Duration:** ~8
> weeks | **Hours:** ~306h

|    ID     | Task                                                       | Priority |         Est.          |
| :-------: | ---------------------------------------------------------- | :------: | :-------------------: |
|    6.1    | Admin console — org management, user management, analytics |    P0    |          80h          |
|    6.2    | SSO integration — SAML 2.0 + OIDC                          |    P0    |          40h          |
|    6.3    | Self-hosting package — Docker Compose + Helm chart + docs  |    P1    |          40h          |
|    6.4    | Desktop apps — Electron/Tauri wrapper for web              |    P1    |          60h          |
|    6.5    | Audit logging — enterprise-grade activity logs with export |    P1    |          24h          |
|    6.6    | Data residency controls — choose region (EU/US/APAC)       |    P2    |          30h          |
|    6.7    | Custom branding — white-label option                       |    P2    |          20h          |
|    6.8    | API rate limiting tiers — Free/Pro/Enterprise              |    P1    |          12h          |
| **Total** | **8 tasks**                                                |          | **306h (~7.7 weeks)** |

---

## Cross-Cutting Concerns

### Testing Strategy

| Phase   | Testing Requirements                                           |
| ------- | -------------------------------------------------------------- |
| All     | Unit tests for every new Elixir module (ExUnit, ≥80% coverage) |
| All     | Integration tests for every new API endpoint                   |
| All     | TypeScript strict mode — zero `any` types                      |
| Phase 1 | Mobile E2E tests for Nodes flow (Detox)                        |
| Phase 2 | Unlock engine property-based tests (StreamData)                |
| Phase 2 | Cosmetics visibility matrix snapshot tests                     |
| Phase 3 | Financial transaction tests (double-entry assertions)          |
| Phase 4 | Forum PostCreationFlow integration tests                       |
| Phase 5 | Load tests at 100K/500K/1M users (k6)                          |
| Phase 5 | Shard failover tests per shard                                 |
| Phase 5 | Cache invalidation E2E tests                                   |

### Migration Strategy

| Concern              | Approach                                                                                                                                                                   |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DB migrations        | Always backwards-compatible. No column drops without 2-release deprecation. Every migration has `down/0`.                                                                  |
| API versioning       | New endpoints under `/api/v1/`. Breaking changes get `/api/v2/` prefix.                                                                                                    |
| Feature flags        | Use `FunWithFlags` (already in project). All new features default to `off`.                                                                                                |
| Rollback plan        | Every feature flag defaults to `off`. Kill switch for every phase.                                                                                                         |
| Rarity migration     | Single atomic migration normalizing ALL cosmetics to 7-tier system. Uses `:string` fields with `validate_inclusion/3`, NOT `Ecto.Enum` (matching existing schemas).        |
| Join table migration | Existing 4 join tables (`user_avatar_border`, `user_chat_effect`, `user_profile_theme`, `user_title`) migrated to unified `user_cosmetic_inventory` with 2-release sunset. |
| Controller patterns  | Gamification domain: top-level `CGraphWeb.{Resource}Controller`. Auth/User: namespaced `CGraphWeb.API.V1.{Resource}Controller`.                                            |

### Shared Package Update Schedule

| Package                       |     Pre      |     P1      |        P2         |      P3       |          P4           |
| ----------------------------- | :----------: | :---------: | :---------------: | :-----------: | :-------------------: |
| `@cgraph/shared-types`        | Rarity types | Nodes types |  Cosmetics types  | Creator types |      Forum types      |
| `@cgraph/api-client`          |  Endpoints   |  Nodes API  |   Cosmetics API   |  Creator API  |       Forum API       |
| `@cgraph/animation-constants` |  Rarity fix  |      —      | 45 NP, registries |       —       |       10 themes       |
| `@cgraph/socket`              |      —       |      —      |         —         |       —       | Mobile forum channels |

### Documentation Update Schedule

| Document                        | When                                        |
| ------------------------------- | ------------------------------------------- |
| `docs/COSMETICS_MANIFEST.md`    | Pre-Phase (new)                             |
| `docs/api/ENDPOINT_CATALOG.md`  | Every phase (new + updates)                 |
| `docs/ARCHITECTURE_DIAGRAMS.md` | Phase 2 (unlock engine), Phase 5 (sharding) |
| `docs/ROADMAP.md`               | After each phase ships                      |
| `docs/adr/`                     | Every architecture decision                 |
| `CHANGELOG.md`                  | Every PR                                    |

---

## Dependency Graph

```
Pre-Phase (Foundation)
  ├── P0.1 Manifest ─── P0.7 Themes ──┐
  ├── P0.2 Rarity ─── P0.3 Migration  │
  ├── P0.4 Frontend rarity             │
  ├── P0.5 API audit                   │
  ├── P0.6 Exchange rate               │
  └── P0.8 Shared types ──────────────┘
         │
         ▼
Phase 1 (Parity — 3 parallel tracks)
  ├── 1A: Mobile Nodes + Web Tips
  ├── 1B: Mobile Secret Chat         ← independent, can parallel
  └── 1C: Mobile Customization Parity ← independent, can parallel
         │
         ▼
Phase 2 (Cosmetics)
  ├── 2A: Backend schemas + controllers
  ├── 2B: Unlock engine (depends on 2A)
  ├── 2C: Frontend (depends on 2A)
  └── 2D: Seed data (depends on 2A)
         │
    ┌────┴────┐
    ▼         ▼
Phase 3    Phase 4         ← CAN RUN IN PARALLEL
(Creator)  (Forum Transform)
    │         │
    └────┬────┘
         ▼
Phase 5 (Infrastructure)
         │
         ▼
Phase 6 (Enterprise)
```

**Critical Path:** Pre → Phase 1 → Phase 2 → Phase 3 → Phase 5 **Parallelizable:** Phase 3 + Phase 4
after Phase 2. Phase 1 tracks 1A/1B/1C are independent.

---

## Effort Summary

| Phase                              |  Tasks  |   Hours    | Weeks (40h/wk) |
| ---------------------------------- | :-----: | :--------: | :------------: |
| Pre-Phase: Foundation              |   10    |    35h     |      0.9       |
| Phase 1: Parity + Mobile Nodes     |   29    |    162h    |      4.1       |
| Phase 2: Cosmetics + Unlock Engine |   35    |    240h    |      6.0       |
| Phase 3: Creator Economy           |   31    |    187h    |      4.7       |
| Phase 4: Forum Transformation      |   34    |    209h    |      5.2       |
| Phase 5: Infrastructure Scaling    |   30    |    215h    |      5.4       |
| Phase 6: Enterprise                |    8    |    306h    |      7.7       |
| **Grand Total**                    | **177** | **1,354h** | **33.9 weeks** |

### Compared to Original Plan

| Metric                        | Original Plan |      This Plan      | Delta |
| ----------------------------- | :-----------: | :-----------------: | :---: |
| Total tasks                   |      146      |         177         |  +31  |
| Total hours                   |    1,061h     |       1,354h        | +293h |
| Calendar weeks                |     26.5      |        33.9         | +7.4  |
| Gaps tracked                  |       0       |         73          |  +73  |
| Verification issues fixed     |       0       |         29          |  +29  |
| Phases                        |       6       | 7 (incl. pre-phase) |  +1   |
| Source doc conflicts resolved |       0       |          7          |  +7   |

The increase comes from: 73 missing features added, 29 verification issues addressed, engineering
standards overhead, comprehensive testing, documentation, operational readiness, data migration from
existing join tables, and the pre-phase foundation work.

---

## Risk Matrix

| Risk                                     | Phase | Prob. | Impact | Mitigation                                                                                                  |
| ---------------------------------------- | :---: | :---: | :----: | ----------------------------------------------------------------------------------------------------------- |
| Unlock engine complexity explosion       |   2   |  🟠   |   🔴   | Start with 3 simple evaluators (messages, posts, friends). Add rest incrementally. Property-based tests.    |
| Mobile Secret Chat crypto bugs           |   1   |  🟠   |   🔴   | Port web implementation directly. Property-based testing on key exchange. Dedicated security review.        |
| Sharding breaks existing queries         |   5   |  🟡   |   🔴   | Build shard router with test mode (single DB, shard-aware queries). Dual-write migration. Instant rollback. |
| Source doc conflict during seeding       |   2   |  🟡   |   🟠   | Pre-Phase canonical manifest resolves all conflicts before any seed work.                                   |
| Profile theme migration data loss        |  Pre  |  🟡   |   🟠   | Map every existing theme to nearest match. Offer "legacy" fallback theme.                                   |
| Rarity migration breaks cosmetic display |  Pre  |  🟡   |   🟠   | Single atomic migration + feature flag for new rarity rendering.                                            |
| Forum monetization Stripe compliance     |   3   |  🟡   |   🟠   | Legal review before launch. Start with Nodes-only (no fiat tiers initially).                                |
| Paid DM files abuse/scam                 |   3   |  🟠   |   🟠   | Report/flag, category tags, mod queue, purchase limits, reputation gating.                                  |
| Boost pay-to-win perception              |   3   |  🟡   |   🟡   | Organic score floor (boosts influence but don't override). "Boosted" label.                                 |
| TimescaleDB operational complexity       |   5   |  🟡   |   🟡   | Start with simple partitioning. Full hypertable in 5.1 only.                                                |
| Cost overrun at scale                    |   5   |  🟡   |   🟡   | Reserved instances (-40%), aggressive caching (-50% queries).                                               |

---

## Success Metrics

### Phase 1 (v1.1)

| Metric                | Target                                                 |
| --------------------- | ------------------------------------------------------ |
| Mobile Nodes adoption | 30% of mobile users have wallet balance within 60 days |
| Mobile tip volume     | 10% of all tips from mobile within 30 days             |
| Discovery engagement  | 25% of mobile users try ≥2 feed modes                  |
| Feature parity score  | Mobile reaches 85% of web functionality                |
| Secret Chat adoption  | 15% of mobile users try Secret Chat                    |

### Phase 2 (v1.2)

| Metric                    | Target                                        |
| ------------------------- | --------------------------------------------- |
| Unlock engine activations | 10,000 cosmetics auto-unlocked in first month |
| Cosmetics engagement      | 40% of users equip a non-default cosmetic     |
| Rarity consistency        | 100% of cosmetics use 7-tier system           |
| Inventory API performance | P99 < 100ms for inventory fetch               |

### Phase 3 (v1.3)

| Metric                           | Target                                       |
| -------------------------------- | -------------------------------------------- |
| Paid DM file transactions        | 500+ unlock transactions in first month      |
| Forum monetization               | 50+ forums with paid tiers active            |
| Boost revenue                    | $5K MRR from boosts within 90 days           |
| Creator payouts                  | $10K total within 90 days                    |
| Economic guardrail effectiveness | <1% flagged transactions are false positives |

### Phase 4 (v1.4)

| Metric                          | Target                                            |
| ------------------------------- | ------------------------------------------------- |
| Identity card visibility        | 100% of forum posts render identity cards         |
| Theme adoption                  | 30% of forums use a non-default theme             |
| @Mention usage                  | 20% of posts contain @mentions                    |
| Mobile forum WebSocket coverage | 100% of mobile forum views have real-time updates |

### Phase 5 (v1.5)

| Metric                     | Target                          |
| -------------------------- | ------------------------------- |
| Forum read P99 latency     | < 200ms                         |
| Forum write P99 latency    | < 500ms                         |
| Search P95 latency         | < 100ms                         |
| Concurrent users supported | 1M+                             |
| Cache hit rate             | >90% cosmetics, >75% forum data |
| Availability               | 99.99%                          |
| Replication lag            | < 50ms                          |

---

## Appendix A: New Files Inventory

| Phase     | Backend |  Web   | Mobile | Shared |  Total  |
| --------- | :-----: | :----: | :----: | :----: | :-----: |
| Pre       |    3    |   0    |   0    |   2    |    5    |
| 1         |    4    |   3    |   18   |   2    |   27    |
| 2         |   23    |   8    |   6    |   2    |   39    |
| 3         |   14    |   6    |   4    |   0    |   24    |
| 4         |   12    |   8    |   9    |   0    |   29    |
| 5         |   20    |   0    |   0    |   0    |   20    |
| **Total** | **76**  | **25** | **37** | **6**  | **144** |

## Appendix B: Source Document Coverage

| Source Document              | Features | Covered by Plan | Coverage |
| ---------------------------- | :------: | :-------------: | :------: |
| CGraph Complete Cosmetics    |    43    |       43        |   100%   |
| CGRAPH-FORUMS-NEXT-GEN-PLAN  |    43    |       43        |   100%   |
| CGRAPH-FORUMS-INFRASTRUCTURE |    15    |       15        |   100%   |
| Nodes are already a solid    |    34    |       34        |   100%   |
| WEB_MOBILE_FEATURE_MAP       |   112    |       112       |   100%   |
| **Total**                    | **247**  |     **247**     | **100%** |

## Appendix C: Review Gap Coverage

All 73 gaps from `INTEGRATION_PLAN_REVIEW.md` are addressed:

- Gaps 1–52 (first pass): Covered in Phases 1–5
- Gaps 53–73 (second pass addendum): Covered in Phase 4 tasks 4.3, 4.4, 4.9, 4.10, 4.11, 4.12, 4.13;
  Phase 2 tasks 2.26; Phase 5 tasks 5.18, 5.22, 5.23, 5.26, 5.27, 5.28; Phase 3 task 3.11; Pre-Phase
  task P0.6
