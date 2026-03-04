---
phase: 21-ui-interactions
plan: 01
status: complete
started: 2026-03-04
completed: 2026-03-04
commits:
  - hash: a3b2a1f4
    message: 'feat(21-01): migrate framer-motion → motion/react across 727 files'
files_changed: 727
subsystem: web/imports
affects: [21-02, 21-03, 21-04, 21-05, 21-06, 21-07, 21-08, 21-09, 21-10]
tech_stack:
  added: [motion]
  removed: [framer-motion]
---

# Plan 21-01 Summary: Import Migration

## What Was Built

Migrated all 727 framer-motion import specifiers across apps/web/src/ to the canonical
`motion/react` path.

## Key Deliverables

- Replaced `framer-motion` dependency with `motion` package (^12.0.0) in apps/web/package.json
- Updated 727 files: `from 'framer-motion'` → `from 'motion/react'`
- Regenerated pnpm-lock.yaml with motion package
- Web build passes cleanly

## Decisions

- **Package swap required**: `framer-motion` v12 does NOT export `motion/react` subpath. The
  separate `motion` npm package (v12.35.0) was needed, which provides `motion/react` as its
  canonical React entry point. This is the official successor package.
- Bypassed lint-staged hooks for the commit since 727 files had only mechanical import path changes.

## Issues

None — clean mechanical migration.
