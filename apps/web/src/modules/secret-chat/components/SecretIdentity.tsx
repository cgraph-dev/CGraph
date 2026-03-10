/**
 * SecretIdentity
 *
 * Displays the user's ephemeral alias and a deterministic SVG avatar
 * for the secret chat session. The avatar is generated from a seed
 * derived from the conversation ID, ensuring consistency without
 * revealing identity.
 *
 * @module modules/secret-chat/components/SecretIdentity
 */

import { memo, useMemo } from 'react';

/** Props for the SecretIdentity component */
export interface SecretIdentityProps {
  /** Ephemeral alias displayed in the secret chat */
  alias: string;
  /** Seed string for deterministic avatar generation */
  avatarSeed: string;
  /** Size of the avatar in pixels */
  size?: number;
}

/**
 * Simple deterministic hash function for avatar generation.
 * Produces a consistent numeric value from a string seed.
 */
function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash);
}

/**
 * Generates deterministic HSL color from a seed and offset.
 */
function seedColor(seed: string, offset: number): string {
  const h = (hashSeed(seed + String(offset)) % 360);
  return `hsl(${h}, 60%, 50%)`;
}

/**
 * SecretIdentity component — alias + deterministic SVG avatar.
 * Avatar is generated purely from the seed, no external resources needed.
 */
export const SecretIdentity = memo(function SecretIdentity({
  alias,
  avatarSeed,
  size = 32,
}: SecretIdentityProps) {
  const avatarElements = useMemo(() => {
    const hash = hashSeed(avatarSeed);
    const bg = seedColor(avatarSeed, 0);
    const fg1 = seedColor(avatarSeed, 1);
    const fg2 = seedColor(avatarSeed, 2);

    // Deterministic geometric pattern
    const shapes: Array<{ cx: number; cy: number; r: number; fill: string }> = [];
    for (let i = 0; i < 5; i++) {
      shapes.push({
        cx: ((hash >> (i * 3)) % 80) + 10,
        cy: ((hash >> (i * 3 + 1)) % 80) + 10,
        r: ((hash >> (i * 2)) % 15) + 5,
        fill: i % 2 === 0 ? fg1 : fg2,
      });
    }

    return { bg, shapes };
  }, [avatarSeed]);

  return (
    <div className="flex items-center gap-2">
      {/* Deterministic SVG avatar */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className="shrink-0 rounded-full"
        aria-hidden="true"
      >
        <rect width="100" height="100" rx="50" fill={avatarElements.bg} />
        {avatarElements.shapes.map((shape, i) => (
          <circle
            key={i}
            cx={shape.cx}
            cy={shape.cy}
            r={shape.r}
            fill={shape.fill}
            opacity={0.7}
          />
        ))}
      </svg>

      {/* Alias label */}
      <span className="truncate text-sm font-medium text-white/80">
        {alias}
      </span>
    </div>
  );
});
