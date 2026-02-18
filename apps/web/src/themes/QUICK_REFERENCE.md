# Theme System Quick Reference

## Import

```typescript
import { useTheme, ThemeRegistry } from '@/themes';
```

## Using Themes

### React Hook

```typescript
const { currentTheme, setTheme, switchTheme } = useTheme();

// Apply theme
setTheme('matrix');

// Smooth transition (400ms)
await switchTheme('matrix', 400);

// Get all themes
const allThemes = useTheme().allThemes;
```

### CSS Variables (Recommended)

```css
.my-component {
  /* Colors */
  background: var(--theme-color-background);
  color: var(--theme-color-text-primary);
  border-color: var(--theme-color-border);

  /* Typography */
  font-family: var(--theme-font-primary);
  font-size: var(--theme-font-size-base);

  /* Layout */
  border-radius: var(--theme-radius-md);
  padding: var(--theme-spacing-md);
  box-shadow: var(--theme-shadow-md);
  transition: var(--theme-transition-base);

  /* Component Specific */
  background: var(--theme-button-primary);
  border: 1px solid var(--theme-card-border);
}
```

### Theme Object

```typescript
function MyComponent() {
  const { currentTheme } = useTheme();

  return (
    <div
      style={{
        background: currentTheme.colors.background,
        color: currentTheme.colors.textPrimary,
        borderRadius: currentTheme.layout.borderRadius.lg,
      }}
    >
      Content
    </div>
  );
}
```

## Creating Themes

### 1. Copy Template

```bash
cp src/themes/presets/theme-template.ts src/themes/presets/my-theme.ts
```

### 2. Configure

```typescript
export const myTheme: AppTheme = {
  id: 'my-theme',
  name: 'My Theme',
  description: 'Custom theme',
  category: 'custom',
  isPremium: false,

  colors: {
    primary: '#ff0000',
    background: '#000000',
    // ... 28+ more
  },

  typography: {
    /* fonts, sizes, weights */
  },
  layout: {
    /* spacing, borders, shadows */
  },
  components: {
    /* per-component styles */
  },
  effects: {
    /* visual effects */
  },
  accessibility: {
    /* compliance */
  },
};
```

### 3. Register

```typescript
// ThemeRegistry.ts
import { myTheme } from './presets/my-theme';

constructor() {
  this.registerTheme(myTheme);
}
```

## Available Themes

- **default** - Clean, modern CGraph design
- **matrix** - Digital rain with terminal aesthetics

## CSS Variable List

### Colors

```
--theme-color-primary
--theme-color-primary-dark
--theme-color-primary-light
--theme-color-primary-glow
--theme-color-secondary
--theme-color-background
--theme-color-surface
--theme-color-text-primary
--theme-color-text-secondary
--theme-color-border
--theme-color-success
--theme-color-warning
--theme-color-error
--theme-color-info
--theme-color-hover
```

### Typography

```
--theme-font-primary
--theme-font-secondary
--theme-font-monospace
--theme-font-size-xs
--theme-font-size-sm
--theme-font-size-base
--theme-font-size-lg
--theme-font-weight-normal
--theme-font-weight-bold
```

### Layout

```
--theme-radius-sm
--theme-radius-md
--theme-radius-lg
--theme-spacing-xs
--theme-spacing-sm
--theme-spacing-md
--theme-spacing-lg
--theme-shadow-sm
--theme-shadow-md
--theme-shadow-glow
--theme-transition-base
```

### Components

```
--theme-navbar-background
--theme-navbar-text
--theme-button-primary
--theme-card-background
--theme-card-border
--theme-input-background
--theme-modal-background
```

## Common Patterns

### Themed Button

```tsx
<button className="theme-button-primary">
  Click Me
</button>

// CSS
.theme-button-primary {
  background: var(--theme-button-primary);
  color: white;
  border-radius: var(--theme-radius-md);
  padding: var(--theme-spacing-sm) var(--theme-spacing-md);
  transition: var(--theme-transition-base);
}

.theme-button-primary:hover {
  background: var(--theme-button-primary-hover);
  box-shadow: var(--theme-shadow-glow);
}
```

### Themed Card

```tsx
<div className="theme-card">
  Content
</div>

// CSS
.theme-card {
  background: var(--theme-card-background);
  border: 1px solid var(--theme-card-border);
  border-radius: var(--theme-radius-lg);
  padding: var(--theme-spacing-lg);
  box-shadow: var(--theme-shadow-md);
}
```

### Conditional Rendering

```tsx
const { currentTheme } = useTheme();

if (currentTheme.matrix?.enabled) {
  return <MatrixBackground />;
}
```

### Custom Theme Creation

```typescript
const custom = ThemeRegistry.createCustomTheme('default', {
  colors: {
    primary: '#ff00ff',
    background: '#000',
  },
});

ThemeRegistry.registerTheme(custom);
ThemeRegistry.applyTheme(custom.id);
```

## Theme Effects

```typescript
// Matrix rain
matrix: {
  enabled: true,
  matrixTheme: MATRIX_GREEN,
  layer: 'background',
  opacity: 0.3,
}

// Visual effects
effects: {
  scanlines: true,      // CRT scanlines
  vignette: true,       // Dark edges
  chromatic: false,     // Color shift
  glowEnabled: true,    // Glow effects
  particlesEnabled: false,
}
```

## Testing Themes

```typescript
// Get current theme
const current = ThemeRegistry.getCurrentTheme();

// Validate accessibility
const validation = ThemeRegistry.validateAccessibility(myTheme);
console.log(validation); // { valid: true, errors: [], warnings: [] }

// Export theme
const json = ThemeRegistry.exportTheme('my-theme');

// Import theme
const imported = ThemeRegistry.importTheme(jsonString);
```

## Accessibility

```css
/* Focus indicators */
.theme-focus-visible:focus-visible {
  outline: 3px solid var(--theme-color-primary);
  outline-offset: 2px;
}

/* Reduce motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
```

## Premium Themes

```typescript
const userIsPremium = user?.subscription?.tier === 'premium' || user?.subscription?.tier === 'enterprise';

if (theme.isPremium && !userIsPremium) {
  // Show upgrade prompt
}
```

## Links

- **Developer Guide**: `/CGraph/THEME_SYSTEM_GUIDE.md`
- **Implementation**: `/CGraph/THEME_SYSTEM_IMPLEMENTATION_COMPLETE.md`
- **Template**: `/apps/web/src/themes/presets/theme-template.ts`
