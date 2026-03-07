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

import { useRef } from 'react';

import { useLottie } from './use-lottie';
import type { LottieRendererProps } from './lottie-types';
import { getWebpCdnUrl } from './lottie-cache';

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
  className,
  fallbackSrc,
}: LottieRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isLoaded, error, prefersReducedMotion } = useLottie({
    codepoint,
    containerRef,
    autoplay,
    loop,
    playOnHover,
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

  return (
    <div
      ref={containerRef}
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
