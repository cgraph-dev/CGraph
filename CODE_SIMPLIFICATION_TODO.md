# Code Simplification TODO

> **Generated**: January 2026 **Scope**: `apps/web/src` - Frontend codebase **Context**: Analysis of
> recent customization store refactoring and related components

This document outlines technical debt and simplification opportunities identified in the web
frontend codebase. Tasks are organized by priority and include detailed implementation steps.

---

## Table of Contents

1. [High Priority](#high-priority)
   - [1.1 Consolidate Dual Store Architecture](#11-consolidate-dual-store-architecture)
   - [1.2 Centralize Mapping Constants](#12-centralize-mapping-constants)
2. [Medium Priority](#medium-priority)
   - [2.1 Remove Legacy State Aliases](#21-remove-legacy-state-aliases)
   - [2.2 Create Generic Customization Grid Component](#22-create-generic-customization-grid-component)
   - [2.3 Extract Conversation.tsx Sub-components](#23-extract-conversationtsx-sub-components)
3. [Low Priority](#low-priority)
   - [3.1 Clean Up Unused Imports](#31-clean-up-unused-imports)
   - [3.2 Add Type-Safe ID Constants](#32-add-type-safe-id-constants)
   - [3.3 Strengthen Deprecation Warnings](#33-strengthen-deprecation-warnings)
4. [Testing Checklist](#testing-checklist)
5. [Migration Notes](#migration-notes)

---

## High Priority

### 1.1 Consolidate Dual Store Architecture

**Problem**: Two customization stores exist (`customizationStore` and `customizationStoreV2`)
requiring manual synchronization across multiple components.

**Impact**:

- Bug-prone manual sync logic
- Increased bundle size
- Confusing developer experience

**Files Affected**:

```
stores/customizationStore.ts          # Re-exports from /customization
stores/customizationStoreV2.ts        # Should be removed (if exists)
stores/customization/index.ts         # Unified store (keep this)
components/customize/LivePreviewPanel.tsx
pages/customize/ChatCustomization.tsx
pages/customize/ThemeCustomization.tsx
pages/customize/EffectsCustomization.tsx
pages/customize/IdentityCustomization.tsx
pages/customize/ProgressionCustomization.tsx
```

**Implementation Steps**:

- [ ] **Step 1**: Audit all imports of customization stores

  ```bash
  # Find all files importing from customization stores
  grep -r "customizationStore" --include="*.tsx" --include="*.ts" apps/web/src
  grep -r "customizationStoreV2" --include="*.tsx" --include="*.ts" apps/web/src
  ```

- [ ] **Step 2**: Update imports to use unified store

  ```typescript
  // BEFORE (multiple patterns exist)
  import { useCustomizationStore } from '@/stores/customizationStore';
  import { useCustomizationStoreV2 } from '@/stores/customizationStoreV2';

  // AFTER (single import)
  import { useCustomizationStore } from '@/stores/customization';
  ```

- [ ] **Step 3**: Remove sync functions from components

  Files with sync logic to remove:
  - `ChatCustomization.tsx:336-345` - `syncBubbleToV2`, `syncEffectToV2`
  - `ThemeCustomization.tsx:476-488` - `syncThemeToV2`
  - `LivePreviewPanel.tsx` - Remove dual store usage in `useShallow` calls

- [ ] **Step 4**: Update component state access patterns

  ```typescript
  // BEFORE: Merging from two stores
  const v2Settings = useCustomizationStoreV2(useShallow((state) => ({...})));
  const v1Settings = useCustomizationStore(useShallow((state) => ({...})));
  const effectiveTitle = v1Settings.title || v2Settings.equippedTitle;

  // AFTER: Single store access
  const { equippedTitle, avatarBorderType } = useCustomizationStore(
    useShallow((state) => ({
      equippedTitle: state.equippedTitle,
      avatarBorderType: state.avatarBorderType,
    }))
  );
  ```

- [ ] **Step 5**: Delete deprecated store files
  - Remove `stores/customizationStoreV2.ts` if it still exists as separate file
  - Update `stores/customizationStore.ts` to be a simple re-export (already done)

- [ ] **Step 6**: Run type checker and fix any type errors
  ```bash
  pnpm typecheck
  ```

**Acceptance Criteria**:

- [ ] Only one customization store import pattern exists
- [ ] No `syncToV2` or similar functions in components
- [ ] All customization pages work correctly
- [ ] Live preview panel updates in real-time

---

### 1.2 Centralize Mapping Constants

**Problem**: ID-to-type mapping constants are duplicated across multiple files.

**Duplicated Constants**: | Constant | Location | Purpose | |----------|----------|---------| |
`BORDER_ID_TO_TYPE` | `LivePreviewPanel.tsx:61-80` | Maps border IDs (b1-b18) to border types | |
`PROFILE_THEME_TO_COLOR` | `LivePreviewPanel.tsx:83-91` | Maps profile themes to color presets | |
`BUBBLE_ID_TO_V2_STYLE` | `ChatCustomization.tsx:29-42` | Maps bubble IDs to ChatBubbleStyle | |
`EFFECT_ID_TO_V2_ANIMATION` | `ChatCustomization.tsx:45-53` | Maps effect IDs to BubbleAnimation | |
`THEME_ID_TO_V2_PRESET` | `ThemeCustomization.tsx:382-395` | Maps theme IDs to ThemePreset |

**Implementation Steps**:

- [ ] **Step 1**: Create centralized mappings file

  ```
  stores/customization/mappings.ts
  ```

- [ ] **Step 2**: Define all mappings with proper types

  ```typescript
  // stores/customization/mappings.ts
  import type { AvatarBorderType, ThemePreset, ChatBubbleStyle, BubbleAnimation } from './index';

  /**
   * Maps avatar border item IDs to their animation types.
   */
  export const BORDER_ID_TO_TYPE: Record<string, AvatarBorderType> = {
    b1: 'static',
    b2: 'static',
    b3: 'static',
    b4: 'static',
    b5: 'pulse',
    b6: 'rotate',
    b7: 'glow',
    b8: 'electric',
    b9: 'rotate',
    b10: 'fire',
    b11: 'ice',
    b12: 'glow',
    b13: 'fire',
    b14: 'legendary',
    b15: 'mythic',
    b16: 'fire',
    b17: 'mythic',
    b18: 'legendary',
  };

  /**
   * Maps profile theme IDs to color presets.
   */
  export const PROFILE_THEME_TO_COLOR: Record<string, ThemePreset> = {
    'profile-default': 'purple',
    'classic-purple': 'purple',
    'profile-ocean': 'cyan',
    'profile-forest': 'emerald',
    'profile-sunset': 'orange',
    'profile-midnight': 'purple',
    'profile-cherry': 'pink',
  };

  /**
   * Maps chat bubble style IDs to ChatBubbleStyle enum values.
   */
  export const BUBBLE_ID_TO_STYLE: Record<string, ChatBubbleStyle> = {
    'bubble-default': 'rounded',
    'bubble-pill': 'rounded',
    'bubble-sharp': 'sharp',
    'bubble-telegram': 'modern',
    'bubble-discord': 'modern',
    'bubble-imessage': 'cloud',
    'bubble-minimal': 'default',
    'bubble-neon': 'modern',
    'bubble-gradient': 'modern',
    'bubble-glass': 'modern',
    'bubble-retro': 'retro',
    'bubble-cloud': 'cloud',
  };

  /**
   * Maps message effect IDs to BubbleAnimation enum values.
   */
  export const EFFECT_ID_TO_ANIMATION: Record<string, BubbleAnimation> = {
    'effect-none': 'none',
    'effect-bounce': 'bounce',
    'effect-slide': 'slide',
    'effect-fade': 'fade',
    'effect-scale': 'scale',
    'effect-pop': 'scale',
    'effect-rotate': 'flip',
  };

  /**
   * Maps theme IDs to ThemePreset for global theming.
   */
  export const THEME_ID_TO_PRESET: Record<string, ThemePreset> = {
    'profile-default': 'purple',
    'classic-purple': 'purple',
    'profile-ocean': 'cyan',
    'profile-forest': 'emerald',
    'profile-sunset': 'orange',
    'profile-midnight': 'purple',
    'profile-cherry': 'pink',
    'chat-default': 'purple',
    'chat-discord': 'purple',
    'chat-telegram': 'cyan',
    'chat-neon': 'pink',
    'chat-minimal': 'emerald',
  };

  // Helper functions
  export function getBorderType(borderId: string | null): AvatarBorderType {
    return borderId ? (BORDER_ID_TO_TYPE[borderId] ?? 'none') : 'none';
  }

  export function getThemeColor(themeId: string | null): ThemePreset {
    return themeId ? (PROFILE_THEME_TO_COLOR[themeId] ?? 'emerald') : 'emerald';
  }
  ```

- [ ] **Step 3**: Export from store barrel file

  ```typescript
  // stores/customization/index.ts - add at bottom
  export * from './mappings';
  ```

- [ ] **Step 4**: Update consuming files to import from centralized location

  ```typescript
  // BEFORE
  const BORDER_ID_TO_TYPE: Record<string, AvatarBorderType> = { ... };

  // AFTER
  import { BORDER_ID_TO_TYPE, getBorderType } from '@/stores/customization';
  ```

- [ ] **Step 5**: Remove duplicate constants from:
  - `LivePreviewPanel.tsx` (lines 61-91)
  - `ChatCustomization.tsx` (lines 29-53)
  - `ThemeCustomization.tsx` (lines 382-395)

**Acceptance Criteria**:

- [ ] Single source of truth for all ID mappings
- [ ] No duplicate mapping constants in component files
- [ ] Helper functions provide fallback defaults

---

## Medium Priority

### 2.1 Remove Legacy State Aliases

**Problem**: The customization state contains 12+ legacy field aliases that duplicate actual fields,
bloating state and storage.

**Legacy Aliases** (from `stores/customization/index.ts:128-141`):

```typescript
// These aliases duplicate other fields:
chatTheme: ThemePreset; // = chatBubbleColor
bubbleStyle: ChatBubbleStyle; // = chatBubbleStyle
messageEffect: BubbleAnimation; // = bubbleEntranceAnimation
avatarBorder: AvatarBorderType; // = avatarBorderType
title: string | null; // = equippedTitle
profileLayout: ProfileCardStyle; // = profileCardStyle
profileTheme: string | null; // = selectedProfileThemeId
particleEffect: string | null; // (unused)
backgroundEffect: string | null; // (unused)
reactionStyle: string; // (unused)
forumTheme: string | null; // (unused)
appTheme: ThemePreset; // = themePreset
```

**Implementation Steps**:

- [ ] **Step 1**: Find all usages of legacy aliases

  ```bash
  grep -rn "\.chatTheme\|\.bubbleStyle\|\.messageEffect\|\.avatarBorder" \
    --include="*.tsx" --include="*.ts" apps/web/src
  grep -rn "\.title\|\.profileLayout\|\.profileTheme\|\.appTheme" \
    --include="*.tsx" --include="*.ts" apps/web/src
  ```

- [ ] **Step 2**: Create migration map documenting all usages

- [ ] **Step 3**: Update all consuming files to use canonical field names

- [ ] **Step 4**: Remove aliases from `CustomizationState` interface

- [ ] **Step 5**: Remove alias assignments from actions

  ```typescript
  // BEFORE (stores/customization/index.ts:461)
  setAvatarBorder: (type) => set({ avatarBorderType: type, avatarBorder: type, isDirty: true }),

  // AFTER
  setAvatarBorder: (type) => set({ avatarBorderType: type, isDirty: true }),
  ```

- [ ] **Step 6**: Remove aliases from `partialize` function (lines 537-570)

- [ ] **Step 7**: Add migration for persisted localStorage data
  ```typescript
  // In store creation, add migration
  migrate: (persistedState: any, version: number) => {
    if (version < 2) {
      return {
        ...persistedState,
        chatBubbleColor: persistedState.chatTheme ?? persistedState.chatBubbleColor,
        avatarBorderType: persistedState.avatarBorder ?? persistedState.avatarBorderType,
        // ... other migrations
      };
    }
    return persistedState;
  },
  version: 2,
  ```

**Acceptance Criteria**:

- [ ] No legacy alias fields in `CustomizationState` interface
- [ ] Persisted data migrates correctly
- [ ] Reduced localStorage usage

---

### 2.2 Create Generic Customization Grid Component

**Problem**: Three nearly identical section components exist in `ChatCustomization.tsx`:

- `BubbleStylesSection` (lines 624-733) - 109 lines
- `MessageEffectsSection` (lines 735-834) - 99 lines
- `ReactionStylesSection` (lines 836-946) - 110 lines

**Total**: ~318 lines of repetitive code

**Implementation Steps**:

- [ ] **Step 1**: Create generic component at `components/customize/CustomizationItemGrid.tsx`

- [ ] **Step 2**: Define generic props interface

  ```typescript
  export interface CustomizationItem {
    id: string;
    name: string;
    description: string;
    unlocked: boolean;
    unlockRequirement?: string;
    isPremium?: boolean;
  }

  interface CustomizationItemGridProps<T extends CustomizationItem> {
    items: T[];
    selectedId: string;
    previewingId: string | null;
    onSelect: (id: string, isUnlocked: boolean) => void;
    renderPreview: (item: T) => React.ReactNode;
    columns?: 2 | 3;
  }
  ```

- [ ] **Step 3**: Implement generic grid with status buttons

- [ ] **Step 4**: Refactor `ChatCustomization.tsx` to use generic component

  ```typescript
  <CustomizationItemGrid
    items={filteredBubbles}
    selectedId={bubbleStyle}
    previewingId={previewingLockedItem}
    onSelect={(id, unlocked) => handlePreviewItem('bubble', id, unlocked)}
    renderPreview={(bubble) => <BubblePreview {...bubble} />}
  />
  ```

- [ ] **Step 5**: Create preview components for each type

**Acceptance Criteria**:

- [ ] Single `CustomizationItemGrid` component handles all three sections
- [ ] Reduced code by ~250 lines
- [ ] Preview rendering is customizable per item type

---

### 2.3 Extract Conversation.tsx Sub-components

**Problem**: `Conversation.tsx` is extremely large (800+ lines, 26k+ tokens).

**Already Extracted**:

- `ConversationHeader.tsx` - Header with participant info and actions

**Remaining Extractions**:

- [ ] **Step 1**: Extract `ConversationInput` component

  ```
  components/conversation/ConversationInput.tsx
  ```

  Include: text input, voice recorder, emoji/GIF/sticker pickers, file attachment, send button

- [ ] **Step 2**: Extract `MessageList` component

  ```
  components/conversation/MessageList.tsx
  ```

  Include: virtualized list, date separators, message grouping, scroll behavior

- [ ] **Step 3**: Extract reaction utilities

  ```
  utils/reactions.ts
  ```

  Move: `aggregateReactions()`, `handleRemoveReaction()`, related interfaces

- [ ] **Step 4**: Update barrel export at `components/conversation/index.ts`

**Acceptance Criteria**:

- [ ] `Conversation.tsx` reduced to <400 lines
- [ ] Each extracted component is independently testable
- [ ] No functionality regression

---

## Low Priority

### 3.1 Clean Up Unused Imports

**Problem**: Multiple files have unused imports with awkward suppression patterns.

**Files to Clean**: | File | Unused Import | Current Suppression |
|------|---------------|---------------------| | `ChatCustomization.tsx:14-16` | `CheckCircleIcon` |
`const _reserved = {...}; void _reserved;` | | `ThemeCustomization.tsx:15` | `CheckCircleIcon` |
`void CheckCircleIcon;` |

**Implementation**:

- [ ] Remove unused imports entirely
- [ ] Run `pnpm lint --fix`
- [ ] Add ESLint rule for `@typescript-eslint/no-unused-vars`

---

### 3.2 Add Type-Safe ID Constants

**Problem**: Magic strings like `'t5'`, `'b14'`, `'effect-bounce'` lack type safety.

**Implementation**:

- [ ] Create `stores/customization/constants.ts`

  ```typescript
  export const LEGENDARY_TITLE_IDS = ['t5', 't6'] as const;
  export const MYTHIC_TITLE_IDS = ['t14', 't15', 't16', 't17', 't18'] as const;
  export const RARE_TITLE_IDS = [...LEGENDARY_TITLE_IDS, ...MYTHIC_TITLE_IDS] as const;

  export function isLegendaryTitle(id: string | null): boolean {
    return id !== null && (RARE_TITLE_IDS as readonly string[]).includes(id);
  }
  ```

- [ ] Update consuming code to use constants

---

### 3.3 Strengthen Deprecation Warnings

**Problem**: Deprecated selectors still work, just log warnings.

**Implementation**:

- [ ] Make deprecated functions throw in development
- [ ] Add JSDoc `@deprecated` notices
- [ ] Consider removing entirely after migration period

---

## Testing Checklist

After completing any task:

### Functional Tests

- [ ] All customization pages load without errors
- [ ] Theme selection updates live preview
- [ ] Chat bubble customization applies correctly
- [ ] Avatar border selection works
- [ ] Settings persist after page refresh
- [ ] Settings sync to backend on save

### Performance Tests

- [ ] No infinite re-render loops (React DevTools)
- [ ] LocalStorage size reduced (if aliases removed)
- [ ] Bundle size stable

### Type Safety

- [ ] `pnpm typecheck` passes
- [ ] No TypeScript errors in IDE

### Regression

- [x] Run `pnpm test` - **893 tests passing** (as of February 1, 2026)
- [ ] Manual smoke test of customization flow

### Test Coverage Status (Updated February 1, 2026)

| Metric             | Value | Notes                                            |
| ------------------ | ----- | ------------------------------------------------ |
| Passing tests      | 893   | +53 from previous session                        |
| Statement coverage | 9.31% | Up from 8.79%                                    |
| E2EE tests         | 28    | New: `/lib/crypto/__tests__/e2ee.test.ts`        |
| Facade tests       | 25    | New: `/stores/facades/__tests__/facades.test.ts` |

### Recent Test Additions

**E2EE Test Suite** (`/apps/web/src/lib/crypto/__tests__/e2ee.test.ts`):

- [x] Base64 utilities (arrayBufferToBase64, base64ToArrayBuffer)
- [x] Key generation (ECDH, ECDSA)
- [x] Key import/export
- [x] Signing/verification (ECDSA)
- [x] Key derivation (HKDF)
- [x] Hashing (SHA-256)
- [x] Encryption/decryption (AES-256-GCM)
- [x] Key bundle generation

**Store Facades Test Suite** (`/apps/web/src/stores/facades/__tests__/facades.test.ts`):

- [x] useAuthFacade (auth, user, wallet)
- [x] useChatFacade (conversations, messages, typing)
- [x] useCommunityFacade (forums, groups)
- [x] useGamificationFacade (XP, karma, achievements)
- [x] useSettingsFacade (privacy, notifications)
- [x] useMarketplaceFacade (items, inventory)
- [x] useUIFacade (theme, modals, toasts)

---

## Migration Notes

### Breaking Changes

1. **Store Import Paths**: Ensure all files updated when consolidating stores
2. **Field Name Changes**: Add localStorage migration for persisted data
3. **Component Props**: Verify all required props passed when extracting components

### Rollback Plan

1. Revert to previous commit
2. Document issues in this file
3. Create smaller incremental PRs

---

## References

**Recent Commits**:

- `d027f35` - refactor(stores): replace object selectors with primitives
- `b58de04` - refactor: consolidate customization stores

**Files Analyzed**:

- `stores/customization/index.ts`
- `stores/utils/storeHelpers.ts`
- `components/customize/LivePreviewPanel.tsx`
- `pages/customize/ChatCustomization.tsx`
- `pages/customize/ThemeCustomization.tsx`
- `pages/messages/Conversation.tsx`
- `components/conversation/ConversationHeader.tsx`
