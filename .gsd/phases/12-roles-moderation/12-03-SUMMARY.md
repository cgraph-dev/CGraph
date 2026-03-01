---
phase: 12-roles-moderation
plan: 03
subsystem: automod
tags: [elixir, automod, enforcement, word-filter, link-filter, spam, react-native]

requires:
  - phase: 12-roles-moderation
    plan: 01
    provides: "manage_automod permission bit, effective permissions"
provides:
  - "Automod enforcement pipeline: check_message/3 with 4 filter types"
  - "Word filter with comma-separated patterns and wildcard support"
  - "Link filter with URL extraction and domain matching"
  - "Caps filter (>70% uppercase on 10+ char messages)"
  - "4 action types: delete, warn, mute, flag_for_review"
  - "Default automod rules seeded on group creation"
  - "Mobile automod settings screen with rule CRUD"
affects: [moderation, group-messages]

tech-stack:
  added: []
  patterns:
    - "Process dictionary caching with 60s TTL for automod rules"
    - "Admin bypass via has_effective_permission?/4 before automod check"
    - "Async Task.start for flag_for_review report creation"

key-files:
  created:
    - apps/backend/lib/cgraph/groups/automod/enforcement.ex
    - apps/mobile/src/screens/groups/automod-settings-screen.tsx
  modified:
    - apps/backend/lib/cgraph/groups/automod.ex
    - apps/backend/lib/cgraph/groups.ex
    - apps/backend/lib/cgraph_web/channels/group_channel.ex
    - apps/backend/lib/cgraph/groups/operations.ex
    - apps/mobile/src/types/index.ts
    - apps/mobile/src/navigation/groups-navigator.tsx

key-decisions:
  - "Automod runs between rate_limit and message creation in new_message handler"
  - "Admins bypass automod entirely (manage_automod permission)"
  - "warn action: message still sent, warning pushed to sender"
  - "flag_for_review: message sent, report created asynchronously"
  - "Process dictionary cache avoids DB hit per message (60s TTL)"
  - "Default rules seeded in create_group transaction"

patterns-established:
  - "Automod enforcement pipeline: gather rules → check each → first match wins → execute action"
  - "Rule types extensible via pattern matching on rule.type atom"

duration: 12min
completed: 2025-01-20
---

# Plan 12-03: Automod Enforcement Pipeline Summary

**Automod enforcement pipeline checks every non-admin group message against configurable rules (word/link/spam/caps filters) with 4 action types, plus mobile settings UI for rule management.**

## What Was Built

### Task 1: Automod enforcement module
- Created `enforcement.ex` (196L) with `check_message/3` pipeline
- **word_filter**: comma-separated patterns, `*` wildcard support via Regex compilation
- **link_filter**: URL extraction via regex, domain matching against blocked list
- **spam_detection**: deferred to existing rate limiter (returns `:ok`)
- **caps_filter**: >70% uppercase on messages with 10+ characters
- `execute_action/4` dispatches: `:delete` (block), `:warn` (allow + push warning), `:mute` (block + TODO mute), `:flag_for_review` (allow + async report)
- Process dictionary caching with 60s TTL to avoid per-message DB queries

### Task 2: Wire automod into message flow
- Added `get_enabled_rules/1` and `seed_default_rules/1` to automod.ex
- Wired `check_automod` delegation in groups.ex facade
- Integrated automod check in `group_channel.ex` new_message handler:
  1. Rate limit check → 2. Admin bypass check → 3. Automod check → 4. Create message
- `handle_automod_action/4`: delete pushes error, warn pushes warning, flag starts async Task
- Seeded default rules (basic word filter + phishing link filter) in `operations.ex` create_group

### Task 3: Mobile automod settings screen
- Created `automod-settings-screen.tsx` (350L)
- Rule list with type badge, action badge, pattern preview, enable toggle
- FAB button for creating new rules
- Modal form with type picker (word_filter/link_filter/spam_detection/caps_filter), pattern input, action picker (delete/warn/mute/flag)
- Full CRUD via group automod API endpoints
- Registered in navigator as `AutomodSettings` screen
