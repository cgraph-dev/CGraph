---
phase: 20
title: 'Liquid Glass UI — Web App Visual Layer Upgrade'
scope: 'Replace all legacy bg-dark-*/bg-gray-* styling with liquid-glass design system across apps/web. Visual layer only — zero store/hook/socket changes.'
constraint: 'NEVER modify Zustand stores, TanStack Query hooks, @cgraph/socket channels, API calls, or business logic. Only replace CSS classes, wrap with LG primitives, and update import paths.'
depends_on: ['commit 61489806 — liquid-glass primitives + 6 priority components']
plans: 7
waves: 3
---

# Phase 20 — Liquid Glass UI: Web App Visual Layer Upgrade

## Context

Commit `61489806` delivered 14 liquid-glass primitives and upgraded 6 priority components (chat bubbles, sidebar, invite modal, command palette, search panel, filter chips, toasts). However, the subagent inventory reveals that **only 2 of ~120+ component files** actually consume liquid-glass imports. The remaining ~100+ files across 10 major UI areas still use hardcoded `bg-dark-600/700/800/900` and `bg-gray-*` Tailwind classes.

This phase systematically upgrades every visual surface in `apps/web` to the liquid-glass design system while preserving **every** Zustand store, TanStack Query hook, `@cgraph/socket` channel, and business logic function untouched.

## Architecture Rules (from PROJECT.md Non-Negotiables)

These are **read-only** for this phase — we do NOT modify any of these systems:

| System | Rule |
|---|---|
| **32 Zustand stores** | Read via hooks (`useAuthStore`, `useChatStore`, etc.) — never modify store shape, actions, or selectors |
| **14 TanStack Query hooks** | `useQuery`/`useMutation` in admin, settings, security, moderation — never change query keys, fetchers, or cache config |
| **7 socket channels** | `user:`, `conversation:`, `group:`, `forum:`, `thread:`, `presence:lobby`, `webrtc:` — never modify channel handlers |
| **API client** | `lib/api.ts` + `@cgraph/api-client` — never modify request/response shape |
| **E2EE** | `lib/crypto/` — never modify encryption/decryption logic |

## Design System Reference

- **Primitives**: `components/liquid-glass/` — LGButton, LGCard, LGModal, LGToast, LGSearchInput, LGSelect, LGTabs, LGToggle, LGCheckbox, LGTextInput, LGUserCard
- **Shared tokens**: `components/liquid-glass/shared.ts` — `glassSurface`, `glassSurfaceElevated`, `springPreset`
- **CSS variables**: `components/liquid-glass/tokens.css` — `--lg-*` custom properties with `.dark {}` overrides
- **Pattern**: Replace `bg-dark-700` → `bg-[rgb(30,32,40)]/[0.72] backdrop-blur-[20px]`; replace `border-dark-600` → `border-white/[0.06]`; add `backdrop-saturate-[1.4]` for depth

## Glass Surface Recipes

```
/* Standard panel */
bg-[rgb(30,32,40)]/[0.72] backdrop-blur-[20px] backdrop-saturate-[1.4]
border border-white/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.3)]

/* Elevated surface (modals, popovers, dropdowns) */
bg-[rgb(35,37,48)]/[0.85] backdrop-blur-[24px] backdrop-saturate-[1.5]
border border-white/[0.08] shadow-[0_16px_48px_rgba(0,0,0,0.4)]

/* Subtle element (hover states, list items) */
bg-white/[0.04] hover:bg-white/[0.08] transition-colors

/* Input field */
bg-white/[0.06] border border-white/[0.08] focus:border-white/[0.16]
focus:ring-1 focus:ring-white/[0.08]

/* Active/selected */
bg-white/[0.12] border-white/[0.12]
```

## Upgrade Strategy

1. **Bottom-up**: Upgrade shared UI primitives first → then layout shells → then feature modules
2. **LG primitive substitution**: Where an LG primitive exists (LGButton, LGCard, LGModal, etc.), replace the old component import
3. **Inline glass classes**: Where no LG primitive fits, apply glass surface recipes directly via Tailwind
4. **Dark mode**: All glass surfaces inherently work in dark mode; for light mode compat use `glassSurface`/`glassSurfaceElevated` from shared.ts which include `dark:` variants
5. **No new stores/hooks**: Every component keeps its existing data flow — we only change the JSX className strings and component wrappers

---

## Wave 1 — Foundation & Layout (Plans 01–02)

### Plan 20-01: Shared UI Primitives Upgrade

**Scope**: Upgrade the base `components/ui/` primitives that every feature module depends on. This is the highest-leverage change — upgrading these propagates glass styling everywhere they're used.

**Files**:
- `components/ui/card.tsx` — Replace `bg-dark-800 border-dark-700` with glass surface
- `components/ui/modal.tsx` — Replace `dark:bg-gray-900` with `glassSurfaceElevated`
- `components/ui/button.tsx` — Add glass variant alongside existing variants (preserve all CVA variants)
- `components/ui/input.tsx` — Replace `dark:bg-gray-800 dark:border-gray-600` with glass input recipe
- `components/ui/toast.tsx` — Wire to `LGToast` or apply glass glow per-variant
- `components/ui/select.tsx` — Glass dropdown surface
- `components/ui/tabs.tsx` — Glass tab bar recipe
- `components/ui/badge.tsx` — Translucent glass pill styling
- `components/ui/tooltip.tsx` — Glass elevated surface
- `components/ui/popover.tsx` — Glass elevated surface
- `components/ui/skeleton.tsx` + `components/ui/skeletons/` — Replace `bg-dark-600/700` with `bg-white/[0.06] animate-pulse`
- `components/ui/empty-state.tsx` — Replace `bg-dark-700` with glass surface
- `components/ui/glass-card.tsx` — Align with LGCard or deprecate in favor of LGCard
- `components/ui/animated-avatar/` — Replace `bg-dark-600/700/800` backgrounds (preserve `useAvatarStyle` store)

**Stores preserved**: `useAvatarStyle` (animated-avatar), inline toast store (toast.tsx)
**Must NOT change**: CVA variant APIs, component prop interfaces, ref forwarding patterns

---

### Plan 20-02: Layout Shells & Navigation

**Scope**: Upgrade the layout shells that wrap every page — sidebar, top nav, mobile nav, app layout.

**Files**:
- `components/layout/sidebar.tsx` — Glass panel (partially done in commit `61489806` for `modules/chat/components/sidebar.tsx`, but `components/layout/sidebar.tsx` is a DIFFERENT sidebar — the main app sidebar)
- `components/layout/floating-sidebar.tsx` — Glass floating panel with elevated surface
- `components/layout/top-nav.tsx` — Glass navbar with `backdrop-blur-[20px]`
- `components/layout/mobile-nav.tsx` — Glass bottom bar
- `layouts/app-layout.tsx` — Glass container shell
- `layouts/auth-layout.tsx` — Glass card centered layout
- `layouts/customize-layout.tsx` — Glass panel layout
- `layouts/social-layout.tsx` — Glass panel layout
- `shared/components/quick-switcher.tsx` — Replace `bg-dark-700/800` with `glassSurfaceElevated` (similar to command-palette)
- `shared/components/presence-status-selector.tsx` — Glass dropdown
- `shared/components/error-fallback.tsx` — Glass error card
- `shared/components/keyboard-shortcuts-modal.tsx` — Use `LGModal`
- `shared/components/push-notification-prompt.tsx` — Glass card prompt
- `shared/components/avatar-lightbox.tsx` — Glass overlay
- `shared/components/notification-actions.tsx` — Glass action buttons

**Stores preserved**: `useAuthStore`, `useChatStore`, `useGroupStore`, `useNotificationStore`, `usePremiumStore` (all read-only in layout components)
**Must NOT change**: Route guards, auth-initializer logic, navigation structure

---

## Wave 2 — Core Feature Modules (Plans 03–05)

### Plan 20-03: Chat Module Visual Upgrade

**Scope**: Upgrade all remaining chat components to glass styling. Message bubble was partially upgraded in `61489806` — this plan covers the rest of the chat UI.

**Files**:
- `modules/chat/components/message-list.tsx` — Glass scroll container
- `modules/chat/components/conversation-input.tsx` — Glass input bar with `backdrop-blur`
- `modules/chat/components/conversation-header.tsx` — Glass header bar
- `modules/chat/components/typing-indicator.tsx` — Translucent glass pill
- `modules/chat/components/message-reactions.tsx` — Replace `bg-dark-600/700/800` with glass pills
- `modules/chat/components/message-bubble/message-action-menu.tsx` — Glass context menu
- `modules/chat/components/thread-panel.tsx` — Glass side panel
- `modules/chat/components/emoji-picker.tsx` — Glass picker surface
- `modules/chat/components/sticker-picker/sticker-picker.tsx` — Glass picker surface
- `modules/chat/components/chat-info-panel/chat-info-panel.tsx` — Glass info card
- `modules/chat/components/animated-message-wrapper.tsx` — Preserve `useCustomizationStore` styling hooks
- `modules/chat/components/animated-reaction-bubble.tsx` — Glass reaction bubbles (preserve `useCustomizationStore`)

**Stores preserved**: `useChatStore`, `useChatEffectsStore`, `useThreadStore`, `useAuthStore`, `useCustomizationStore`, `useFriendStore`
**Socket channels preserved**: `conversationChannel` (new_message, typing, reactions, msg_ack)
**Must NOT change**: Message rendering logic, E2EE decrypt pipeline, reply/forward/pin actions

---

### Plan 20-04: Settings & Profile Visual Upgrade

**Scope**: Upgrade all settings panels and social/profile components to glass styling.

**Files (Settings)**:
- `modules/settings/components/panels/notification-settings-panel.tsx` — Glass settings card
- `modules/settings/components/panels/privacy-settings-panel.tsx` — Glass settings card
- `modules/settings/components/panels/security-settings-panel.tsx` — Glass settings card
- `modules/settings/components/panels/language-settings-panel.tsx` — Glass settings card
- `modules/settings/components/panels/dnd-schedule-panel.tsx` — Glass schedule picker
- `modules/settings/components/profile-form-fields.tsx` — Glass form inputs
- `modules/settings/components/appearance-settings/display-options.tsx` — Glass option cards
- `modules/settings/components/appearance-settings/background-effects.tsx` — Glass effect cards
- `modules/settings/components/appearance-settings/toggle.tsx` — Use `LGToggle`
- `modules/settings/components/avatar-settings/` — Glass upload area

**Files (Social/Profile)**:
- `modules/social/components/profile-stats.tsx` — Glass stat cards
- `modules/social/components/profile-states.tsx` — Glass state indicator
- `modules/social/components/profile-edit-form.tsx` — Glass form with `LGTextInput`
- `modules/social/components/contacts-presence-list.tsx` — Glass list items
- `modules/social/components/custom-status-modal.tsx` — Use `LGModal`
- `modules/social/components/common/online-status/` — Translucent status dots
- `modules/social/components/common/rss-feed-links.tsx` — Glass link cards

**Stores preserved**: `useSettingsStore`, `useAuthStore`, `useProfileStore`, `useFriendStore`, `useCalendarStore`, `useCustomizationStore`, `usePluginStore`
**Must NOT change**: Settings persistence logic, form validation, profile data flow

---

### Plan 20-05: Groups & Calls Visual Upgrade

**Scope**: Upgrade groups/channels UI and voice/video call screens.

**Files (Groups)**:
- `modules/groups/components/group-settings/overview-tab.tsx` — Glass settings panel
- `modules/groups/components/group-settings/notifications-tab.tsx` — Glass notification toggles
- `modules/groups/components/group-settings/settings-sidebar.tsx` — Glass nav panel
- `modules/groups/components/channel-list/create-channel-modal.tsx` — Use `LGModal` + `LGTextInput`
- `modules/groups/components/channel-list/voice-channel-item.tsx` — Glass channel row
- `modules/groups/components/voice-channel-panel.tsx` — Glass voice panel
- `modules/groups/components/role-manager/toggle.tsx` — Use `LGToggle`

**Files (Calls)**:
- `modules/calls/components/video-call-modal.tsx` — Glass call surface
- `modules/calls/components/voice-call-modal.tsx` — Glass call surface
- `modules/calls/components/group-call-view.tsx` — Glass participant grid
- `modules/calls/components/incoming-call-modal.tsx` — Glass modal with `LGButton` actions
- `modules/calls/components/video-grid.tsx` — Glass video tile cards
- `modules/calls/components/livekit-participant-tile.tsx` — Glass participant card
- `modules/calls/components/encryption-indicator.tsx` — Glass badge

**Stores preserved**: `useGroupStore`, `useVoiceStateStore`, `useIncomingCallStore`, `useChatStore`, `useAuthStore`, group E2EE store, channel thread store
**Socket channels preserved**: `groupChannel`, `webrtc:lobby`, `call:{roomId}`
**Must NOT change**: Channel join/leave logic, voice state management, WebRTC signaling, role permission checks

---

## Wave 3 — Feature Modules & Polish (Plans 06–07)

### Plan 20-06: Forums & Gamification Visual Upgrade

**Scope**: Upgrade all forum editor/display and gamification components.

**Files (Forums)**:
- `modules/forums/components/post-editor/editor-toolbar.tsx` — Glass toolbar
- `modules/forums/components/post-editor/post-editor.tsx` — Glass editor surface
- `modules/forums/components/post-editor/poll-creator.tsx` — Glass poll form
- `modules/forums/components/forum-header/forum-header-hero.tsx` — Glass hero card
- `modules/forums/components/forum-header/forum-actions.tsx` — Glass action buttons
- `modules/forums/components/forum-header/vote-buttons.tsx` — Glass vote pills
- `modules/forums/components/leaderboard-widget/*.tsx` — Glass leaderboard cards
- `modules/forums/components/nested-comments/comment-forms.tsx` — Glass comment input
- `modules/forums/components/multi-quote-indicator.tsx` — Glass indicator bar

**Files (Gamification)**:
- `modules/gamification/components/level-progress.tsx` — Glass progress bar container
- `modules/gamification/components/achievement-notification.tsx` — Glass achievement toast
- `modules/gamification/components/achievement-display/*.tsx` — Glass achievement cards
- `modules/gamification/components/leaderboard-widget/leaderboard-widget.tsx` — Glass leaderboard
- `modules/gamification/components/streak-tracker/streak-tracker.tsx` — Glass streak card
- `modules/gamification/components/badges/animated-badge/badge-tooltip.tsx` — Glass tooltip
- `modules/gamification/components/referral-dashboard/referral-dashboard.tsx` — Glass dashboard
- `modules/gamification/components/events/seasonal-event-banner.tsx` — Glass banner

**Stores preserved**: `useForumStore`, `useForumThemeStore`, `useAnnouncementStore`, `useThemeStore`, `useGamificationStore`, `usePrestigeStore`, `useSeasonalEventStore`, `useReferralStore`, `useMarketplaceStore`, `useAvatarBorderStore`, `useAuthStore`, gamification socket store + all forum sub-stores (rss, emoji, userGroups, permissions, leaderboard)
**Socket channels preserved**: `forumChannel`, `threadChannel`
**Must NOT change**: BBCode editor logic, poll voting, forum ranking engine, XP/coin calculations, achievement unlock logic, leaderboard queries

---

### Plan 20-07: Admin, Premium, Moderation & Remaining Pages

**Scope**: Upgrade admin dashboard, premium pages, moderation UI, and any remaining page-level components.

**Files (Admin)**:
- `pages/admin/tabs/settings-tab.tsx` — Glass settings form
- `pages/admin/tabs/audit-tab.tsx` — Glass audit table
- `pages/admin/tabs/users/` — Glass user management table
- `pages/admin/tabs/reports-tab.tsx` — Glass report cards
- `pages/admin/tabs/overview-tab.tsx` — Glass metrics dashboard

**Files (Premium/Billing)**:
- `pages/premium/` — Glass pricing cards, plan comparison
- `pages/creator/` — Glass creator dashboard

**Files (Security)**:
- `pages/security/key-verification/` — Glass verification UI
- `pages/security/e2ee-verification/` — Glass safety number display

**Files (Moderation)**:
- `modules/moderation/components/moderation-queue.tsx` — Glass queue cards
- Other moderation components

**Files (Remaining pages)**:
- `pages/calls/call-history/` — Glass call history list
- `pages/settings/custom-emoji/` — Glass emoji management
- `pages/settings/blocked-users/` — Glass blocked user list
- `pages/explore/` — Glass explore cards
- `pages/not-found.tsx` — Glass 404 page
- `pages/calendar/` — Glass calendar view
- `pages/friends/` — Glass friend list
- `pages/notifications/` — Glass notification list
- `pages/leaderboard/` — Glass leaderboard view
- `pages/search/` — Glass search results
- `pages/community/` — Glass community page
- `pages/customize/` — Glass customization page

**Stores preserved**: admin store, `usePremiumStore`, `useModerationStore`, `useSearchStore`, all TanStack Query hooks (admin config, audit log, user list, reports, emojis, key verification, call history, blocked users)
**Must NOT change**: Admin RBAC checks, billing/Stripe integration, moderation review flow, data export pipeline

---

## Verification Criteria

For every plan:
1. `npx tsc --noEmit` — zero TypeScript errors
2. `npx eslint --no-error-on-unmatched-pattern src/` — zero new ESLint errors
3. All existing Vitest tests pass — `npx vitest run --reporter=verbose`
4. Visual smoke test — every upgraded component renders correctly in dark and light mode
5. Store integration — all Zustand stores still read/write correctly (verified by existing tests)
6. No regressions — existing E2E tests pass (`npx playwright test`)

## Success Metrics

| Metric | Before | After |
|---|---|---|
| Files using `bg-dark-*` | ~100+ | 0 |
| Files consuming liquid-glass | 2 | 100+ |
| Glass surface coverage | ~5% | 100% |
| Broken stores/hooks | 0 | 0 |
| New TypeScript errors | 0 | 0 |

## Out of Scope

- **@cgraph/ui package extraction** — covered by `.gsd/phases/packages-ui/PLAN.md` (separate phase)
- **Mobile app** — separate phase with `@cgraph/ui-native`
- **New features** — no new functionality, only visual layer replacement
- **Zustand store refactoring** — stores are frozen; only their render output changes
- **API changes** — zero backend modifications
- **New animations** — use existing Framer Motion springs from `springPreset`; no new GSAP timelines
