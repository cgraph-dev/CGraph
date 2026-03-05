---
phase: 22-modern-ui-overhaul
plan: 07
status: complete
timestamp: 2025-01-20
commit: 69d363f9
affects: ["22-10"]
subsystem: groups
tech-stack:
  added: []
  used: [motion/react, radix-ui, heroicons, react-native-reanimated, expo-haptics, expo-vector-icons]
patterns:
  applied: [Discord server sidebar, squircle hover transitions, localStorage persistence, horizontal mobile icon bar, PanResponder swipe-to-dismiss]
decisions:
  - Preserved existing channel-list/ directory (141-line ChannelList, 106-line ChannelItem, 84-line CategorySection) — new components complement rather than replace
  - Preserved existing voice-channel-panel.tsx (207 lines) — new VoiceChannelUsers is for inline channel display, not the persistent bottom panel
  - Preserved existing group-list/group-icon.tsx (82 lines) — new ServerIconBar is the full far-left sidebar, not individual icons
  - Preserved existing mobile channel-list.tsx (326 lines) — new ChannelListItem provides per-item component for reuse
  - Mobile icon bar is horizontal (top row) rather than vertical to match native UX patterns
---

## Plan 22-07 Summary: Groups & Channels Discord-Style UI

### What Was Built

**Web — 8 components:**

| Component | Path | Lines | Purpose |
|-----------|------|-------|---------|
| ServerIconBar | `modules/groups/components/server-icon-bar.tsx` | 217 | 72px vertical bar with squircle hover, unread pills, home button, add/discover |
| ServerSidebar | `modules/groups/components/server-sidebar.tsx` | 165 | 240px panel with ServerHeader, optional banner, channel area, UserBar (mic/deafen/settings) |
| ServerHeader | `modules/groups/components/server-header.tsx` | 168 | Dropdown menu: invite, settings, create channel/category, notifications, privacy, leave (red) |
| ServerBanner | `modules/groups/components/server-banner.tsx` | 57 | Optional banner image with dual gradient overlays for readability |
| ChannelCategory | `modules/groups/components/channel-category.tsx` | 149 | Collapsible sections with localStorage persistence, channel count when collapsed, "+" on hover |
| ChannelListItem | `modules/groups/components/channel-list-item.tsx` | 169 | Type icons (#/speaker/megaphone/lock), unread bold+dot, mention badge, hover action icons |
| VoiceChannelUsers | `modules/groups/components/voice-channel-users.tsx` | 128 | Connected users below voice channel with speaking ring, streaming LIVE badge |
| RoleBadge | `modules/groups/components/role-badge.tsx` | 97 | Colored pill (sm/md) with permissions tooltip on hover |

**Mobile — 3 components:**

| Component | Path | Lines | Purpose |
|-----------|------|-------|---------|
| ServerSidebar | `components/groups/server-sidebar.tsx` | 255 | Full-screen slide-in with horizontal icon bar, PanResponder swipe-dismiss |
| ChannelListItem | `components/groups/channel-list-item.tsx` | 196 | FadeInRight stagger, long-press Alert context menu, unread/mention badges |
| VoiceChannelUsers | `components/groups/voice-channel-users.tsx` | 218 | Horizontal avatar row with speaking borders, join button, overflow badge |

**Preserved existing (not modified):**
- `channel-list/channel-list.tsx` (141 lines) — DnD-based channel list with sortable channels
- `channel-list/channel-item.tsx` (106 lines) — Existing channel item with animations
- `channel-list/channel-category.tsx` (84 lines) — Existing category section
- `voice-channel-panel.tsx` (207 lines) — Persistent bottom voice panel
- `group-list/group-icon.tsx` (82 lines) — Individual group icon component
- Mobile `channel-list.tsx` (326 lines) — SectionList-based channel list

### Key Patterns

- **Squircle hover**: `borderRadius` transition from 50% → 35% on hover/active (Discord signature)
- **Unread pill**: 3px white pill on left edge, 8px height for unread, 36px for active
- **LocalStorage persistence**: Collapsed categories survive page reload
- **Streaming indicator**: Red `LIVE` badge with `ComputerDesktopIcon`
- **Mobile swipe-dismiss**: PanResponder with SWIPE_THRESHOLD at 25% screen width
- **Horizontal icon bar**: Mobile adapts vertical server bar to horizontal FlatList row

### Zero TypeScript Errors

All 11 components pass `tsc --noEmit` with zero errors.
