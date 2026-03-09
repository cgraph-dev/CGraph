/**
 * LottieOverlay Component
 *
 * Renders a Lottie animation as an absolute-positioned overlay on its
 * parent container.  Used to display profile effects (sparkles, snow,
 * fire vortex, etc.) on top of the profile card.
 *
 * The component:
 * - Resolves the effect ID via PROFILE_EFFECT_REGISTRY
 * - Fetches the Lottie JSON data from the asset map
 * - Dynamically imports lottie-web (light build) to render
 * - Respects prefers-reduced-motion
 * - Pauses when scrolled out of view via IntersectionObserver
 * - Gracefully handles null/missing effect IDs
 *
 * @module components/lottie/lottie-overlay
 */

import { memo, useRef, useEffect, useState, useCallback } from 'react';
import type { AnimationItem } from 'lottie-web';
import { getProfileEffectById } from '@cgraph/animation-constants';
import { getProfileEffectSource } from '@/assets/lottie/effects/effectMap';
import { usePrefersReducedMotion } from '@/hooks';

// ── Types ──────────────────────────────────────────────────────────────

export interface LottieOverlayProps {
  /** Profile effect ID from the registry (null = hidden). */
  effectId: string | null | undefined;
  /** CSS opacity for the overlay layer. @default 0.85 */
  opacity?: number;
  /** CSS mix-blend-mode. @default 'screen' */
  blendMode?: React.CSSProperties['mixBlendMode'];
  /** Playback speed multiplier. @default 1 */
  speed?: number;
  /** Additional CSS class. */
  className?: string;
}

// ── Active animation budget ────────────────────────────────────────────

let activeOverlayCount = 0;
const MAX_CONCURRENT_OVERLAYS = 4;

// ── Component ──────────────────────────────────────────────────────────

/**
 * Absolute-positioned Lottie overlay for profile card effects.
 *
 * Renders nothing when `effectId` is null/undefined or 'effect_none'.
 * Falls back gracefully if the animation data is unavailable.
 */
export const LottieOverlay = memo(function LottieOverlay({
  effectId,
  opacity = 0.85,
  blendMode = 'screen',
  speed = 1,
  className,
}: LottieOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationItem | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  // ── Resolve effect ───────────────────────────────────────────────────

  const entry = effectId ? getProfileEffectById(effectId) : undefined;
  const isNone = !effectId || effectId === 'effect_none' || !entry?.lottieFile;
  const animationData = isNone ? undefined : getProfileEffectSource(effectId);

  // ── Visibility tracking ──────────────────────────────────────────────

  useEffect(() => {
    if (isNone) return;
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([observedEntry]) => {
        setIsVisible(!!observedEntry?.isIntersecting);
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isNone]);

  // ── Load and manage Lottie animation ─────────────────────────────────

  useEffect(() => {
    if (isNone || prefersReducedMotion || hasError || !animationData) return;
    if (!containerRef.current) return;

    let cancelled = false;
    const container = containerRef.current;

    async function init() {
      try {
        const lottie = (await import('lottie-web/build/player/lottie_light')).default;
        if (cancelled) return;

        const anim = lottie.loadAnimation({
          container,
          renderer: 'svg',
          loop: true,
          autoplay: false,
          // Lottie JSON data resolved from the asset map
          animationData: animationData,
        });

        anim.addEventListener('DOMLoaded', () => {
          if (cancelled) return;
          if (speed !== 1) anim.setSpeed(speed);
          animRef.current = anim;
          setIsLoaded(true);
        });

        anim.addEventListener('data_failed', () => {
          if (!cancelled) setHasError(true);
        });
      } catch {
        if (!cancelled) setHasError(true);
      }
    }

    void init();

    return () => {
      cancelled = true;
      if (animRef.current) {
        animRef.current.destroy();
        animRef.current = null;
      }
      setIsLoaded(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectId, animationData, prefersReducedMotion, speed]);

  // ── Play / pause based on visibility + concurrency budget ────────────

  const playAnim = useCallback(() => {
    const anim = animRef.current;
    if (!anim || anim.isPaused === false) return;
    if (activeOverlayCount >= MAX_CONCURRENT_OVERLAYS) return;
    activeOverlayCount++;
    anim.play();
  }, []);

  const pauseAnim = useCallback(() => {
    const anim = animRef.current;
    if (!anim || anim.isPaused) return;
    activeOverlayCount = Math.max(0, activeOverlayCount - 1);
    anim.pause();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (isVisible) {
      playAnim();
    } else {
      pauseAnim();
    }
    return () => {
      pauseAnim();
    };
  }, [isVisible, isLoaded, playAnim, pauseAnim]);

  // ── Render nothing for no-effect / reduced-motion / error ────────────

  if (isNone || prefersReducedMotion || hasError) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={className}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        opacity,
        mixBlendMode: blendMode,
        zIndex: 20,
        overflow: 'hidden',
        borderRadius: 'inherit',
      }}
    />
  );
});

export default LottieOverlay;
