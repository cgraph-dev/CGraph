/**
 * Tests for useAdaptiveMotion hook and getAdaptiveAnimationProps.
 *
 * Verifies motion adaptation based on device capabilities, user preferences,
 * and runtime FPS measurements.
 *
 * @module hooks/__tests__/useAdaptiveMotion.test
 */

import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAdaptiveMotion, getAdaptiveAnimationProps } from '../useAdaptiveMotion';

// Mock matchMedia default (no reduced motion)
const createMatchMedia = (matches: boolean) =>
  vi.fn().mockImplementation((query: string) => {
    const listeners: Array<(e: MediaQueryListEvent) => void> = [];
    return {
      matches: query === '(prefers-reduced-motion: reduce)' ? matches : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((_type: string, cb: (e: MediaQueryListEvent) => void) =>
        listeners.push(cb)
      ),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      _listeners: listeners,
    };
  });

describe('useAdaptiveMotion', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Default: capable device, no reduced motion preference
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      value: 8,
      writable: true,
      configurable: true,
    });
    window.matchMedia = createMatchMedia(false);
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(
      (cb) => setTimeout(() => cb(performance.now()), 16) as unknown as number
    );
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) =>
      clearTimeout(id as unknown as ReturnType<typeof setTimeout>)
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('enables animations by default on capable devices', () => {
    const { result } = renderHook(() => useAdaptiveMotion());

    expect(result.current.shouldAnimate).toBe(true);
    expect(result.current.motionScale).toBe(1);
    expect(result.current.prefersReducedMotion).toBe(false);
    expect(result.current.currentFps).toBe(60);
  });

  it('respects forceReduced config', () => {
    const { result } = renderHook(() => useAdaptiveMotion({ forceReduced: true }));

    expect(result.current.shouldAnimate).toBe(false);
  });

  it('detects prefers-reduced-motion', () => {
    window.matchMedia = createMatchMedia(true);

    const { result } = renderHook(() => useAdaptiveMotion());

    expect(result.current.prefersReducedMotion).toBe(true);
    expect(result.current.shouldAnimate).toBe(false);
    expect(result.current.motionScale).toBeLessThanOrEqual(0.5);
  });

  it('detects low-end devices based on hardware concurrency', () => {
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      value: 2,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useAdaptiveMotion());

    expect(result.current.isLowEndDevice).toBe(true);
    expect(result.current.motionScale).toBeLessThanOrEqual(0.5);
  });

  it('detects low-end devices based on deviceMemory', () => {
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      value: 8,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(navigator, 'deviceMemory', {
      value: 2,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useAdaptiveMotion());

    expect(result.current.isLowEndDevice).toBe(true);
  });

  it('starts with default FPS of 60', () => {
    const { result } = renderHook(() => useAdaptiveMotion());
    expect(result.current.currentFps).toBe(60);
    expect(result.current.isPerformanceDegraded).toBe(false);
  });

  it('cleans up on unmount', () => {
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');

    const { unmount } = renderHook(() => useAdaptiveMotion());
    unmount();

    expect(cancelSpy).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// getAdaptiveAnimationProps Tests
// ---------------------------------------------------------------------------

describe('getAdaptiveAnimationProps', () => {
  it('disables all motion when shouldAnimate is false', () => {
    const props = getAdaptiveAnimationProps({
      shouldAnimate: false,
      motionScale: 0,
      prefersReducedMotion: true,
      isLowEndDevice: false,
      currentFps: 60,
      isPerformanceDegraded: false,
    });

    expect(props.initial).toBe(false);
    expect(props.animate).toBe(false);
    expect(props.exit).toBe(false);
    expect(props.transition.duration).toBe(0);
  });

  it('returns full animation props at motionScale 1', () => {
    const props = getAdaptiveAnimationProps({
      shouldAnimate: true,
      motionScale: 1,
      prefersReducedMotion: false,
      isLowEndDevice: false,
      currentFps: 60,
      isPerformanceDegraded: false,
    });

    expect(props.transition.duration).toBeCloseTo(0.3);
    // Uses spring-like ease for full scale
    expect(props.transition.ease).toEqual([0.4, 0, 0.2, 1]);
  });

  it('uses simpler easing at low motionScale', () => {
    const props = getAdaptiveAnimationProps({
      shouldAnimate: true,
      motionScale: 0.5,
      prefersReducedMotion: false,
      isLowEndDevice: true,
      currentFps: 30,
      isPerformanceDegraded: true,
    });

    expect(props.transition.ease).toBe('easeOut');
    // Duration should be faster at lower scale
    expect(props.transition.duration).toBeGreaterThan(0);
    expect(props.transition.duration).toBeLessThan(0.5);
  });

  it('adjusts duration based on motionScale', () => {
    const fullProps = getAdaptiveAnimationProps({
      shouldAnimate: true,
      motionScale: 1,
      prefersReducedMotion: false,
      isLowEndDevice: false,
      currentFps: 60,
      isPerformanceDegraded: false,
    });

    const reducedProps = getAdaptiveAnimationProps({
      shouldAnimate: true,
      motionScale: 0.5,
      prefersReducedMotion: false,
      isLowEndDevice: true,
      currentFps: 30,
      isPerformanceDegraded: true,
    });

    // Lower motionScale → faster duration (less time spent animating)
    expect(reducedProps.transition.duration).toBeGreaterThan(fullProps.transition.duration);
  });
});
