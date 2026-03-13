/**
 * Hook for forum list data and loading state.
 * @module features/forums/hooks/useForumList
 */
import { useForumStore } from '@/stores/forumStore';

/** Description. */
/** Hook for forum list. */
export function useForumList() {
  const forums = useForumStore((s) => s.forums);
  const isLoading = useForumStore((s) => s.loading);
  const error = useForumStore((s) => s.error);
  const fetchForums = useForumStore((s) => s.fetchForums);

  return { forums, isLoading, error, fetchForums };
}
