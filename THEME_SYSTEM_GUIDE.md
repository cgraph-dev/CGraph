# CGraph Theme System Guide

**Version**: 2.0.0 **Last Updated**: January 2026 **Status**: Production Ready

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Quick Start](#quick-start)
4. [Creating New Themes](#creating-new-themes)
5. [Theme Structure](#theme-structure)
6. [API Reference](#api-reference)
7. [Integration Guide](#integration-guide)
8. [Best Practices](#best-practices)
9. [Accessibility](#accessibility)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The CGraph Theme System is a modular, scalable theming architecture that enables complete UI
transformation. It consists of two independent layers:

### Layer 1: App-Wide Themes

Complete UI transformations that change:

- Colors, typography, and layout
- Backgrounds and effects (Matrix rain, particles, etc.)
- Component styling across the entire application
- **Local to each user** - only affects how YOU see the app

### Layer 2: User Customizations

Personal identity elements that include:

- Avatar borders (10 types: static → mythic)
- Chat bubble styles and colors
- Profile badges and titles
- **Visible to all users** - your digital identity

---

## Architecture

### File Structure

```
apps/web/src/themes/
├── theme-types.ts              # TypeScript type definitions
├── ThemeRegistry.ts            # Theme management and API
├── useTheme.ts                 # React hook for theme operations
├── theme-globals.css           # Global CSS variables and effects
├── index.ts                    # Public API exports
└── presets/
    ├── default-theme.ts        # Default CGraph theme
    ├── matrix-theme.ts         # Matrix digital rain theme
    └── theme-template.ts       # Template for creating new themes
```

### Key Components

| Component          | Purpose                            | Location            |
| ------------------ | ---------------------------------- | ------------------- |
| `ThemeRegistry`    | Central theme store and management | `ThemeRegistry.ts`  |
| `useTheme()`       | React hook for theme operations    | `useTheme.ts`       |
| `ThemeSwitcher`    | UI for selecting themes            | `components/theme/` |
| `AppThemeSettings` | Settings page for app themes       | `pages/settings/`   |

---

## Quick Start

### For Users

1. Navigate to **Settings → App Theme**
2. Browse available themes (Default, Matrix, etc.)
3. Click a theme card to preview and apply
4. Premium themes require subscription

### For Developers

#### Using Themes in Your Code

```typescript
import { useTheme } from '@/themes';

function MyComponent() {
  const { currentTheme, setTheme } = useTheme();

  return (
    <div style={{ background: currentTheme.colors.background }}>
      <button onClick={() => setTheme('matrix')}>
        Switch to Matrix
      </button>
    </div>
  );
}
```

#### Applying CSS Variables

```css
.my-button {
  background: var(--theme-color-primary);
  color: var(--theme-color-text-primary);
  border-radius: var(--theme-radius-md);
  transition: var(--theme-transition-base);
}

.my-button:hover {
  background: var(--theme-color-primary-light);
  box-shadow: var(--theme-shadow-glow);
}
```

---

## Creating New Themes

### Step 1: Copy the Template

```bash
cp apps/web/src/themes/presets/theme-template.ts \
   apps/web/src/themes/presets/my-theme.ts
```

### Step 2: Configure Your Theme

```typescript
import type { AppTheme } from '../theme-types';

export const myTheme: AppTheme = {
  id: 'my-theme',
  name: 'My Custom Theme',
  description: 'A vibrant custom theme',
  category: 'custom',
  version: '1.0.0',
  isPremium: false,

  colors: {
    primary: '#ff6b6b',
    primaryDark: '#ee5a52',
    primaryLight: '#ff8787',
    // ... (30+ color properties)
  },

  typography: {
    fontFamily: {
      primary: '"Comic Sans MS", cursive', // Don't actually do this
      // ...
    },
    // ...
  },

  // ... (layout, components, effects, accessibility)
};
```

### Step 3: Register in ThemeRegistry

```typescript
// apps/web/src/themes/ThemeRegistry.ts
import { myTheme } from './presets/my-theme';

constructor() {
  this.registerTheme(defaultTheme);
  this.registerTheme(matrixTheme);
  this.registerTheme(myTheme); // Add your theme
}
```

### Step 4: Export (Optional)

```typescript
// apps/web/src/themes/index.ts
export { myTheme } from './presets/my-theme';
```

---

## Theme Structure

### Complete Theme Interface

```typescript
interface AppTheme {
  // Metadata
  id: string;
  name: string;
  description: string;
  category: ThemeCategory;
  version: string;
  isPremium: boolean;

  // Design tokens
  colors: ThemeColors; // 30+ color properties
  typography: ThemeTypography; // Font families, sizes, weights
  layout: ThemeLayout; // Spacing, borders, shadows
  components: ThemeComponents; // Per-component styling
  effects: ThemeEffects; // Visual effects config

  // Special features
  matrix?: MatrixThemeConfig; // Optional Matrix integration

  // Compliance
  accessibility: {
    highContrast: boolean;
    colorBlindMode?: string;
    focusIndicators: boolean;
  };
}
```

### Colors (30+ properties)

```typescript
interface ThemeColors {
  // Primary
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primaryGlow: string;

  // Secondary
  secondary: string;
  secondaryDark: string;
  secondaryLight: string;

  // Accent
  accent: string;
  accentDark: string;
  accentLight: string;

  // Backgrounds
  background: string;
  backgroundLight: string;
  backgroundDark: string;
  surface: string;
  surfaceLight: string;
  surfaceDark: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textDisabled: string;
  textInverse: string;

  // Borders
  border: string;
  borderLight: string;
  borderDark: string;
  borderFocus: string;

  // States
  success: string;
  warning: string;
  error: string;
  info: string;

  // Interactive
  hover: string;
  active: string;
  disabled: string;

  // Overlays
  overlay: string;
  backdrop: string;

  // Gradients
  gradientStart: string;
  gradientEnd: string;
}
```

### Matrix Integration

```typescript
interface MatrixThemeConfig {
  enabled: boolean;
  matrixTheme: MatrixTheme; // From @/lib/animations/matrix/themes
  layer: 'background' | 'foreground' | 'overlay';
  opacity: number;
  speed: number;
  density: number;
  fontSize: number;
  columns: number | 'auto';
  characters: 'katakana' | 'latin' | 'binary' | 'custom';
  glowEffect: boolean;
  trailLength: number;
  fadeSpeed: number;
}
```

---

## API Reference

### ThemeRegistry

Central theme management singleton.

#### Methods

**`registerTheme(theme: AppTheme): void`**

```typescript
ThemeRegistry.registerTheme(myCustomTheme);
```

**`getTheme(id: string): AppTheme | undefined`**

```typescript
const theme = ThemeRegistry.getTheme('matrix');
```

**`getAllThemes(): AppTheme[]`**

```typescript
const allThemes = ThemeRegistry.getAllThemes();
```

**`applyTheme(themeId: string): boolean`**

```typescript
ThemeRegistry.applyTheme('matrix'); // Returns true if successful
```

**`switchTheme(fromId: string, toId: string, duration?: number): Promise<void>`**

```typescript
await ThemeRegistry.switchTheme('default', 'matrix', 400);
```

**`createCustomTheme(baseId: string, overrides: Partial<AppTheme>): AppTheme`**

```typescript
const customTheme = ThemeRegistry.createCustomTheme('default', {
  colors: { primary: '#ff0000' },
});
```

**`exportTheme(themeId: string): string`**

```typescript
const json = ThemeRegistry.exportTheme('my-theme');
```

**`importTheme(json: string): AppTheme`**

```typescript
const theme = ThemeRegistry.importTheme(jsonString);
```

**`getCSSVariables(theme: AppTheme): Record<string, string>`**

```typescript
const vars = ThemeRegistry.getCSSVariables(theme);
// { '--theme-color-primary': '#10b981', ... }
```

### useTheme Hook

React hook for theme management.

```typescript
function MyComponent() {
  const {
    currentTheme,          // Current AppTheme
    allThemes,             // Array of all themes
    setTheme,              // (id: string) => void
    switchTheme,           // (toId: string, duration?: number) => Promise<void>
    createCustomTheme,     // (baseId: string, overrides: Partial<AppTheme>) => AppTheme
    exportTheme,           // () => string
    importTheme,           // (json: string) => void
    isThemeApplied,        // (id: string) => boolean
  } = useTheme();

  return <div>...</div>;
}
```

---

## Integration Guide

### App-Level Integration

#### 1. Import and Initialize

```typescript
// App.tsx
import { ThemeRegistry } from '@/themes/ThemeRegistry';
import '@/themes/theme-globals.css';

useEffect(() => {
  const themeId = localStorage.getItem('cgraph-app-theme') || 'default';
  ThemeRegistry.applyTheme(themeId);
}, []);
```

#### 2. Listen for Theme Changes

```typescript
useEffect(() => {
  const handleThemeChange = (event: Event) => {
    const { theme } = (event as CustomEvent).detail;
    console.log('Theme changed to:', theme.name);
  };

  window.addEventListener('themechange', handleThemeChange);
  return () => window.removeEventListener('themechange', handleThemeChange);
}, []);
```

### Component-Level Integration

#### Using CSS Variables

```tsx
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="theme-card">
      {children}
    </div>
  );
}

// CSS
.theme-card {
  background: var(--theme-card-background);
  border: 1px solid var(--theme-card-border);
  border-radius: var(--theme-radius-lg);
  box-shadow: var(--theme-card-shadow);
}
```

#### Using Theme Object

```tsx
function Banner() {
  const { currentTheme } = useTheme();

  return (
    <div
      style={{
        background: currentTheme.components.navbar.background,
        color: currentTheme.components.navbar.text,
      }}
    >
      Welcome to {currentTheme.name}
    </div>
  );
}
```

#### Conditional Rendering

```tsx
function MatrixRain() {
  const { currentTheme } = useTheme();

  if (!currentTheme.matrix?.enabled) {
    return null;
  }

  return <MatrixBackground config={currentTheme.matrix} />;
}
```

---

## Best Practices

### 1. Always Use CSS Variables

✅ **Good:**

```css
.button {
  background: var(--theme-button-primary);
  color: white;
}
```

❌ **Bad:**

```css
.button {
  background: #10b981; /* Hard-coded color won't change with theme */
}
```

### 2. Respect User Preferences

```typescript
const { currentTheme } = useTheme();

const shouldReduceMotion =
  currentTheme.effects.reduceMotion ||
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!shouldReduceMotion) {
  // Apply animations
}
```

### 3. Theme Transitions

```typescript
// Smooth transition
await ThemeRegistry.switchTheme('default', 'matrix', 400);

// Instant change
ThemeRegistry.applyTheme('matrix');
```

### 4. Test All Themes

Before releasing a component, test it with:

- Default theme
- Matrix theme
- High contrast mode
- Color blind modes

### 5. Performance

```typescript
// Memoize theme-dependent calculations
const buttonStyle = useMemo(
  () => ({
    background: currentTheme.components.button.primary,
    borderRadius: currentTheme.layout.borderRadius.md,
  }),
  [currentTheme]
);
```

---

## Accessibility

### WCAG 2.1 AA Compliance

All themes must meet:

- **Text contrast**: 4.5:1 minimum (normal text)
- **Large text**: 3:1 minimum (18px+ or 14px+ bold)
- **UI components**: 3:1 minimum

### Validation

```typescript
const validation = ThemeRegistry.validateAccessibility(myTheme);

if (!validation.valid) {
  console.error('Accessibility errors:', validation.errors);
}
if (validation.warnings.length > 0) {
  console.warn('Accessibility warnings:', validation.warnings);
}
```

### Color Blind Support

```typescript
const theme: AppTheme = {
  // ...
  accessibility: {
    highContrast: false,
    colorBlindMode: 'protanopia', // or 'deuteranopia', 'tritanopia'
    focusIndicators: true,
  },
};
```

### Focus Indicators

Always visible, high contrast:

```css
.theme-focus-visible:focus-visible {
  outline: 3px solid var(--theme-color-primary);
  outline-offset: 2px;
}
```

### Reduce Motion

```css
@media (prefers-reduced-motion: reduce) {
  .theme-transitioning * {
    transition: none !important;
    animation: none !important;
  }
}
```

---

## Troubleshooting

### Theme Not Applying

**Problem**: Theme changes don't take effect

**Solution**:

1. Check console for errors
2. Verify theme is registered:
   ```typescript
   console.log(ThemeRegistry.getAllThemes());
   ```
3. Clear localStorage and refresh:
   ```typescript
   localStorage.removeItem('cgraph-app-theme');
   ```

### CSS Variables Not Working

**Problem**: Components not using theme colors

**Solution**:

1. Ensure `theme-globals.css` is imported in App.tsx
2. Verify CSS variable names match theme structure
3. Check browser DevTools → Elements → Computed styles

### Premium Theme Locked

**Problem**: Can't access premium themes

**Solution**:

```typescript
const user = useAuthStore((state) => state.user);
const isPremium = user?.subscription?.tier === 'pro' || user?.subscription?.tier === 'business';
```

### Matrix Effect Not Showing

**Problem**: Matrix rain not visible

**Solution**:

1. Check theme has matrix config:
   ```typescript
   console.log(currentTheme.matrix);
   ```
2. Verify Matrix component is rendered
3. Check z-index and opacity settings

### Performance Issues

**Problem**: Theme switching is laggy

**Solution**:

1. Reduce transition duration:
   ```typescript
   await switchTheme('default', 'matrix', 150); // Shorter duration
   ```
2. Disable effects temporarily:
   ```typescript
   theme.effects.particlesEnabled = false;
   ```
3. Use Chrome DevTools Performance tab to profile

---

## Examples

### Create a Gaming Theme

```typescript
export const gamingTheme: AppTheme = {
  id: 'gaming',
  name: 'Gaming',
  description: 'High-energy gaming aesthetic',
  category: 'gaming',
  isPremium: true,

  colors: {
    primary: '#ff0080',
    background: '#0a0a0f',
    accent: '#00ffff',
    // ...
  },

  effects: {
    backgroundEffect: 'particles',
    glowEnabled: true,
    glowIntensity: 1.0,
    particlesEnabled: true,
    scanlines: true,
    chromatic: true,
    // ...
  },

  // ...
};
```

### Create a Professional Theme

```typescript
export const professionalTheme: AppTheme = {
  id: 'professional',
  name: 'Professional',
  description: 'Clean, business-appropriate design',
  category: 'professional',
  isPremium: false,

  colors: {
    primary: '#2563eb',
    background: '#ffffff',
    textPrimary: '#1f2937',
    // ...
  },

  effects: {
    backgroundEffect: 'none',
    glowEnabled: false,
    particlesEnabled: false,
    scanlines: false,
    // ...
  },

  accessibility: {
    highContrast: true,
    focusIndicators: true,
  },

  // ...
};
```

---

## Changelog

### Version 2.0.0 (January 2026)

- ✨ Modular theme architecture
- ✨ Matrix theme with digital rain
- ✨ CSS variables system
- ✨ Theme switcher UI
- ✨ Accessibility validation
- ✨ useTheme() React hook
- 📝 Comprehensive documentation

### Version 1.0.0

- Initial user customization system (avatar borders, chat bubbles)

---

## Support

For questions or issues:

- GitHub Issues: https://github.com/your-org/cgraph/issues
- Documentation: `/CGraph/THEME_SYSTEM_GUIDE.md`
- Examples: `/CGraph/apps/web/src/themes/presets/`

---

**License**: MIT **Maintainer**: CGraph Development Team
