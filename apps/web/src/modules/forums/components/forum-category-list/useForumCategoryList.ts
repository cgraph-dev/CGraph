import { useState, useMemo } from 'react';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import type { ForumCategory, Forum } from '@/modules/forums/store';

/**
 * Hook encapsulating state and logic for ForumCategoryList.
 */
export function useForumCategoryList(categories: ForumCategory[], forums: Forum[]) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(categories.map((c) => c.id))
  );

  /** Group forums by category id */
  const forumsByCategory = useMemo(() => {
    const grouped: Record<string, Forum[]> = {};
    categories.forEach((cat) => {
      grouped[cat.id] = [];
    });
    // This would need to be connected to actual forum-category relationships
    return grouped;
  }, [forums, categories]);

  const toggleCategory = (categoryId: string) => {
    HapticFeedback.light();
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  return { expandedCategories, forumsByCategory, toggleCategory };
}
