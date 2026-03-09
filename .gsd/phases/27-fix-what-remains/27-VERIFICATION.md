---
phase: 27-fix-what-remains
status: passed
verified: 2026-03-10
score: 14/15
---

# Phase 27: Fix What Remains — Verification Report

## Plan 27-01 Must-Haves

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | Legacy Theme[] grid deleted, single theme system | ✅ | theme-customization/page.tsx uses ProfileThemeConfig exclusively |
| 2 | useNewProfileThemes hook deleted | ✅ | 0 results in apps/web/src/ |
| 3 | Background Effects → 3-state toggle | ✅ | background-effects-section.tsx: none/static/animated |
| 4 | ParticleEngine with priority stack | ✅ | ParticleEngine.tsx: border=0, nameplate=1, profile-bg=2, ambient=3 |
| 5 | PARTICLE_ID_TO_EFFECT removed | ✅ | 0 results in apps/web/src/ |
| 6 | Reaction Styles section removed | ⚠️ | Not rendered in page.tsx, but component file still exists (dead code) |
| 7 | Locked layouts removed | ✅ | PROFILE_LAYOUTS: Classic, Modern, Compact, Showcase, Gaming only |
| 8 | Legacy aliases audited | ✅ | Renamed to "Canonical Aliases" — all 12 have active consumers |
| 9 | Dead store props audited | ✅ | Zero dead props found |

## Plan 27-02 Must-Haves

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | Achievement stripped of gamification fields | ✅ | No xpReward/coinReward/unlockLevel/progress in shared-types |
| 2 | cosmeticReward added | ✅ | packages/shared-types/src/achievements.ts:75 |
| 3 | Orphaned titleReward strings handled | ✅ | apps/web/src/data/titles.ts — 803 lines of title entries |
| 4 | free rarity in titles | ✅ | TitleRarity = 'free' | 'common' | ... | 'mythic' |
| 5 | RARITY_COLORS has mythic | ✅ | All 3 RARITY_COLORS maps include mythic |
| 6 | Achievement types consolidated | ✅ | Single import from @cgraph/shared-types, no local duplicates |

## Residual Issues (Low Priority)

- **ReactionStylesSection dead code**: Component file + types + barrel export still exist but are
  never rendered. Non-blocking — cleanup candidate for future phase.
- **unlockLevel in non-Achievement types**: Exists in profileThemes.ts and badgesCollection.ts
  — these are separate domain types, not Achievement. Out of scope.
- **xpReward in notification payload**: notification-provider/types.ts has xpReward on UI payload
  types. Separate from Achievement definition. Cleanup candidate.

## Verdict

**PASSED** — 14/15 must-haves fully satisfied. 1 partial (dead component file not deleted but
section is not rendered, so zero user-facing impact). All core phase goals achieved.
