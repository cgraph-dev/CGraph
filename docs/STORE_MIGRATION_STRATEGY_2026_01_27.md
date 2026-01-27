# Store Migration Strategy - Unified Customization System

**Date**: January 27, 2026 **Status**: Implementation Guide **Complexity**: Medium

---

## Executive Summary

After analyzing the existing codebase, I've identified that the **old customization stores have much
more detailed UI state** than what's persisted to the backend. This document outlines a **hybrid
approach** that maintains backward compatibility while adding persistent, cross-device
customization.

---

## Current State Analysis

### Old Stores (UI-Focused, Local Only)

#### 1. `chatBubbleStore.ts`

**Purpose**: Detailed UI customization (localStorage only) **Fields**: 25+ detailed options
including:

- `ownMessageBg` / `otherMessageBg` (separate colors)
- `useGradient`, `gradientDirection`
- `bubbleShape`, `showTail`, `tailPosition`
- `glassEffect`, `glassBlur` (0-30)
- `shadowIntensity`, `borderWidth`
- `maxWidth`, `spacing`, `alignSent`, `alignReceived`
- `showTimestamp`, `timestampPosition`
- `showAvatar`, `avatarSize`
- `groupMessages`, `groupTimeout`

**Storage**: localStorage only (not synced to backend)

#### 2. `avatarBorderStore.ts`

**Purpose**: Avatar border catalog + selection **Fields**:

- `allBorders` - Full catalog of 150+ borders
- `unlockedBorders` - User's unlocked borders
- `preferences` - Border preferences (animationSpeed, particleDensity, customColors)
- `previewBorderId` - Temporary preview state
- `filters` - UI filter state

**Storage**: localStorage + some backend sync (partial)

### New Store (Backend-Focused, Cross-Device)

#### `unifiedCustomizationStore.ts`

**Purpose**: Cross-device persistent customization **Fields**: 20 backend-persisted fields
including:

- `bubbleColor` (single color)
- `bubbleOpacity`, `bubbleRadius`, `bubbleShadow`
- `textColor`, `textSize`, `textWeight`, `fontFamily`
- `entranceAnimation`, `hoverEffect`, `animationIntensity`
- `glassEffect`, `borderStyle`, `particleEffect`

**Storage**: Backend database + localStorage fallback

---

## The Problem

**The old stores manage MORE state than what's persisted to the backend.**

Example:

- Old store: `ownMessageBg` and `otherMessageBg` (2 separate colors)
- New store: `bubbleColor` (1 color)
- Backend schema: `bubble_color` (1 color)

**We can't simply replace the old stores** because we'd lose functionality.

---

## Recommended Solution: Hybrid Approach

### Strategy: Use Both Systems

Keep **both** old and new stores, with clear separation of concerns:

| Store                         | Purpose                  | Storage                | Use Case                   |
| ----------------------------- | ------------------------ | ---------------------- | -------------------------- |
| **chatBubbleStore**           | Detailed UI preferences  | localStorage           | Ephemeral UI customization |
| **avatarBorderStore**         | Border catalog + preview | localStorage           | UI state management        |
| **unifiedCustomizationStore** | Core settings sync       | Backend + localStorage | Cross-device persistence   |

### Integration Pattern

```typescript
// Component uses BOTH stores
import { useChatBubbleStore } from '@/stores/chatBubbleStore';
import { useChatCustomization } from '@/stores/unifiedCustomizationStore';

function ChatBubbleSettings() {
  // UI-specific state (local only)
  const { style, updateStyle } = useChatBubbleStore();

  // Backend-persisted state (cross-device)
  const { chat, updateChat } = useChatCustomization();

  // When user changes a backend-synced setting:
  const handleColorChange = async (color: string) => {
    // Update local UI immediately
    updateStyle({ ownMessageBg: color });

    // Sync to backend (cross-device)
    await updateChat({ bubbleColor: color });
  };

  // UI-only settings (not synced):
  const handleMaxWidthChange = (width: number) => {
    updateStyle({ maxWidth: width }); // Local only
  };
}
```

---

## Field Mapping

### Backend-Synced Fields (Use Unified Store)

These fields exist in BOTH old stores AND backend:

| Old Store Field         | Unified Store Field    | Backend Field        | Action     |
| ----------------------- | ---------------------- | -------------------- | ---------- |
| `borderRadius`          | `bubbleRadius`         | `bubble_radius`      | ✅ Migrate |
| `entranceAnimation`     | `entranceAnimation`    | `entrance_animation` | ✅ Migrate |
| `glassEffect` (boolean) | `glassEffect` (string) | `glass_effect`       | ⚠️ Convert |
| `borderStyle`           | `borderStyle`          | `border_style`       | ✅ Migrate |

### UI-Only Fields (Keep in Old Store)

These fields exist ONLY in old stores (not in backend):

| Old Store Field                      | Keep in Old Store? | Reason                                 |
| ------------------------------------ | ------------------ | -------------------------------------- |
| `ownMessageBg` vs `otherMessageBg`   | ✅ Yes             | Backend only has single `bubble_color` |
| `useGradient`, `gradientDirection`   | ✅ Yes             | Complex UI state                       |
| `showTail`, `tailPosition`           | ✅ Yes             | UI-specific rendering                  |
| `glassBlur` (0-30)                   | ✅ Yes             | Fine-grained control                   |
| `maxWidth`, `spacing`                | ✅ Yes             | Layout-specific                        |
| `showTimestamp`, `timestampPosition` | ✅ Yes             | UI preference                          |
| `showAvatar`, `avatarSize`           | ✅ Yes             | UI preference                          |
| `groupMessages`, `groupTimeout`      | ✅ Yes             | Behavior preference                    |

---

## Migration Steps

### Phase 1: Keep Both Stores (Recommended)

**Pros**:

- ✅ No breaking changes
- ✅ All existing features work
- ✅ Adds cross-device sync for key settings
- ✅ Minimal code changes

**Cons**:

- ⚠️ Maintains duplicate state for some fields
- ⚠️ Requires coordination between stores

**Implementation**:

1. Keep `chatBubbleStore.ts` as-is
2. Keep `avatarBorderStore.ts` as-is
3. Add `unifiedCustomizationStore.ts` (already done)
4. Update key components to sync backend fields
5. Document which fields sync vs local-only

### Phase 2: Gradual Migration (Long-term)

**Steps**:

1. Identify which UI-only fields users ACTUALLY use
2. Run analytics for 1-2 months
3. Deprecate unused fields
4. Migrate popular UI fields to backend schema
5. Eventually consolidate into single store

---

## Implementation Examples

### Example 1: ChatBubbleSettings Component

**Current** (uses old store only):

```typescript
const { style, updateStyle } = useChatBubbleStore();
```

**Updated** (hybrid approach):

```typescript
import { useChatBubbleStore } from '@/stores/chatBubbleStore';
import { useChatCustomization } from '@/stores/unifiedCustomizationStore';

function ChatBubbleSettings() {
  // Local UI state
  const { style, updateStyle } = useChatBubbleStore();

  // Backend-synced state
  const { chat, updateChat, isSyncing } = useChatCustomization();

  const handleBubbleColorChange = async (color: string) => {
    // Update local UI
    updateStyle({ ownMessageBg: color });

    // Sync to backend for cross-device
    try {
      await updateChat({ bubbleColor: color });
    } catch (error) {
      console.error('Failed to sync color:', error);
      // Local state still works even if sync fails
    }
  };

  return (
    <div>
      <input
        type="color"
        value={style.ownMessageBg}
        onChange={(e) => handleBubbleColorChange(e.target.value)}
      />
      {isSyncing && <span>Syncing...</span>}
    </div>
  );
}
```

### Example 2: AvatarBorderRenderer Component

**Current** (uses old store):

```typescript
const { getEquippedBorder } = useAvatarBorderStore();
const border = getEquippedBorder();
```

**Updated** (hybrid approach):

```typescript
import { useAvatarBorderStore } from '@/stores/avatarBorderStore';
import { useProfileCustomization } from '@/stores/unifiedCustomizationStore';

function AvatarBorderRenderer({ src, alt }: Props) {
  // Local border catalog and preview state
  const { getEquippedBorder, preferences } = useAvatarBorderStore();

  // Backend-synced border ID
  const { avatarBorder, profile } = useProfileCustomization();

  // Use backend border ID if available, fallback to local
  const borderId = profile.avatarBorderId || preferences.equippedBorderId;
  const border = getEquippedBorder(); // Gets full config from catalog

  return <motion.div>...</motion.div>;
}
```

### Example 3: Equipping Avatar Border

**Current**:

```typescript
const { equipBorder } = useAvatarBorderStore();
equipBorder('border_cosmic_01'); // Local only
```

**Updated** (with backend sync):

```typescript
import { useAvatarBorderStore } from '@/stores/avatarBorderStore';
import { useProfileCustomization } from '@/stores/unifiedCustomizationStore';

function AvatarBorderPicker() {
  // Local state for UI
  const { equipBorder: equipLocalBorder, allBorders } = useAvatarBorderStore();

  // Backend sync
  const { equipAvatarBorder } = useProfileCustomization();

  const handleEquip = async (borderId: string) => {
    // Update local UI immediately
    equipLocalBorder(borderId);

    // Find border config
    const border = allBorders.find(b => b.id === borderId);
    if (!border) return;

    // Sync to backend (cross-device)
    try {
      await equipAvatarBorder({
        id: border.id,
        name: border.name,
        description: border.description,
        rarity: border.rarity,
        type: border.animation || 'solid',
        price: border.coinCost || 0,
        animation: border.animation,
        colorPrimary: border.colors.primary,
        colorSecondary: border.colors.secondary,
        particleEffect: border.particleEffect?.type,
        glowIntensity: border.glowIntensity,
        config: border.customConfig,
      });
    } catch (error) {
      console.error('Failed to sync border:', error);
      // Local state still works
    }
  };

  return <div>...</div>;
}
```

---

## Component Update Checklist

### High Priority (Backend-Synced Features)

- [ ] **ChatBubbleSettings.tsx** - Add backend sync for color, opacity, radius
- [ ] **AvatarBorderRenderer.tsx** - Use backend borderId when available
- [ ] **CustomizationUI.tsx** - Integrate unified store
- [ ] **ProfilePanel.tsx** - Sync profile theme changes
- [ ] **ThemePanel.tsx** - Sync app theme changes

### Medium Priority (UI Enhancement)

- [ ] **LivePreviewPanel.tsx** - Show "Synced" indicator
- [ ] **IdentityCustomization.tsx** - Sync badge selection
- [ ] **CosmeticsSettingsPanel.tsx** - Add sync status

### Low Priority (Keep Local Only)

- [ ] **AnimatedAvatar.tsx** - UI animation state only
- [ ] **ChatPanel.tsx** - UI preferences only
- [ ] **EffectsCustomization.tsx** - UI effects only

---

## Testing Plan

### Test Case 1: Cross-Device Sync

1. Login on Device A
2. Change bubble color to #FF5733
3. Verify local UI updates immediately
4. Wait for "Synced" indicator
5. Login on Device B
6. Verify bubble color is #FF5733

**Expected**: Color syncs across devices **Fallback**: Local state works even if sync fails

### Test Case 2: Offline Behavior

1. Disconnect network
2. Change bubble color
3. Verify local UI updates
4. Reconnect network
5. Verify automatic sync

**Expected**: Local changes persist, sync when online

### Test Case 3: Backward Compatibility

1. Use existing components
2. Verify all UI features still work
3. Verify no console errors

**Expected**: Everything works as before

---

## Migration Timeline

### Week 1: Preparation

- ✅ Create unified store (DONE)
- ✅ Create migration guide (THIS DOCUMENT)
- [ ] Run database migrations
- [ ] Test API endpoints

### Week 2: High-Priority Components

- [ ] Update ChatBubbleSettings
- [ ] Update AvatarBorderRenderer
- [ ] Update ProfilePanel
- [ ] Test cross-device sync

### Week 3: Medium-Priority Components

- [ ] Update LivePreviewPanel
- [ ] Update IdentityCustomization
- [ ] Add sync indicators

### Week 4: Polish & Testing

- [ ] End-to-end testing
- [ ] Performance testing
- [ ] User acceptance testing
- [ ] Documentation

---

## Rollback Plan

If issues arise:

1. **Keep old stores**: Don't delete `chatBubbleStore.ts` or `avatarBorderStore.ts`
2. **Feature flag**: Add `ENABLE_UNIFIED_STORE` environment variable
3. **Gradual rollout**: Enable for 10% → 50% → 100% of users
4. **Monitor errors**: Track sync failures in Sentry
5. **Quick revert**: Remove unified store integration if needed

---

## Decision: Recommended Approach

**✅ RECOMMENDATION: Hybrid Approach (Phase 1)**

### Why?

1. **Zero Breaking Changes**: All existing features work
2. **Additive Only**: We're ADDING cross-device sync, not replacing anything
3. **Gradual Migration**: Can migrate more fields to backend over time
4. **Low Risk**: Fallback to local state always works
5. **User Benefit**: Users get cross-device sync for key settings

### What to Do NOW?

1. **Run database migrations** (5 min)

   ```bash
   cd apps/backend && mix ecto.migrate
   ```

2. **Test API endpoints** (10 min)

   ```bash
   # See CUSTOMIZATION_SYSTEM_IMPLEMENTATION_2026_01_27.md
   ```

3. **Update 1-2 components** as proof-of-concept (1-2 hours)
   - Start with ChatBubbleSettings.tsx
   - Add backend sync for bubbleColor

4. **Monitor & Iterate** (ongoing)
   - Track sync success rate
   - Gather user feedback
   - Expand to more fields

---

## Conclusion

**The old stores are NOT obsolete** - they manage valuable UI state that doesn't need backend
persistence. The unified store COMPLEMENTS them by adding cross-device sync for key settings.

This hybrid approach:

- ✅ Maintains all existing functionality
- ✅ Adds cross-device sync
- ✅ Allows gradual migration
- ✅ Provides clear fallback behavior

**Next Step**: Run migrations and test API endpoints, then update 1-2 components as
proof-of-concept.

---

**Document Version**: 1.0.0 **Last Updated**: January 27, 2026 **Status**: Ready for Implementation
