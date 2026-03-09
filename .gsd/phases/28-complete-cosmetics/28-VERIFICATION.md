---
phase: 28-complete-cosmetics
verified: 2026-03-10T00:00:00Z
status: gaps_found
score: 0/11 must-haves verified
---

# Phase 28: Complete Broken Cosmetics — Pre-Execution Verification Report

**Phase Goal:** Build/fix the three most impactful cosmetic features: NameplateBar (full rendering with Lottie), Profile Effects (LottieOverlay), and Border unification (CSS→Lottie, sync 42 borders).
**Verified:** 2026-03-10
**Status:** gaps_found (phase not yet executed)

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | NameplateBar component built (web + native sharing design tokens) | ✗ MISSING | No `components/nameplate/` directory. Zero NameplateBar files anywhere in web app |
| 2 | Full rendering: Lottie bg OR CSS gradient, border, emblem, text effect, particles | ✗ MISSING | No rendering component. `nameplateMap.ts` has 24 IDs but ALL point to `placeholder.json` — no real Lottie assets |
| 3 | Wired to ProfileContent replacing partial stub | ✗ STUB | `profile-content.tsx` accepts `equippedNameplate?: string | null` in props interface (line 31) but never destructures or renders it — dead prop |
| 4 | All 24 nameplates render correctly in live preview | ✗ MISSING | 24 IDs cataloged in `NAMEPLATE_LOTTIE_MAP` but no rendering component exists to display them |
| 5 | LottieOverlay component added to ProfileCard and ProfileCardPreview | ✗ MISSING | `LottieOverlay` does not exist anywhere in codebase. Zero references |
| 6 | equippedProfileEffect wired to PROFILE_EFFECT_REGISTRY[id].lottieFile | ⚠️ PARTIAL | Store wiring EXISTS: `equippedProfileEffect` in customizationStore types (line 125), setter, schema mapping. `PROFILE_EFFECT_REGISTRY` in `packages/animation-constants/src/registries/profileEffects.ts` with 12 entries + lottieFile refs. BUT value is read from store → passed to ProfileContent → never consumed for actual Lottie rendering |
| 7 | All 12 profile effects tested on web | ✗ MISSING | Only 1 placeholder Lottie at `/lottie/effects/placeholder.json`. No rendering code, no tests |
| 8 | All CSS-particle borders replaced with Lottie equivalents | ⚠️ PARTIAL | `avatar-borders.ts` defines 42 borders all `type: 'lottie'` with `lottieUrl`. BUT legacy `borderCollections.ts` (1260 lines, 150+ CSS borders) still exists AND is actively imported by `profile-card-preview.tsx` (`getBorderById`). Dual data sources create conflicts |
| 9 | Single rendering path per border (Lottie or CSS, never both) | ⚠️ PARTIAL | `AvatarBorderRenderer` has correct conditional: `isLottieType && lottieUrl` → `LottieBorderRenderer`, else CSS. BUT `border-particle-system.tsx` is `@deprecated` but not removed. Two codepaths still coexist |
| 10 | All 42 canonical borders render correctly on web | ⚠️ PARTIAL | 42 Lottie border defs in `avatar-borders.ts`. 44 Lottie JSON files in `public/lottie/borders/`. `LottieBorderRenderer` (286 lines) is real implementation. Not verified in browser. Some are placeholder Lotties |
| 11 | Backend seed synced: 42 borders (up from 18) | ✗ MISSING | Migration `20260118000004_seed_cosmetics_data.exs` has only 18 borders with old CSS schema (`animation_type`, `particle_config`, `glow_config`). No `lottie_url` data. Migration to add Lottie columns exists but seed NOT updated to 42 entries |

**Score:** 0/11 truths verified (4 partial, 1 stub, 6 missing)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/web/src/components/nameplate/NameplateBar.tsx` | Nameplate rendering component | ✗ MISSING | Directory does not exist |
| `apps/web/src/components/nameplate/index.ts` | Barrel export | ✗ MISSING | Directory does not exist |
| `apps/web/src/components/lottie/LottieOverlay.tsx` | Profile effect overlay | ✗ MISSING | `components/lottie/` dir does not exist (note: `lib/lottie/` exists with renderer infrastructure) |
| `apps/backend/priv/repo/seeds/` border seed | 42 border seed records | ✗ MISSING | Only `load_test_users.exs` in seeds. Borders in migration file with only 18 entries |

**Artifacts:** 0/4 verified

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| ProfileContent | NameplateBar | equippedNameplate prop | ✗ NOT WIRED | Prop declared but never destructured or rendered |
| ProfileCardPreview | LottieOverlay | equippedProfileEffect | ✗ NOT WIRED | Store value read (line 55) but no rendering component exists |
| customizationStore | ProfileContent | equippedNameplate setter | ⚠️ PARTIAL | Store → read → passed as prop → dead end (not rendered) |
| customizationStore | ProfileCardPreview | equippedProfileEffect setter | ⚠️ PARTIAL | Store → read → passed as prop → dead end (not rendered) |
| AvatarBorderRenderer | LottieBorderRenderer | isLottieType conditional | ✓ WIRED | Conditional branch routes Lottie borders to LottieBorderRenderer correctly |
| avatar-borders.ts | AvatarBorderRenderer | import chain | ⚠️ PARTIAL | `avatar-borders.ts` has 42 Lottie entries but `profile-card-preview.tsx` imports from legacy `borderCollections.ts` instead |
| Frontend borders (42) | Backend seed (18) | API sync | ✗ NOT WIRED | Frontend has 42 Lottie borders, backend seed has 18 CSS borders — mismatch |

**Key Links:** 1/7 wired, 3 partial, 3 not wired

## Existing Infrastructure (Build-On Assets)

Phase 28 does NOT start from zero. Significant infrastructure exists:

### Lottie Pipeline (✓ Complete)
- `lib/lottie/lottie-renderer.tsx` — Base Lottie player
- `lib/lottie/use-lottie.ts` — React hook
- `lib/lottie/lottie-cache.ts` — Caching layer
- `lib/lottie/lottie-border-renderer.tsx` — 286 lines, real Lottie border rendering

### Nameplate Data (✓ Ready, Needs Component)
- `assets/lottie/nameplates/nameplateMap.ts` — 24 IDs mapped (all → placeholder currently)
- `getNameplateLottieSource()` resolver function exists
- `NAMEPLATE_FALLBACK` defined
- CSS animations ready: `nameplate-holo`, `nameplate-rainbow`, `nameplate-glitch` in `index.css`
- `ParticleEngine` supports `nameplate` particle source with priority 1

### Profile Effects Data (✓ Ready, Needs Rendering)
- `PROFILE_EFFECT_REGISTRY` — 12 entries with `lottieFile` references (shared package)
- Identity customization page has `profile-effects-section.tsx` picker UI
- Store fully wired: `equippedProfileEffect` with setter, schema, persistence

### Border Pipeline (✓ Mostly Ready, Needs Cleanup)
- 42 Lottie border definitions in `avatar-borders.ts`
- 44 Lottie JSON files in `public/lottie/borders/`
- `AvatarBorderRenderer` has working Lottie conditional branch
- `LottieBorderRenderer` is a real 286-line implementation

### Store / State (✓ Complete)
- `equippedNameplate`, `equippedProfileEffect`, `avatarBorderType` all in customizationStore
- Setters, defaults, schema mapping, persistence all wired

## Anti-Patterns Found

| File | Issue | Severity |
|------|-------|----------|
| `data/borderCollections.ts` | 1260-line legacy CSS border system still imported by `profile-card-preview.tsx` | 🛑 Blocker — must be reconciled or removed |
| `border-particle-system.tsx` | Deprecated barrel re-export still exists | ⚠️ Warning — dead code |
| `border-particle-system/` directory | ~300 lines of deprecated CSS particle border code | ⚠️ Warning — should be removed when Lottie borders are fully verified |
| `profile-content.tsx` | `equippedNameplate` declared in props interface but never used | ⚠️ Warning — dead prop |
| `profile-card-preview.tsx` | `equippedProfileEffect` read from store but never rendered | ⚠️ Warning — dead store read |
| `assets/lottie/nameplates/placeholder.json` | Only placeholder Lottie for all 24 nameplates | 🛑 Blocker — no real assets |
| `public/lottie/effects/placeholder.json` | Only placeholder Lottie for all 12 effects | 🛑 Blocker — no real assets |

## Human Verification Required

### 1. Visual: Nameplate Rendering
**Test:** Equip each of the 24 nameplates and verify visual rendering
**Expected:** Lottie background OR CSS gradient, border frame, emblem, text effect visible
**Why human:** Cannot verify visual fidelity programmatically

### 2. Visual: Profile Effects
**Test:** Equip each of 12 profile effects on profile card
**Expected:** Lottie overlay animation plays over profile card
**Why human:** Animation quality requires visual inspection

### 3. Visual: Border Rendering
**Test:** Equip various Lottie borders and verify they render around avatar
**Expected:** Animated border frames display correctly, no CSS fallback triggered
**Why human:** Border animation fidelity needs visual check

### 4. Performance: Particle + Lottie Stacking
**Test:** Equip nameplate with particles + Lottie border + profile effect simultaneously
**Expected:** Smooth rendering, no frame drops
**Why human:** Performance feel cannot be measured via grep

## Gaps Summary

### Critical Gaps (Block Goal Achievement)

1. **NameplateBar component does not exist** — Core deliverable of Plan 28-01 is entirely absent
2. **LottieOverlay component does not exist** — Core deliverable of Plan 28-02 is entirely absent
3. **Dead prop wiring** — Store → prop pass-through → nowhere. Props exist but are never consumed for rendering
4. **Backend seed: 18 borders, need 42** — Frontend/backend data mismatch will cause missing borders in production
5. **All nameplate/effect Lottie JSONs are placeholder** — Even with components, animations won't display without real assets

### Non-Critical Gaps

6. **Legacy `borderCollections.ts` (1260 lines)** — Should be removed/reconciled but border rendering still works via Lottie path
7. **Deprecated `border-particle-system`** — Dead code, should be cleaned up
8. **Dual import paths for borders** — `profile-card-preview.tsx` imports from `borderCollections` instead of `avatar-borders`

## Recommended Fix Plans

All three existing plans (28-01, 28-02, 28-03) are correctly scoped to address the gaps. No additional fix plans are needed. Execute as designed.

### Execution Notes:

1. **Plan 28-01** (NameplateBar): Create `components/nameplate/NameplateBar.tsx`, wire to ProfileContent, replace dead prop with actual component rendering. The `nameplateMap.ts`, ParticleEngine priority system, and CSS text animations are all ready.

2. **Plan 28-02** (Profile Effects): Create `components/lottie/LottieOverlay.tsx` using existing `lib/lottie/` infrastructure, wire to ProfileCard/ProfileCardPreview by consuming the already-read `equippedProfileEffect` state.

3. **Plan 28-03** (Border Unification): Remove/reconcile `borderCollections.ts`, clean deprecated `border-particle-system`, expand backend seed from 18 → 42 with Lottie columns.

### Asset Dependency:
Plans reference real Lottie JSON files but only placeholders exist. Phase execution should either:
- Create proper placeholder animations that render visibly (not empty canvases)
- OR document that real designer assets are needed post-Phase 28

## Verification Metadata

- **Approach:** Goal-backward analysis — derived must-haves from PLAN frontmatter, verified against codebase via grep, file reads, and structural analysis
- **Files scanned:** ~50 across `apps/web/src/`, `packages/`, `apps/backend/`
- **Phase status:** NOT YET EXECUTED — this is a pre-execution baseline
- **Truths:** 0/11 verified, 4 partial, 1 stub, 6 missing
- **Artifacts:** 0/4 exist
- **Key links:** 1/7 wired, 3 partial, 3 not wired
