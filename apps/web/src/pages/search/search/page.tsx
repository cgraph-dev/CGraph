/**
 * Search Page Component
 *
 * Composes SearchHeader, IdSearchBar, and SearchResults
 * with ambient particle background.
 *
 * @module pages/search/search/page
 */

import { durations } from '@cgraph/animation-constants';
import { motion } from 'framer-motion';
import { useSearch } from './useSearch';
import { SearchHeader } from './search-header';
import { IdSearchBar } from './id-search-bar';
import { SearchResults } from './search-results';

/**
 * Main Search page — header, ID quick-search, and categorised results.
 */
export function Search() {
  const search = useSearch();

  return (
    <div className="relative flex h-full max-h-screen flex-1 flex-col overflow-hidden bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      {/* Ambient particles */}
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute h-0.5 w-0.5 rounded-full bg-primary-400"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.1, 0.4, 0.1],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: durations.epic.ms / 1000 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: 'easeInOut',
          }}
        />
      ))}

      <SearchHeader
        inputValue={search.inputValue}
        onInputChange={search.handleInputChange}
        category={search.category}
        onCategoryChange={search.handleCategoryChange}
        onClear={search.handleClear}
      />

      <IdSearchBar
        idSearchType={search.idSearchType}
        setIdSearchType={search.setIdSearchType}
        idSearchValue={search.idSearchValue}
        setIdSearchValue={search.setIdSearchValue}
        onSearch={search.handleIdSearch}
      />

      <SearchResults state={search} />
    </div>
  );
}

export default Search;
