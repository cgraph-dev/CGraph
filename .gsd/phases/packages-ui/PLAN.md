# PLAN — `@cgraph/ui` Shared Liquid Glass Component Library

> **Phase:** packages/ui scaffold + 11 components **Design System:** `cgraph-liquid-glass-v1` (see
> `design-system/cgraph-liquid-glass/MASTER.md`) **Stack:** React 19 + TypeScript strict + Tailwind
> CSS 3.4 + CVA 0.7 + Framer Motion 12 **Created:** 2026-03-04

---

## 0. Context & Discovery Summary

### What Exists Today

| Location                                      | Status                                                               |
| --------------------------------------------- | -------------------------------------------------------------------- |
| `apps/web/src/components/liquid-glass/`       | 12 components — prototype implementations directly in the web app    |
| `design-system/cgraph-liquid-glass/MASTER.md` | Full persisted design system with tokens, spring presets, recipes    |
| `packages/animation-constants/`               | Platform-agnostic spring/easing constants (consumed by web + mobile) |
| `packages/utils/`                             | Shared utilities (no UI)                                             |

### Key Constraints Discovered

| Constraint                                                                                                         | Impact                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| **Mobile** uses React Native + Reanimated (no Tailwind, no Framer Motion)                                          | `@cgraph/ui` targets **web-only** consumers (apps/web, apps/landing). Mobile gets a future `@cgraph/ui-native` package. |
| **Landing** has React 19 + Tailwind + Framer Motion but **no** CVA/clsx/tailwind-merge                             | Those become `peerDependencies` — landing must install them.                                                            |
| **Existing packages** use source-level imports (`"main": "./src/index.ts"`)                                        | Follow the same pattern — no pre-build step. Vite/SWC in consuming apps handles transpilation.                          |
| **tsconfig.base.json** enforces `strict: true`, `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess` | All components must pass strict mode.                                                                                   |
| **Turbo pipeline** expects `typecheck`, `test`, `build` tasks                                                      | Package must define these scripts.                                                                                      |

### Architectural Decision: Web-Only Package

The mobile app uses `react-native-reanimated` and `StyleSheet` — not Tailwind + Framer Motion.
Forcing a platform abstraction would:

- Bloat the API with lowest-common-denominator primitives
- Lose Tailwind's utility-class power and Framer Motion's spring physics
- Add complexity for zero near-term gain (mobile has its own component kit)

**Decision:** `@cgraph/ui` is a **web-first** package. Mobile reuse is deferred to a future
`@cgraph/ui-native` that consumes the same design tokens from `@cgraph/animation-constants` + a
shared `@cgraph/design-tokens` package (out of scope for this plan).

---

## 1. Package Scaffold

### 1.1 Create `packages/ui/package.json`

```jsonc
{
  "name": "@cgraph/ui",
  "version": "1.0.0",
  "private": true,
  "description": "CGraph Liquid Glass UI component library — shared across web apps",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./button": "./src/components/liquid-button.tsx",
    "./input": "./src/components/liquid-input.tsx",
    "./search": "./src/components/liquid-search.tsx",
    "./select": "./src/components/liquid-select.tsx",
    "./toggle": "./src/components/liquid-toggle.tsx",
    "./checkbox": "./src/components/liquid-checkbox.tsx",
    "./tabs": "./src/components/liquid-tabs.tsx",
    "./card": "./src/components/liquid-card.tsx",
    "./modal": "./src/components/liquid-modal.tsx",
    "./toast": "./src/components/liquid-toast.tsx",
    "./user-card": "./src/components/liquid-user-card.tsx",
    "./tokens": "./src/tokens.css",
    "./shared": "./src/shared.ts",
  },
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "clean": "rm -rf dist",
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "framer-motion": "^12.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^3.0.0",
  },
  "devDependencies": {
    "@testing-library/react": "^16.3.0",
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/user-event": "^14.6.1",
    "@types/react": "^19.2.13",
    "@types/react-dom": "^19.2.3",
    "jsdom": "^26.0.0",
    "typescript": "~5.8.0",
    "vitest": "^3.1.0",
  },
}
```

**Rationale:**

- `peerDependencies` for react, framer-motion, CVA, clsx, tailwind-merge — consumers provide their
  own versions.
- No `dependencies` — zero added weight. Everything is a peer or dev dep.
- Subpath exports for tree-shakable per-component imports.
- Source-level entry (`./src/index.ts`) — matches every other `@cgraph/*` package.

### 1.2 Create `packages/ui/tsconfig.json`

```jsonc
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "jsx": "react-jsx",
    "paths": {
      "@/*": ["./src/*"],
    },
  },
  "include": ["src/**/*"],
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts",
    "**/*.test.tsx",
    "**/*.spec.ts",
    "**/*.spec.tsx",
  ],
}
```

### 1.3 Create `packages/ui/vitest.config.ts`

```ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

### 1.4 Directory Structure

```
packages/ui/
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── src/
    ├── index.ts                    # Barrel export
    ├── tokens.css                  # CSS custom properties
    ├── shared.ts                   # Springs, glass surfaces, glow map, cn()
    ├── components/
    │   ├── liquid-button.tsx        # LiquidButton
    │   ├── liquid-input.tsx         # LiquidInput
    │   ├── liquid-search.tsx        # LiquidSearch
    │   ├── liquid-select.tsx        # LiquidSelect
    │   ├── liquid-toggle.tsx        # LiquidToggle
    │   ├── liquid-checkbox.tsx      # LiquidCheckbox
    │   ├── liquid-tabs.tsx          # LiquidTabs
    │   ├── liquid-card.tsx          # LiquidCard
    │   ├── liquid-modal.tsx         # LiquidModal
    │   ├── liquid-toast.tsx         # LiquidToast
    │   └── liquid-user-card.tsx     # LiquidUserCard + LiquidAvatar
    └── test/
        ├── setup.ts                # Testing-library + jsdom setup
        ├── liquid-button.test.tsx
        ├── liquid-input.test.tsx
        ├── liquid-search.test.tsx
        ├── liquid-select.test.tsx
        ├── liquid-toggle.test.tsx
        ├── liquid-checkbox.test.tsx
        ├── liquid-tabs.test.tsx
        ├── liquid-card.test.tsx
        ├── liquid-modal.test.tsx
        ├── liquid-toast.test.tsx
        └── liquid-user-card.test.tsx
```

---

## 2. Shared Foundation (`src/shared.ts` + `src/tokens.css`)

### 2.1 `src/shared.ts`

Migrate from `apps/web/src/components/liquid-glass/shared.ts` with these changes:

| Change                                                                  | Why                                                                    |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Include `cn()` helper inline (re-export of `clsx` + `tailwind-merge`)   | Avoid dependency on `@/lib/utils` — the package must be self-contained |
| Export all spring presets: `springPreset`, `springSnap`, `springGentle` | Unchanged from MASTER.md                                               |
| Export `glassSurface`, `glassSurfaceElevated` class strings             | Unchanged                                                              |
| Export `glowColors` map + `GlowColor` type                              | Unchanged                                                              |
| Export `prefersReducedMotion()` helper                                  | Unchanged                                                              |

```ts
// cn() — self-contained, no external @/lib/utils dependency
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### 2.2 `src/tokens.css`

Direct copy from `apps/web/src/components/liquid-glass/tokens.css`. No changes needed — pure CSS
custom properties with no dependencies.

---

## 3. Component Migration Plan

Each component is migrated from `apps/web/src/components/liquid-glass/lg-*.tsx` to
`packages/ui/src/components/liquid-*.tsx` with these systematic changes:

### 3.0 Global Changes (Applied to ALL Components)

| #   | Change                 | From                               | To                                |
| --- | ---------------------- | ---------------------------------- | --------------------------------- |
| 1   | Import path for `cn()` | `import { cn } from '@/lib/utils'` | `import { cn } from '../shared'`  |
| 2   | Import path for shared | `import { ... } from './shared'`   | `import { ... } from '../shared'` |
| 3   | Component prefix       | `LG` (e.g. `LGButton`)             | `Liquid` (e.g. `LiquidButton`)    |
| 4   | Display name           | `LGButton`                         | `LiquidButton`                    |
| 5   | Type prefix            | `LGButtonProps`                    | `LiquidButtonProps`               |
| 6   | File name              | `lg-button.tsx`                    | `liquid-button.tsx`               |

### 3.1 LiquidButton (`liquid-button.tsx`)

**Source:** `apps/web/src/components/liquid-glass/lg-button.tsx`

| Aspect                     | Spec                                                                                   |
| -------------------------- | -------------------------------------------------------------------------------------- |
| **CVA variants**           | `glass`, `red`, `blue`, `neutral`, `purple`, `pink`, `green`, `ghost`, `outline`       |
| **Sizes**                  | `sm` (h-8), `md` (h-10), `lg` (h-12), `icon` (h-10 w-10)                               |
| **Props**                  | `variant`, `size`, `iconLeft`, `iconRight`, `isLoading`, `disabled`                    |
| **Animation**              | `whileHover: { scale: 1.03, y: -1 }`, `whileTap: { scale: 0.97 }`, `springPreset`      |
| **Changes from prototype** | Rename `LGButton` → `LiquidButton`, `LGButtonProps` → `LiquidButtonProps`, fix imports |

### 3.2 LiquidInput (`liquid-input.tsx`)

**Source:** `apps/web/src/components/liquid-glass/lg-text-input.tsx`

| Aspect           | Spec                                                                          |
| ---------------- | ----------------------------------------------------------------------------- |
| **CVA variants** | sizes: `sm`/`md`/`lg`, state: `default`/`error`/`success`                     |
| **Props**        | `inputSize`, `state`, `label`, `error`, `hint`, `iconLeft`, `iconRight`       |
| **Animation**    | Focus scale `1.01` via `springPreset`                                         |
| **Changes**      | Rename `LGTextInput` → `LiquidInput`, `LGTextInputProps` → `LiquidInputProps` |

### 3.3 LiquidSearch (`liquid-search.tsx`)

**Source:** `apps/web/src/components/liquid-glass/lg-search-input.tsx`

| Aspect        | Spec                                                                                |
| ------------- | ----------------------------------------------------------------------------------- |
| **Shape**     | Pill (rounded-full)                                                                 |
| **Props**     | `inputSize`, `value`, `onClear`                                                     |
| **Animation** | Focus scale, clear button pop                                                       |
| **Changes**   | Rename `LGSearchInput` → `LiquidSearch`, `LGSearchInputProps` → `LiquidSearchProps` |

### 3.4 LiquidSelect (`liquid-select.tsx`)

**Source:** `apps/web/src/components/liquid-glass/lg-select.tsx`

| Aspect        | Spec                                                           |
| ------------- | -------------------------------------------------------------- |
| **Props**     | `options`, `value`, `onChange`, `placeholder`, `label`, `size` |
| **Keyboard**  | ArrowUp/Down, Enter/Space to select, Escape to close           |
| **Animation** | Chevron rotate, dropdown spring open/close                     |
| **Changes**   | Rename prefixes, import paths                                  |

### 3.5 LiquidToggle (`liquid-toggle.tsx`)

**Source:** `apps/web/src/components/liquid-glass/lg-toggle.tsx`

| Aspect        | Spec                                           |
| ------------- | ---------------------------------------------- |
| **Props**     | `checked`, `onChange`, `label`, `size` (sm/md) |
| **Animation** | Knob translate via `springSnap`                |
| **Changes**   | Rename prefixes                                |

### 3.6 LiquidCheckbox (`liquid-checkbox.tsx`)

**Source:** `apps/web/src/components/liquid-glass/lg-checkbox.tsx`

| Aspect        | Spec                                            |
| ------------- | ----------------------------------------------- |
| **Props**     | `checked`, `onChange`, `label`, `indeterminate` |
| **Animation** | Checkmark pop via `springSnap`                  |
| **Changes**   | Rename prefixes                                 |

### 3.7 LiquidTabs (`liquid-tabs.tsx`)

**Source:** `apps/web/src/components/liquid-glass/lg-tabs.tsx`

| Aspect        | Spec                                                                 |
| ------------- | -------------------------------------------------------------------- |
| **Props**     | `tabs`, `value`, `onChange`, `children(activeValue)`, `size` (sm/md) |
| **Animation** | Sliding indicator via `springPreset`                                 |
| **Keyboard**  | ArrowLeft/Right, Home/End                                            |
| **Changes**   | Rename prefixes, rename `LGTab` type → `LiquidTab`                   |

### 3.8 LiquidCard (`liquid-card.tsx`)

**Source:** `apps/web/src/components/liquid-glass/lg-card.tsx`

| Aspect           | Spec                                                             |
| ---------------- | ---------------------------------------------------------------- |
| **CVA variants** | `glass`, `elevated`, `flat` + `interactive` boolean              |
| **Props**        | `variant`, `interactive`, `header`, `footer`, `compact`          |
| **Animation**    | Interactive hover: `scale: 1.015, y: -2` + iridescent box-shadow |
| **Changes**      | Rename prefixes                                                  |

### 3.9 LiquidModal (`liquid-modal.tsx`)

**Source:** `apps/web/src/components/liquid-glass/lg-modal.tsx`

| Aspect        | Spec                                                          |
| ------------- | ------------------------------------------------------------- |
| **Sizes**     | `sm`, `md`, `lg`, `xl`                                        |
| **Props**     | `open`, `onClose`, `title`, `description`, `footer`, `size`   |
| **Features**  | Focus trap, Escape to close, body scroll lock, backdrop click |
| **Animation** | `springGentle`: `scale: 0.92→1, y: 20→0`                      |
| **Changes**   | Rename prefixes                                               |

### 3.10 LiquidToast (`liquid-toast.tsx`)

**Source:** `apps/web/src/components/liquid-glass/lg-toast.tsx`

| Aspect        | Spec                                                                          |
| ------------- | ----------------------------------------------------------------------------- |
| **Variants**  | `info`, `success`, `warning`, `error`                                         |
| **API**       | `toast()` imperative, `dismissToast()`, `clearAllToasts()`, `useToast()` hook |
| **Container** | `<LiquidToastContainer position="bottom-right" />` — render once at root      |
| **Animation** | Slide-in from right: `x: 60→0, scale: 0.95→1`                                 |
| **Changes**   | Rename `LGToastContainer` → `LiquidToastContainer`, all type prefixes         |

### 3.11 LiquidUserCard (`liquid-user-card.tsx`)

**Source:** `apps/web/src/components/liquid-glass/lg-user-card.tsx`

| Aspect            | Spec                                                                               |
| ----------------- | ---------------------------------------------------------------------------------- |
| **Sub-component** | `LiquidAvatar` with initials fallback + status dot                                 |
| **CVA variants**  | sizes: `sm`/`md`/`lg` + `interactive` boolean                                      |
| **Props**         | `name`, `subtitle`, `avatarSrc`, `status` (online/offline/away/dnd), `action` slot |
| **Animation**     | Interactive hover with iridescent glow                                             |
| **Changes**       | Rename `LG` → `Liquid` prefixes, `LGAvatar` → `LiquidAvatar`                       |

---

## 4. Barrel Export (`src/index.ts`)

```ts
// Shared
export {
  cn,
  springPreset,
  springSnap,
  springGentle,
  glassSurface,
  glassSurfaceElevated,
  glowColors,
  prefersReducedMotion,
  type GlowColor,
} from './shared';

// Components
export { LiquidButton, buttonVariants, type LiquidButtonProps } from './components/liquid-button';
export { LiquidInput, type LiquidInputProps } from './components/liquid-input';
export { LiquidSearch, type LiquidSearchProps } from './components/liquid-search';
export {
  LiquidSelect,
  type LiquidSelectProps,
  type LiquidSelectOption,
} from './components/liquid-select';
export { LiquidToggle, type LiquidToggleProps } from './components/liquid-toggle';
export { LiquidCheckbox, type LiquidCheckboxProps } from './components/liquid-checkbox';
export { LiquidTabs, type LiquidTabsProps, type LiquidTab } from './components/liquid-tabs';
export { LiquidCard, type LiquidCardProps } from './components/liquid-card';
export { LiquidModal, type LiquidModalProps } from './components/liquid-modal';
export {
  LiquidToastContainer,
  type LiquidToastContainerProps,
  toast,
  dismissToast,
  clearAllToasts,
  useToast,
  type Toast,
  type ToastVariant,
} from './components/liquid-toast';
export {
  LiquidUserCard,
  type LiquidUserCardProps,
  LiquidAvatar,
  type LiquidAvatarProps,
} from './components/liquid-user-card';
```

---

## 5. Consumer Integration

### 5.1 `apps/web/package.json`

Add dependency:

```json
"@cgraph/ui": "workspace:*"
```

Then migrate imports:

```diff
- import { LGButton, LGCard } from '@/components/liquid-glass';
+ import { LiquidButton, LiquidCard } from '@cgraph/ui';
```

Add CSS import in entry point (`main.tsx` or `index.css`):

```diff
+ @import '@cgraph/ui/tokens';
```

### 5.2 `apps/landing/package.json`

Add dependencies:

```json
"@cgraph/ui": "workspace:*",
"class-variance-authority": "^0.7.1",
"clsx": "^2.1.1",
"tailwind-merge": "^3.0.0"
```

Update `tailwind.config` content array to include the package:

```js
content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}',
  '../../packages/ui/src/**/*.{ts,tsx}',  // ← scan @cgraph/ui for Tailwind classes
],
```

### 5.3 `apps/mobile` — NOT a Consumer (Intentional)

Mobile uses React Native + Reanimated. It will **not** depend on `@cgraph/ui`. Future: a
`@cgraph/ui-native` package can reuse shared design tokens from `@cgraph/animation-constants`.

---

## 6. Testing Strategy

### 6.1 Per-Component Test File

Each component gets a `test/liquid-*.test.tsx` with:

| Category          | What to Test                                                                                   |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| **Render**        | Renders without crash, correct element type                                                    |
| **Variants**      | Each CVA variant applies expected classes                                                      |
| **Props**         | Label, error, hint, placeholder render correctly                                               |
| **Interaction**   | Click fires onChange, toggle flips, checkbox toggles                                           |
| **Keyboard**      | Select: ArrowDown/Enter, Tabs: ArrowLeft/Right, Modal: Escape                                  |
| **Accessibility** | Correct ARIA roles (`role="switch"`, `role="checkbox"`, etc.), `aria-checked`, `aria-expanded` |
| **Disabled**      | Disabled state prevents interaction                                                            |
| **Loading**       | Button loading shows spinner, disables                                                         |

### 6.2 Test Setup (`test/setup.ts`)

```ts
import '@testing-library/jest-dom';

// Mock matchMedia for reduced-motion tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

### 6.3 Expected Test Count

| Component      | Estimated Tests                                                 |
| -------------- | --------------------------------------------------------------- |
| LiquidButton   | 8 (variants, sizes, loading, disabled, icon slots)              |
| LiquidInput    | 7 (sizes, states, label/error, icon slots, focus)               |
| LiquidSearch   | 5 (render, value, clear, focus)                                 |
| LiquidSelect   | 8 (open/close, keyboard, selection, disabled options)           |
| LiquidToggle   | 5 (toggle, label, sizes, disabled)                              |
| LiquidCheckbox | 6 (check, uncheck, indeterminate, label, disabled)              |
| LiquidTabs     | 7 (render, switch, keyboard, disabled, indicator)               |
| LiquidCard     | 5 (variants, header/footer, interactive hover)                  |
| LiquidModal    | 7 (open/close, Escape, backdrop click, focus trap, scroll lock) |
| LiquidToast    | 6 (show, dismiss, auto-dismiss, variants, position)             |
| LiquidUserCard | 5 (render, avatar fallback, status, action slot)                |
| **Total**      | **~69 tests**                                                   |

---

## 7. Execution Waves

### Wave 1 — Scaffold (no dependencies between tasks)

| #   | Task                                   | Output                                        |
| --- | -------------------------------------- | --------------------------------------------- |
| 1.1 | Create `packages/ui/package.json`      | Package manifest                              |
| 1.2 | Create `packages/ui/tsconfig.json`     | TypeScript config                             |
| 1.3 | Create `packages/ui/vitest.config.ts`  | Test config                                   |
| 1.4 | Create `packages/ui/src/tokens.css`    | CSS custom properties (copy from prototype)   |
| 1.5 | Create `packages/ui/src/shared.ts`     | Spring presets, cn(), glass classes, glow map |
| 1.6 | Create `packages/ui/src/test/setup.ts` | Test setup with matchMedia mock               |

**Checkpoint:** `pnpm install` succeeds, `turbo run typecheck --filter=@cgraph/ui` passes.

### Wave 2 — Core Components (parallel — no inter-dependencies)

| #   | Task                   | Source → Target                             |
| --- | ---------------------- | ------------------------------------------- |
| 2.1 | Migrate LiquidButton   | `lg-button.tsx` → `liquid-button.tsx`       |
| 2.2 | Migrate LiquidInput    | `lg-text-input.tsx` → `liquid-input.tsx`    |
| 2.3 | Migrate LiquidSearch   | `lg-search-input.tsx` → `liquid-search.tsx` |
| 2.4 | Migrate LiquidSelect   | `lg-select.tsx` → `liquid-select.tsx`       |
| 2.5 | Migrate LiquidToggle   | `lg-toggle.tsx` → `liquid-toggle.tsx`       |
| 2.6 | Migrate LiquidCheckbox | `lg-checkbox.tsx` → `liquid-checkbox.tsx`   |
| 2.7 | Migrate LiquidTabs     | `lg-tabs.tsx` → `liquid-tabs.tsx`           |
| 2.8 | Migrate LiquidCard     | `lg-card.tsx` → `liquid-card.tsx`           |

**Checkpoint:** All 8 components type-check. `turbo run typecheck --filter=@cgraph/ui` passes.

### Wave 3 — Overlay & Composite Components (parallel)

| #   | Task                                  | Source → Target                             |
| --- | ------------------------------------- | ------------------------------------------- |
| 3.1 | Migrate LiquidModal                   | `lg-modal.tsx` → `liquid-modal.tsx`         |
| 3.2 | Migrate LiquidToast                   | `lg-toast.tsx` → `liquid-toast.tsx`         |
| 3.3 | Migrate LiquidUserCard + LiquidAvatar | `lg-user-card.tsx` → `liquid-user-card.tsx` |

**Checkpoint:** All 11 components type-check.

### Wave 4 — Barrel Export + Tests (sequential)

| #   | Task                                                      |
| --- | --------------------------------------------------------- |
| 4.1 | Create `src/index.ts` barrel export                       |
| 4.2 | Write tests for all 11 components                         |
| 4.3 | Run full test suite: `turbo run test --filter=@cgraph/ui` |

**Checkpoint:** All ~69 tests pass. Full typecheck passes. No circular imports.

### Wave 5 — Consumer Integration

| #   | Task                                                                                       |
| --- | ------------------------------------------------------------------------------------------ |
| 5.1 | Add `"@cgraph/ui": "workspace:*"` to `apps/web/package.json`                               |
| 5.2 | Add `"@cgraph/ui": "workspace:*"` + CVA/clsx/tailwind-merge to `apps/landing/package.json` |
| 5.3 | Update `apps/landing/tailwind.config` content array                                        |
| 5.4 | Add `@import '@cgraph/ui/tokens'` to apps/web entry CSS                                    |
| 5.5 | Add `@import '@cgraph/ui/tokens'` to apps/landing entry CSS                                |
| 5.6 | `pnpm install` from root                                                                   |

**Checkpoint:** Both apps/web and apps/landing can `import { LiquidButton } from '@cgraph/ui'` and
type-check.

### Wave 6 — Deprecation of Prototype (optional, separate PR)

| #   | Task                                                                              |
| --- | --------------------------------------------------------------------------------- |
| 6.1 | Add deprecation notice to `apps/web/src/components/liquid-glass/index.ts`         |
| 6.2 | Grep for `@/components/liquid-glass` imports in apps/web, migrate to `@cgraph/ui` |
| 6.3 | Remove `apps/web/src/components/liquid-glass/` once all imports migrated          |

---

## 8. Risk Mitigation

| Risk                                                         | Likelihood | Mitigation                                                                                            |
| ------------------------------------------------------------ | ---------- | ----------------------------------------------------------------------------------------------------- |
| Tailwind class scanning misses `@cgraph/ui`                  | Medium     | Explicitly add `../../packages/ui/src/**/*.{ts,tsx}` to each app's `tailwind.config.js` content array |
| Path alias `@/*` conflicts between package and consuming app | Low        | Package uses relative imports internally — `@/*` alias only in tsconfig for tests                     |
| framer-motion version mismatch between web and landing       | Low        | Both already pin `^12.0.0`. peerDependency spec `^12.0.0` ensures compatibility                       |
| `useSyncExternalStore` (toast store) not available           | None       | React 19 ships it natively                                                                            |
| Modal focus trap incomplete                                  | Medium     | Test with Tab key cycling in test suite. Consider adding `focus-trap-react` as optional peer in v1.1  |

---

## 9. Success Criteria

| Criteria                                   | Measurement                                                                                     |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| All 11 components export from `@cgraph/ui` | `import { LiquidButton, ..., LiquidUserCard } from '@cgraph/ui'` compiles                       |
| TypeScript strict passes                   | `turbo run typecheck --filter=@cgraph/ui` — 0 errors                                            |
| Test suite passes                          | `turbo run test --filter=@cgraph/ui` — all ~69 tests green                                      |
| apps/web can consume                       | `import { LiquidButton } from '@cgraph/ui'` in apps/web type-checks                             |
| apps/landing can consume                   | Same import in apps/landing type-checks                                                         |
| No runtime dependencies                    | `package.json` has zero `dependencies` — only `peerDependencies` and `devDependencies`          |
| Design system compliance                   | All components match `design-system/cgraph-liquid-glass/MASTER.md` tokens, springs, and recipes |
