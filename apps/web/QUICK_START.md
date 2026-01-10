# Quick Start Guide - CGraph Web Enhancements

## 🚀 Getting Started (5 Minutes)

### Step 1: Verify Installation
Dependencies are already installed. Verify with:
```bash
cd /CGraph/apps/web
pnpm list three @react-three/fiber gsap
```

### Step 2: Import and Use

#### Basic Example - Glassmorphic Card
```tsx
import GlassCard from '@/components/ui/GlassCard';

function MyComponent() {
  return (
    <GlassCard variant="neon" glow hover3D className="p-6">
      <h2>Hello Future!</h2>
      <p>This card has glassmorphism, glow, and 3D hover effects.</p>
    </GlassCard>
  );
}
```

#### Message Animation
```tsx
import { AnimatedMessageWrapper } from '@/components/conversation/AnimatedMessageWrapper';

<AnimatedMessageWrapper
  isOwnMessage={true}
  index={0}
  isNew={true}
  onSwipeReply={() => console.log('Swiped for reply!')}
>
  <div className="message-bubble">Your message here</div>
</AnimatedMessageWrapper>
```

#### AI Theme
```tsx
import { useEffect } from 'react';
import { themeEngine } from '@/lib/ai/ThemeEngine';

function App() {
  useEffect(() => {
    // Generate and apply AI theme
    const theme = themeEngine.generateTheme();
    themeEngine.applyTheme(theme);
  }, []);

  return <YourApp />;
}
```

### Step 3: Add Background Effect

Choose one:

**Option A: WebGL Shader (Best Performance)**
```tsx
import ShaderBackground from '@/components/shaders/ShaderBackground';

<ShaderBackground
  variant="fluid"
  color1="#00ff41"
  color2="#003b00"
  speed={0.5}
  interactive
/>
```

**Option B: 3D Matrix (More Impressive)**
```tsx
import Matrix3DEnvironment from '@/components/three/Matrix3DEnvironment';

<Matrix3DEnvironment
  intensity="medium"
  theme="matrix-green"
  interactive
/>
```

### Step 4: Try the Full Enhanced UI

Replace your current conversation route:

```tsx
// In your router configuration
import EnhancedConversation from '@/pages/messages/EnhancedConversation';

// Update route
<Route
  path="/messages/:conversationId"
  element={<EnhancedConversation />}
/>
```

---

## 🎨 Component Cheat Sheet

### GlassCard Variants
```tsx
<GlassCard variant="default" />     // Basic glass effect
<GlassCard variant="frosted" />     // Heavy blur
<GlassCard variant="crystal" />     // Matrix green borders
<GlassCard variant="neon" />        // Neon glow borders
<GlassCard variant="holographic" /> // Rainbow gradient
```

### Animation Engine
```tsx
import { AnimationEngine, HapticFeedback } from '@/lib/animations/AnimationEngine';

// Simple animation
AnimationEngine.animate(element, 'bounceIn');

// Spring physics
AnimationEngine.spring(element, { x: 100, y: 50 }, {
  tension: 200,
  friction: 20
});

// Haptic feedback
HapticFeedback.medium(); // On button click
HapticFeedback.success(); // On successful action
```

### Voice Visualization
```tsx
import AdvancedVoiceVisualizer from '@/components/audio/AdvancedVoiceVisualizer';

<AdvancedVoiceVisualizer
  audioUrl="/voice.mp3"
  variant="spectrum"      // or 'waveform', 'circular', 'particles'
  theme="matrix-green"
  height={100}
  width={300}
/>
```

### Reactions
```tsx
import { AnimatedReactionBubble, ReactionPicker } from '@/components/conversation/AnimatedReactionBubble';

<AnimatedReactionBubble
  reaction={{ emoji: '❤️', count: 5, hasReacted: true }}
  isOwnMessage={false}
  onPress={() => toggleReaction('❤️')}
/>
```

---

## 🎯 Common Use Cases

### 1. Add Glass Effect to Existing Component
```tsx
// Before
<div className="bg-dark-800 p-6 rounded-lg">
  Content
</div>

// After
<GlassCard variant="frosted" className="p-6">
  Content
</GlassCard>
```

### 2. Animate List Items
```tsx
{items.map((item, index) => (
  <AnimatedMessageWrapper
    key={item.id}
    index={index}
    isNew={false}
    isOwnMessage={false}
  >
    <ItemComponent item={item} />
  </AnimatedMessageWrapper>
))}
```

### 3. Add Background to Page
```tsx
function MyPage() {
  return (
    <>
      <ShaderBackground variant="waves" />
      <div className="relative z-10">
        {/* Your page content */}
      </div>
    </>
  );
}
```

### 4. Generate Dynamic Themes
```tsx
function ThemeButton() {
  const changeTheme = () => {
    const theme = themeEngine.generateTheme();
    themeEngine.applyTheme(theme);
  };

  return <button onClick={changeTheme}>New Theme</button>;
}
```

---

## 🐛 Troubleshooting

### Issue: TypeScript Errors
```bash
# Auto-fix linting issues
pnpm lint:fix

# Or ignore during development
// @ts-ignore
```

### Issue: WebGL Not Supported
```tsx
// Add fallback
{supportsWebGL ? (
  <ShaderBackground variant="fluid" />
) : (
  <div className="bg-gradient-to-br from-dark-900 to-dark-800" />
)}
```

### Issue: Performance on Low-End Devices
```tsx
// Reduce intensity
<Matrix3DEnvironment intensity="low" />

// Or disable effects
<GlassCard variant="default" glow={false} hover3D={false} />
```

---

## 📖 Full Documentation

- **ENHANCEMENT_GUIDE.md** - Comprehensive feature documentation
- **IMPLEMENTATION_SUMMARY.md** - Project overview and metrics

---

## 🎉 You're Ready!

Start with a simple GlassCard or background, then explore more advanced features as needed.

**Pro Tip**: Check out [/pages/messages/EnhancedConversation.tsx](/CGraph/apps/web/src/pages/messages/EnhancedConversation.tsx) to see everything working together!
