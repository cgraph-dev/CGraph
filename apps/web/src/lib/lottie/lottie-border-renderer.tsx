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
const MAX_CONCURRENT_ANIMATIONS = 20;

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
      { threshold: 0.1 }
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
        // Dynamically import full lottie-web (supports embedded image assets)
        const lottie = (await import('lottie-web')).default;
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
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
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

  // Cut out only the center circle where the avatar sits.
  // This keeps all decorative frame elements (stars, wings, ornaments) visible
  // while preventing the Lottie's background shapes from covering the avatar.
  const innerRadius = Math.max(0, avatarSize / 2 - 2); // slightly smaller hole for overlap
  const maskCenter = totalSize / 2;
  const maskStyle: React.CSSProperties = {
    position: 'absolute' as const,
    inset: 0,
    pointerEvents: 'none' as const,
    WebkitMaskImage: `radial-gradient(circle ${innerRadius}px at ${maskCenter}px ${maskCenter}px, transparent ${innerRadius - 1}px, black ${innerRadius}px)`,
    maskImage: `radial-gradient(circle ${innerRadius}px at ${maskCenter}px ${maskCenter}px, transparent ${innerRadius - 1}px, black ${innerRadius}px)`,
  };

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: totalSize,
        height: totalSize,
      }}
    >
      {/* Lottie animation layer — masked to cut out only the avatar center */}
      <div ref={containerRef} style={maskStyle} />

      {/* Avatar centered inside the frame hole */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: avatarSize,
          height: avatarSize,
          borderRadius: '50%',
          overflow: 'hidden',
          zIndex: 1,
        }}
      >
        {children}
      </div>
    </div>
  );
});

export default LottieBorderRenderer;
