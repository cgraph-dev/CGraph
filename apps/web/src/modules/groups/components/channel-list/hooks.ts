/**
 * Channel list data fetching hooks.
 * @module
 */
import { useState, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useGroupStore } from '@/modules/groups/store';
import { HapticFeedback } from '@/lib/animations/animation-engine';

/**
 * Hook for managing channel list state and logic.
 * Handles category expansion, active group resolution, and channel filtering.
 */
export function useChannelListState() {
  const { groupId, channelId } = useParams();
  const { groups, setActiveChannel } = useGroupStore();
  void setActiveChannel; // Reserved for channel selection handler

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState<string | null>(null);

  const activeGroup = groups.find((g) => g.id === groupId);

  // Initialize all categories as expanded
  useMemo(() => {
    if (activeGroup?.categories) {
      setExpandedCategories(new Set(activeGroup.categories.map((c) => c.id)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGroup?.id]);

  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
    HapticFeedback.light();
  }, []);

  const uncategorizedChannels = activeGroup?.channels?.filter((c) => !c.categoryId) || [];

  return {
    groupId,
    channelId,
    activeGroup,
    expandedCategories,
    showCreateModal,
    setShowCreateModal,
    toggleCategory,
    uncategorizedChannels,
  };
}
