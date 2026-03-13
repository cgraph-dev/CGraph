/**
 * Loading States — Skeleton compositions for all major content areas
 *
 * Pre-built skeleton layouts that match actual content structure.
 * Uses the Skeleton primitive from design system (Plan 22-01).
 *
 * Variants: conversation-list, message-list, channel-list, profile,
 * forum-list, member-list, search-results
 *
 * @module components/ui/loading-states
 */

import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

// ── Skeleton Primitive ─────────────────────────────────────────────────

function Sk({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-white/[0.06]', className)} />;
}

// ── Variants ───────────────────────────────────────────────────────────

/** 8 rows: avatar + 2 text lines */
export function ConversationListLoading() {
  return (
    <div className="space-y-1 p-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg px-2 py-2.5">
          <Sk className="h-10 w-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Sk className="h-3.5 w-3/5 rounded" />
            <Sk className="h-3 w-4/5 rounded" />
          </div>
          <Sk className="h-3 w-8 rounded" />
        </div>
      ))}
    </div>
  );
}

/** 5 message groups: avatar + text blocks of varying widths */
export function MessageListLoading() {
  const widths = ['w-3/4', 'w-1/2', 'w-2/3', 'w-4/5', 'w-1/3'];
  return (
    <div className="space-y-6 px-4 py-4">
      {widths.map((w, i) => (
        <div key={i} className="flex items-start gap-3">
          <Sk className="h-10 w-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Sk className="h-3.5 w-24 rounded" />
              <Sk className="h-2.5 w-12 rounded" />
            </div>
            <Sk className={cn('h-4 rounded', w)} />
            {i % 2 === 0 && <Sk className="h-4 w-2/5 rounded" />}
          </div>
        </div>
      ))}
    </div>
  );
}

/** 3 categories with 4 channel items each */
export function ChannelListLoading() {
  return (
    <div className="space-y-4 p-2">
      {[0, 1, 2].map((cat) => (
        <div key={cat}>
          <Sk className="mb-2 ml-2 h-3 w-20 rounded" />
          {[0, 1, 2, 3].map((ch) => (
            <div key={ch} className="flex items-center gap-2 px-2 py-1.5">
              <Sk className="h-4 w-4 shrink-0 rounded" />
              <Sk className="h-3.5 w-28 rounded" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/** Banner + avatar + stats + tabs */
export function ProfileLoading() {
  return (
    <div>
      <Sk className="h-40 w-full rounded-none" />
      <div className="-mt-12 px-4">
        <Sk className="h-24 w-24 rounded-full border-4 border-[#111214]" />
        <div className="mt-3 space-y-2">
          <Sk className="h-5 w-40 rounded" />
          <Sk className="h-3.5 w-28 rounded" />
        </div>
        <div className="mt-4 flex gap-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-1">
              <Sk className="mx-auto h-5 w-10 rounded" />
              <Sk className="h-3 w-14 rounded" />
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-2 border-b border-white/[0.06] pb-2">
          {[0, 1, 2, 3].map((i) => (
            <Sk key={i} className="h-8 w-20 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

/** 4 thread cards in 2-col grid */
export function ForumListLoading() {
  return (
    <div className="grid grid-cols-2 gap-3 p-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="space-y-2.5 rounded-xl bg-white/[0.02] p-3">
          <div className="flex items-center gap-2">
            <Sk className="h-6 w-6 rounded-full" />
            <Sk className="h-3 w-16 rounded" />
          </div>
          <Sk className="h-4 w-5/6 rounded" />
          <Sk className="h-3 w-4/6 rounded" />
          <Sk className="h-20 w-full rounded-lg" />
          <div className="flex gap-3">
            <Sk className="h-3 w-10 rounded" />
            <Sk className="h-3 w-10 rounded" />
            <Sk className="h-3 w-10 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** 10 rows: avatar + name + role */
export function MemberListLoading() {
  return (
    <div className="space-y-0.5 p-2">
      <Sk className="mb-2 ml-2 h-3 w-24 rounded" />
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2.5 px-2 py-1.5">
          <Sk className="h-8 w-8 shrink-0 rounded-full" />
          <Sk className="h-3.5 w-24 flex-1 rounded" />
          <Sk className="h-4 w-12 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/** 6 result rows */
export function SearchResultsLoading() {
  return (
    <div className="space-y-1 p-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2.5">
          <Sk className="h-9 w-9 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-1.5">
            <Sk className="h-3.5 w-2/5 rounded" />
            <Sk className="h-3 w-3/5 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Unified variant component ──────────────────────────────────────────

type LoadingVariant =
  | 'conversation-list'
  | 'message-list'
  | 'channel-list'
  | 'profile'
  | 'forum-list'
  | 'member-list'
  | 'search-results';

const variantMap: Record<LoadingVariant, React.ComponentType> = {
  'conversation-list': ConversationListLoading,
  'message-list': MessageListLoading,
  'channel-list': ChannelListLoading,
  profile: ProfileLoading,
  'forum-list': ForumListLoading,
  'member-list': MemberListLoading,
  'search-results': SearchResultsLoading,
};

/** Description. */
/** Loading State component. */
export function LoadingState({ variant }: { variant: LoadingVariant }) {
  const Component = variantMap[variant];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <Component />
    </motion.div>
  );
}

export default LoadingState;
