/**
 * Avatar image display component with Discord/Instagram-style features.
 * @module
 */
import { ReactNode, useMemo, lazy, Suspense } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { getAvatarBorderStyle } from '@/modules/settings/hooks/useCustomizationApplication';

const LottieRenderer = lazy(() =>
  import('@/lib/lottie/lottie-renderer').then((m) => ({ default: m.LottieRenderer }))
);

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
type AvatarStatus = 'online' | 'offline' | 'idle' | 'dnd' | 'invisible';
type AvatarShape = 'squircle' | 'circle' | 'square';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  className?: string;
  badge?: ReactNode;
  status?: AvatarStatus;
  /** Show animated gradient ring like Instagram stories */
  storyRing?: boolean;
  /** Show animated typing dots overlay */
  typing?: boolean;
  /** Avatar shape — squircle (43px radius, default), circle, or square */
  shape?: AvatarShape;
  borderId?: string | null;
  /** URL to a Lottie JSON animation (renders inside avatar bounds) */
  lottieUrl?: string;
}

const sizeConfig: Record<
  AvatarSize,
  { px: number; container: string; text: string; statusDot: string; statusRing: string }
> = {
  xs: {
    px: 16,
    container: 'h-4 w-4',
    text: 'text-[7px]',
    statusDot: 'h-1.5 w-1.5',
    statusRing: 'ring-1',
  },
  sm: {
    px: 24,
    container: 'h-6 w-6',
    text: 'text-[9px]',
    statusDot: 'h-2 w-2',
    statusRing: 'ring-[1.5px]',
  },
  md: {
    px: 32,
    container: 'h-8 w-8',
    text: 'text-[11px]',
    statusDot: 'h-2.5 w-2.5',
    statusRing: 'ring-2',
  },
  lg: {
    px: 40,
    container: 'h-10 w-10',
    text: 'text-xs',
    statusDot: 'h-3 w-3',
    statusRing: 'ring-2',
  },
  xl: {
    px: 56,
    container: 'h-14 w-14',
    text: 'text-base',
    statusDot: 'h-3.5 w-3.5',
    statusRing: 'ring-2',
  },
  '2xl': {
    px: 80,
    container: 'h-20 w-20',
    text: 'text-xl',
    statusDot: 'h-4 w-4',
    statusRing: 'ring-[3px]',
  },
  '3xl': {
    px: 120,
    container: 'h-[120px] w-[120px]',
    text: 'text-3xl',
    statusDot: 'h-5 w-5',
    statusRing: 'ring-[3px]',
  },
};

const statusColors: Record<AvatarStatus, string> = {
  online: 'bg-green-500',
  offline: 'bg-gray-500',
  idle: 'bg-yellow-500',
  dnd: 'bg-red-500',
  invisible: 'bg-gray-500',
};

const GRADIENT_PALETTE = [
  'from-red-500 to-orange-500',
  'from-orange-500 to-amber-500',
  'from-amber-500 to-yellow-500',
  'from-green-500 to-emerald-500',
  'from-teal-500 to-cyan-500',
  'from-cyan-500 to-blue-500',
  'from-blue-500 to-indigo-500',
  'from-indigo-500 to-violet-500',
  'from-violet-500 to-purple-500',
  'from-purple-500 to-fuchsia-500',
  'from-fuchsia-500 to-pink-500',
  'from-pink-500 to-rose-500',
];

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function getGradient(name: string): string {
  return GRADIENT_PALETTE[hashName(name) % GRADIENT_PALETTE.length]!;
}

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name
    .trim()
    .split(' ')
    .filter((p) => p.length > 0);
  if (parts.length >= 2 && parts[0]?.[0] && parts[1]?.[0]) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.charAt(0).toUpperCase();
}

/**
 * Avatar — Discord/Instagram-quality avatar with status, story ring, typing indicator.
 */
export default function Avatar({
  src,
  alt = '',
  name = '',
  size = 'md',
  className = '',
  badge,
  status,
  storyRing = false,
  typing = false,
  shape = 'squircle',
  borderId,
  lottieUrl,
}: AvatarProps) {
  const cfg = sizeConfig[size];
  const rounding =
    shape === 'circle' ? 'rounded-full' : shape === 'square' ? 'rounded-2xl' : 'rounded-[43px]';
  const gradient = useMemo(() => getGradient(name), [name]);
  const borderStyle = borderId ? getAvatarBorderStyle(borderId) : { className: '' };

  return (
    <div className={cn('relative inline-flex shrink-0', className)}>
      {/* Story ring */}
      {storyRing && (
        <div
          className={cn(
            'absolute -inset-[3px] animate-[spin_4s_linear_infinite] bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-500',
            rounding
          )}
        />
      )}

      {/* Avatar image / initials */}
      <div
        className={cn(
          cfg.container,
          'relative flex items-center justify-center overflow-hidden',
          rounding,
          storyRing && 'ring-2 ring-[rgb(15,15,20)]',
          !src && `bg-gradient-to-br ${gradient}`,
          src && 'bg-white/[0.06]',
          borderStyle.className
        )}
        style={borderStyle.style}
      >
        {lottieUrl ? (
          <Suspense
            fallback={
              src ? (
                <img
                  src={src}
                  alt={alt || name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <span className={cn('select-none font-semibold text-white', cfg.text)}>
                  {getInitials(name)}
                </span>
              )
            }
          >
            <LottieRenderer codepoint={lottieUrl} emoji={name || alt} size={cfg.px} autoplay loop />
          </Suspense>
        ) : src ? (
          <img src={src} alt={alt || name} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <span className={cn('select-none font-semibold text-white', cfg.text)}>
            {getInitials(name)}
          </span>
        )}

        {/* Typing indicator overlay */}
        {typing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="h-1 w-1 rounded-full bg-white"
                  animate={{ y: [0, -3, 0] }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Status indicator dot — Discord style */}
      {status && status !== 'invisible' && (
        <span
          className={cn(
            'absolute bottom-0 right-0',
            cfg.statusDot,
            'rounded-full',
            statusColors[status],
            cfg.statusRing,
            'ring-[rgb(15,15,20)]',
            status === 'dnd' &&
              'after:absolute after:inset-x-[2px] after:top-1/2 after:h-[2px] after:-translate-y-1/2 after:rounded-full after:bg-[rgb(15,15,20)]'
          )}
        />
      )}

      {/* Badge slot */}
      {badge && <span className="absolute -right-1 -top-1">{badge}</span>}
    </div>
  );
}

// ---------- AvatarGroup ----------

interface AvatarGroupProps {
  children: ReactNode;
  max?: number;
  size?: AvatarSize;
}

/**
 * AvatarGroup — stacked avatars with +N overflow pill.
 */
export function AvatarGroup({ children, max = 3, size = 'md' }: AvatarGroupProps) {
  const childArray = Array.isArray(children) ? children : [children];
  const visible = childArray.slice(0, max);
  const overflow = childArray.length - max;

  const overlap: Record<AvatarSize, string> = {
    xs: '-ml-1.5',
    sm: '-ml-2',
    md: '-ml-2.5',
    lg: '-ml-3',
    xl: '-ml-4',
    '2xl': '-ml-5',
    '3xl': '-ml-6',
  };

  return (
    <div className="flex items-center">
      {visible.map((child, i) => (
        <div
          key={i}
          className={cn(
            'relative rounded-full ring-2 ring-[rgb(15,15,20)]',
            i > 0 && overlap[size]
          )}
          style={{ zIndex: visible.length - i }}
        >
          {child}
        </div>
      ))}
      {overflow > 0 && (
        <div
          className={cn(overlap[size], 'relative rounded-full ring-2 ring-[rgb(15,15,20)]')}
          style={{ zIndex: 0 }}
        >
          <div
            className={cn(
              sizeConfig[size].container,
              'flex items-center justify-center rounded-full bg-white/[0.1]',
              sizeConfig[size].text,
              'font-semibold text-white/70'
            )}
          >
            +{overflow}
          </div>
        </div>
      )}
    </div>
  );
}
