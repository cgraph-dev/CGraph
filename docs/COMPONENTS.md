# CGraph Component Library

> **31 Storybook stories** covering all core UI primitives, feedback states, navigation,
> layout, media, and chat components. All animations use shared tokens from
> `@cgraph/animation-constants`.

---

## UI Primitives

| Component          | Path                                 | Variants / Props                                           | Story |
| ------------------ | ------------------------------------ | ---------------------------------------------------------- | ----- |
| Button             | `components/ui/button.tsx`           | primary, secondary, outline, ghost, danger, success; sm/md/lg; loading, fullWidth | ✅    |
| Input              | `components/ui/input.tsx`            | text, password, search; with icon, error state             | ✅    |
| Select             | `components/ui/select.tsx`           | single-select, searchable, disabled                        | ✅    |
| Badge              | `components/ui/badge.tsx`            | color variants, sizes, with dot indicator                  | ✅    |
| Card               | `components/ui/card.tsx`             | default, elevated, interactive, with header/footer         | ✅    |
| Dialog             | `components/ui/dialog.tsx`           | default, destructive, with form, custom footer             | ✅    |
| Modal              | `components/ui/modal.tsx`            | default, full-screen, with close button                    | ✅    |
| Tabs               | `components/ui/tabs.tsx`             | horizontal, many tabs, controlled/uncontrolled             | ✅    |
| Popover            | `components/ui/popover.tsx`          | basic, with form, info tooltip                             | ✅    |
| Toast              | `components/ui/toast.tsx`            | success, error, warning, info; auto-dismiss                | ✅    |
| Tooltip            | `components/ui/tooltip.tsx`          | top, bottom, left, right; delay variants                   | ✅    |
| Skeleton           | `components/ui/skeleton.tsx`         | text, circular, rectangular; shimmer animation             | ✅    |
| Switch             | `components/navigation/switch.tsx`   | on/off, disabled, with label                               | ✅    |
| Avatar             | `components/user/avatar.stories.tsx` | sizes, online indicator, fallback initials                  | ✅    |
| Alert              | `components/ui/alert.tsx`            | info, warning, error, success                              | —     |
| Label              | `components/ui/label.tsx`            | default, required indicator                                | —     |
| Separator          | `components/ui/separator.tsx`        | horizontal, vertical                                       | —     |
| TextArea           | `components/ui/text-area.tsx`        | resizable, with character count                            | —     |
| SubmitButton       | `components/ui/submit-button.tsx`    | loading state, disabled                                    | —     |
| GlowText           | `components/ui/glow-text.tsx`        | color variants, intensity                                  | —     |
| GlassCard          | `components/ui/glass-card.tsx`       | blur levels, tint colors                                   | —     |
| TiltCard           | `components/ui/tilt-card.tsx`        | tilt intensity, perspective                                | —     |
| AnimatedBorder     | `components/ui/animated-border.tsx`  | color, speed, width                                        | —     |
| AnimatedAvatar     | `components/ui/animated-avatar.tsx`  | pulse, glow effects                                        | —     |
| UploadProgressRing | `components/ui/upload-progress-ring.tsx` | progress %, size, color                               | —     |

## Feedback & State

| Component            | Path                                             | Variants / Props                               | Story |
| -------------------- | ------------------------------------------------ | ---------------------------------------------- | ----- |
| EmptyState           | `components/feedback/empty-state.tsx`            | with icon, with action button                  | ✅    |
| AnimatedEmptyState   | `shared/components/animated-empty-state.tsx`     | fade-in + spring icon, stagger children        | ✅    |
| ErrorFallback        | `shared/components/error-fallback.tsx`           | retry, go back, report actions                 | ✅    |
| ErrorBoundary        | `components/feedback/error-boundary.tsx`         | class boundary with fallback                   | ✅    |
| RouteErrorBoundary   | `components/feedback/route-error-boundary.tsx`   | route-scoped with navigation fallback          | —     |
| QueryBoundary        | `components/feedback/query-boundary.tsx`         | loading + error + empty combined               | —     |
| LoadingSpinner       | `components/feedback/loading-spinner.tsx`        | sizes, color                                   | ✅    |
| ProgressBar          | `components/feedback/progress-bar.tsx`           | determinate, indeterminate, colors             | ✅    |
| PageSkeleton         | `shared/components/page-skeleton.tsx`            | generic isLoading wrapper                      | ✅    |
| PageTransition       | `shared/components/page-transition.tsx`          | framer-motion fade + slide on route change     | —     |

## Page-Level Skeletons

| Component             | Path                                              | Layout Shape              | Story |
| --------------------- | ------------------------------------------------- | ------------------------- | ----- |
| ChannelListSkeleton   | `components/ui/skeletons/channel-list-skeleton.tsx` | avatar + 2-line rows × 10 | ✅    |
| ConversationSkeleton  | `components/ui/skeletons/conversation-skeleton.tsx`| header + bubble rows × 8  | ✅    |
| ForumSkeleton         | `components/ui/skeletons/forum-skeleton.tsx`       | board header + thread rows | ✅   |
| SettingsSkeleton      | `components/ui/skeletons/settings-skeleton.tsx`    | sidebar + form fields     | ✅    |
| ExploreSkeleton       | `components/ui/skeletons/explore-skeleton.tsx`     | card grid                 | —     |
| AdminSkeleton         | `components/ui/skeletons/admin-skeleton.tsx`       | dashboard panels          | —     |
| MessageSkeleton       | `components/ui/skeletons/message-skeleton.tsx`     | chat bubble placeholders  | —     |
| UserCardSkeleton      | `components/ui/skeletons/user-card-skeleton.tsx`   | avatar + name + status    | ✅    |

## Navigation

| Component       | Path                                      | Variants / Props                          | Story |
| --------------- | ----------------------------------------- | ----------------------------------------- | ----- |
| Dropdown        | `components/navigation/dropdown.tsx`      | left/right align, with icons, disabled    | ✅    |
| Sidebar         | `components/layout/sidebar.tsx`           | default, compact, floating, collapsed     | ✅    |
| FloatingSidebar | `components/layout/floating-sidebar.tsx`  | overlay mode                              | —     |
| TopNav          | `components/layout/top-nav.tsx`           | with breadcrumbs, with search             | —     |
| MobileNav       | `components/layout/mobile-nav.tsx`        | bottom tab navigation                     | —     |
| CommandPalette  | `components/layout/command-palette.tsx`    | Ctrl+K quick switcher                     | —     |
| TagInput        | `components/navigation/tag-input.tsx`     | add/remove tags, autocomplete             | —     |

## Chat & Messaging

| Component        | Path                                              | Variants / Props                                | Story |
| ---------------- | ------------------------------------------------- | ----------------------------------------------- | ----- |
| MessageBubble    | `modules/chat/components/message-bubble/`         | text, image, voice, gif, reply, edited, deleted | ✅    |
| GifMessage       | `modules/chat/components/gif-message.tsx`         | loading, loaded, autoplay on/off, error         | ✅    |
| SearchBar        | `modules/search/components/advanced-search/`      | empty, with query, suggestions, filters         | ✅    |

## Media

| Component            | Path                                          | Variants / Props                              | Story |
| -------------------- | --------------------------------------------- | --------------------------------------------- | ----- |
| VoiceMessagePlayer   | `components/media/voice-message-player.tsx`   | playing, paused, loading, speed control       | ✅    |
| FileAttachment       | `components/media/file-attachment.stories.tsx` | image, document, video, audio, downloading    | ✅    |
| VoiceMessageRecorder | `components/media/voice-message-recorder.tsx` | recording, idle, preview                      | —     |
| Waveform             | `components/media/waveform.tsx`               | static, animated, interactive                 | —     |
| FileUpload           | `components/media/file-upload.tsx`            | drag-drop, browse, progress                   | —     |

## Groups & Forums

| Component        | Path                                              | Variants / Props                              | Story |
| ---------------- | ------------------------------------------------- | --------------------------------------------- | ----- |
| ChannelItem      | `modules/groups/components/channel-list/`         | text, voice, announcement; active, muted, unread | ✅ |
| ForumThreadCard  | `pages/forums/forum-thread-card.stories.tsx`      | default, pinned, locked, high-activity        | ✅    |

## Discovery (Phase 34)

| Component         | Path                                                   | Variants / Props                              | Story |
| ----------------- | ------------------------------------------------------ | --------------------------------------------- | ----- |
| FeedModeTabs      | `modules/discovery/components/feed-mode-tabs.tsx`      | 5 modes (Pulse/Fresh/Rising/Deep Cut/Frequency) | —   |
| FrequencyPicker   | `modules/discovery/components/frequency-picker.tsx`    | topic multi-select with weight sliders         | —    |
| TopicCard         | `modules/discovery/components/topic-card.tsx`          | topic display with health score                | —    |

## Cosmetics (Phase 35)

| Component              | Path                                                           | Variants / Props                                | Story |
| ---------------------- | -------------------------------------------------------------- | ----------------------------------------------- | ----- |
| CosmeticCard           | `modules/cosmetics/components/cosmetic-card.tsx`              | rarity-based glow, equipped indicator           | —     |
| CosmeticRenderer       | `modules/cosmetics/components/cosmetic-renderer.tsx`          | renders any cosmetic type                       | —     |
| EquipPanel             | `modules/cosmetics/components/equip-panel.tsx`                | equip/unequip with confirmation                 | —     |
| RarityBadge            | `modules/cosmetics/components/rarity-badge.tsx`               | 7-tier rarity display with colors               | —     |
| InventoryPage          | `modules/cosmetics/pages/inventory-page.tsx`                  | full inventory grid with filters                | —     |
| ShopPage               | `modules/cosmetics/pages/shop-page.tsx`                       | Nodes-priced cosmetics shop                     | —     |
| CosmeticsSettingsPanel | `modules/settings/components/cosmetics-settings-panel.tsx`    | cosmetics preferences                           | —     |

## Creator Economy (Phase 36)

| Component             | Path                                                           | Variants / Props                               | Story |
| --------------------- | -------------------------------------------------------------- | ---------------------------------------------- | ----- |
| CreatorDashboardPage  | `modules/creator/pages/creator-dashboard-page.tsx`            | earnings chart, payout history, analytics       | —     |
| EarningsChart         | `modules/creator/components/earnings-chart.tsx`               | monthly earnings with Recharts                  | —     |
| PremiumThreadManager  | `modules/creator/components/premium-thread-manager.tsx`       | create/manage gated threads                     | —     |
| PaidFileCard          | `modules/paid-dm/components/paid-file-card.tsx`               | locked file preview + price badge               | —     |
| FileUnlockModal       | `modules/paid-dm/components/file-unlock-modal.tsx`            | Nodes payment confirmation                      | —     |
| PaidDmSettingsPage    | `modules/paid-dm/pages/paid-dm-settings-page.tsx`             | pricing config for paid DMs                     | —     |
| BoostPanel            | `modules/forums/components/boost-panel.tsx`                   | boost forum/thread controls                     | —     |
| PremiumThreadGate     | `modules/forums/components/premium-thread-gate.tsx`           | paywall overlay with "Unlock" CTA               | —     |
| PaidBadge             | `components/forums/paid-badge.tsx`                            | paid content indicator badge                    | —     |
| CreatorLayout         | `modules/social/components/profile-card/creator-layout.tsx`   | creator-specific profile card variant           | —     |

## Forum Transformation (Phase 37)

| Component                | Path                                                              | Variants / Props                              | Story |
| ------------------------ | ----------------------------------------------------------------- | --------------------------------------------- | ----- |
| IdentityCard             | `modules/forums/components/identity-card.tsx`                    | user identity display (title + badge + border) | —    |
| MentionAutocomplete      | `modules/forums/components/mention-autocomplete.tsx`             | @mention user search dropdown                  | —    |
| TagSelector              | `modules/forums/components/tag-selector.tsx`                     | multi-tag picker with categories                | —    |
| ThreadTemplatePicker     | `modules/forums/components/thread-template-picker.tsx`           | template selection for new threads              | —    |
| ScheduledPostForm        | `modules/forums/components/scheduled-post-form.tsx`              | date/time picker for scheduled publishing       | —    |
| ForumModDashboard        | `modules/forums/components/forum-moderation/forum-mod-dashboard.tsx` | moderation queue + actions                  | —    |
| WarningPanel             | `modules/forums/components/forum-moderation/warning-panel.tsx`   | user warnings management                        | —    |
| ForumAutomodSettings     | `modules/forums/components/forum-moderation/forum-automod-settings.tsx` | automod rule configuration              | —    |
| ForumPermissionsPanel    | `modules/forums/components/forum-permissions/forum-permissions-panel.tsx` | 21-flag permission matrix              | —    |
| PermissionTemplateManager| `modules/forums/components/forum-permissions/permission-template-manager.tsx` | CRUD permission templates        | —    |
| PermissionMatrix         | `modules/forums/components/forum-permissions/permission-matrix.tsx` | visual permission grid                     | —    |
| ForumSearchPage          | `modules/forums/pages/forum-search-page.tsx`                     | forum-scoped search results                     | —    |
| IdentityCustomization    | `pages/customize/identity-customization/identity-customization.tsx` | identity card editor with preview           | —    |

## Notifications

| Component        | Path                                                 | Variants / Props                        | Story |
| ---------------- | ---------------------------------------------------- | --------------------------------------- | ----- |
| NotificationItem | `pages/notifications/notifications/notification-item.tsx` | message, mention, reaction, system; read/unread | ✅ |

## Shared Utilities

| Component              | Path                                                | Purpose                               |
| ---------------------- | --------------------------------------------------- | ------------------------------------- |
| AvatarLightbox         | `shared/components/avatar-lightbox.tsx`            | Zoom-to-fullscreen avatar viewer      |
| KeyboardShortcutsModal | `shared/components/keyboard-shortcuts-modal.tsx`   | Global keyboard shortcuts reference   |
| LastSeenBadge          | `shared/components/last-seen-badge.tsx`            | "Last seen X ago" relative time badge |
| NotificationActions    | `shared/components/notification-actions.tsx`       | Mark read, mute, delete actions       |
| PresenceStatusSelector | `shared/components/presence-status-selector.tsx`   | Online/away/DND status picker         |
| PushNotificationPrompt | `shared/components/push-notification-prompt.tsx`   | Browser push notification opt-in      |
| QuickSwitcher          | `shared/components/quick-switcher.tsx`             | Ctrl+K navigation command palette     |

---

## Mobile Components (`apps/mobile/src/components/ui/`)

| Component       | Path                             | Variants / Props                          |
| --------------- | -------------------------------- | ----------------------------------------- |
| EmptyState      | `ui/empty-state.tsx`             | icon, title, description, action; FadeIn  |
| ErrorFallback   | `ui/error-fallback.tsx`          | error, retry; FadeIn + staggered entrance |
| SkeletonLoader  | `ui/skeleton-loader.tsx`         | text, circle, rect; pulse shimmer         |
| PageTransition  | `ui/page-transition.tsx`         | fade, slideRight, slideUp presets         |
| GlassCard       | `ui/glass-card-v2.tsx`           | blur, tint, gesture-driven tilt           |
| AnimatedAvatar  | `ui/animated-avatar.tsx`         | presence glow, tap feedback               |
| Badge           | `ui/badge.tsx`                   | color, size, dot indicator                |
| BottomSheet     | `ui/bottom-sheet.tsx`            | snapping points, drag handle              |
| Carousel        | `ui/carousel.tsx`                | horizontal swipe, pagination dots         |

## Mobile — Nodes & Secret Chat (Phase 34)

| Component              | Path                                                        | Variants / Props                          |
| ---------------------- | ----------------------------------------------------------- | ----------------------------------------- |
| NodesWalletScreen      | `screens/nodes/nodes-wallet-screen.tsx`                     | balance, transactions, buy CTA            |
| ShopScreen             | `screens/nodes/shop-screen.tsx`                             | bundle grid (5 bundles)                   |
| WithdrawalScreen       | `screens/nodes/withdrawal-screen.tsx`                       | withdrawal form, status tracking          |
| SecretChatScreen       | `screens/secret-chat/secret-chat-screen.tsx`                | ghost mode, 12 themes, panic wipe         |
| SecretChatSettingsScreen | `screens/secret-chat/secret-chat-settings-screen.tsx`     | timer, theme, key verification            |
| SecretChatHeader       | `components/secret-chat/secret-chat-header.tsx`             | ghost indicator, timer badge              |
| SecretChatMessage      | `components/secret-chat/secret-chat-message.tsx`            | E2EE badge, disappearing indicator        |
| SecretChatInput        | `components/secret-chat/secret-chat-input.tsx`              | encrypted input with send button          |
| DiscoverySection       | `screens/search/search-screen/components/discovery-section.tsx` | 5 feed modes in search tab            |
| CustomizeScreen        | `screens/customize/customize-screen.tsx`                    | 5 customization categories                |
| PrivacyScreen          | `screens/settings/privacy-screen.tsx`                       | 15 privacy toggles                        |

## Mobile — Cosmetics (Phase 35)

| Component            | Path                                                   | Variants / Props                          |
| -------------------- | ------------------------------------------------------ | ----------------------------------------- |
| InventoryScreen      | `screens/cosmetics/inventory-screen.tsx`                | full cosmetic inventory                   |
| EquipScreen          | `screens/cosmetics/equip-screen.tsx`                    | equip/unequip cosmetics                   |
| CosmeticRenderer     | `components/cosmetics/cosmetic-renderer.tsx`            | renders any cosmetic surface              |

## Mobile — Creator Economy (Phase 36)

| Component              | Path                                                    | Variants / Props                          |
| ---------------------- | ------------------------------------------------------- | ----------------------------------------- |
| CreatorDashboardScreen | `screens/creator/creator-dashboard-screen.tsx`           | earnings, analytics, payouts              |
| PaidFileCard           | `components/paid-dm/paid-file-card.tsx`                  | locked file + Nodes price                 |
| PaidDmSettingsScreen   | `screens/paid-dm/paid-dm-settings-screen.tsx`            | pricing configuration                     |

## Mobile — Forum Transformation (Phase 37)

| Component              | Path                                                     | Variants / Props                          |
| ---------------------- | -------------------------------------------------------- | ----------------------------------------- |
| IdentityCardScreen     | `screens/forums/identity-card-screen.tsx`                | view/edit identity card                   |
| ForumAdminScreen       | `screens/forums/forum-admin-screen.tsx`                  | admin panels (10 sections)                |
| ForumSearchScreen      | `screens/forums/forum-search-screen.tsx`                 | forum-scoped search                       |
| ForumLeaderboardScreen | `screens/forums/forum-leaderboard-screen.tsx`            | reputation rankings                       |
| ForumUserGroupsScreen  | `screens/forums/forum-user-groups-screen.tsx`            | user group management                     |
| ForumModerationScreen  | `screens/forums/forum-moderation-screen.tsx`             | moderation queue + actions                |
| IdentityCard           | `components/forums/identity-card.tsx`                    | compact identity display                  |
| MentionInput           | `components/forums/mention-input.tsx`                    | @mention autocomplete input               |
| TagChips               | `components/forums/tag-chips.tsx`                        | tag display chips                         |
| ThreadPrefixBadge      | `components/forums/thread-prefix-badge.tsx`              | thread prefix indicator                   |
| IdentityCustomization  | `screens/customize/identity-customization-screen.tsx`    | mobile identity card editor               |

---

## Animation Tokens

All animations use shared tokens from `@cgraph/animation-constants`:

| Module           | Path                                            | Contents                                               |
| ---------------- | ----------------------------------------------- | ------------------------------------------------------ |
| `durations`      | `packages/animation-constants/src/durations.ts` | instant, fast, normal, slow, dramatic (ms values)      |
| `easings`        | `packages/animation-constants/src/easings.ts`   | easeIn, easeOut, easeInOut, cubicBezier presets         |
| `springs`        | `packages/animation-constants/src/springs.ts`   | snappy, gentle, bouncy, smooth (stiffness/damping/mass) |
| `stagger`        | `packages/animation-constants/src/stagger.ts`   | stagger delay presets for list animations               |
| `transitions`    | `packages/animation-constants/src/transitions.ts` | pageEnter, modalSlideUp, drawerSlideIn, fadeIn, scalePress, etc. |
| `rnTransitions`  | `packages/animation-constants/src/transitions.ts` | Reanimated-compatible numeric presets                  |

### Usage

```tsx
// Web (Framer Motion)
import { transitions } from '@cgraph/animation-constants';
<motion.div {...transitions.pageEnter}>...</motion.div>

// Mobile (Reanimated)
import { rnTransitions } from '@cgraph/animation-constants';
<Animated.View entering={FadeIn.duration(rnTransitions.fadeIn.duration)}>
```

---

## Storybook

Run locally:

```bash
cd apps/web && pnpm storybook
```

All stories use **CSF3 format** (`Meta` + `StoryObj` pattern) with `tags: ['autodocs']` for
automatic documentation generation.
