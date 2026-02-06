/**
 * useForumTree hook
 * @module modules/forums/components/forum-hierarchy-tree
 */

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { createLogger } from '@/lib/logger';
import type { ForumNode } from './types';

const logger = createLogger('ForumHierarchyTree');

export function useForumTree(rootForumId?: string, maxDepth = 10, showHidden = false) {
  const [tree, setTree] = useState<ForumNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTree = async () => {
      try {
        setLoading(true);
        const params: Record<string, string> = {
          max_depth: maxDepth.toString(),
          include_hidden: showHidden.toString(),
        };

        let response;
        if (rootForumId) {
          response = await api.get(`/api/v1/forums/${rootForumId}/subtree`, { params });
        } else {
          response = await api.get('/api/v1/forums/tree', { params });
        }

        setTree(response.data?.data || []);
        setError(null);
      } catch (err) {
        logger.error('Failed to fetch forum tree:', err);
        setError('Failed to load forum structure');
      } finally {
        setLoading(false);
      }
    };

    fetchTree();
  }, [rootForumId, maxDepth, showHidden]);

  return { tree, loading, error, refetch: () => setLoading(true) };
}
