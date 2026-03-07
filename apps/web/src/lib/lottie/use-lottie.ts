/**
 * React hook for Lottie animation lifecycle management.
 *
 * Handles:
 * - prefers-reduced-motion detection
 * - IndexedDB cache-first fetching
 * - lottie-web player initialisation
 * - hover play/pause
 * - cleanup on unmount
 *
 * @module lib/lottie/use-lottie
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { AnimationItem } from 'lottie-web';

import { lottieCache } from './lottie-cache';
import type { LottieAnimationData } from './lottie-types';

// ── Reduced-motion helper ──────────────────────────────────────────

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return reduced;
}

// ── Hook ───────────────────────────────────────────────────────────

export interface UseLottieConfig {
  /** Unicode codepoint to load (e.g. "1f600"). */
  codepoint: string;
  /** Ref to the container <div> that receives the animation. */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Start playing immediately. @default false */
  autoplay?: boolean;
  /** Loop the animation continuously. @default false */
  loop?: boolean;
  /** Play animation only while hovering the container. @default true */
  playOnHover?: boolean;
  /** Replay animation from start every N milliseconds. 0 = disabled. @default 0 */
  replayInterval?: number;
}

export interface UseLottieReturn {
  isLoaded: boolean;
  isPlaying: boolean;
  play: () => void;
  pause: () => void;
  stop: () => void;
  error: string | null;
  prefersReducedMotion: boolean;
}

/** Manage Lottie animation lifecycle: fetch, cache, render, and hover play/pause. */
export function useLottie({
  codepoint,
  containerRef,
  autoplay = false,
  loop = false,
  playOnHover = true,
  replayInterval = 0,
}: UseLottieConfig): UseLottieReturn {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const animRef = useRef<AnimationItem | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  // Load animation data and initialise lottie-web player
  useEffect(() => {
    if (prefersReducedMotion) return;
    if (!containerRef.current) return;

    let cancelled = false;
    const container = containerRef.current;

    async function init() {
      try {
        // 1. Fetch animation data (cache-first)
        const animData: LottieAnimationData | null = await lottieCache.fetchAnimation(codepoint);

        if (cancelled || !animData) {
          if (!animData) setError('Animation not found');
          return;
        }

        // 2. Dynamically import the light SVG-only build (~150KB)
        const lottie = (await import('lottie-web/build/player/lottie_light')).default;

        if (cancelled) return;

        // 3. Initialise player
        const anim = lottie.loadAnimation({
          container,
          renderer: 'svg',
          loop,
          autoplay: autoplay && !playOnHover,
          animationData: animData,
        });

        animRef.current = anim;

        anim.addEventListener('DOMLoaded', () => {
          if (!cancelled) {
            setIsLoaded(true);
            if (autoplay && !playOnHover) setIsPlaying(true);
          }
        });

        anim.addEventListener('loopComplete', () => {
          if (!loop && !cancelled) setIsPlaying(false);
        });

        anim.addEventListener('complete', () => {
          if (!cancelled) setIsPlaying(false);
        });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load animation');
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      if (animRef.current) {
        animRef.current.destroy();
        animRef.current = null;
      }
      setIsLoaded(false);
      setIsPlaying(false);
    };
  }, [codepoint, containerRef, autoplay, loop, playOnHover, prefersReducedMotion]);

  // Periodic replay — restarts animation every `replayInterval` ms
  useEffect(() => {
    if (!replayInterval || replayInterval <= 0 || prefersReducedMotion) return;
    // Play once immediately when loaded
    const anim = animRef.current;
    if (anim && isLoaded) {
      anim.goToAndPlay(0);
      setIsPlaying(true);
    }
    const id = setInterval(() => {
      const a = animRef.current;
      if (a) {
        a.goToAndPlay(0);
        setIsPlaying(true);
      }
    }, replayInterval);
    return () => clearInterval(id);
  }, [replayInterval, isLoaded, prefersReducedMotion]);

  // Hover play / pause
  useEffect(() => {
    if (!playOnHover || prefersReducedMotion) return;
    const container = containerRef.current;
    if (!container) return;

    const handleEnter = () => {
      const anim = animRef.current;
      if (anim) {
        anim.goToAndPlay(0);
        setIsPlaying(true);
      }
    };

    const handleLeave = () => {
      const anim = animRef.current;
      if (anim) {
        anim.goToAndStop(0);
        setIsPlaying(false);
      }
    };

    container.addEventListener('mouseenter', handleEnter);
    container.addEventListener('mouseleave', handleLeave);

    return () => {
      container.removeEventListener('mouseenter', handleEnter);
      container.removeEventListener('mouseleave', handleLeave);
    };
  }, [playOnHover, containerRef, prefersReducedMotion]);

  // ── Imperative controls ──────────────────────────────────────────

  const play = useCallback(() => {
    animRef.current?.play();
    setIsPlaying(true);
  }, []);

  const pause = useCallback(() => {
    animRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const stop = useCallback(() => {
    animRef.current?.goToAndStop(0);
    setIsPlaying(false);
  }, []);

  return { isLoaded, isPlaying, play, pause, stop, error, prefersReducedMotion };
}
