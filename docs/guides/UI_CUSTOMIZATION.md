# CGraph UI Customization Guide

> How to modify, theme, and extend the CGraph user interface

---

## Table of Contents

1. [Design System Overview](#design-system-overview)
2. [Theming with TailwindCSS](#theming-with-tailwindcss)
3. [Matrix Theme System](#matrix-theme-system)
4. [Advanced Theme Engine (v0.7.36+)](#advanced-theme-engine-v0736)
5. [Component Architecture](#component-architecture)
6. [Modifying Existing Components](#modifying-existing-components)
7. [Creating New Components](#creating-new-components)
8. [Mobile UI (React Native)](#mobile-ui-react-native)
9. [Dark Mode & Themes](#dark-mode--themes)
10. [Responsive Design](#responsive-design)
11. [Animations & Transitions](#animations--transitions)
12. [Accessibility (a11y)](#accessibility-a11y)

---

## Design System Overview

CGraph follows a consistent design language across web and mobile:

### Design Tokens

| Token              | Web (TailwindCSS) | Mobile (React Native)    |
| ------------------ | ----------------- | ------------------------ |
| Primary Color      | `bg-primary-600`  | `#059669` (Matrix Green) |
| Secondary          | `bg-gray-600`     | `#4B5563`                |
| Success            | `bg-green-600`    | `#059669`                |
| Warning            | `bg-yellow-500`   | `#EAB308`                |
| Error              | `bg-red-600`      | `#DC2626`                |
| Background (Light) | `bg-white`        | `#FFFFFF`                |
| Background (Dark)  | `bg-gray-900`     | `#111827`                |
| Text (Light mode)  | `text-gray-900`   | `#111827`                |
| Text (Dark mode)   | `text-gray-100`   | `#F3F4F6`                |
| Matrix Glow        | `shadow-glow-md`  | `#00ff41`                |

### Typography Scale

```css
/* Heading sizes */
.text-xs {
  font-size: 0.75rem;
} /* 12px */
.text-sm {
  font-size: 0.875rem;
} /* 14px */
.text-base {
  font-size: 1rem;
} /* 16px */
.text-lg {
  font-size: 1.125rem;
} /* 18px */
.text-xl {
  font-size: 1.25rem;
} /* 20px */
.text-2xl {
  font-size: 1.5rem;
} /* 24px */
.text-3xl {
  font-size: 1.875rem;
} /* 30px */
```

### Spacing System

We use a 4px base unit:

```css
.p-1 {
  padding: 0.25rem;
} /* 4px */
.p-2 {
  padding: 0.5rem;
} /* 8px */
.p-3 {
  padding: 0.75rem;
} /* 12px */
.p-4 {
  padding: 1rem;
} /* 16px */
.p-6 {
  padding: 1.5rem;
} /* 24px */
.p-8 {
  padding: 2rem;
} /* 32px */
```

---

## Theming with TailwindCSS

### Configuration File

The main theme configuration is in `apps/web/tailwind.config.js`:

```javascript
// apps/web/tailwind.config.js
const colors = require('tailwindcss/colors');

module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // Enable dark mode via class
  theme: {
    extend: {
      colors: {
        // Custom brand colors
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5', // Primary
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
          950: '#1E1B4B',
        },
        // Semantic colors
        surface: {
          light: '#FFFFFF',
          dark: '#1F2937',
        },
        elevated: {
          light: '#F9FAFB',
          dark: '#374151',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        soft: '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        glow: '0 0 20px rgba(99, 102, 241, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};
```

### Changing the Primary Color

To change the entire app's primary color, update the `brand` colors:

```javascript
// Before: Indigo theme
brand: {
  600: '#4F46E5',  // Indigo
}

// After: Emerald theme
brand: {
  50: '#ECFDF5',
  100: '#D1FAE5',
  200: '#A7F3D0',
  300: '#6EE7B7',
  400: '#34D399',
  500: '#10B981',
  600: '#059669',  // Now green!
  700: '#047857',
  800: '#065F46',
  900: '#064E3B',
  950: '#022C22',
}
```

Then update component usage from `indigo-*` to `brand-*`:

```jsx
// Before
<button className="bg-indigo-600 hover:bg-indigo-700">

// After (theme-aware)
<button className="bg-brand-600 hover:bg-brand-700">
```

---

## Matrix Theme System

CGraph uses a Matrix-inspired green theme for authentication pages that integrates with the cipher
rain background effect.

### Color Palette

```javascript
// apps/web/tailwind.config.js
colors: {
  primary: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',  // Main matrix green
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },
  matrix: {
    glow: '#00ff41',      // Phosphor screen glow
    dim: '#003b00',       // Dark terminal green
    bright: '#39ff14',    // Neon highlight
  },
}
```

### Matrix CSS Classes

| Class                  | Purpose                                             | Usage                        |
| ---------------------- | --------------------------------------------------- | ---------------------------- |
| `.matrix-input`        | Form inputs with gradient background and glow focus | Text inputs, password fields |
| `.matrix-button`       | Primary CTA with shine animation                    | Submit buttons               |
| `.matrix-card`         | Card with green-tinted border and inner glow        | Auth containers              |
| `.matrix-glow`         | Text shadow for headings                            | Titles, branding             |
| `.matrix-link`         | Links with hover glow effect                        | Navigation, inline links     |
| `.form-field-animate`  | Staggered entrance animation                        | Form fields                  |
| `.oauth-button-matrix` | OAuth buttons with hover glow                       | Social login                 |

### Form Animation Example

```tsx
// Staggered form field animations
<form className="space-y-6">
  <div className="form-field-animate">
    <label>Email</label>
    <input className="matrix-input" type="email" />
  </div>
  <div className="form-field-animate">
    <label>Password</label>
    <input className="matrix-input" type="password" />
  </div>
  <button className="matrix-button form-field-animate">Sign In</button>
</form>
```

### Available Animations

```javascript
animation: {
  'glow': 'glowGreen 2s ease-in-out infinite alternate',
  'glow-pulse': 'glowPulse 3s ease-in-out infinite',
  'matrix-flicker': 'matrixFlicker 0.15s ease-in-out infinite',
  'border-glow': 'borderGlow 2s ease-in-out infinite alternate',
  'float': 'float 6s ease-in-out infinite',
}
```

### Shadow Utilities

```javascript
boxShadow: {
  'glow-sm': '0 0 10px rgba(16, 185, 129, 0.3)',
  'glow-md': '0 0 20px rgba(16, 185, 129, 0.4)',
  'glow-lg': '0 0 30px rgba(16, 185, 129, 0.5)',
  'matrix': '0 0 15px rgba(0, 255, 65, 0.3), inset 0 0 10px rgba(0, 255, 65, 0.1)',
  'matrix-intense': '0 0 30px rgba(0, 255, 65, 0.5), 0 0 60px rgba(0, 255, 65, 0.2)',
}
```

---

## Advanced Theme Engine (v0.7.36+)

CGraph features a comprehensive theme engine inspired by CGraph, Element/Matrix, and Signal. This
system provides runtime theme switching, custom theme creation, and full user preference controls.

### Available Themes

| Theme ID      | Category | Description                                  |
| ------------- | -------- | -------------------------------------------- |
| `dark`        | Dark     | Default elegant dark theme with cyan accents |
| `light`       | Light    | Clean light theme for daytime use            |
| `matrix`      | Special  | Iconic green-on-black hacker aesthetic       |
| `holo-cyan`   | Special  | Futuristic cyan holographic glow             |
| `holo-purple` | Special  | Cyberpunk purple neon vibes                  |
| `holo-gold`   | Special  | Premium golden holographic shine             |
| `midnight`    | Dark     | Deep space dark blue theme                   |

### Using the Theme Engine

```tsx
import { useThemeEnhanced, useThemeColors } from '@/contexts/ThemeContextEnhanced';

function MyComponent() {
  const { currentTheme, setTheme, preferences } = useThemeEnhanced();
  const colors = useThemeColors();

  return (
    <div style={{ backgroundColor: colors.background, color: colors.text }}>
      <p>Current theme: {currentTheme.name}</p>
      <button onClick={() => setTheme('matrix')}>Switch to Matrix</button>
    </div>
  );
}
```

### Theme Color Properties

The `ThemeColors` interface provides 35+ semantic color properties:

```typescript
interface ThemeColors {
  // Primary colors
  primary: string;
  primaryLight: string;
  primaryDark: string;

  // Secondary colors
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;

  // Accent colors
  accent: string;
  accentLight: string;
  accentDark: string;

  // Background colors
  background: string;
  backgroundElevated: string;
  backgroundDark: string;

  // Surface colors
  surface: string;
  surfaceElevated: string;
  surfaceBorder: string;

  // Text colors
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  // Semantic colors
  success: string;
  warning: string;
  error: string;
  info: string;

  // Interactive colors
  interactive: string;
  interactiveHover: string;
  interactiveActive: string;

  // Status colors
  online: string;
  offline: string;
  away: string;
  busy: string;
}
```

### User Preferences

The theme engine manages user preferences:

```typescript
interface ThemePreferences {
  themeId: string; // Active theme ID
  customThemes: Theme[]; // User-created themes
  fontScale: number; // 0.75 - 1.5 (75% - 150%)
  messageDisplay: 'compact' | 'comfortable' | 'spacious';
  messageSpacing: number; // Custom message spacing
  reduceMotion: boolean; // Accessibility option
  highContrast: boolean; // WCAG compliance
  useSystemPreference: boolean; // Auto dark/light
}
```

### Creating Custom Themes

```tsx
import { useThemeEnhanced } from '@/contexts/ThemeContextEnhanced';

function ThemeCreator() {
  const { createCustomTheme, setTheme } = useThemeEnhanced();

  const createMyTheme = () => {
    const theme = createCustomTheme({
      name: 'My Custom Theme',
      category: 'dark',
      colors: {
        primary: '#ff6b6b',
        background: '#1a1a2e',
        surface: '#16213e',
        text: '#eee',
        // ... other required colors
      },
    });
    setTheme(theme.id);
  };

  return <button onClick={createMyTheme}>Create Theme</button>;
}
```

### Theme Security Note (v0.7.37+)

> ⚠️ **Security Update**: Theme import/export functionality has been removed as of v0.7.37 to
> prevent potential XSS and code injection attacks. Custom themes can only be created
> programmatically within the application.

If you need to backup or restore themes, use the browser's localStorage directly (advanced users
only):

```javascript
// Export themes (developer console only)
const prefs = JSON.parse(localStorage.getItem('cgraph-theme-preferences'));
console.log(JSON.stringify(prefs.customThemes, null, 2));

// Import themes programmatically via createCustomTheme hook
```

### CSS Variables

The theme engine injects CSS variables for use in stylesheets:

```css
:root {
  --color-primary: #00d9ff;
  --color-background: #0f0f0f;
  --color-surface: #1a1a1a;
  --color-text: #ffffff;
  --font-scale: 1;
  --message-spacing: 1rem;
  /* ... 40+ variables */
}

/* Usage in CSS */
.my-component {
  background: var(--color-surface);
  color: var(--color-text);
  font-size: calc(1rem * var(--font-scale));
}
```

### Holographic UI v4.0

The new Holographic UI components integrate seamlessly with the theme engine:

```tsx
import {
  HoloProvider,
  HoloContainer,
  HoloText,
  HoloButton,
  HoloCard,
  HoloModal,
} from '@/components/enhanced/ui/HolographicUIv4';

function FuturisticUI() {
  return (
    <HoloProvider preset="matrix">
      <HoloContainer enableScanlines enableGlow>
        <HoloText variant="title">Welcome to the Matrix</HoloText>
        <HoloButton variant="primary">Enter</HoloButton>
      </HoloContainer>
    </HoloProvider>
  );
}
```

Available HoloProvider presets: `cyan`, `matrix`, `purple`, `gold`, `midnight`

### Accessibility Features

The theme engine includes accessibility controls:

```tsx
const { preferences, toggleReduceMotion, toggleHighContrast } = useThemeEnhanced();

// Check if user prefers reduced motion
if (preferences.reduceMotion) {
  // Skip animations
}

// High contrast mode adjusts colors automatically
if (preferences.highContrast) {
  // Increased contrast ratios
}
```

### Cross-Tab Synchronization

Themes sync across browser tabs automatically using the BroadcastChannel API:

```typescript
// Changes in one tab are reflected in all tabs
setTheme('matrix'); // All tabs switch to Matrix theme
```

### Background Effects (v0.7.37+)

The theme system now supports dynamic background effects integrated with the main app layout:

```typescript
// Background effect options
interface BackgroundSettings {
  backgroundEffect: 'none' | 'shader' | 'matrix3d';
  shaderVariant: 'matrix' | 'fluid' | 'particles' | 'waves' | 'neural';
  backgroundIntensity: number; // 0.0 - 1.0
}

// Update via settings
const { updateSettings } = useThemeEnhanced();

updateSettings({
  backgroundEffect: 'shader',
  shaderVariant: 'matrix',
  backgroundIntensity: 0.6,
});
```

**Available Shader Effects:**

| Variant     | Description                      |
| ----------- | -------------------------------- |
| `matrix`    | Classic Matrix code rain effect  |
| `fluid`     | Smooth fluid dynamics simulation |
| `particles` | Floating particle system         |
| `waves`     | Animated wave patterns           |
| `neural`    | Neural network-style connections |

**Usage in Components:**

The background effect is applied automatically in `AppLayout.tsx`. Colors are derived from the
active theme for seamless integration.

---

## Component Architecture

### Core Component Library

CGraph includes a comprehensive set of reusable UI components in `apps/web/src/components/`:

| Component        | Purpose                         | Import                                                   |
| ---------------- | ------------------------------- | -------------------------------------------------------- |
| `Button`         | Primary button with variants    | `import { Button } from '@/components'`                  |
| `IconButton`     | Icon-only buttons               | `import { IconButton } from '@/components'`              |
| `Input`          | Text input with labels          | `import { Input } from '@/components'`                   |
| `Textarea`       | Multi-line text input           | `import { Textarea } from '@/components'`                |
| `TextArea`       | Auto-growing text area          | `import { TextArea } from '@/components'`                |
| `Select`         | Searchable dropdown select      | `import { Select } from '@/components'`                  |
| `Dropdown`       | Portal-based dropdown menu      | `import { Dropdown } from '@/components'`                |
| `Modal`          | Accessible modal dialog         | `import { Modal } from '@/components'`                   |
| `ConfirmDialog`  | Confirmation prompts            | `import { ConfirmDialog } from '@/components'`           |
| `Avatar`         | User avatars with status        | `import { Avatar } from '@/components'`                  |
| `AvatarGroup`    | Stacked avatar list             | `import { AvatarGroup } from '@/components'`             |
| `Loading`        | Loading spinners                | `import { Loading } from '@/components'`                 |
| `LoadingOverlay` | Full-screen loading             | `import { LoadingOverlay } from '@/components'`          |
| `ErrorBoundary`  | Error handling wrapper          | `import ErrorBoundary from '@/components/ErrorBoundary'` |
| `EmptyState`     | Empty content states            | `import { EmptyState } from '@/components'`              |
| `ToastProvider`  | Toast notifications             | `import { ToastProvider, useToast } from '@/components'` |
| `Tooltip`        | Multi-position tooltip          | `import { Tooltip } from '@/components'`                 |
| `FileUpload`     | Drag-and-drop file upload       | `import { FileUpload } from '@/components'`              |
| `Tabs`           | Tab navigation (pill/underline) | `import { Tabs } from '@/components'`                    |
| `TagInput`       | Tag input with autocomplete     | `import { TagInput } from '@/components'`                |
| `ProgressBar`    | Progress indicator              | `import { ProgressBar } from '@/components'`             |
| `Switch`         | Toggle switch                   | `import { Switch } from '@/components'`                  |

#### Quick Start

```tsx
// Import from the component index
import { Button, Input, Modal, Avatar, Loading, EmptyState } from '@/components';

// Or import individual components
import { Button } from '@/components/Button';
```

### File Structure

```
apps/web/src/
├── components/
│   ├── index.ts          # Component exports
│   ├── Avatar.tsx        # User avatars
│   ├── Button.tsx        # Button variants
│   ├── Dropdown.tsx      # Portal-based dropdown menu
│   ├── EmptyState.tsx    # Empty state templates
│   ├── ErrorBoundary.tsx # Error handling
│   ├── FileUpload.tsx    # Drag-and-drop file upload
│   ├── Input.tsx         # Form inputs
│   ├── Loading.tsx       # Loading spinners
│   ├── Modal.tsx         # Modal dialogs
│   ├── ProgressBar.tsx   # Progress indicators
│   ├── Select.tsx        # Searchable select dropdown
│   ├── Switch.tsx        # Toggle switches
│   ├── Tabs.tsx          # Tab navigation
│   ├── TagInput.tsx      # Tag input with autocomplete
│   ├── TextArea.tsx      # Auto-growing textarea
│   ├── Toast.tsx         # Toast notifications
│   ├── Tooltip.tsx       # Multi-position tooltips
│   ├── common/           # Additional primitives
│   ├── layout/           # Page structure
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── messages/         # Feature-specific
│   │   ├── MessageList.tsx
│   │   ├── MessageInput.tsx
│   │   └── MessageBubble.tsx
│   ├── groups/
│   ├── forums/
│   └── settings/
├── styles/
│   └── index.css         # Global styles
└── lib/
    ├── api.ts            # Axios instance
    ├── apiUtils.ts       # API response utilities
    ├── cn.ts             # className utility
    └── socket.ts         # Phoenix socket
```

### Component Template

Every component follows this pattern:

```tsx
// components/common/Button.tsx
import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

// 1. Define variants
const variants = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 focus:ring-brand-500',
  secondary:
    'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-100',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

// 2. Define props interface
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
}

// 3. Create component with forwardRef
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center rounded-lg font-medium',
          'focus:ring-2 focus:ring-offset-2 focus:outline-none',
          'transition-colors duration-200',
          'disabled:cursor-not-allowed disabled:opacity-50',
          // Variant & size
          variants[variant],
          sizes[size],
          // Custom classes
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="mr-2 -ml-1 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

### The `cn()` Utility

We use `clsx` and `tailwind-merge` for className handling:

```typescript
// lib/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

This allows:

- Conditional classes: `cn('base', isActive && 'active')`
- Merging without conflicts: `cn('px-4', className)` where className might be `px-8`

---

## Modifying Existing Components

### Example: Changing the Message Bubble Style

Let's say you want messages to have rounded corners on one side only (chat app style):

**Before:**

```tsx
// components/messages/MessageBubble.tsx
<div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2">
```

**After:**

```tsx
// components/messages/MessageBubble.tsx
interface MessageBubbleProps {
  content: string;
  isOwn: boolean; // Is this our message?
  timestamp: Date;
}

export function MessageBubble({ content, isOwn, timestamp }: MessageBubbleProps) {
  return (
    <div
      className={cn(
        'max-w-[70%] px-4 py-2',
        isOwn
          ? [
              'bg-brand-600 text-white',
              'rounded-l-2xl rounded-tr-2xl rounded-br-sm', // Tail on right
              'ml-auto', // Align right
            ]
          : [
              'bg-gray-100 dark:bg-gray-800',
              'rounded-tl-2xl rounded-r-2xl rounded-bl-sm', // Tail on left
              'mr-auto', // Align left
            ]
      )}
    >
      <p className="break-words">{content}</p>
      <span className={cn('mt-1 block text-xs', isOwn ? 'text-brand-200' : 'text-gray-500')}>
        {formatTime(timestamp)}
      </span>
    </div>
  );
}
```

### Example: Adding a New Variant to Button

Want an "outline" button? Add a variant:

```typescript
const variants = {
  primary: '...',
  secondary: '...',
  danger: '...',
  ghost: '...',
  // Add new variant
  outline:
    'border-2 border-brand-600 text-brand-600 bg-transparent hover:bg-brand-50 dark:hover:bg-brand-900/20',
};
```

Now use it:

```jsx
<Button variant="outline">Click me</Button>
```

---

## Creating New Components

### Step-by-Step: Building a Status Indicator

Let's create a component to show online/offline status:

**Step 1: Create the file**

```bash
touch apps/web/src/components/common/StatusIndicator.tsx
```

**Step 2: Write the component**

```tsx
// components/common/StatusIndicator.tsx
import { cn } from '@/lib/cn';

type Status = 'online' | 'idle' | 'busy' | 'offline';

interface StatusIndicatorProps {
  status: Status;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const statusConfig = {
  online: {
    color: 'bg-green-500',
    label: 'Online',
    pulse: true,
  },
  idle: {
    color: 'bg-yellow-500',
    label: 'Idle',
    pulse: false,
  },
  busy: {
    color: 'bg-red-500',
    label: 'Do Not Disturb',
    pulse: false,
  },
  offline: {
    color: 'bg-gray-400',
    label: 'Offline',
    pulse: false,
  },
};

const sizes = {
  sm: 'h-2 w-2',
  md: 'h-3 w-3',
  lg: 'h-4 w-4',
};

export function StatusIndicator({
  status,
  size = 'md',
  showLabel = false,
  className,
}: StatusIndicatorProps) {
  const config = statusConfig[status];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="relative flex">
        <span
          className={cn('rounded-full', sizes[size], config.color, config.pulse && 'animate-pulse')}
        />
        {config.pulse && (
          <span
            className={cn('absolute inset-0 animate-ping rounded-full opacity-75', config.color)}
          />
        )}
      </span>
      {showLabel && (
        <span className="text-sm text-gray-600 dark:text-gray-400">{config.label}</span>
      )}
    </div>
  );
}
```

**Step 3: Export from index**

```typescript
// components/common/index.ts
export * from './Button';
export * from './Input';
export * from './StatusIndicator'; // Add this
```

**Step 4: Use it**

```tsx
import { StatusIndicator } from '@/components/common';

function UserProfile({ user }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar src={user.avatar} />
      <div>
        <h3>{user.name}</h3>
        <StatusIndicator status={user.status} showLabel size="sm" />
      </div>
    </div>
  );
}
```

---

## Mobile UI (React Native)

### Structure

```
apps/mobile/src/
├── components/
│   ├── common/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Avatar.tsx
│   ├── messages/
│   ├── groups/
│   └── forums/
├── screens/
├── navigation/
└── contexts/
    └── ThemeContext.tsx
```

### Theme Context

```tsx
// contexts/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  colors: typeof lightColors;
}

const lightColors = {
  background: '#FFFFFF',
  surface: '#F9FAFB',
  text: '#111827',
  textSecondary: '#6B7280',
  primary: '#4F46E5',
  primaryLight: '#EEF2FF',
  border: '#E5E7EB',
  error: '#DC2626',
  success: '#059669',
};

const darkColors = {
  background: '#111827',
  surface: '#1F2937',
  text: '#F9FAFB',
  textSecondary: '#9CA3AF',
  primary: '#818CF8',
  primaryLight: '#312E81',
  border: '#374151',
  error: '#F87171',
  success: '#34D399',
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<Theme>('system');

  const isDark = theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';

  const colors = isDark ? darkColors : lightColors;

  useEffect(() => {
    AsyncStorage.getItem('theme').then((saved) => {
      if (saved) setThemeState(saved as Theme);
    });
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    AsyncStorage.setItem('theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, setTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
```

### Using Theme in Components

```tsx
// components/common/Button.tsx (React Native)
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
}

export function Button({ title, onPress, variant = 'primary', loading, disabled }: ButtonProps) {
  const { colors } = useTheme();

  const getBackgroundColor = () => {
    if (disabled) return colors.border;
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'secondary':
        return colors.surface;
      case 'ghost':
        return 'transparent';
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary':
        return '#FFFFFF';
      case 'secondary':
        return colors.text;
      case 'ghost':
        return colors.primary;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        { backgroundColor: getBackgroundColor() },
        variant === 'ghost' && styles.ghost,
      ]}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text style={[styles.text, { color: getTextColor() }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  ghost: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
```

---

## Dark Mode & Themes

### Web: Toggling Dark Mode

```tsx
// contexts/ThemeContext.tsx (Web)
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}>({
  theme: 'system',
  setTheme: () => {},
  isDark: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');

  const isDark =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : theme === 'dark';

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    const saved = localStorage.getItem('theme') as Theme;
    if (saved) setThemeState(saved);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>{children}</ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
```

### Theme Switcher Component

```tsx
// components/settings/ThemeSwitcher.tsx
import { useTheme } from '@/contexts/ThemeContext';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: 'light', icon: SunIcon, label: 'Light' },
    { value: 'dark', icon: MoonIcon, label: 'Dark' },
    { value: 'system', icon: ComputerDesktopIcon, label: 'System' },
  ] as const;

  return (
    <div className="flex gap-2 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={cn(
            'flex items-center gap-2 rounded-md px-3 py-2 transition-colors',
            theme === value
              ? 'bg-white shadow-sm dark:bg-gray-700'
              : 'hover:bg-gray-200 dark:hover:bg-gray-700'
          )}
        >
          <Icon className="h-5 w-5" />
          <span className="text-sm font-medium">{label}</span>
        </button>
      ))}
    </div>
  );
}
```

---

## Responsive Design

### Breakpoints

```javascript
// tailwind.config.js defaults
screens: {
  'sm': '640px',   // Mobile landscape
  'md': '768px',   // Tablet
  'lg': '1024px',  // Desktop
  'xl': '1280px',  // Large desktop
  '2xl': '1536px', // Extra large
}
```

### Mobile-First Approach

Always start with mobile styles, add complexity for larger screens:

```tsx
// Layout example
<div className="// Mobile: Stack vertically // Tablet+: Side by side // Spacing flex flex-col gap-4 md:flex-row">
  <aside className="// Mobile: Full width // Tablet+: Fixed sidebar // Don't w-full shrink md:w-64 md:flex-shrink-0">
    <Sidebar />
  </aside>

  <main className="// Take remaining space // Allow content to min-w-0 flex-1 shrink">
    <Content />
  </main>
</div>
```

### Responsive Navigation

```tsx
// components/layout/Navigation.tsx
import { useState } from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="border-b bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Logo />

          {/* Desktop navigation */}
          <div className="hidden items-center gap-6 md:flex">
            <NavLinks />
            <UserMenu />
          </div>

          {/* Mobile menu button */}
          <button
            className="rounded-lg p-2 hover:bg-gray-100 md:hidden dark:hover:bg-gray-800"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-t md:hidden dark:border-gray-800">
          <div className="space-y-2 px-4 py-4">
            <NavLinks mobile />
          </div>
        </div>
      )}
    </nav>
  );
}
```

---

## Animations & Transitions

### CSS Transitions

Simple hover effects:

```tsx
<button className="
  bg-brand-600
  hover:bg-brand-700
  transition-colors
  duration-200
">
```

### CSS Animations

Define in Tailwind config, use in components:

```tsx
// Fade in when mounting
<div className="animate-fade-in">
  Content appears smoothly
</div>

// Slide up effect
<div className="animate-slide-up">
  Content slides in from below
</div>
```

### Framer Motion (Advanced)

For complex animations, we use Framer Motion:

```tsx
import { motion, AnimatePresence } from 'framer-motion';

// Animate list items
function MessageList({ messages }) {
  return (
    <AnimatePresence>
      {messages.map((msg) => (
        <motion.div
          key={msg.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.2 }}
        >
          <MessageBubble {...msg} />
        </motion.div>
      ))}
    </AnimatePresence>
  );
}

// Page transitions
function PageWrapper({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      {children}
    </motion.div>
  );
}
```

---

## Accessibility (a11y)

### Semantic HTML

```tsx
// Good: Semantic structure
<article>
  <header>
    <h1>Post Title</h1>
    <time dateTime="2025-12-28">December 28, 2025</time>
  </header>
  <main>
    <p>Post content...</p>
  </main>
  <footer>
    <button>Like</button>
    <button>Reply</button>
  </footer>
</article>

// Bad: Div soup
<div>
  <div><span>Post Title</span></div>
  <div>Post content...</div>
  <div><span>Like</span></div>
</div>
```

### Keyboard Navigation

```tsx
// Ensure all interactive elements are focusable
<button
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
  tabIndex={0}
  role="button"
  aria-label="Send message"
>
  <SendIcon />
</button>

// Skip to main content link
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-brand-600 text-white px-4 py-2 rounded"
>
  Skip to main content
</a>
```

### ARIA Labels

```tsx
// Form inputs
<label htmlFor="email" className="sr-only">Email address</label>
<input
  id="email"
  type="email"
  aria-label="Email address"
  aria-describedby="email-error"
  aria-invalid={!!error}
/>
{error && <p id="email-error" role="alert">{error}</p>}

// Loading states
<button disabled={loading} aria-busy={loading}>
  {loading ? 'Sending...' : 'Send'}
</button>

// Live regions for real-time updates
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {unreadCount} new messages
</div>
```

### Color Contrast

Ensure text meets WCAG 2.1 AA standards:

- Regular text: 4.5:1 contrast ratio
- Large text (18px+): 3:1 contrast ratio

```tsx
// Good contrast
<p className="text-gray-900 dark:text-gray-100">Readable text</p>

// Check with: https://webaim.org/resources/contrastchecker/
```

### Focus Indicators

Never remove focus outlines without replacement:

```css
/* tailwind.config.js */
theme: {
  extend: {
    ringColor: {
      DEFAULT: '#4F46E5',  // Visible focus ring
    },
  },
}

/* Usage */
.focus:ring-2.focus:ring-offset-2 {
  /* Clear, visible focus indicator */
}
```

---

## Quick Reference: Common UI Changes

| Task                    | File to Edit                        | What to Change                         |
| ----------------------- | ----------------------------------- | -------------------------------------- |
| Change primary color    | `tailwind.config.js`                | `theme.extend.colors.brand`            |
| Update fonts            | `tailwind.config.js` + `index.html` | `fontFamily` + Google Fonts link       |
| Modify button styles    | `components/common/Button.tsx`      | `variants` object                      |
| Change border radius    | `tailwind.config.js`                | `theme.extend.borderRadius`            |
| Add new animation       | `tailwind.config.js`                | `theme.extend.animation` + `keyframes` |
| Update breakpoints      | `tailwind.config.js`                | `theme.screens`                        |
| Change dark mode colors | `tailwind.config.js`                | Add `dark:` variants                   |
| Mobile nav behavior     | `components/layout/Navigation.tsx`  | Responsive classes + state             |

---

_Last updated: December 2025_
