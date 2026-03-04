---
phase: 20-liquid-glass-ui
plan: 01
status: complete
started: 2025-01-27
completed: 2025-01-27
duration: ~20min
commits:
  - 25eea990: "feat(20-01): upgrade core ui primitives to liquid glass surfaces"
  - ad64c934: "feat(20-01): upgrade display primitives to liquid glass"
subsystem: components/ui
affects: [20-02, 20-03, 20-04, 20-05, 20-06, 20-07, 20-08, 20-09, 20-10]
tech_stack:
  added: []
  used: [glassSurface, glassSurfaceElevated, liquid-glass/shared.ts]
---

# Plan 20-01 Summary: Shared UI Primitives

## What Was Done

Upgraded all shared UI primitives in `components/ui/` from legacy `bg-dark-*` / `bg-gray-*` surfaces to liquid-glass design system.

### Task 1: Core Interactive Primitives (9 files)
- **card.tsx**: `glassSurface` import, glass base/hover/elevated variants, glass borders on header/footer
- **modal.tsx**: `glassSurfaceElevated` for panel, glass borders, glass footer/cancel button
- **button.tsx**: Added `glass` variant (`bg-white/[0.06] border border-white/[0.08]`)
- **input.tsx**: Textarea/Select sub-components upgraded to glass surfaces
- **text-area.tsx**: `bg-dark-700` → `bg-white/[0.04]`, `border-dark-600` → `border-white/[0.08]`
- **select.tsx**: `glassSurfaceElevated` for dropdown, glass trigger/search/items
- **badge.tsx**: default → `bg-white/[0.08] border-white/[0.06]`, outline → `border-white/[0.08]`
- **avatar.tsx**: Fallback bg → `bg-white/[0.06]`, status ring → `ring-[rgb(30,32,40)]`
- **profile-photo-viewer.tsx**: Close button → `bg-white/[0.08] backdrop-blur-md`

### Task 2: Display Primitives (14 files)
- **tooltip.tsx**: Glass elevated surface with backdrop-blur
- **skeleton.tsx + 8 skeleton files**: All `bg-dark-700` → `bg-white/[0.06]`, `bg-dark-600` → `bg-white/[0.04]`
- **empty-state.tsx**: Icon container → `bg-white/[0.06]`
- **animated-avatar.tsx**: Inner bg → `bg-white/[0.06]`, status border → `border-[rgb(30,32,40)]`
- **avatar-style-picker.tsx**: All dark surfaces → glass equivalents

### Not Modified
- **glass-card.tsx**: Already uses its own glass system (zero legacy classes)
- **popover.stories.tsx**: Test file, excluded per plan

## Verification
- `npx tsc --noEmit` — zero errors
- `grep -rn "bg-dark-" components/ui/**` — zero matches (excluding stories/tests)
- All component prop APIs unchanged

## Key Patterns Established
- `glassSurface` for card-level containers
- `glassSurfaceElevated` for modals/dropdowns/tooltips
- `bg-white/[0.06]` for skeleton placeholders and secondary surfaces
- `border-white/[0.06]` / `border-white/[0.08]` for glass borders
- `ring-[rgb(30,32,40)]` for status indicator rings
