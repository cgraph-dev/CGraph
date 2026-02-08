/**
 * useForumAdminActions - action handlers for categories, rules, flairs, mod queue, and members
 */

import { useCallback, type Dispatch, type SetStateAction } from 'react';
import { type ForumCategory, type ForumModerator } from '@/modules/forums/store';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import type { ForumRule, PostFlair, ModQueueItem, MemberData } from './types';

interface ActionDeps {
  categories: ForumCategory[];
  setCategories: Dispatch<SetStateAction<ForumCategory[]>>;
  newCategoryName: string;
  setNewCategoryName: Dispatch<SetStateAction<string>>;
  rules: ForumRule[];
  setRules: Dispatch<SetStateAction<ForumRule[]>>;
  setEditingRule: Dispatch<SetStateAction<string | null>>;
  setFlairs: Dispatch<SetStateAction<PostFlair[]>>;
  setModQueue: Dispatch<SetStateAction<ModQueueItem[]>>;
  setMembers: Dispatch<SetStateAction<MemberData[]>>;
  setModerators: Dispatch<SetStateAction<ForumModerator[]>>;
}

export function useForumAdminActions(deps: ActionDeps) {
  const {
    categories,
    setCategories,
    newCategoryName,
    setNewCategoryName,
    rules,
    setRules,
    setEditingRule,
    setFlairs,
    setModQueue,
    setMembers,
    setModerators,
  } = deps;

  // Category handlers
  const addCategory = useCallback(() => {
    if (!newCategoryName.trim()) return;
    const newCategory: ForumCategory = {
      id: `cat_${Date.now()}`,
      name: newCategoryName.trim(),
      slug: newCategoryName.trim().toLowerCase().replace(/\s+/g, '-'),
      description: '',
      order: categories.length,
      postCount: 0,
    };
    setCategories([...categories, newCategory]);
    setNewCategoryName('');
    HapticFeedback.success();
  }, [newCategoryName, categories, setCategories, setNewCategoryName]);

  const removeCategory = useCallback(
    (categoryId: string) => {
      setCategories((prev) => prev.filter((c) => c.id !== categoryId));
      HapticFeedback.medium();
    },
    [setCategories]
  );

  const updateCategory = useCallback(
    (index: number, category: ForumCategory) => {
      setCategories((prev) => {
        const updated = [...prev];
        updated[index] = category;
        return updated;
      });
    },
    [setCategories]
  );

  // Rule handlers
  const addRule = useCallback(() => {
    const newRule: ForumRule = {
      id: `rule_${Date.now()}`,
      title: 'New Rule',
      description: 'Rule description...',
      order: rules.length + 1,
    };
    setRules([...rules, newRule]);
    setEditingRule(newRule.id);
    HapticFeedback.light();
  }, [rules, setRules, setEditingRule]);

  const updateRule = useCallback(
    (ruleId: string, field: keyof ForumRule, value: string | number) => {
      setRules((prev) => prev.map((r) => (r.id === ruleId ? { ...r, [field]: value } : r)));
    },
    [setRules]
  );

  const removeRule = useCallback(
    (ruleId: string) => {
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
      HapticFeedback.medium();
    },
    [setRules]
  );

  // Flair handlers
  const addFlair = useCallback(() => {
    const newFlair: PostFlair = {
      id: `flair_${Date.now()}`,
      name: 'New Flair',
      color: '#8B5CF6',
      emoji: '🏷️',
    };
    setFlairs((prev) => [...prev, newFlair]);
    HapticFeedback.light();
  }, [setFlairs]);

  const updateFlair = useCallback(
    (flairId: string, field: keyof PostFlair, value: string | boolean) => {
      setFlairs((prev) => prev.map((f) => (f.id === flairId ? { ...f, [field]: value } : f)));
    },
    [setFlairs]
  );

  const removeFlair = useCallback(
    (flairId: string) => {
      setFlairs((prev) => prev.filter((f) => f.id !== flairId));
      HapticFeedback.medium();
    },
    [setFlairs]
  );

  // Mod queue handler
  const handleModQueueAction = useCallback(
    (itemId: string, action: 'approve' | 'reject') => {
      setModQueue((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? { ...item, status: action === 'approve' ? 'approved' : 'rejected' }
            : item
        )
      );
      HapticFeedback.success();
    },
    [setModQueue]
  );

  // Member handler
  const updateMemberRole = useCallback(
    (memberId: string, newRole: string) => {
      setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)));
      HapticFeedback.medium();
    },
    [setMembers]
  );

  // Moderator handlers
  const addModerator = useCallback(
    (mod: ForumModerator) => {
      setModerators((prev) => [...prev, mod]);
    },
    [setModerators]
  );

  const removeModerator = useCallback(
    (modId: string) => {
      setModerators((prev) => prev.filter((m) => m.id !== modId));
    },
    [setModerators]
  );

  return {
    addCategory,
    removeCategory,
    updateCategory,
    addRule,
    updateRule,
    removeRule,
    addFlair,
    updateFlair,
    removeFlair,
    handleModQueueAction,
    updateMemberRole,
    addModerator,
    removeModerator,
  };
}
