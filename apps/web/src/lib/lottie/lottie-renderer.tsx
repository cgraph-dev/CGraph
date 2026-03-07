/**
 * LottieRenderer Component
 *
 * Renders a Lottie animation for an animated Noto emoji.
 * Falls back to a static WebP image when:
 * - The user prefers reduced motion
 * - The Lottie data fails to load
 *
 * @module lib/lottie/lottie-renderer
 */

import { useRef, useState, useEffect } from 'react';

import { useLottie } from './use-lottie';
import type { LottieRendererProps } from './lottie-types';
import { getWebpCdnUrl } from './lottie-cache';

// ── Viewport-aware lazy loading ────────────────────────────────────
// Only initialise Lottie for emojis currently visible in the viewport.
// Off-screen emojis show a static WebP to avoid hundreds of SVG players.

function useIsVisible(ref: React.RefObject<HTMLElement | null>, rootMargin = '200px') {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect(); // stay visible once seen — avoids thrashing
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin]);

  return visible;
}

/**
 * Renders an animated Noto emoji via lottie-web, with WebP fallback.
 */
export function LottieRenderer({
  codepoint,
  emoji,
  size = 32,
  autoplay = false,
  loop = false,
  playOnHover = true,
  replayInterval = 0,
  className,
  fallbackSrc,
}: LottieRendererProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isVisible = useIsVisible(wrapperRef);

  const containerRef = useRef<HTMLDivElement>(null);
  const { isLoaded, error, prefersReducedMotion } = useLottie({
    codepoint,
    containerRef,
    autoplay,
    loop,
    playOnHover,
    replayInterval,
    enabled: isVisible, // only load when in viewport
  });

  const webpUrl = fallbackSrc ?? getWebpCdnUrl(codepoint);

  // Fallback: reduced motion or load error → static WebP
  if (prefersReducedMotion || error) {
    return (
      <img
        src={webpUrl}
        alt={emoji}
        width={size}
        height={size}
        className={className}
        loading="lazy"
      />
    );
  }

  // Not yet visible — render lightweight placeholder with static image
  if (!isVisible) {
    return (
      <div
        ref={wrapperRef}
        className={className}
        style={{ width: size, height: size, position: 'relative' }}
        aria-label={emoji}
        role="img"
      >
        <img
          src={webpUrl}
          alt={emoji}
          width={size}
          height={size}
          style={{ position: 'absolute', inset: 0 }}
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      ref={(node) => {
        // Assign both refs to the same node
        (wrapperRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      className={className}
      style={{ width: size, height: size, position: 'relative' }}
      aria-label={emoji}
      role="img"
    >
      {/* Show WebP while Lottie is loading */}
      {!isLoaded && (
        <img
          src={webpUrl}
          alt={emoji}
          width={size}
          height={size}
          style={{ position: 'absolute', inset: 0 }}
          loading="lazy"
        />
      )}
    </div>
  );
}
