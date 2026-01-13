# Matrix Cipher Background Animation

> A high-performance, customizable Matrix-style falling code animation for CGraph's authentication and background visuals.

## Version

**v1.0.0** - Introduced in CGraph v0.6.3

## Overview

The Matrix Cipher Background is a sophisticated animation system that renders the iconic "digital rain" effect from The Matrix movies. Built with performance and customization in mind, it supports:

- **Web**: Canvas 2D rendering with 60fps target
- **Mobile**: React Native Animated API with optimized rendering
- **10+ Color Themes**: Matrix Green, Cyber Blue, Blood Red, Golden, and more
- **Configuration Presets**: High Quality, Power Saver, Minimal, Intense
- **Responsive Design**: Automatic adjustments for mobile, tablet, and desktop
- **Depth Effects**: Multi-layer parallax for 3D-like visuals
- **Character Sets**: Katakana, Latin, Cyrillic, Greek, Binary, Hex, and mixed

---

## Architecture

### Web Implementation (`/apps/web/src/lib/animations/matrix/`)

```
matrix/
├── types.ts           # TypeScript type definitions
├── characters.ts      # Character set definitions and utilities
├── themes.ts          # Color theme presets
├── config.ts          # Configuration management
├── engine.ts          # Core canvas animation engine
├── useMatrix.ts       # React hook for lifecycle management
├── MatrixBackground.tsx # React component variants
├── index.ts           # Barrel exports
└── __tests__/         # Comprehensive test suite
    ├── types.test.ts
    ├── characters.test.ts
    ├── themes.test.ts
    ├── config.test.ts
    └── engine.test.ts
```

### Mobile Implementation (`/apps/mobile/src/components/matrix/`)

```
matrix/
├── types.ts           # Mobile-specific types
├── themes.ts          # Theme definitions
├── config.ts          # Mobile configuration
├── MatrixBackground.tsx # React Native component
└── index.ts           # Exports
```

---

## Quick Start

### Web Usage

```tsx
import { MatrixAuthBackground, MatrixBackground } from '@/lib/animations/matrix';

// Simple auth layout usage (recommended for auth screens)
function AuthLayout({ children }) {
  return (
    <div className="relative min-h-screen">
      <MatrixAuthBackground />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

// Full control usage
function CustomBackground() {
  return (
    <MatrixBackground
      theme="cyber-blue"
      preset="high-quality"
      config={{
        columns: { density: 0.8 },
        effects: { enableBloom: true }
      }}
    />
  );
}
```

### Mobile Usage

```tsx
import { MatrixBackground } from '@/components/matrix';

function LoginScreen() {
  return (
    <View style={{ flex: 1 }}>
      <MatrixBackground theme="matrix-green" />
      {/* Login form overlaid on top */}
    </View>
  );
}
```

---

## Configuration

### Performance Presets

| Preset | FPS | Max Columns | Bloom | Depth Layers | Use Case |
|--------|-----|-------------|-------|--------------|----------|
| `default` | 60 | 100 | ✓ | 3 | Balanced for most devices |
| `high-quality` | 60 | 150 | ✓ | 4 | High-end desktops |
| `power-saver` | 30 | 50 | ✗ | 2 | Laptops on battery |
| `minimal` | 24 | 30 | ✗ | 1 | Low-end devices |
| `intense` | 60 | 200 | ✓ | 4 | Visual impact priority |

### Configuration Structure

```typescript
interface MatrixConfig {
  version: string;
  name: string;
  theme: MatrixTheme;
  
  performance: {
    targetFPS: number;
    maxColumns: number;
    adaptiveQuality: boolean;
    throttleOnBlur: boolean;
    throttledFPS: number;
  };
  
  characters: {
    type: CharacterSetType;  // 'katakana' | 'latin' | 'binary' | etc.
    includeNumbers: boolean;
    includeSymbols: boolean;
    changeFrequency: number;
  };
  
  columns: {
    minSpeed: number;
    maxSpeed: number;
    minLength: number;
    maxLength: number;
    density: number;        // 0-1, affects column count
    spacing: number;
  };
  
  effects: {
    enableDepth: boolean;
    depthLayers: number;
    trailFade: number;
    enableBloom: boolean;
    bloomIntensity: number;
    enableVignette: boolean;
    vignetteIntensity: number;
  };
  
  font: {
    family: string;
    baseSize: number;
    sizeVariation: boolean;
  };
  
  responsive: {
    mobile: DeepPartial<MatrixConfig>;
    tablet: DeepPartial<MatrixConfig>;
  };
}
```

### Custom Configuration

```typescript
import { createConfig, mergeConfigs, PRESET_HIGH_QUALITY } from '@/lib/animations/matrix';

// Create custom config
const myConfig = createConfig({
  performance: {
    targetFPS: 45,
  },
  columns: {
    density: 0.6,
    minSpeed: 3,
    maxSpeed: 10,
  },
  effects: {
    enableBloom: true,
    bloomIntensity: 0.7,
  },
});

// Merge with preset
const mergedConfig = mergeConfigs(PRESET_HIGH_QUALITY, {
  columns: { density: 0.9 },
});
```

---

## Themes

### Built-in Themes

| Theme ID | Name | Primary Color | Description |
|----------|------|---------------|-------------|
| `matrix-green` | Matrix Green | `#00ff41` | Classic neon green |
| `cyber-blue` | Cyber Blue | `#00d4ff` | Electric cyan |
| `blood-red` | Blood Red | `#ff1744` | Deep crimson |
| `golden` | Golden | `#ffd700` | Luxurious gold |
| `purple-haze` | Purple Haze | `#9c27b0` | Mystical purple |
| `neon-pink` | Neon Pink | `#ff1493` | Vibrant pink |
| `ice` | Ice | `#e0ffff` | Cool icy blue |
| `fire` | Fire | `#ff4500` | Warm orange-red |

### Theme Structure

```typescript
interface MatrixTheme {
  id: string;
  name: string;
  preset: ThemePreset;
  
  primaryColor: string;      // Head of rain drop
  secondaryColor: string;    // Body
  tertiaryColor: string;     // Tail
  backgroundColor: string;   // Canvas background
  
  trailGradient: ColorStop[]; // Fade gradient
  
  glow: {
    enabled: boolean;
    radius: number;
    color: string;
    intensity: number;       // 0-1
    pulsate: boolean;
    pulseSpeed?: number;
  };
  
  depthColors: {
    near: string;
    mid: string;
    far: string;
  };
  
  opacity: {
    head: number;           // 0-1
    body: number;
    tail: number;
    background: number;
  };
}
```

### Creating Custom Themes

```typescript
import { createCustomTheme, getTheme } from '@/lib/animations/matrix';

const customTheme = createCustomTheme('matrix-green', {
  primaryColor: '#ff00ff',
  secondaryColor: '#cc00cc',
  tertiaryColor: '#880088',
  glow: {
    enabled: true,
    intensity: 1,
    pulsate: true,
    pulseSpeed: 1500,
  },
});
```

### Theme Transitions

```typescript
import { interpolateThemes, MATRIX_GREEN, CYBER_BLUE } from '@/lib/animations/matrix';

// Smooth transition between themes
const transitionTheme = interpolateThemes(MATRIX_GREEN, CYBER_BLUE, 0.5);
```

---

## Character Sets

### Available Sets

| Set | Description | Example |
|-----|-------------|---------|
| `latin` | Extended Latin alphabet | A-Z, a-z, accented |
| `katakana` | Japanese Katakana | アイウエオ |
| `cyrillic` | Russian and Slavic | АБВГД |
| `greek` | Greek alphabet | ΑΒΓΔΕ |
| `numbers` | Digits + math symbols | 0-9, ±×÷∞ |
| `binary` | Just 0 and 1 | 01 |
| `hex` | Hexadecimal | 0-9, A-F |
| `symbols` | Special symbols | !@#$%^& |
| `mixed` | All combined | Mixed |
| `custom` | User-defined | Any string |

### Character Presets

```typescript
import { CHARACTER_PRESETS, getPresetCharacters } from '@/lib/animations/matrix';

// Use preset
const classicChars = CHARACTER_PRESETS.classic();  // Katakana + numbers + symbols
const binaryChars = CHARACTER_PRESETS.binary();    // Just 0 and 1
const hackerChars = CHARACTER_PRESETS.hacker();    // Code symbols + hex
```

---

## API Reference

### Components

#### `MatrixBackground`

Main component for rendering the Matrix animation.

```tsx
interface MatrixBackgroundProps {
  theme?: ThemePreset;
  preset?: ConfigPresetName;
  config?: DeepPartial<MatrixConfig>;
  className?: string;
  onReady?: () => void;
  onError?: (error: Error) => void;
}
```

#### `MatrixAuthBackground`

Pre-configured background for authentication screens with vignette overlay.

```tsx
interface MatrixAuthBackgroundProps {
  theme?: ThemePreset;
}
```

### Hooks

#### `useMatrix`

React hook for direct engine control.

```typescript
const { canvasRef, isReady, error, engine } = useMatrix({
  theme: 'matrix-green',
  preset: 'default',
  config: { /* overrides */ },
  onReady: () => console.log('Started!'),
});
```

### Functions

#### Configuration

```typescript
// Create config with overrides
createConfig(overrides?: DeepPartial<MatrixConfig>): MatrixConfig

// Get preset by name
getPreset(name: ConfigPresetName): MatrixConfig

// Get responsive config for screen width
getResponsiveConfig(config: MatrixConfig, width: number): MatrixConfig

// Validate config and get errors
validateConfig(config: Partial<MatrixConfig>): string[]

// Merge multiple configs
mergeConfigs(...configs: DeepPartial<MatrixConfig>[]): MatrixConfig

// Clone config deeply
cloneConfig(config: MatrixConfig): MatrixConfig
```

#### Themes

```typescript
// Get theme by preset name
getTheme(preset: ThemePreset): MatrixTheme

// Create custom theme from base
createCustomTheme(base: ThemePreset, overrides: Partial<MatrixTheme>): MatrixTheme

// Interpolate between themes (0-1)
interpolateThemes(from: MatrixTheme, to: MatrixTheme, t: number): MatrixTheme

// Parse hex color to RGB
parseColor(color: string): { r: number; g: number; b: number }

// Convert RGB to CSS rgba string
toRGBA(r: number, g: number, b: number, a: number): string
```

#### Characters

```typescript
// Get character set by type
getCharacterSet(type: CharacterSetType, customChars?: string, includeNumbers?: boolean, includeSymbols?: boolean): string[]

// Get random character from array
getRandomChar(chars: string[]): string

// Get multiple random characters
getRandomChars(chars: string[], count: number): string[]

// Create weighted random generator
createWeightedGenerator(chars: string[], weights?: number[]): () => string

// Get character display width (handles CJK)
getCharWidth(char: string): number

// Get preset characters
getPresetCharacters(preset: CharacterPreset): string[]
```

---

## Performance Optimization

### Automatic Optimizations

1. **Adaptive Quality**: Automatically reduces effects when frame rate drops
2. **Throttling on Blur**: Reduces FPS when tab is not visible
3. **Responsive Scaling**: Adjusts density and effects for smaller screens
4. **Frame Skipping**: Skips frames to maintain smooth animation
5. **Object Pooling**: Reuses column objects to reduce GC pressure

### Manual Optimization Tips

```typescript
// For low-end devices
const config = getPreset('minimal');

// Disable expensive effects
const config = createConfig({
  effects: {
    enableBloom: false,
    enableDepth: false,
    enableVignette: false,
  },
  performance: {
    targetFPS: 30,
    maxColumns: 40,
  },
});

// Mobile-specific
const config = createConfig({
  columns: {
    density: 0.4,
    spacing: 24,
  },
  font: {
    baseSize: 12,
  },
});
```

---

## Testing

The Matrix animation system includes comprehensive tests:

```bash
# Run all matrix tests
cd apps/web
npm run test -- --run src/lib/animations/matrix

# Watch mode
npm run test -- src/lib/animations/matrix
```

### Test Coverage

- **208 tests** covering:
  - Type definitions and DeepPartial utility
  - Character set generation and utilities
  - Theme validation and interpolation
  - Configuration merging and validation
  - Engine lifecycle and rendering

---

## Troubleshooting

### Common Issues

**Animation not starting**
- Ensure container has dimensions (non-zero width/height)
- Check browser console for errors
- Verify theme name is valid

**Low FPS**
- Use `power-saver` or `minimal` preset
- Reduce `columns.density`
- Disable bloom and depth effects
- Lower `performance.targetFPS`

**Memory issues**
- Reduce `performance.maxColumns`
- Decrease `columns.maxLength`
- Ensure component unmounts properly

**Mobile performance**
- Use mobile-specific config from `DEFAULT_CONFIG.responsive.mobile`
- Reduce column count to 30-40
- Disable glow effects

---

## Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 80+ | ✅ Full support |
| Firefox | 75+ | ✅ Full support |
| Safari | 13+ | ✅ Full support |
| Edge | 80+ | ✅ Full support |
| iOS Safari | 13+ | ✅ Optimized |
| Android Chrome | 80+ | ✅ Optimized |

---

## Future Enhancements

- [ ] WebGL renderer for even higher performance
- [ ] Interactive mode (mouse/touch interaction)
- [ ] Audio reactive mode
- [ ] Custom shader support
- [ ] Recording/export to video
- [ ] Theme editor UI
- [ ] Additional character animations (wave, pulse)

---

## Contributing

See [CONTRIBUTING.md](/CONTRIBUTING.md) for guidelines on contributing to the Matrix animation system.

When adding new themes or presets, ensure:
1. All tests pass
2. Documentation is updated
3. TypeScript types are complete
4. Mobile compatibility is tested

---

## License

MIT License - See [LICENSE](/LICENSE) for details.
