# Store Consolidation Plan

## Current State: 31 store files

## Target State: 7 domain-aligned stores

## Migration Strategy

### Phase 1: Create Index Files (Backward Compatible)

Create index files that re-export from existing stores while planning consolidation.

### Phase 2: Gradual Consolidation

1. Merge related stores one at a time
2. Update imports across codebase
3. Run tests after each merge
4. Maintain backward compatibility exports

### Phase 3: Cleanup

1. Remove deprecated store files
2. Update documentation
3. Final verification

---

## Target Store Structure

### 1. userStore (auth + profile + settings + friends)

**Merge:**

- `authStore.ts` (526 lines) - Core authentication
- `profileStore.ts` (596 lines) - User profile management
- `settingsStore.ts` (658 lines) - User settings
- `friendStore.ts` (293 lines) - Friend list management

**Total: ~2,073 lines → Target: 1,500 lines (after deduplication)**

### 2. chatStore (messages + conversations + effects)

**Merge:**

- `chatStore.ts` (976 lines) - Core chat functionality
- `chatEffectsStore.ts` (743 lines) - Message effects
- `chatBubbleStore.ts` (79 lines) - Bubble customization
- `pmStore.ts` (802 lines) - Private messaging (if different from chatStore)
- `incomingCallStore.ts` (44 lines) - Call state

**Total: ~2,644 lines → Target: 2,000 lines**

### 3. communityStore (forums + groups + moderation)

**Merge:**

- `forumStore.ts` (1,550 lines) - Forum threads/posts
- `groupStore.ts` (358 lines) - Group/server management
- `moderationStore.ts` (895 lines) - Moderation tools
- `forumHostingStore.ts` (631 lines) - Forum hosting
- `announcementStore.ts` (565 lines) - Announcements

**Total: ~3,999 lines → Target: 3,000 lines**

### 4. gamificationStore (xp + achievements + events)

**Keep/Merge:**

- `gamificationStore.ts` (686 lines) - Core XP/leveling
- `prestigeStore.ts` (332 lines) - Prestige system
- `seasonalEventStore.ts` (399 lines) - Seasonal events
- `referralStore.ts` (440 lines) - Referral program

**Total: ~1,857 lines → Target: 1,400 lines**

### 5. themeStore (all theme/customization)

**Merge:**

- `themeStore.ts` (62 lines) - Basic theme
- `profileThemeStore.ts` (117 lines) - Profile theming
- `forumThemeStore.ts` (192 lines) - Forum theming
- `customization/index.ts` (672 lines) - Customization system
- `unifiedCustomizationStore.ts` (172 lines) - Unified customization
- `customizationStore.ts` (15 lines) - Legacy
- `customizationStoreV2.ts` (35 lines) - V2 migration
- `theme/index.ts` (979 lines) - Theme engine

**Total: ~2,244 lines → Target: 1,500 lines**

### 6. marketplaceStore (economy + items)

**Keep/Merge:**

- `marketplaceStore.ts` (423 lines) - Marketplace
- `avatarBorderStore.ts` (473 lines) - Avatar borders/items

**Total: ~896 lines → Target: 700 lines**

### 7. utilityStore (notifications + search + misc)

**Merge:**

- `notificationStore.ts` (128 lines) - Notifications
- `searchStore.ts` (219 lines) - Search functionality
- `pluginStore.ts` (247 lines) - Plugin system
- `calendarStore.ts` (630 lines) - Calendar events

**Total: ~1,224 lines → Target: 1,000 lines**

---

## Helper Files (Keep Separate)

- `middleware.ts` (210 lines) - Zustand middleware
- `utils/storeHelpers.ts` (298 lines) - Shared utilities
- `slices/` - Slice definitions for modular composition
- `customization/mappings.ts` (249 lines) - Theme mappings

---

## Implementation Order

1. **Theme stores** - Easiest, many small files
2. **Gamification stores** - Clear domain boundaries
3. **Marketplace stores** - Only 2 files
4. **Utility stores** - Clear boundaries
5. **User stores** - Requires careful auth handling
6. **Chat stores** - Complex, needs thorough testing
7. **Community stores** - Largest, needs planning

---

## Backward Compatibility

During migration, old imports will work via re-exports:

```typescript
// Old: import { useAuthStore } from '@/stores/authStore';
// New: import { useAuthStore } from '@/stores/userStore';
// Compat: authStore.ts re-exports from userStore

// In deprecated authStore.ts:
export { useAuthStore, useUserStore } from './userStore';
```

---

## Progress Tracking

- [ ] Phase 1: Create index files
- [ ] Phase 2.1: Theme store consolidation
- [ ] Phase 2.2: Gamification store consolidation
- [ ] Phase 2.3: Marketplace store consolidation
- [ ] Phase 2.4: Utility store consolidation
- [ ] Phase 2.5: User store consolidation
- [ ] Phase 2.6: Chat store consolidation
- [ ] Phase 2.7: Community store consolidation
- [ ] Phase 3: Cleanup deprecated files
