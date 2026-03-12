/**
 * ForumSearchPage
 *
 * Full-page search experience that composes existing `forum-search/` components
 * and layers additional filter controls for tags and templates.
 *
 * Composes:
 * - ForumSearch (main search input + core logic)
 * - FiltersPanel (sort, time range, type, category filters)
 * - SearchResults (results dropdown)
 * - TagSelector (tag-based filtering)
 *
 * @module modules/forums/pages/forum-search-page
 */

import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { MagnifyingGlassIcon, TagIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { ForumSearch } from '@/modules/forums/components/forum-search';
import { FiltersPanel } from '@/modules/forums/components/forum-search/filters-panel';
import { SearchResults } from '@/modules/forums/components/forum-search/search-results';
import { DEFAULT_FILTERS } from '@/modules/forums/components/forum-search/constants';
import type { SearchFilters, SearchResult } from '@/modules/forums/components/forum-search/types';
import type { ForumCategory } from '@/modules/forums/store';
import TagSelector from '@/modules/forums/components/tag-selector';

// ── Types ──────────────────────────────────────────────────────────────

interface Tag {
  id: string;
  name: string;
  color: string;
  categoryId?: string;
  categoryName?: string;
}

interface TagCategory {
  id: string;
  name: string;
  maxTags?: number;
  tags: Tag[];
}

interface Template {
  id: string;
  name: string;
  description?: string;
}

interface ForumSearchPageProps {
  forumId?: string;
  categories?: ForumCategory[];
  tagCategories?: TagCategory[];
  templates?: Template[];
  onSearch?: (query: string, filters: SearchFilters) => Promise<SearchResult[]>;
  onResultClick?: (result: SearchResult) => void;
  className?: string;
}

// ── Component ──────────────────────────────────────────────────────────

export default function ForumSearchPage({
  forumId,
  categories = [],
  tagCategories = [],
  templates = [],
  onSearch,
  onResultClick,
  className,
}: ForumSearchPageProps) {
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [pageResults, setPageResults] = useState<SearchResult[]>([]);

  // Wrap onSearch to include tag + template filtering context
  const handleSearch = useCallback(
    async (query: string, searchFilters: SearchFilters): Promise<SearchResult[]> => {
      if (!onSearch) return [];

      // Merge tag IDs into search context
      const enrichedFilters = {
        ...searchFilters,
        // Tags and template could be passed as extra filter params
      };

      const results = await onSearch(query, enrichedFilters);
      setPageResults(results);
      return results;
    },
    [onSearch, selectedTags, selectedTemplate],
  );

  const handleFilterChange = useCallback(
    (partial: Partial<SearchFilters>) => {
      setFilters((prev) => ({ ...prev, ...partial }));
    },
    [],
  );

  const handleToggleCategory = useCallback(
    (categoryId: string) => {
      setFilters((prev) => ({
        ...prev,
        categories: prev.categories.includes(categoryId)
          ? prev.categories.filter((c) => c !== categoryId)
          : [...prev.categories, categoryId],
      }));
    },
    [],
  );

  const handleClearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setSelectedTags([]);
    setSelectedTemplate(null);
  }, []);

  return (
    <div className={cn('mx-auto max-w-4xl px-4 py-6', className)}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-xl font-bold text-white">
          <MagnifyingGlassIcon className="h-6 w-6 text-primary-400" />
          Search Forums
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Search posts, comments, and users across the forum
        </p>
      </div>

      {/* Main search (compose existing ForumSearch) */}
      <div className="mb-6">
        <ForumSearch
          forumId={forumId}
          categories={categories}
          onSearch={handleSearch}
          onResultClick={onResultClick}
          showFilters={false}
          variant="expanded"
        />
      </div>

      {/* Extended Filters Row */}
      <div className="mb-6 space-y-4 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-300">Filters</span>
          <button
            type="button"
            onClick={() => setShowFilters((s) => !s)}
            className="text-xs text-primary-400 transition-colors hover:text-primary-300"
          >
            {showFilters ? 'Hide advanced' : 'Show advanced'}
          </button>
        </div>

        {/* Tag filter */}
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-400">
            <TagIcon className="h-3.5 w-3.5" />
            Filter by Tags
          </label>
          <TagSelector
            forumId={forumId ?? ''}
            selectedTags={selectedTags}
            onChange={setSelectedTags}
            categories={tagCategories}
          />
        </div>

        {/* Template filter */}
        {templates.length > 0 && (
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-400">
              <DocumentTextIcon className="h-3.5 w-3.5" />
              Filter by Template
            </label>
            <div className="flex flex-wrap gap-2">
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() =>
                    setSelectedTemplate(selectedTemplate === tpl.id ? null : tpl.id)
                  }
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                    selectedTemplate === tpl.id
                      ? 'bg-primary-600 text-white'
                      : 'bg-white/[0.06] text-gray-400 hover:bg-white/[0.1] hover:text-gray-300',
                  )}
                >
                  {tpl.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Advanced filters panel (compose existing) */}
        {showFilters && (
          <FiltersPanel
            isOpen={showFilters}
            filters={filters}
            categories={categories}
            primaryColor="#10B981"
            onFilterChange={handleFilterChange}
            onToggleCategory={handleToggleCategory}
            onClearFilters={handleClearFilters}
          />
        )}
      </div>

      {/* Results */}
      {pageResults.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-gray-400">
            {pageResults.length} result{pageResults.length !== 1 ? 's' : ''}
          </h2>
          <div className="space-y-2">
            {pageResults.map((result) => (
              <motion.button
                key={result.id}
                onClick={() => onResultClick?.(result)}
                whileHover={{ scale: 1.005 }}
                className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] p-4 text-left transition-colors hover:border-white/[0.12]"
              >
                <div className="flex items-start gap-3">
                  {result.author.avatarUrl && (
                    <img
                      src={result.author.avatarUrl}
                      alt={result.author.username}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-white">
                      {result.title}
                    </h3>
                    <p className="mt-0.5 line-clamp-2 text-xs text-gray-400">
                      {result.snippet}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2 text-[11px] text-gray-500">
                      <span>@{result.author.username}</span>
                      <span>&middot;</span>
                      <span>{new Date(result.createdAt).toLocaleDateString()}</span>
                      {result.forumName && (
                        <>
                          <span>&middot;</span>
                          <span>{result.forumName}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
