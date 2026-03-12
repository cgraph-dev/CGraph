/**
 * CosmeticRenderer — universal web renderer for any cosmetic type.
 *
 * Accepts a cosmetic type + config and renders the appropriate visual:
 *   - border:         SVG path overlay
 *   - title:          styled text element
 *   - badge:          icon badge
 *   - nameplate:      background + text composition
 *   - profile_effect: CSS animation overlay
 *   - chat_bubble:    themed bubble wrapper
 *   - emoji_pack:     emoji grid preview
 *   - sound_pack:     audio icon indicator
 *   - theme:          gradient preview swatch
 *
 * @module cosmetics/components/cosmetic-renderer
 */

import type { CosmeticItem, CosmeticType } from '@cgraph/shared-types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CosmeticRendererProps {
  /** The cosmetic item to render. */
  readonly item: CosmeticItem;
  /** Render size in px. */
  readonly size?: number;
  /** Additional CSS classes. */
  readonly className?: string;
}

// ---------------------------------------------------------------------------
// Sub-renderers
// ---------------------------------------------------------------------------

function BorderRenderer({ item, size = 64 }: { item: CosmeticItem; size: number }) {
  const color = item.colors[0] ?? '#60a5fa';
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="drop-shadow-lg">
      <rect
        x="4"
        y="4"
        width="92"
        height="92"
        rx="16"
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeDasharray={item.animationType === 'css' ? '8 4' : undefined}
      />
      {item.colors.length > 1 && (
        <rect
          x="8"
          y="8"
          width="84"
          height="84"
          rx="12"
          fill="none"
          stroke={item.colors[1]}
          strokeWidth="2"
          opacity="0.5"
        />
      )}
    </svg>
  );
}

function TitleRenderer({ item }: { item: CosmeticItem; size?: number }) {
  const color = item.colors[0] ?? '#f59e0b';
  return (
    <span
      className="text-lg font-bold tracking-wide"
      style={{
        color,
        textShadow: `0 0 8px ${color}40`,
      }}
    >
      {item.name}
    </span>
  );
}

function BadgeRenderer({ item, size = 48 }: { item: CosmeticItem; size: number }) {
  const color = item.colors[0] ?? '#a855f7';
  return (
    <div
      className="flex items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `${color}20`,
        border: `2px solid ${color}`,
      }}
    >
      {item.previewUrl ? (
        <img src={item.previewUrl} alt={item.name} className="h-3/4 w-3/4 object-contain" />
      ) : (
        <span className="text-lg">🛡️</span>
      )}
    </div>
  );
}

function NameplateRenderer({ item, size = 64 }: { item: CosmeticItem; size: number }) {
  const bgColor = item.colors[0] ?? '#1e293b';
  const textColor = item.colors[1] ?? '#ffffff';
  return (
    <div
      className="flex items-center justify-center rounded-lg px-4 py-2"
      style={{
        width: size * 3,
        height: size,
        background: `linear-gradient(135deg, ${bgColor}, ${bgColor}cc)`,
        border: `1px solid ${bgColor}80`,
      }}
    >
      <span className="truncate text-sm font-semibold" style={{ color: textColor }}>
        {item.name}
      </span>
    </div>
  );
}

function ProfileEffectRenderer({ item, size = 64 }: { item: CosmeticItem; size: number }) {
  const color = item.colors[0] ?? '#ec4899';
  return (
    <div className="relative overflow-hidden rounded-xl" style={{ width: size, height: size }}>
      <div
        className="absolute inset-0 animate-pulse rounded-xl"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${color}40, transparent 70%)`,
        }}
      />
      <div
        className="absolute inset-0 animate-ping rounded-xl opacity-20"
        style={{
          background: `radial-gradient(circle at 70% 70%, ${color}30, transparent 60%)`,
          animationDuration: '3s',
        }}
      />
      <div className="relative flex h-full w-full items-center justify-center text-2xl">✨</div>
    </div>
  );
}

function FallbackRenderer({ item, size = 64 }: { item: CosmeticItem; size: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-lg bg-white/5 text-2xl"
      style={{ width: size, height: size }}
    >
      {item.previewUrl ? (
        <img
          src={item.previewUrl}
          alt={item.name}
          className="h-full w-full rounded-lg object-contain"
        />
      ) : (
        '🎁'
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Type → renderer map
// ---------------------------------------------------------------------------

type SubRendererFn = (props: { item: CosmeticItem; size: number }) => React.JSX.Element;

const RENDERERS: Record<CosmeticType, SubRendererFn> = {
  border: BorderRenderer,
  title: TitleRenderer,
  badge: BadgeRenderer,
  nameplate: NameplateRenderer,
  profile_effect: ProfileEffectRenderer,
  chat_bubble: FallbackRenderer,
  emoji_pack: FallbackRenderer,
  sound_pack: FallbackRenderer,
  theme: FallbackRenderer,
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * Universal cosmetic renderer — delegates to type-specific sub-renderer.
 */
export function CosmeticRenderer({ item, size = 64, className = '' }: CosmeticRendererProps) {
  const Renderer = RENDERERS[item.type] ?? FallbackRenderer;

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <Renderer item={item} size={size} />
    </div>
  );
}
