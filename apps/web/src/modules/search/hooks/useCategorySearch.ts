/**
 * Category-specific Search Hooks
 *
 * Hooks for searching within specific categories (users, groups, forums).
 *
 * @module modules/search/hooks/useCategorySearch
 */

import { useCallback, useEffect } from 'react';
import { useSearchStore } from '../store';

/**
 * Hook for user search
 */
export function useUserSearch() {
  const { users, isLoading, search, setCategory, category } = useSearchStore();

  useEffect(() => {
    if (category !== 'users') {
      setCategory('users');
    }
  }, [category, setCategory]);

  const searchUsers = useCallback(
    async (query: string) => {
      setCategory('users');
      await search(query);
    },
    [search, setCategory]
  );

  return {
    users,
    isLoading,
    search: searchUsers,
  };
}

/**
 * Hook for group search
 */
export function useGroupSearch() {
  const { groups, isLoading, search, setCategory, category } = useSearchStore();

  useEffect(() => {
    if (category !== 'groups') {
      setCategory('groups');
    }
  }, [category, setCategory]);

  const searchGroups = useCallback(
    async (query: string) => {
      setCategory('groups');
      await search(query);
    },
    [search, setCategory]
  );

  return {
    groups,
    isLoading,
    search: searchGroups,
  };
}

/**
 * Hook for forum search
 */
export function useForumSearch() {
  const { forums, posts, isLoading, search, setCategory } = useSearchStore();

  const searchForums = useCallback(
    async (query: string) => {
      setCategory('forums');
      await search(query);
    },
    [search, setCategory]
  );

  const searchPosts = useCallback(
    async (query: string) => {
      setCategory('posts');
      await search(query);
    },
    [search, setCategory]
  );

  return {
    forums,
    posts,
    isLoading,
    searchForums,
    searchPosts,
  };
}
