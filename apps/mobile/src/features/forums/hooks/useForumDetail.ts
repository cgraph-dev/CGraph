/**
 * Hook for individual forum detail, threads, and actions.
 * @module features/forums/hooks/useForumDetail
 */
import { useForumStore } from '@/stores/forumStore';

/** Description. */
/** Hook for forum detail. */
export function useForumDetail(forumId: string) {
  const forum = useForumStore((s) => s.forums.find((f) => f.id === forumId));
  const threads = useForumStore((s) => s.threads);
  const isLoading = useForumStore((s) => s.loading);
  const error = useForumStore((s) => s.error);
  const fetchForum = useForumStore((s) => s.fetchForum);
  const fetchThreads = useForumStore((s) => s.fetchThreads);

  return { forum, threads, isLoading, error, fetchForum, fetchThreads };
}
