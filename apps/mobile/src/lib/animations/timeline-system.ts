/**
 * TimelineSystem - Animation Timeline & Choreography Engine
 *
 * Features:
 * - Keyframe animation builder
 * - Timeline sequencing with parallel/serial execution
 * - Animation choreography for complex UI patterns
 * - Stagger utilities for list animations
 * - Loop and repeat configurations
 */

import {
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
  SharedValue,
  cancelAnimation,
} from 'react-native-reanimated';

import { SPRING_PRESETS, EASING_FUNCTIONS } from './animation-library';

// ============================================================================
// Types
// ============================================================================

export interface Keyframe {
  value: number;
  duration?: number;
  easing?: keyof typeof EASING_FUNCTIONS;
  spring?: keyof typeof SPRING_PRESETS;
}

export interface KeyframeAnimation {
  keyframes: Keyframe[];
  totalDuration: number;
}

export interface TimelineStep {
  id: string;
  type: 'animation' | 'delay' | 'callback';
  target?: SharedValue<number>;
  animation?: KeyframeAnimation;
  delay?: number;
  callback?: () => void;
  parallel?: boolean; // If true, runs with the next step
}

export interface Timeline {
  steps: TimelineStep[];
  loop?: boolean;
  loopCount?: number;
  onComplete?: () => void;
}

export interface ChoreographyConfig {
  stagger?: number;
  direction?: 'forward' | 'reverse' | 'center' | 'edges';
  easing?: keyof typeof EASING_FUNCTIONS;
  spring?: keyof typeof SPRING_PRESETS;
}

// ============================================================================
// Keyframe Builder
// ============================================================================

export class KeyframeBuilder {
  private keyframes: Keyframe[] = [];
  private currentDuration: number = 0;

  static create(): KeyframeBuilder {
    return new KeyframeBuilder();
  }

  to(value: number, duration: number = 300): KeyframeBuilder {
    this.keyframes.push({ value, duration });
    this.currentDuration += duration;
    return this;
  }

  spring(value: number, preset: keyof typeof SPRING_PRESETS = 'default'): KeyframeBuilder {
    this.keyframes.push({ value, spring: preset });
    this.currentDuration += 500; // Approximate spring duration
    return this;
  }

  eased(
    value: number,
    duration: number = 300,
    easing: keyof typeof EASING_FUNCTIONS = 'easeInOut'
  ): KeyframeBuilder {
    this.keyframes.push({ value, duration, easing });
    this.currentDuration += duration;
    return this;
  }

  hold(duration: number): KeyframeBuilder {
    if (this.keyframes.length > 0) {
      const lastKeyframe = this.keyframes[this.keyframes.length - 1];
      if (lastKeyframe) {
        this.keyframes.push({ value: lastKeyframe.value, duration });
        this.currentDuration += duration;
      }
    }
    return this;
  }

  build(): KeyframeAnimation {
    return {
      keyframes: [...this.keyframes],
      totalDuration: this.currentDuration,
    };
  }
}

// ============================================================================
// Timeline Builder
// ============================================================================

export class TimelineBuilder {
  private steps: TimelineStep[] = [];
  private stepIdCounter: number = 0;

  static create(): TimelineBuilder {
    return new TimelineBuilder();
  }

  private generateStepId(): string {
    return `step_${this.stepIdCounter++}`;
  }

  animate(
    target: SharedValue<number>,
    animation: KeyframeAnimation,
    parallel: boolean = false
  ): TimelineBuilder {
    this.steps.push({
      id: this.generateStepId(),
      type: 'animation',
      target,
      animation,
      parallel,
    });
    return this;
  }

  delay(duration: number): TimelineBuilder {
    this.steps.push({
      id: this.generateStepId(),
      type: 'delay',
      delay: duration,
    });
    return this;
  }

  call(callback: () => void): TimelineBuilder {
    this.steps.push({
      id: this.generateStepId(),
      type: 'callback',
      callback,
    });
    return this;
  }

  parallel(
    animations: Array<{ target: SharedValue<number>; animation: KeyframeAnimation }>
  ): TimelineBuilder {
    animations.forEach((anim, index) => {
      this.steps.push({
        id: this.generateStepId(),
        type: 'animation',
        target: anim.target,
        animation: anim.animation,
        parallel: index < animations.length - 1,
      });
    });
    return this;
  }

  build(): Timeline {
    return {
      steps: [...this.steps],
    };
  }
}

// ============================================================================
// Timeline Runner
// ============================================================================

export function runKeyframeAnimation(
  target: SharedValue<number>,
  animation: KeyframeAnimation
): void {
  const { keyframes } = animation;

  if (keyframes.length === 0) return;

  const animations = keyframes.map((keyframe) => {
    if (keyframe.spring) {
      const springConfig = SPRING_PRESETS[keyframe.spring];
      return withSpring(keyframe.value, springConfig);
    }

    const duration = keyframe.duration || 300;
    const easingFn = keyframe.easing
      ? EASING_FUNCTIONS[keyframe.easing]
      : Easing.inOut(Easing.ease);

    return withTiming(keyframe.value, { duration, easing: easingFn });
  });

  if (animations.length === 1 && animations[0]) {
    target.value = animations[0];
  } else if (animations.length > 1) {
    target.value = withSequence(...(animations as [any, any, ...any[]]));
  }
}

export async function runTimeline(timeline: Timeline): Promise<void> {
  const { steps } = timeline;
  let currentIndex = 0;

  const executeStep = async (step: TimelineStep): Promise<void> => {
    switch (step.type) {
      case 'animation':
        if (step.target && step.animation) {
          runKeyframeAnimation(step.target, step.animation);
          if (!step.parallel) {
            // Wait for animation to complete
            await new Promise((resolve) => setTimeout(resolve, step.animation!.totalDuration));
          }
        }
        break;

      case 'delay':
        if (step.delay) {
          await new Promise((resolve) => setTimeout(resolve, step.delay));
        }
        break;

      case 'callback':
        if (step.callback) {
          step.callback();
        }
        break;
    }
  };

  while (currentIndex < steps.length) {
    const currentStep = steps[currentIndex];
    if (currentStep) {
      await executeStep(currentStep);
    }
    currentIndex++;
  }

  if (timeline.onComplete) {
    timeline.onComplete();
  }
}

// ============================================================================
// Choreography Utilities
// ============================================================================

export function createStaggeredAnimation(
  targets: SharedValue<number>[],
  animation: KeyframeAnimation,
  config: ChoreographyConfig = {}
): void {
  const { stagger = 50, direction = 'forward', spring } = config;

  let indices: number[];

  switch (direction) {
    case 'reverse':
      indices = targets.map((_, i) => targets.length - 1 - i);
      break;
    case 'center': {
      const center = Math.floor(targets.length / 2);
      indices = targets
        .map((_, i) => i)
        .sort((a, b) => Math.abs(a - center) - Math.abs(b - center));
      break;
    }
    case 'edges': {
      indices = [];
      let left = 0;
      let right = targets.length - 1;
      while (left <= right) {
        if (left === right) {
          indices.push(left);
        } else {
          indices.push(left, right);
        }
        left++;
        right--;
      }
      break;
    }
    default: // forward
      indices = targets.map((_, i) => i);
  }

  indices.forEach((targetIndex, orderIndex) => {
    const target = targets[targetIndex];
    if (!target) return;

    const delay = orderIndex * stagger;
    const { keyframes } = animation;

    if (keyframes.length === 0) return;

    const animations = keyframes.map((keyframe) => {
      if (spring || keyframe.spring) {
        const springConfig = SPRING_PRESETS[spring || keyframe.spring || 'default'];
        return withSpring(keyframe.value, springConfig);
      }

      const duration = keyframe.duration || 300;
      const easingFn = keyframe.easing
        ? EASING_FUNCTIONS[keyframe.easing]
        : Easing.inOut(Easing.ease);

      return withTiming(keyframe.value, { duration, easing: easingFn });
    });

    if (animations.length === 1 && animations[0]) {
      target.value = withDelay(delay, animations[0]);
    } else if (animations.length > 1) {
      target.value = withDelay(delay, withSequence(...(animations as [any, any, ...any[]])));
    }
  });
}

export function createWaveAnimation(
  targets: SharedValue<number>[],
  fromValue: number,
  toValue: number,
  config: {
    waveDuration?: number;
    wavelength?: number;
    amplitude?: number;
  } = {}
): void {
  const { waveDuration = 2000, wavelength = 4, amplitude = 1 } = config;

  const phaseOffset = (2 * Math.PI) / wavelength;

  targets.forEach((target, index) => {
    const phase = index * phaseOffset;
    const delay = (phase / (2 * Math.PI)) * waveDuration;

    const animation = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(toValue * amplitude, { duration: waveDuration / 2 }),
          withTiming(fromValue, { duration: waveDuration / 2 })
        ),
        -1,
        true
      )
    );

    target.value = animation;
  });
}

export function createPulseAnimation(
  target: SharedValue<number>,
  config: {
    fromValue?: number;
    toValue?: number;
    duration?: number;
    repeatCount?: number;
  } = {}
): void {
  const { fromValue = 1, toValue = 1.1, duration = 1000, repeatCount = -1 } = config;

  target.value = withRepeat(
    withSequence(
      withTiming(toValue, { duration: duration / 2 }),
      withTiming(fromValue, { duration: duration / 2 })
    ),
    repeatCount,
    true
  );
}

export function createShakeAnimation(
  target: SharedValue<number>,
  config: {
    intensity?: number;
    duration?: number;
    shakes?: number;
  } = {}
): void {
  const { intensity = 10, duration = 500, shakes = 5 } = config;

  const shakeDuration = duration / (shakes * 2 + 1);
  const shakeAnimations: unknown[] = [];

  for (let i = 0; i < shakes; i++) {
    const direction = i % 2 === 0 ? 1 : -1;
    const dampedIntensity = intensity * (1 - i / shakes);

    shakeAnimations.push(withTiming(direction * dampedIntensity, { duration: shakeDuration }));
    shakeAnimations.push(withTiming(-direction * dampedIntensity, { duration: shakeDuration }));
  }

  shakeAnimations.push(withTiming(0, { duration: shakeDuration }));

  target.value = withSequence(...(shakeAnimations as [any, any, ...any[]]));
}

export function createBounceAnimation(
  target: SharedValue<number>,
  config: {
    toValue?: number;
    duration?: number;
    bounces?: number;
  } = {}
): void {
  const { toValue = -30, duration = 1000, bounces = 3 } = config;

  const bounceAnimations: unknown[] = [];
  const bounceDuration = duration / (bounces * 2);

  for (let i = 0; i < bounces; i++) {
    const dampedValue = toValue * Math.pow(0.6, i);
    bounceAnimations.push(
      withTiming(dampedValue, { duration: bounceDuration, easing: Easing.out(Easing.quad) })
    );
    bounceAnimations.push(
      withTiming(0, { duration: bounceDuration, easing: Easing.in(Easing.quad) })
    );
  }

  target.value = withSequence(...(bounceAnimations as [any, any, ...any[]]));
}

export function stopAnimation(target: SharedValue<number>): void {
  cancelAnimation(target);
}

export function stopAllAnimations(targets: SharedValue<number>[]): void {
  targets.forEach((target) => cancelAnimation(target));
}

// ============================================================================
// Preset Choreographies
// ============================================================================

export const CHOREOGRAPHY_PRESETS = {
  cascadeIn: (targets: SharedValue<number>[]) =>
    createStaggeredAnimation(targets, KeyframeBuilder.create().to(0).spring(1).build(), {
      stagger: 50,
      direction: 'forward',
    }),

  cascadeOut: (targets: SharedValue<number>[]) =>
    createStaggeredAnimation(targets, KeyframeBuilder.create().to(1).spring(0).build(), {
      stagger: 50,
      direction: 'reverse',
    }),

  explodeIn: (targets: SharedValue<number>[]) =>
    createStaggeredAnimation(
      targets,
      KeyframeBuilder.create().to(0).spring(1, 'superBouncy').build(),
      { stagger: 30, direction: 'center' }
    ),

  implodeOut: (targets: SharedValue<number>[]) =>
    createStaggeredAnimation(targets, KeyframeBuilder.create().to(1).spring(0, 'snappy').build(), {
      stagger: 30,
      direction: 'edges',
    }),

  wave: (targets: SharedValue<number>[]) =>
    createWaveAnimation(targets, 0, 1, { waveDuration: 2000, wavelength: 4 }),

  ripple: (targets: SharedValue<number>[]) =>
    createStaggeredAnimation(
      targets,
      KeyframeBuilder.create().to(0).eased(1.2, 150).eased(0.9, 100).spring(1).build(),
      { stagger: 40, direction: 'center' }
    ),
};

// ============================================================================
// Default Export
// ============================================================================

const TimelineSystem = {
  // Builders
  KeyframeBuilder,
  TimelineBuilder,

  // Runners
  runKeyframeAnimation,
  runTimeline,

  // Choreography
  createStaggeredAnimation,
  createWaveAnimation,
  createPulseAnimation,
  createShakeAnimation,
  createBounceAnimation,
  stopAnimation,
  stopAllAnimations,

  // Presets
  CHOREOGRAPHY_PRESETS,
};

export default TimelineSystem;
