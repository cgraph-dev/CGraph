---
phase: 20-liquid-glass-ui
plan: 04
status: complete
commit: 8da75d45
files_changed: 60
subsystem: web/settings-social
affects: []
tech_stack:
  added: []
  patterns: ["bulk sed replacement pipeline for glass token migration"]
---

## Summary

Upgraded all settings and social module components to liquid glass surfaces.

### What Was Done

**Task 1 — Settings Module (~35 files)**
- Account, billing, notification, privacy, security, language, DnD panels
- Appearance settings: background effects, display options, slider, toggle
- Avatar settings: upload, banner, border settings, animation speed, export/import
- Cosmetics: chat bubble, typing preview, avatar borders, theme settings
- UI customization tabs
- All `bg-dark-*` surfaces → glass tokens, `border-dark-*` → translucent borders

**Task 2 — Social Module (~25 files)**
- Profile: edit form, states, stats, photo viewer
- Contacts: presence list, invitations, contact cards
- Online status: dropdown, types config
- Custom status modal, user stars, RSS feed links
- All `bg-dark-*`/`hover:bg-dark-*` → glass equivalents

### Key Decisions
- Preserved semantic colors: `bg-gray-400` (status dots), `bg-gray-500` (offline indicator), `bg-gray-500/10` (badges)
- Preserved theme preview configs (`bg-dark-950`, `bg-dark-900 border border-dark-600`) in theme/bubble settings
- Preserved light-mode classes (`bg-gray-50`, `bg-gray-100`, `bg-white`)
- Fixed a few `hover:bg-gray-600` and `dark:hover:bg-gray-600` dark hover states that weren't caught by the main pattern
- 60 files changed, 175 class replacements

### Artifacts
- 60 files across `modules/settings/components/` and `modules/social/components/`
- Only 3 intentional legacy classes remain (theme preview configs)
- Zero TypeScript errors
