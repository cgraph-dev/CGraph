/**
 * useForumBreadcrumbs hook
 * @module modules/forums/components/forum-hierarchy-tree
 */

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { createLogger } from '@/lib/logger';
import type { Breadcrumb } from './types';

const logger = createLogger('ForumHierarchyTree');

export function useForumBreadcrumbs(forumId: string | undefined) {
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!forumId) {
      setBreadcrumbs([]);
      return;
    }

    const fetchBreadcrumbs = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/v1/forums/${forumId}/breadcrumbs`);
        setBreadcrumbs(response.data?.data || []);
      } catch (err) {
        logger.error('Failed to fetch breadcrumbs:', err);
        setBreadcrumbs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBreadcrumbs();
  }, [forumId]);

  return { breadcrumbs, loading };
}
