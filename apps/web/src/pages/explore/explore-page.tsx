/**
 * Explore Page
 *
 * Unified community discovery page that aggregates public groups
 * and forums into a single browsable, searchable, filterable feed.
 *
 * @module pages/explore/explore-page
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  GlobeAltIcon,
  SparklesIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';
import CommunityCard, { type Community } from './community-card';
import CategoryBar from './category-bar';
import { api } from '@/lib/api';

const SORT_OPTIONS = [
  { value: 'popular', label: 'Popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'alphabetical', label: 'A–Z' },
] as const;

type SortOption = (typeof SORT_OPTIONS)[number]['value'];

/**
 * Unified Explore page for discovering communities (groups + forums).
 */
export default function ExplorePage() {

  const [communities, setCommunities] = useState<Community[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOption>('popular');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const observerRef = useRef<HTMLDivElement | null>(null);

  const fetchCommunities = useCallback(
    async (reset = false) => {
      try {
        setIsLoading(true);
        const currentOffset = reset ? 0 : offset;

        const res = await api.get('/api/v1/explore', { params: {
          category: category || undefined,
          sort,
          q: search || undefined,
          limit: 20,
          offset: currentOffset,
        }});
        const payload = res.data?.data ?? res.data;
        const items: Community[] = payload?.communities ?? [];
        const cats: string[] = payload?.categories ?? [];

        if (reset) {
          setCommunities(items);
          setOffset(items.length);
        } else {
          setCommunities((prev) => [...prev, ...items]);
          setOffset((prev) => prev + items.length);
        }
        setCategories(cats);
        setHasMore(items.length >= 20);
      } catch (err) {
        console.error('Explore fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [api, category, sort, search, offset]
  );

  // Reset and fetch when filters change
  useEffect(() => {
    setOffset(0);
    setHasMore(true);
    fetchCommunities(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, sort]);

  // Debounced search
  const handleSearch = useCallback(
    (value: string) => {
      setSearch(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setOffset(0);
        setHasMore(true);
        fetchCommunities(true);
      }, 300);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [category, sort]
  );

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!observerRef.current || !hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isLoading) {
          fetchCommunities(false);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [fetchCommunities, hasMore, isLoading]);

  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-5">
        <div className="flex items-center gap-3">
          <GlobeAltIcon className="h-7 w-7 text-primary-400" />
          <h1 className="text-2xl font-bold text-white">Explore Communities</h1>
        </div>

        <p className="mt-1 text-sm text-white/50">
          Discover groups and forums to join
        </p>

        {/* Search + Sort */}
        <div className="mt-4 flex items-center gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search communities..."
              className="w-full rounded-xl bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/40 outline-none ring-1 ring-white/10 focus:ring-primary-500/50"
            />
          </div>

          <div className="relative">
            <AdjustmentsHorizontalIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40 pointer-events-none" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="appearance-none rounded-xl bg-white/[0.04] py-2.5 pl-9 pr-8 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-primary-500/50"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category bar */}
        <div className="mt-3">
          <CategoryBar categories={categories} selected={category} onSelect={setCategory} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        {isLoading && communities.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          </div>
        ) : communities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <SparklesIcon className="mb-4 h-12 w-12 text-white/20" />
            <h3 className="text-lg font-semibold text-white/60">No communities found</h3>
            <p className="mt-1 text-sm text-white/40">
              {search ? 'Try a different search term' : 'No public communities available yet'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {communities.map((c) => (
                <CommunityCard key={`${c.type}-${c.id}`} community={c} />
              ))}
            </div>

            {/* Infinite scroll sentinel */}
            {hasMore && (
              <div ref={observerRef} className="flex items-center justify-center py-8">
                {isLoading && (
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
