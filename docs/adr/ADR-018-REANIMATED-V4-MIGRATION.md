# ADR-018: React Native Reanimated v4 Migration

> **Status:** Accepted  
> **Date:** 2026-02-03  
> **Author:** AI Assistant (Claude)  
> **Related:** Mobile App, Animation System, Gesture Handling

## Context

The CGraph mobile app was using React Native Reanimated with deprecated v3 APIs that have been
removed or changed in v4. Additionally, the navigation system used `@react-navigation/stack` which
has been superseded by `@react-navigation/native-stack` in v7.

**Problems:**

- 222 TypeScript errors in the mobile app
- Deprecated `useAnimatedGestureHandler` API removed in Reanimated v4
- `SpringConfig` type changed from extendable interface to union type
- `Animated.SharedValue<T>` namespace removed (now direct `SharedValue<T>` import)
- `@react-navigation/stack` JavaScript-based transitions incompatible with native-stack

## Decision

Migrate all animation and gesture code to Reanimated v4 APIs and rewrite the navigation transition
system for native-stack v7.

### Key API Changes

#### 1. Gesture Handler Migration

**Before (v3 - Deprecated):**

```tsx
const gestureHandler = useAnimatedGestureHandler({
  onStart: (_, ctx) => {
    ctx.startX = x.value;
  },
  onActive: (e, ctx) => {
    x.value = ctx.startX + e.translationX;
  },
  onEnd: () => {
    x.value = withSpring(0);
  },
});

<PanGestureHandler onGestureEvent={gestureHandler}>
  <Animated.View />
</PanGestureHandler>;
```

**After (v4):**

```tsx
const gestureContext = useSharedValue({ startX: 0 });

const panGesture = Gesture.Pan()
  .onStart(() => {
    'worklet';
    gestureContext.value = { startX: x.value };
  })
  .onUpdate((e) => {
    'worklet';
    x.value = gestureContext.value.startX + e.translationX;
  })
  .onEnd(() => {
    'worklet';
    x.value = withSpring(0, springCfg);
  });

<GestureDetector gesture={panGesture}>
  <Animated.View />
</GestureDetector>;
```

#### 2. SpringConfig Type Fix

**Before (v3):**

```tsx
// This worked when WithSpringConfig was an interface
export interface SpringConfig extends WithSpringConfig {
  name?: string;
  description?: string;
}
```

**After (v4):**

```tsx
// WithSpringConfig is now a union type, cannot be extended
export interface SpringConfig {
  damping?: number;
  mass?: number;
  stiffness?: number;
  overshootClamping?: boolean;
  velocity?: number;
  // Metadata
  name?: string;
  description?: string;
}

// Helper to extract withSpring-compatible config
export function getSpringConfig(config: SpringConfig): WithSpringConfig {
  const { name, description, ...springConfig } = config;
  return springConfig as WithSpringConfig;
}
```

#### 3. SharedValue Namespace

**Before:**

```tsx
interface Props {
  value: Animated.SharedValue<number>;
}
```

**After:**

```tsx
import { SharedValue } from 'react-native-reanimated';

interface Props {
  value: SharedValue<number>;
}
```

#### 4. Navigation Transitions (native-stack v7)

**Before (@react-navigation/stack):**

```tsx
// JavaScript-based interpolators
export function forHorizontalSlide({
  current, next, layouts
}: StackCardInterpolationProps): StackCardInterpolatedStyle {
  const translateX = current.progress.interpolate({...});
  return { cardStyle: { transform: [{ translateX }] } };
}
```

**After (@react-navigation/native-stack v7):**

```tsx
// Native animation options
export const slideFromRight: NativeStackNavigationOptions = {
  animation: 'slide_from_right',
  gestureEnabled: true,
};

export const modalPresentation: NativeStackNavigationOptions = {
  presentation: 'modal',
  animation: 'slide_from_bottom',
  gestureEnabled: true,
};
```

## Files Changed

### Gesture Handler Migrations (6 files)

| File                | Components                | Changes                                               |
| ------------------- | ------------------------- | ----------------------------------------------------- |
| `Carousel3D.tsx`    | Carousel3D                | `Gesture.Pan()` + `GestureDetector`                   |
| `DynamicModal.tsx`  | DynamicModal, BottomSheet | `Gesture.Pan()` + `Gesture.Tap()` + `GestureDetector` |
| `FluidTabs.tsx`     | FluidTabs                 | `Gesture.Pan()` + `GestureDetector`                   |
| `SwipeableCard.tsx` | SwipeableCard             | `Gesture.Pan()` + `GestureDetector`                   |
| `ColorPicker.tsx`   | ColorPicker               | `Gesture.Pan()` + `GestureDetector`                   |
| `SliderGroup.tsx`   | Slider, RangeSlider       | `Gesture.Pan()` + `GestureDetector`                   |

### Type Fixes

| File                   | Changes                                                             |
| ---------------------- | ------------------------------------------------------------------- |
| `AnimationLibrary.ts`  | New standalone `SpringConfig` interface, `getSpringConfig()` helper |
| `ProgressRing.tsx`     | `SharedValue` direct import                                         |
| `StatCounter.tsx`      | `SharedValue` direct import                                         |
| `AnimatedGradient.tsx` | `SharedValue` direct import                                         |
| `ShaderEffects.tsx`    | `SharedValue` direct import                                         |
| `PullToRefresh.tsx`    | `SharedValue` direct import, prop rename                            |

### Complete Rewrites

| File                  | Reason                                                          |
| --------------------- | --------------------------------------------------------------- |
| `TransitionConfig.ts` | `@react-navigation/stack` → `@react-navigation/native-stack` v7 |

### Additional Fixes

| File                 | Issue                           | Fix                                                                    |
| -------------------- | ------------------------------- | ---------------------------------------------------------------------- |
| `ParticleSystem.ts`  | Interface properties too strict | Made physics/emitter/bounds optional in input types                    |
| `GradientEngine.ts`  | Shadow offset type              | `{ x, y }` → `{ width, height }`                                       |
| `FeedbackSystem.tsx` | LinearGradient colors           | Cast to tuple type                                                     |
| `BlurViewCross.tsx`  | LinearGradient locations        | Cast to tuple type                                                     |
| `platform/index.ts`  | Non-existent exports            | Removed `useLiveActivity`, `DynamicIslandContent`, `LiveActivityState` |
| Index barrel files   | Re-exports not in scope         | Import components before using in default export object                |

## Consequences

### Positive

- **0 TypeScript errors** (down from 222)
- **Better performance** - Gesture API runs entirely on UI thread
- **Native transitions** - Smoother, more consistent animations
- **Future-proof** - Compatible with Reanimated 4.x roadmap
- **Cleaner code** - Gesture composition is more declarative

### Negative

- **Breaking change** - Any external code using old APIs needs migration
- **TransitionConfig API change** - Custom JavaScript interpolators no longer supported
- **Learning curve** - New Gesture API syntax differs from v3

### Neutral

- **File size** - Roughly same after migration
- **Test coverage** - Needs gesture tests updated (future work)

## Migration Guide for Developers

### If adding new animated components:

1. **Import from the right places:**

   ```tsx
   import { Gesture, GestureDetector } from 'react-native-gesture-handler';
   import Animated, {
     useSharedValue,
     useAnimatedStyle,
     withSpring,
     SharedValue, // Direct import, not Animated.SharedValue
   } from 'react-native-reanimated';
   ```

2. **Use getSpringConfig() for withSpring:**

   ```tsx
   import { SPRING_PRESETS, getSpringConfig } from '@/lib/animations/AnimationLibrary';

   // In worklet
   x.value = withSpring(0, getSpringConfig(SPRING_PRESETS.bouncy));
   ```

3. **Use GestureDetector, not PanGestureHandler:**

   ```tsx
   const pan = Gesture.Pan()
     .onUpdate((e) => { 'worklet'; ... });

   <GestureDetector gesture={pan}>
     <Animated.View />
   </GestureDetector>
   ```

4. **Store gesture context in useSharedValue:**

   ```tsx
   const ctx = useSharedValue({ startX: 0, startY: 0 });
   ```

5. **Add 'worklet' directive to gesture callbacks:**
   ```tsx
   .onStart(() => {
     'worklet';  // Required!
     ctx.value = { startX: x.value };
   })
   ```

## Related Documentation

- [React Native Reanimated v4 Migration Guide](https://docs.swmansion.com/react-native-reanimated/docs/guides/migration-from-v3)
- [Gesture Handler v2 Documentation](https://docs.swmansion.com/react-native-gesture-handler/docs/)
- [React Navigation Native Stack](https://reactnavigation.org/docs/native-stack-navigator)
