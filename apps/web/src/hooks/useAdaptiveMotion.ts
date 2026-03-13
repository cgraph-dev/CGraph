/**
 * useAdaptiveMotion - Adaptive motion hook for performance-aware animations
 *
 * Detects user preferences and device capabilities to adjust animation intensity:
 * - Respects prefers-reduced-motion
 * - Detects low-end devices via hardware concurrency
 * - Monitors frame rate and reduces effects if dropping
 * - Provides motion scale factors for animations
 *
 * @example
 * const { shouldAnimate, motionScale, prefersReducedMotion } = useAdaptiveMotion();
 *
 * <motion.div
 *   animate={shouldAnimate ? { scale: 1.1 * motionScale } : undefined}
 * />
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface AdaptiveMotionConfig {
  /** Minimum acceptable FPS before reducing motion (default: 30) */
  minFps?: number;
  /** Number of frames to sample for FPS calculation (default: 60) */
  sampleSize?: number;
  /** How often to check FPS in ms (default: 1000) */
  checkInterval?: number;
  /** Force reduced motion regardless of preferences */
  forceReduced?: boolean;
}

interface AdaptiveMotionState {
  /** Whether animations should be enabled */
  shouldAnimate: boolean;
  /** Scale factor for animation intensity (0-1) */
  motionScale: number;
  /** User prefers reduced motion */
  prefersReducedMotion: boolean;
  /** Device has low hardware capabilities */
  isLowEndDevice: boolean;
  /** Current estimated FPS */
  currentFps: number;
  /** Whether performance is degraded */
  isPerformanceDegraded: boolean;
}

const DEFAULT_CONFIG: Required<AdaptiveMotionConfig> = {
  minFps: 30,
  sampleSize: 60,
  checkInterval: 1000,
  forceReduced: false,
};

/**
 * Detects if the device is low-end based on hardware concurrency
 */
function detectLowEndDevice(): boolean {
  if (typeof navigator === 'undefined') return false;

  // Check hardware concurrency (CPU cores)
  const cores = navigator.hardwareConcurrency || 4;
  if (cores <= 2) return true;

  // Check device memory if available

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const nav = navigator as Navigator & { deviceMemory?: number }; // type assertion: Navigator with optional deviceMemory API
  if (nav.deviceMemory && nav.deviceMemory < 4) return true;

  // Check if mobile device (more conservative with animations)
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  return isMobile && cores <= 4;
}

/**
 * Hook that provides adaptive motion settings based on device capabilities
 * and user preferences
 */
export function useAdaptiveMotion(config: AdaptiveMotionConfig = {}): AdaptiveMotionState {
  const { minFps, sampleSize, checkInterval, forceReduced } = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  const [state, setState] = useState<AdaptiveMotionState>(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined'
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false;

    const isLowEndDevice = detectLowEndDevice();

    return {
      shouldAnimate: !forceReduced && !prefersReducedMotion,
      motionScale: prefersReducedMotion || isLowEndDevice ? 0.5 : 1,
      prefersReducedMotion,
      isLowEndDevice,
      currentFps: 60,
      isPerformanceDegraded: false,
    };
  });

  // FPS monitoring refs
  const frameTimesRef = useRef<number[]>([]);
  const lastFrameTimeRef = useRef<number>(performance.now());
  const rafIdRef = useRef<number | null>(null);

  // Monitor FPS
  const measureFps = useCallback(() => {
    const now = performance.now();
    const delta = now - lastFrameTimeRef.current;
    lastFrameTimeRef.current = now;

    // Add frame time to samples
    frameTimesRef.current.push(delta);
    if (frameTimesRef.current.length > sampleSize) {
      frameTimesRef.current.shift();
    }

    rafIdRef.current = requestAnimationFrame(measureFps);
  }, [sampleSize]);

  // Calculate and update FPS periodically
  useEffect(() => {
    if (forceReduced || state.prefersReducedMotion) return;

    // Start FPS measurement
    rafIdRef.current = requestAnimationFrame(measureFps);

    const intervalId = setInterval(() => {
      const frameTimes = frameTimesRef.current;
      if (frameTimes.length < 10) return;

      // Calculate average FPS
      const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
      const fps = Math.round(1000 / avgFrameTime);

      const isPerformanceDegraded = fps < minFps;
      const motionScale = isPerformanceDegraded
        ? Math.max(0.3, fps / 60)
        : state.isLowEndDevice
          ? 0.7
          : 1;

      setState((prev) => ({
        ...prev,
        currentFps: fps,
        isPerformanceDegraded,
        motionScale,
        shouldAnimate: !isPerformanceDegraded || fps > 15,
      }));
    }, checkInterval);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      clearInterval(intervalId);
    };
  }, [
    forceReduced,
    state.prefersReducedMotion,
    state.isLowEndDevice,
    minFps,
    checkInterval,
    measureFps,
  ]);

  // Listen for prefers-reduced-motion changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleChange = (e: MediaQueryListEvent) => {
      setState((prev) => ({
        ...prev,
        prefersReducedMotion: e.matches,
        shouldAnimate: !forceReduced && !e.matches,
        motionScale: e.matches ? 0.3 : prev.isLowEndDevice ? 0.7 : 1,
      }));
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [forceReduced]);

  return state;
}

/**
 * Get motion presets based on adaptive motion state
 */
export function getAdaptiveAnimationProps(state: AdaptiveMotionState) {
  if (!state.shouldAnimate) {
    return {
      initial: false,
      animate: false,
      exit: false,
      transition: { duration: 0 },
    };
  }

  const baseDuration = 0.3 * (2 - state.motionScale); // Faster on lower scale

  return {
    transition: {
      duration: baseDuration,
      ease: state.motionScale < 0.7 ? 'easeOut' : [0.4, 0, 0.2, 1],
    },
  };
}

export default useAdaptiveMotion;
