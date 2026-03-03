# Summary 04-02: Web Light Mode

**Phase:** 04-design-mobile **Status:** Complete **Duration:** ~45 minutes

## What was done

### Task 1: Make base styles theme-aware

- Updated `apps/web/src/index.css` body styles — already used CSS variables, verified correct
- Replaced hardcoded `@apply border-dark-700` default with
  `border-color: var(--token-border-default)`
- Updated scrollbar styling to use CSS variables (`--token-bg-secondary`, `--token-bg-tertiary`,
  `--token-border-default`)

### Task 2: Update component utility classes

- Added token-driven `foreground` and `token-border` color utilities to `tailwind.config.js` —
  enables `text-foreground`, `text-foreground-secondary`, `text-foreground-muted` classes that swap
  with theme
- Updated `.btn-secondary`, `.btn-ghost` — `text-gray-100` → `text-foreground`
- Updated `.input` — `placeholder:text-dark-400` → `placeholder:text-foreground-muted`, added
  `text-foreground`
- Updated `.message-bubble-received` — `text-gray-100` → `text-foreground`
- Updated `.sidebar-item`, `.sidebar-item-active` — `text-gray-300`/`text-white` →
  `text-foreground-secondary`/`text-foreground`
- Updated `.channel-item`, `.channel-item-active` — `text-gray-400`/`text-white` →
  `text-foreground-muted`/`text-foreground`
- Updated `.typing-dot` — `bg-gray-400` → `bg-foreground-muted`
- Updated all `.markdown-content` styles — `text-white`/`text-gray-300`/`text-gray-400` →
  `text-foreground`/`text-foreground-secondary`/`text-foreground-muted`

### Task 3: Verify theme-globals.css integration

- Verified `theme-globals.css` correctly maps legacy `--theme-*` vars to `--token-*` vars with
  fallbacks
- Verified `.theme-transitioning` class applies smooth color transitions
- Verified `ThemeRegistry.switchTheme()` calls `injectCSSVariables()` which sets all `--token-*`
  variables
- No changes needed — integration is correct

### Task 4: Fix ThemeSwitcher UX

- Removed `window.location.reload()` from `app-theme-settings.tsx` `handleThemeChange`
- `ThemeSwitcher` already calls `ThemeRegistry.switchTheme()` which does CSS variable injection —
  reload was redundant
- Updated hardcoded `text-gray-*`/`text-white`/`bg-gray-*` in settings page and theme switcher to
  token-driven classes
- Fixed pre-existing ESLint type assertion error in `theme-switcher.tsx`

### Task 5: Visual QA — light mode render check

- **Auth pages**: Fixed login form fields (labels, inputs, placeholders, remember-me), register page
  (subtitle, divider, sign-in link), social login divider, auth form input (all 3 variants),
  onboarding features step, step header
- **Layout**: Fixed sidebar (borders, toggle button, group names, user section), top-nav (borders,
  hamburger menu, breadcrumbs, search, dark mode toggle), floating sidebar (toggle button, tooltip),
  mobile nav (all 3 variants — borders)
- **Key insight**: `bg-dark-600` through `bg-dark-900` classes in Tailwind are already token-driven
  (04-01 mapped them to CSS variables), so they swap correctly with theme. The main issue was
  `text-white`, `text-gray-*`, and `border-white/*` which are hardcoded Tailwind colors not
  connected to the token system.

## Commits

- `8429a6d8` — style(web): make base styles and component classes theme-aware for light mode
- `ccb17cc3` — fix(web): remove window.location.reload() from theme switching
- `9ec0f270` — style(web): fix hardcoded dark colors in auth and layout components

## Verification

- TypeScript compilation: `npx tsc --noEmit` — no new errors introduced (all errors are pre-existing
  in test files)
- CSS variable system: body, scrollbar, buttons, inputs, cards, sidebar, channels, markdown all
  reference token CSS variables
- Theme switching: no page reload, instant CSS variable swap via ThemeRegistry

## Requirements addressed

- **DESIGN-05**: Dark/light mode — light mode now renders correctly across base styles, component
  utilities, auth pages, and layout components

## Notes

- The Tailwind config (from 04-01) already mapped `dark-600` through `dark-900` to token CSS
  variables, so `bg-dark-*` classes automatically adapt to any theme. The missing piece was
  text/foreground colors and borders.
- Added `foreground` color utility to Tailwind config: `text-foreground`,
  `text-foreground-secondary`, `text-foreground-muted`, `text-foreground-inverse` — all token-driven
  with RGB alpha support.
- Added `token-border` color utility for explicit border token usage.
- There are still many components throughout the app with `text-gray-*` and `text-white` classes
  (gamification pages, notification pages, etc.). These are lower-priority pages and can be
  addressed incrementally. The critical user-facing surfaces (auth, layout, settings, markdown) are
  now theme-aware.
- The `matrix-input` and `matrix-card` CSS classes in index.css use hardcoded rgba values for the
  Matrix theme effect. These are intentionally Matrix-specific and don't need token conversion.
