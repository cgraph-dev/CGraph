/**
 * Search Page State Hook
 *
 * Manages search query, debounced search, category selection,
 * ID-based search, and result counts.
 *
 * @module pages/search/search/useSearch
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import debounce from 'lodash.debounce';
import { useSearchStore, type SearchCategory } from '@/modules/search/store';
import type {
  SearchUser,
  SearchGroup,
  SearchForum,
  SearchPost,
  SearchMessage,
} from '@/modules/search/store';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { categories } from './constants';
import type { IdSearchType } from './types';

/** Return type for the useSearch hook */
export interface SearchState {
  /** Current input value */
  inputValue: string;
  /** ID search input value */
  idSearchValue: string;
  /** ID search entity type */
  idSearchType: IdSearchType;
  /** Set ID search entity type */
  setIdSearchType: (type: IdSearchType) => void;
  /** Set ID search input value */
  setIdSearchValue: (value: string) => void;
  /** Active search category */
  category: SearchCategory;
  /** Search results — users */
  users: SearchUser[];
  /** Search results — groups */
  groups: SearchGroup[];
  /** Search results — forums */
  forums: SearchForum[];
  /** Search results — posts */
  posts: SearchPost[];
  /** Search results — messages */
  messages: SearchMessage[];
  /** Loading state */
  isLoading: boolean;
  /** Whether a search has been performed */
  hasSearched: boolean;
  /** Total result count across all categories */
  totalResults: number;
  /** Handle text input change (triggers debounced search) */
  handleInputChange: (value: string) => void;
  /** Switch category and re-search */
  handleCategoryChange: (cat: SearchCategory) => void;
  /** Clear search */
  handleClear: () => void;
  /** Execute ID-based search */
  handleIdSearch: () => Promise<void>;
  /** Navigate to a result */
  navigate: ReturnType<typeof useNavigate>;
}

/**
 * Hook encapsulating all search page state and actions.
 */
export function useSearch(): SearchState {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [inputValue, setInputValue] = useState(searchParams.get('q') || '');
  const [idSearchValue, setIdSearchValue] = useState('');
  const [idSearchType, setIdSearchType] = useState<IdSearchType>('user');

  const {
    query,
    category,
    users,
    groups,
    forums,
    posts,
    messages,
    isLoading,
    hasSearched,
    setQuery,
    setCategory,
    search,
    searchById,
    clearResults,
  } = useSearchStore();

  const debouncedSearch = useCallback(
    debounce((q: string) => {
      if (q.trim()) {
        search(q);
        setSearchParams({ q, category });
      }
    }, 300),
    [category]
  );

  useEffect(() => {
    const q = searchParams.get('q');
    const cat = searchParams.get('category') as SearchCategory;
    if (q) {
      setInputValue(q);
      setQuery(q);
      if (cat && categories.find((c) => c.id === cat)) {
        setCategory(cat);
      }
      search(q);
    }
  }, [searchParams, setQuery, setCategory, search]);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    setQuery(value);
    debouncedSearch(value);
  };

  const handleCategoryChange = (cat: SearchCategory) => {
    setCategory(cat);
    HapticFeedback.light();
    if (query.trim()) {
      search();
      setSearchParams({ q: query, category: cat });
    }
  };

  const handleClear = () => {
    setInputValue('');
    clearResults();
    setSearchParams({});
  };

  const handleIdSearch = async () => {
    if (!idSearchValue.trim()) return;
    HapticFeedback.medium();
    const result = await searchById(idSearchType, idSearchValue.trim());
    if (result) {
      switch (idSearchType) {
        case 'user':
          navigate(`/friends?userId=${idSearchValue}`);
          break;
        case 'group':
          navigate(`/groups/${idSearchValue}`);
          break;
        case 'forum':
          navigate(`/forums/${idSearchValue}`);
          break;
      }
    } else {
      alert(`${idSearchType} not found`);
    }
  };

  const totalResults =
    users.length + groups.length + forums.length + posts.length + messages.length;

  return {
    inputValue,
    idSearchValue,
    idSearchType,
    setIdSearchType,
    setIdSearchValue,
    category,
    users,
    groups,
    forums,
    posts,
    messages,
    isLoading,
    hasSearched,
    totalResults,
    handleInputChange,
    handleCategoryChange,
    handleClear,
    handleIdSearch,
    navigate,
  };
}
