# CGraph Circuit Board Logo

## Overview

The CGraph logo is a PCB (Printed Circuit Board) styled "CG" monogram featuring:

- **Double-outline strokes** mimicking PCB trace edges
- **Angular/octagonal letter shapes** with cut corners
- **Small circular connection nodes** along the traces
- **Cyan glowing highlights** at key circuit junctions
- **Overlapping C and G** that share visual space

## Design Elements

### Visual Style

The logo draws inspiration from circuit board aesthetics:

- Letters are formed with rectangular shapes featuring 45° chamfered corners
- Each letter has an outer stroke and inner cutout creating a double-line effect
- Small circles represent solder pads and via connections
- Cyan glow effects indicate active/powered connection points

### Color Palette

| Element          | Color           | Hex       |
| ---------------- | --------------- | --------- |
| Main Strokes     | Dark Gray/Black | `#1a1a1a` |
| Inner Fill       | White           | `#ffffff` |
| Glow Highlights  | Cyan            | `#00d4ff` |
| Connection Nodes | Dark Gray       | `#1a1a1a` |

### Color Variants

| Variant   | Description                        |
| --------- | ---------------------------------- |
| `default` | Black strokes on white, cyan glow  |
| `white`   | White strokes for dark backgrounds |
| `cyan`    | Cyan-tinted version                |
| `emerald` | Green-tinted version               |
| `purple`  | Purple-tinted version              |
| `dark`    | Dark strokes for light backgrounds |

## Components

### LogoIcon

Main logo component for navigation, headers, and general use.

```tsx
import { LogoIcon } from '@/components/Logo';

// Basic usage
<LogoIcon size={40} />

// With animation (trace drawing effect)
<LogoIcon size={40} animated />

// With glow effects
<LogoIcon size={40} showGlow />

// Color variants
<LogoIcon size={40} color="white" />   // For dark backgrounds
<LogoIcon size={40} color="cyan" />    // Cyan tinted
```

**Props:**

- `size`: number (default: 40) - Logo width in pixels
- `animated`: boolean - Enable trace drawing animation
- `showGlow`: boolean - Show cyan glow effects
- `color`: Color variant selection
- `className`: Additional CSS classes

### LogoWithText

Logo paired with "CGraph" text.

```tsx
import { LogoWithText } from '@/components/Logo';

<LogoWithText size={40} animated />;
```

### LogoSimple

Simplified version for small sizes (favicons, etc).

```tsx
import { LogoSimple } from '@/components/Logo';

<LogoSimple size={24} />;
```

### LogoSquare

Square format with background for app icons.

```tsx
import { LogoSquare } from '@/components/Logo';

<LogoSquare size={64} />;
```

### LogoLoader

Animated loading spinner with logo.

```tsx
import { LogoLoader } from '@/components/Logo';

<LogoLoader size={48} />;
```

## File Locations

### React Components

- `apps/web/src/components/Logo.tsx` - Main logo component
- `apps/web/src/components/AnimatedLogo.tsx` - Elaborate animated version

### Static Assets

- `apps/web/public/favicon.svg` - Browser favicon
- `apps/web/public/apple-touch-icon.svg` - iOS app icon
- `apps/web/public/og-image.svg` - Social sharing image
- `docs-website/static/img/logo.svg` - Documentation site logo
- `docs-website/static/img/logo-dark.svg` - Dark mode variant
- `docs/assets/cgraph-logo.svg` - Primary brand asset

## Usage Guidelines

### Navigation

```tsx
<Link to="/" className="nav-logo">
  <LogoIcon size={32} showGlow animated color="gradient" />
  <span>CGraph</span>
</Link>
```

### Footer

```tsx
<LogoIcon size={24} color="white" />
```

### Loading States

```tsx
<LogoLoader size={48} />
```

### Hero Sections

```tsx
import AnimatedLogo from '@/components/AnimatedLogo';

<AnimatedLogo variant="hero" size="xl" />;
```

## Animation Details

When `animated={true}`, the logo plays a trace-drawing sequence:

1. Paths draw with `pathLength` animation (0.8s each)
2. Connection nodes scale in with spring physics
3. Glow effects fade in at the end

## Accessibility

- All logo SVGs include appropriate `aria-label` when used as links
- Color contrast meets WCAG AA standards
- Animations respect `prefers-reduced-motion` preference
