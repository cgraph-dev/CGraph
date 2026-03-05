/**
 * Board Header — Forum board hero section
 *
 * Features:
 * - Board name (large) + description + stats
 * - Optional banner image
 * - Action bar: Create Thread, Sort, View Mode, Search
 * - Pinned threads row
 * - Board rules collapsible card
 *
 * @module modules/forums/components/board-header
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  PlusIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  EyeIcon,
  ChevronDownIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { springs } from '@/lib/animation-presets';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────

interface BoardHeaderProps {
  name: string;
  description?: string;
  bannerUrl?: string;
  threadCount?: number;
  subscriberCount?: number;
  activeNow?: number;
  moderators?: Array<{ id: string; displayName: string; avatarUrl?: string }>;
  rules?: string[];
  onCreateThread?: () => void;
  className?: string;
}

// ── Stat Badge ─────────────────────────────────────────────────────────

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-400">
      <Icon className="h-3.5 w-3.5" />
      <span className="font-semibold text-gray-300">{value}</span>
      <span>{label}</span>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────

export function BoardHeader({
  name,
  description,
  bannerUrl,
  threadCount = 0,
  subscriberCount = 0,
  activeNow = 0,
  moderators = [],
  rules = [],
  onCreateThread,
  className,
}: BoardHeaderProps) {
  const [showRules, setShowRules] = useState(false);

  return (
    <div className={cn('overflow-hidden rounded-xl border border-white/[0.06]', className)}>
      {/* Banner */}
      {bannerUrl && (
        <div className="relative h-32 w-full overflow-hidden">
          <img src={bannerUrl} alt="" className="h-full w-full object-cover" />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.8) 100%)',
            }}
          />
        </div>
      )}

      {/* Content */}
      <div className={cn('bg-white/[0.03] p-4', bannerUrl && '-mt-8 relative')}>
        {/* Name + description */}
        <h1 className="text-xl font-bold text-white">{name}</h1>
        {description && (
          <p className="mt-1 text-sm text-gray-400">{description}</p>
        )}

        {/* Stats row */}
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <Stat icon={ChatBubbleLeftRightIcon} label="threads" value={threadCount} />
          <Stat icon={UserGroupIcon} label="subscribers" value={subscriberCount} />
          <Stat icon={EyeIcon} label="online now" value={activeNow} />
        </div>

        {/* Moderators */}
        {moderators.length > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase text-gray-500">Mods:</span>
            <div className="flex -space-x-1">
              {moderators.slice(0, 5).map((mod) => (
                <div
                  key={mod.id}
                  className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full border border-[#2b2d31] bg-white/[0.08]"
                  title={mod.displayName}
                >
                  {mod.avatarUrl ? (
                    <img src={mod.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[8px] font-bold text-gray-400">
                      {mod.displayName.charAt(0)}
                    </span>
                  )}
                </div>
              ))}
              {moderators.length > 5 && (
                <span className="ml-1.5 text-[10px] text-gray-500">
                  +{moderators.length - 5}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2">
          {onCreateThread && (
            <motion.button
              onClick={onCreateThread}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-xs font-semibold text-white hover:bg-primary-500"
            >
              <PlusIcon className="h-4 w-4" />
              New Thread
            </motion.button>
          )}

          {rules.length > 0 && (
            <button
              onClick={() => setShowRules((p) => !p)}
              className="flex items-center gap-1 rounded-lg bg-white/[0.04] px-3 py-2 text-xs text-gray-400 hover:bg-white/[0.06] hover:text-gray-300"
            >
              <ShieldCheckIcon className="h-3.5 w-3.5" />
              Rules
              <ChevronDownIcon
                className={cn('h-3 w-3 transition-transform', showRules && 'rotate-180')}
              />
            </button>
          )}
        </div>

        {/* Rules card */}
        <AnimatePresence>
          {showRules && rules.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              transition={springs.snappy}
              className="overflow-hidden rounded-lg border border-white/[0.06] bg-white/[0.03]"
            >
              <div className="p-3">
                <h4 className="mb-2 text-xs font-bold text-gray-300">Board Rules</h4>
                <ol className="space-y-1">
                  {rules.map((rule, i) => (
                    <li key={i} className="flex gap-2 text-xs text-gray-400">
                      <span className="font-bold text-gray-500">{i + 1}.</span>
                      {rule}
                    </li>
                  ))}
                </ol>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default BoardHeader;
