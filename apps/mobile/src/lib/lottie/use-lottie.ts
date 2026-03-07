/**
 * useLottie — React Native hook for Lottie animation state
 *
 * Manages loading from filesystem cache or CDN, exposes play/pause/reset
 * controls, and integrates with the reduced-motion accessibility setting.
 *
 * @module lib/lottie/use-lottie
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { AccessibilityInfo } from 'react-native';
import type LottieView from 'lottie-react-native';
import { lottieCache } from './lottie-cache';
import { emojiToCodepoint, getLottieCdnUrl } from './lottie-types';

interface UseLottieConfig {
  /** Unicode codepoint (e.g. "1f600") — takes precedence over emoji */
  codepoint?: string;
  /** Emoji character to derive codepoint from */
  emoji?: string;
  /** Direct URL to a Lottie JSON file */
  url?: string;
  /** Start playing immediately */
  autoplay?: boolean;
  /** Loop the animation */
  loop?: boolean;
}

interface UseLottieReturn {
  /** Lottie source — file URI string or remote URL */
  source: string | null;
  /** Whether the animation is currently loading */
  isLoading: boolean;
  /** Whether the system has reduced motion enabled */
  reducedMotion: boolean;
  /** Ref to attach to LottieView */
  animationRef: React.RefObject<LottieView | null>;
  /** Play the animation from current frame */
  play: () => void;
  /** Pause the animation */
  pause: () => void;
  /** Reset and optionally replay */
  reset: (andPlay?: boolean) => void;
}

/**
 * Hook for loading and controlling Lottie animations with filesystem caching.
 */
export function useLottie(config: UseLottieConfig): UseLottieReturn {
  const { codepoint: rawCodepoint, emoji, url, autoplay = false } = config;

  const resolvedCodepoint = rawCodepoint || (emoji ? emojiToCodepoint(emoji) : undefined);

  const [source, setSource] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const animationRef = useRef<LottieView | null>(null);

  // Check reduced-motion preference
  useEffect(() => {
    const check = async () => {
      const isReduced = await AccessibilityInfo.isReduceMotionEnabled();
      setReducedMotion(isReduced);
    };
    check();

    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    return () => sub.remove();
  }, []);

  // Load from cache or fetch
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);

      try {
        if (url) {
          // Direct URL — use as-is
          if (!cancelled) setSource(url);
        } else if (resolvedCodepoint) {
          // Try filesystem cache first
          const cached = await lottieCache.get(resolvedCodepoint);
          if (cached) {
            if (!cancelled) setSource(cached);
          } else {
            // Download and cache
            try {
              const filePath = await lottieCache.fetchAndCache(resolvedCodepoint);
              if (!cancelled) setSource(filePath);
            } catch {
              // Fallback to direct CDN URL (no cache)
              if (!cancelled) setSource(getLottieCdnUrl(resolvedCodepoint));
            }
          }
        }
      } catch {
        // Source stays null — fallback image will render
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [resolvedCodepoint, url]);

  const play = useCallback(() => {
    animationRef.current?.play();
  }, []);

  const pause = useCallback(() => {
    animationRef.current?.pause();
  }, []);

  const reset = useCallback(
    (andPlay = true) => {
      animationRef.current?.reset();
      if (andPlay && autoplay) {
        animationRef.current?.play();
      }
    },
    [autoplay],
  );

  return { source, isLoading, reducedMotion, animationRef, play, pause, reset };
}
