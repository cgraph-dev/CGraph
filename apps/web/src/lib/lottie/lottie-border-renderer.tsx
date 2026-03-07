/**
 * LottieBorderRenderer Component
 *
 * Renders a Lottie animation as a circular border around an avatar.
 * Uses CSS clip-path and radial-gradient mask to create a ring effect.
 *
 * Performance constraints:
 * - Canvas renderer for avatars < 64px, SVG for 64px+
 * - Max 2 concurrent Lottie border animations in viewport (IntersectionObserver)
 * - Auto-pause when scrolled out of view
 * - Respects prefers-reduced-motion
 *
 * @module lib/lottie/lottie-border-renderer
 */

import { useRef, useEffect, useState, useCallback, memo } from 'react';
import type { AnimationItem } from 'lottie-web';

// ── Types ──────────────────────────────────────────────────────────────

export interface LottieBorderConfig {
  /** Loop the animation. @default true */
  loop?: boolean;
  /** Playback speed multiplier. @default 1.0 */
  speed?: number;
  /** Segment to play [inFrame, outFrame]. */
  segment?: [number, number];
}

export interface LottieBorderProps {
  /** URL to the Lottie JSON animation file. */
  lottieUrl: string;
  /** Avatar size in pixels (e.g. 48, 64, 96, 128). */
  avatarSize: number;
  /** Border thickness in pixels. @default 3 */
  borderWidth?: number;
  /** Lottie playback configuration. */
  lottieConfig?: LottieBorderConfig;
  /** Avatar content. */
  children: React.ReactNode;
  /** Fallback border color when Lottie fails to load. @default '#6366f1' */
  fallbackColor?: string;
  /** Additional className. */
  className?: string;
}

// ── Active animation counter (max 2 concurrent) ───────────────────────

let activeAnimationCount = 0;
const MAX_CONCURRENT_ANIMATIONS = 2;

// ── Reduced motion hook ───────────────────────────────────────────────

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

// ── Component ─────────────────────────────────────────────────────────

/**
 * Renders a Lottie animation as a circular ring border around children (avatar).
 *
 * Falls back to a static CSS border ring when:
 * - User prefers reduced motion
 * - Lottie animation fails to load
 * - Max concurrent animation limit is reached
 */
export const LottieBorderRenderer = memo(function LottieBorderRenderer({
  lottieUrl,
  avatarSize,
  borderWidth = 3,
  lottieConfig,
  children,
  fallbackColor = '#6366f1',
  className,
}: LottieBorderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationItem | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  const totalSize = avatarSize + borderWidth * 2;
  const renderer = avatarSize < 64 ? 'canvas' : 'svg';

  // IntersectionObserver: track visibility
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(!!entry?.isIntersecting);
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Load and manage Lottie animation
  useEffect(() => {
    if (prefersReducedMotion || error) return;
    if (!containerRef.current) return;

    let cancelled = false;
    const container = containerRef.current;

    async function init() {
      try {
        // Dynamically import lottie-web (light build)
        const lottie = (await import('lottie-web/build/player/lottie_light')).default;
        if (cancelled) return;

        const anim = lottie.loadAnimation({
          container,
          // renderer type from lottie-web accepts 'svg' | 'canvas' | 'html'
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- lottie-web API requires this form
          renderer: renderer as 'svg' | 'canvas',
          loop: lottieConfig?.loop ?? true,
          autoplay: false,
          path: lottieUrl,
        });

        anim.addEventListener('DOMLoaded', () => {
          if (cancelled) return;
          if (lottieConfig?.speed) {
            anim.setSpeed(lottieConfig.speed);
          }
          if (lottieConfig?.segment) {
            anim.playSegments(lottieConfig.segment, true);
          }
          animRef.current = anim;
          setIsLoaded(true);
        });

        anim.addEventListener('data_failed', () => {
          if (!cancelled) setError(true);
        });
      } catch {
        if (!cancelled) setError(true);
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
  }, [lottieUrl, prefersReducedMotion]);

  // Play/pause based on visibility + concurrency budget
  const playAnim = useCallback(() => {
    const anim = animRef.current;
    if (!anim || anim.isPaused === false) return;
    if (activeAnimationCount >= MAX_CONCURRENT_ANIMATIONS) return;
    activeAnimationCount++;
    anim.play();
  }, []);

  const pauseAnim = useCallback(() => {
    const anim = animRef.current;
    if (!anim || anim.isPaused) return;
    activeAnimationCount = Math.max(0, activeAnimationCount - 1);
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

  // Fallback: reduced motion or error → static CSS ring
  if (prefersReducedMotion || error) {
    return (
      <div
        className={className}
        style={{
          position: 'relative',
          width: totalSize,
          height: totalSize,
        }}
      >
        {/* Static ring fallback */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: `${borderWidth}px solid ${fallbackColor}`,
          }}
        />
        {/* Avatar */}
        <div
          style={{
            position: 'absolute',
            top: borderWidth,
            left: borderWidth,
            width: avatarSize,
            height: avatarSize,
            borderRadius: '50%',
            overflow: 'hidden',
          }}
        >
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: totalSize,
        height: totalSize,
      }}
    >
      {/* Lottie animation layer (behind avatar, masked into a ring) */}
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          inset: 0,
          clipPath: `circle(${totalSize / 2}px at center)`,
          WebkitMaskImage: `radial-gradient(circle ${avatarSize / 2}px at center, transparent ${
            avatarSize / 2 - 1
          }px, black ${avatarSize / 2}px)`,
          maskImage: `radial-gradient(circle ${avatarSize / 2}px at center, transparent ${
            avatarSize / 2 - 1
          }px, black ${avatarSize / 2}px)`,
        }}
      />

      {/* Avatar centered on top */}
      <div
        style={{
          position: 'absolute',
          top: borderWidth,
          left: borderWidth,
          width: avatarSize,
          height: avatarSize,
          borderRadius: '50%',
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  );
});

export default LottieBorderRenderer;
