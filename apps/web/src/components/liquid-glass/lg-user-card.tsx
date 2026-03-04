/**
 * CGraph Liquid Glass — UserCard
 *
 * Frosted-glass user card with avatar, status indicator,
 * iridescent hover glow, and spring-physics interaction.
 *
 * @module components/liquid-glass/lg-user-card
 */
import { type Ref, type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { springPreset } from './shared';

/* ── Avatar sub-component ──────────────────────────────────────────────────── */

export interface LGAvatarProps {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg';
  status?: 'online' | 'offline' | 'away' | 'dnd' | null;
}

const avatarSize = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
} as const;

const statusDot = {
  sm: 'h-2 w-2 right-0 bottom-0',
  md: 'h-2.5 w-2.5 right-0 bottom-0',
  lg: 'h-3 w-3 right-0.5 bottom-0.5',
} as const;

const statusColor = {
  online: 'bg-green-400 shadow-[0_0_6px_rgba(134,239,172,0.6)]',
  offline: 'bg-slate-300',
  away: 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]',
  dnd: 'bg-red-400 shadow-[0_0_6px_rgba(252,165,165,0.5)]',
} as const;

function getInitials(name?: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

/** Liquid Glass avatar with optional status indicator. */
export function LGAvatar({ src, alt, fallback, size = 'md', status }: LGAvatarProps) {
  return (
    <div className="relative flex-shrink-0">
      {src ? (
        <img
          src={src}
          alt={alt ?? 'User avatar'}
          className={cn('rounded-full object-cover', 'ring-2 ring-white/80', avatarSize[size])}
        />
      ) : (
        <div
          className={cn(
            'flex items-center justify-center rounded-full',
            'bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200',
            'font-semibold text-slate-600',
            'ring-2 ring-white/80',
            avatarSize[size]
          )}
          aria-label={alt ?? fallback}
        >
          {getInitials(fallback)}
        </div>
      )}
      {status && (
        <span
          className={cn(
            'absolute rounded-full border-2 border-white',
            statusDot[size],
            statusColor[status]
          )}
          aria-label={status}
        />
      )}
    </div>
  );
}

/* ── UserCard CVA ──────────────────────────────────────────────────────────── */

const userCardVariants = cva(
  [
    'flex items-center gap-3',
    'bg-white/[0.72] backdrop-blur-[20px] backdrop-saturate-[1.6]',
    'border border-slate-200/60',
    'rounded-[var(--lg-radius-sm)]',
    'transition-shadow duration-300',
  ],
  {
    variants: {
      size: {
        sm: 'px-3 py-2',
        md: 'px-4 py-3',
        lg: 'px-5 py-4',
      },
      interactive: {
        true: 'cursor-pointer',
        false: '',
      },
    },
    defaultVariants: {
      size: 'md',
      interactive: false,
    },
  }
);

/* ── UserCard ──────────────────────────────────────────────────────────────── */

export interface LGUserCardProps
  extends Omit<HTMLMotionProps<'div'>, 'children'>, VariantProps<typeof userCardVariants> {
  /** Avatar image URL. Falls back to initials. */
  avatarSrc?: string | null;
  /** User's display name. */
  name: string;
  /** Secondary text (email, role, etc.). */
  subtitle?: string;
  /** Online status indicator. */
  status?: LGAvatarProps['status'];
  /** Trailing action slot. */
  action?: ReactNode;
  children?: ReactNode;
}

/** Liquid Glass user card with avatar, status, and action slot. */
export function LGUserCard({
  ref,
  className,
  size,
  interactive,
  avatarSrc,
  name,
  subtitle,
  status,
  action,
  children,
  ...props
}: LGUserCardProps & { ref?: Ref<HTMLDivElement> }) {
  const isInteractive = interactive === true;
  const avatarSizeMap = { sm: 'sm', md: 'md', lg: 'lg' } as const;

  return (
    <motion.div
      ref={ref}
      className={cn(userCardVariants({ size, interactive }), className)}
      whileHover={
        isInteractive
          ? {
              scale: 1.015,
              y: -1,
              boxShadow:
                '0 8px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(196,181,253,0.2), 0 0 20px rgba(147,197,253,0.12)',
            }
          : undefined
      }
      transition={springPreset}
      {...props}
    >
      <LGAvatar
        src={avatarSrc}
        alt={name}
        fallback={name}
        size={avatarSizeMap[size ?? 'md']}
        status={status}
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-800">{name}</p>
        {subtitle && <p className="truncate text-xs text-slate-500">{subtitle}</p>}
        {children}
      </div>

      {action && <div className="flex-shrink-0">{action}</div>}
    </motion.div>
  );
}
