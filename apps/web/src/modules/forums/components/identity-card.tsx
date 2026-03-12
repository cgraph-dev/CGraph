/**
 * IdentityCard Component
 *
 * Compact card showing a user's forum identity:
 * - Display name + avatar with frame overlay
 * - Equipped badges (max 3 shown)
 * - Title
 * - Reputation score with color coding (green/yellow/red)
 *
 * @module modules/forums/components/identity-card
 */

import React from 'react';
import { motion } from 'motion/react';
import { StarIcon, ShieldCheckIcon, TrophyIcon } from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────

interface Badge {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

interface IdentitySnapshot {
  displayName: string;
  username?: string;
  avatarUrl: string | null;
  avatarFrameUrl?: string | null;
  title?: string | null;
  badges?: Badge[];
  reputation?: number;
}

interface IdentityCardProps {
  userId: string;
  snapshot?: IdentitySnapshot;
  compact?: boolean;
  className?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────

const MAX_BADGES_SHOWN = 3;

function getReputationColor(rep: number): string {
  if (rep >= 100) return 'text-green-400';
  if (rep >= 0) return 'text-yellow-400';
  return 'text-red-400';
}

function getReputationBg(rep: number): string {
  if (rep >= 100) return 'bg-green-500/20';
  if (rep >= 0) return 'bg-yellow-500/20';
  return 'bg-red-500/20';
}

const BADGE_ICONS = [StarIcon, ShieldCheckIcon, TrophyIcon] as const;

// ── Component ──────────────────────────────────────────────────────────

export default function IdentityCard({
  userId: _userId,
  snapshot,
  compact = false,
  className,
}: IdentityCardProps) {
  void _userId;

  const displayName = snapshot?.displayName ?? 'Unknown';
  const avatarUrl = snapshot?.avatarUrl;
  const frameUrl = snapshot?.avatarFrameUrl;
  const title = snapshot?.title;
  const badges = snapshot?.badges ?? [];
  const reputation = snapshot?.reputation ?? 0;
  const visibleBadges = badges.slice(0, MAX_BADGES_SHOWN);
  const extraBadges = badges.length - MAX_BADGES_SHOWN;

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {/* Avatar */}
        <div className="relative h-8 w-8 flex-shrink-0">
          <img
            src={avatarUrl ?? '/default-avatar.png'}
            alt={displayName}
            className="h-8 w-8 rounded-full object-cover"
          />
          {frameUrl && (
            <img
              src={frameUrl}
              alt=""
              className="pointer-events-none absolute inset-0 h-8 w-8"
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <span className="truncate text-sm font-semibold text-white">{displayName}</span>
        </div>

        {/* Reputation compact */}
        <span
          className={cn(
            'rounded px-1.5 py-0.5 text-[10px] font-bold',
            getReputationColor(reputation),
            getReputationBg(reputation),
          )}
        >
          {reputation}
        </span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl border border-white/[0.06] bg-white/[0.03] p-4',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {/* Avatar with frame */}
        <div className="relative h-12 w-12 flex-shrink-0">
          <img
            src={avatarUrl ?? '/default-avatar.png'}
            alt={displayName}
            className="h-12 w-12 rounded-full object-cover ring-2 ring-white/[0.08]"
          />
          {frameUrl && (
            <img
              src={frameUrl}
              alt=""
              className="pointer-events-none absolute inset-0 h-12 w-12"
            />
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-bold text-white">{displayName}</h4>

          {title && (
            <span className="mt-0.5 block truncate text-xs text-gray-400">{title}</span>
          )}

          {/* Badges */}
          {visibleBadges.length > 0 && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1">
              {visibleBadges.map((badge, i) => {
                const IconComp = BADGE_ICONS[i % BADGE_ICONS.length] as React.ComponentType<React.SVGProps<SVGSVGElement>>;
                return (
                  <span
                    key={badge.id}
                    className="flex items-center gap-0.5 rounded-full bg-white/[0.08] px-1.5 py-0.5 text-[10px] font-medium text-gray-300"
                    style={badge.color ? { color: badge.color } : undefined}
                    title={badge.name}
                  >
                    <IconComp className="h-3 w-3" />
                    {badge.name}
                  </span>
                );
              })}
              {extraBadges > 0 && (
                <span className="text-[10px] text-gray-500">+{extraBadges}</span>
              )}
            </div>
          )}
        </div>

        {/* Reputation */}
        <div
          className={cn(
            'flex flex-col items-center rounded-lg px-2 py-1',
            getReputationBg(reputation),
          )}
        >
          <span className={cn('text-lg font-bold leading-tight', getReputationColor(reputation))}>
            {reputation}
          </span>
          <span className="text-[9px] uppercase tracking-wider text-gray-500">rep</span>
        </div>
      </div>
    </motion.div>
  );
}
