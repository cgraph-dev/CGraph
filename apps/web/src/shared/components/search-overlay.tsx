/**
 * Search Overlay — Full content search with scope, filters, and grouped results
 *
 * Features:
 * - Scope selector (current conversation, server, everywhere)
 * - Results grouped by type with section headers
 * - Match highlighting
 * - Filter chips (from, in channel, date range, has attachment)
 * - Recent searches before typing
 * - Infinite scroll
 *
 * @module shared/components/search-overlay
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  FunnelIcon,
  ClockIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { SearchResultItem, type SearchResult } from './search-result-item';

// ── Types ──────────────────────────────────────────────────────────────

type SearchScope = 'conversation' | 'server' | 'everywhere';

interface SearchFilter {
  from?: string;
  inChannel?: string;
  dateFrom?: string;
  dateTo?: string;
  hasAttachment?: boolean;
  hasLink?: boolean;
}

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
  results?: SearchResult[];
  recentSearches?: string[];
  onSearch?: (query: string, scope: SearchScope, filters: SearchFilter) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
}

// ── Scope Config ───────────────────────────────────────────────────────

const scopes: { value: SearchScope; label: string }[] = [
  { value: 'conversation', label: 'In this conversation' },
  { value: 'server', label: 'In this server' },
  { value: 'everywhere', label: 'Everywhere' },
];

// ── Component ──────────────────────────────────────────────────────────

/** Description. */
/** Search Overlay component. */
export function SearchOverlay({
  open,
  onClose,
  results = [],
  recentSearches = [],
  onSearch,
  onLoadMore,
  hasMore,
  loading,
}: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<SearchScope>('everywhere');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilter>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) return;
    const t = setTimeout(() => onSearch?.(query, scope, filters), 200);
    return () => clearTimeout(t);
  }, [query, scope, filters, onSearch]);

  // Infinite scroll
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !hasMore || loading) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
      onLoadMore?.();
    }
  }, [hasMore, loading, onLoadMore]);

  // Group results
  const grouped = React.useMemo(() => {
    const map = new Map<string, SearchResult[]>();
    for (const r of results) {
      const existing = map.get(r.type) || [];
      existing.push(r);
      map.set(r.type, existing);
    }
    return map;
  }, [results]);

  const typeLabels: Record<string, string> = {
    message: 'Messages',
    user: 'People',
    channel: 'Channels',
    thread: 'Forum Threads',
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9998] flex justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div className="absolute inset-0 bg-black/40" onClick={onClose} />

          <motion.div
            className="relative flex h-full w-full max-w-[480px] flex-col border-l border-white/[0.06] bg-[#1e1f22]"
            initial={{ x: 480 }}
            animate={{ x: 0 }}
            exit={{ x: 480 }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
          >
            {/* Header */}
            <div className="border-b border-white/[0.06] p-4">
              <div className="flex items-center gap-3">
                <MagnifyingGlassIcon className="h-5 w-5 shrink-0 text-white/40" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search messages, people, channels..."
                  className="flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-white/25"
                />
                <button
                  onClick={() => setShowFilters((f) => !f)}
                  className={cn(
                    'rounded-md p-1.5 transition-colors',
                    showFilters
                      ? 'bg-primary-600/20 text-primary-400'
                      : 'text-white/40 hover:text-white/60'
                  )}
                >
                  <AdjustmentsHorizontalIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={onClose}
                  className="rounded-md p-1.5 text-white/40 hover:text-white/60"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Scope selector */}
              <div className="mt-3 flex gap-1">
                {scopes.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setScope(s.value)}
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                      scope === s.value
                        ? 'bg-primary-600/20 text-primary-400'
                        : 'bg-white/[0.04] text-white/40 hover:text-white/60'
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Filters panel */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-3 overflow-hidden"
                  >
                    <div className="flex flex-wrap gap-2">
                      <FilterChip
                        label="From user"
                        active={!!filters.from}
                        onClick={() => setFilters((f) => ({ ...f, from: f.from ? undefined : '' }))}
                      />
                      <FilterChip
                        label="In channel"
                        active={!!filters.inChannel}
                        onClick={() =>
                          setFilters((f) => ({ ...f, inChannel: f.inChannel ? undefined : '' }))
                        }
                      />
                      <FilterChip
                        label="Has attachment"
                        active={!!filters.hasAttachment}
                        onClick={() =>
                          setFilters((f) => ({ ...f, hasAttachment: !f.hasAttachment }))
                        }
                      />
                      <FilterChip
                        label="Has link"
                        active={!!filters.hasLink}
                        onClick={() => setFilters((f) => ({ ...f, hasLink: !f.hasLink }))}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Results */}
            <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto py-2">
              {!query.trim() ? (
                /* Recent searches */
                <div className="px-4">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/30">
                    Recent Searches
                  </p>
                  {recentSearches.length === 0 ? (
                    <p className="py-4 text-sm text-white/20">No recent searches</p>
                  ) : (
                    recentSearches.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => setQuery(s)}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-white/50 transition-colors hover:bg-white/[0.04] hover:text-white/80"
                      >
                        <ClockIcon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{s}</span>
                      </button>
                    ))
                  )}
                </div>
              ) : results.length === 0 && !loading ? (
                <div className="px-4 py-8 text-center text-sm text-white/25">
                  No results for &ldquo;{query}&rdquo;
                </div>
              ) : (
                Array.from(grouped.entries()).map(([type, items]) => (
                  <div key={type} className="mb-3">
                    <div className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/30">
                      {typeLabels[type] || type} &middot; {items.length}
                    </div>
                    {items.map((item) => (
                      <SearchResultItem key={item.id} result={item} query={query} />
                    ))}
                  </div>
                ))
              )}

              {loading && (
                <div className="flex justify-center py-4">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-500/30 border-t-primary-500" />
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Filter Chip ────────────────────────────────────────────────────────

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
        active
          ? 'bg-primary-600/20 text-primary-400'
          : 'bg-white/[0.04] text-white/40 hover:text-white/60'
      )}
    >
      <FunnelIcon className="h-3 w-3" />
      {label}
    </button>
  );
}

export default SearchOverlay;
