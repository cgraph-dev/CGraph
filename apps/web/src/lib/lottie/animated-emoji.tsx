/**
 * AnimatedEmoji — shared component for rendering emojis with Lottie animations.
 *
 * Looks up the emoji in the animated catalog and renders via LottieRenderer
 * when available, falling back to the plain Unicode character otherwise.
 *
 * @module lib/lottie/animated-emoji
 */

import { LottieRenderer } from './lottie-renderer';
import { getReactionAnimation } from '@/lib/chat/reactionUtils';

export interface AnimatedEmojiProps {
  /** The emoji character to render (e.g. "👍"). */
  emoji: string;
  /** Pixel size for the Lottie animation / fallback. */
  size?: number;
  /** Whether to play the animation on hover (default true). */
  playOnHover?: boolean;
  /** Optional CSS class for the wrapper. */
  className?: string;
}

/**
 * Renders an animated Lottie emoji if available, falling back to plain text.
 *
 * Uses the cached animated emoji catalog from localStorage (populated eagerly
 * at app startup). Each rendering site should use this instead of raw `{emoji}`.
 */
export function AnimatedEmoji({
  emoji,
  size = 24,
  playOnHover = true,
  className,
}: AnimatedEmojiProps) {
  const anim = getReactionAnimation(emoji);

  if (anim) {
    return (
      <LottieRenderer
        codepoint={anim.codepoint}
        emoji={emoji}
        size={size}
        playOnHover={playOnHover}
        fallbackSrc={anim.webp}
        className={className}
      />
    );
  }

  return (
    <span
      className={className}
      style={{ fontSize: size * 0.85, lineHeight: 1, display: 'inline-block' }}
      role="img"
      aria-label={emoji}
    >
      {emoji}
    </span>
  );
}
