/**
 * useFeed — TanStack infinite query for Discovery feed
 *
 * Fetches from GET /api/v1/feed?mode=X&cursor=Y with cursor pagination.
 *
 * @module modules/discovery/hooks/useFeed
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { FeedMode } from '../store/discoveryStore';

export interface FeedThread {
  id: string;
  title: string;
  slug: string;
  content_preview: string | null;
  thread_type: string;
  is_locked: boolean;
  is_pinned: boolean;
  is_content_gated: boolean;
  gate_price_nodes: number | null;
  view_count: number;
  reply_count: number;
  score: number;
  hot_score: number;
  weighted_resonates: number;
  author: { id: string; username: string } | null;
  board: { id: string; name: string; slug?: string } | null;
  created_at: string;
  updated_at: string;
}

interface FeedResponse {
  data: FeedThread[];
  meta: {
    cursor: string | null;
    has_more: boolean;
    per_page: number;
  };
}

export function useFeed(mode: FeedMode, communityId?: string | null) {
  return useInfiniteQuery<FeedResponse>({
    queryKey: ['feed', mode, communityId ?? null],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({ mode });
      if (pageParam) params.set('cursor', pageParam as string);
      if (communityId) params.set('community_id', communityId);

      const res = await api.get(`/api/v1/feed?${params.toString()}`);
      return res.data as FeedResponse;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.meta.has_more ? lastPage.meta.cursor : undefined,
    staleTime: 60_000,
    retry: 1,
  });
}
