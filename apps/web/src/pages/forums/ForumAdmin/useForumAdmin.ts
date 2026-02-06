/**
 * useForumAdmin hook - state management and handlers for forum admin dashboard
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForumStore, type ForumCategory, type ForumModerator } from '@/stores/forumStore';
import { useAuthStore } from '@/stores/authStore';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { DEFAULT_FLAIRS, DEFAULT_APPEARANCE } from './constants';
import type {
  AdminTab,
  ForumAppearance,
  ForumRule,
  PostFlair,
  MemberData,
  ModQueueItem,
  ForumAnalytics,
} from './types';

export function useForumAdmin() {
  const { forumSlug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { forums, fetchForum, updateForum, deleteForum } = useForumStore();

  const forum = forums.find((f) => f.slug === forumSlug);
  const isOwner = forum?.ownerId === user?.id;
  const isModerator = forum?.moderators?.some((m) => m.userId === user?.id) || isOwner;

  const [activeTab, setActiveTab] = useState<AdminTab>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // General settings state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isNsfw, setIsNsfw] = useState(false);
  const [requireApproval, setRequireApproval] = useState(false);

  // Appearance state
  const [appearance, setAppearance] = useState<ForumAppearance>(DEFAULT_APPEARANCE);

  // Categories state
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);

  // Moderators state
  const [moderators, setModerators] = useState<ForumModerator[]>([]);
  const [newModUsername, setNewModUsername] = useState('');

  // Members state
  const [members, setMembers] = useState<MemberData[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberFilter, setMemberFilter] = useState<string>('all');

  // Rules state
  const [rules, setRules] = useState<ForumRule[]>([]);
  const [editingRule, setEditingRule] = useState<string | null>(null);

  // Flairs state
  const [flairs, setFlairs] = useState<PostFlair[]>(DEFAULT_FLAIRS);

  // Mod queue state
  const [modQueue, setModQueue] = useState<ModQueueItem[]>([]);
  const [queueFilter, setQueueFilter] = useState<'all' | 'pending' | 'reports'>('pending');

  // Analytics state
  const [analytics, setAnalytics] = useState<ForumAnalytics>({
    totalMembers: 0,
    activeMembers: 0,
    totalPosts: 0,
    totalComments: 0,
    postsToday: 0,
    postsThisWeek: 0,
    topPosters: [],
    growthRate: 0,
  });

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Fetch forum on mount
  useEffect(() => {
    if (forumSlug) {
      fetchForum(forumSlug);
    }
  }, [forumSlug, fetchForum]);

  // Initialize state from forum data
  useEffect(() => {
    if (forum) {
      setName(forum.name);
      setDescription(forum.description || '');
      setIsPublic(forum.isPublic ?? true);
      setIsNsfw(forum.isNsfw ?? false);
      setCategories(forum.categories || []);
      setModerators(forum.moderators || []);

      // Load appearance
      setAppearance({
        iconUrl: forum.iconUrl || '',
        bannerUrl: forum.bannerUrl || '',
        primaryColor: '#8B5CF6',
        secondaryColor: '#6366F1',
        accentColor: '#EC4899',
        themePreset: 'default',
        customCss: forum.customCss || '',
        headerStyle: 'default',
        cardStyle: 'default',
      });

      // Mock analytics data
      setAnalytics({
        totalMembers: forum.memberCount || 0,
        activeMembers: Math.floor((forum.memberCount || 0) * 0.3),
        totalPosts: Math.floor(Math.random() * 500) + 50,
        totalComments: Math.floor(Math.random() * 2000) + 200,
        postsToday: Math.floor(Math.random() * 20),
        postsThisWeek: Math.floor(Math.random() * 100),
        topPosters: [
          { username: 'user1', count: 45 },
          { username: 'user2', count: 38 },
          { username: 'user3', count: 32 },
        ],
        growthRate: Math.floor(Math.random() * 30) - 5,
      });

      // Mock rules
      setRules([
        {
          id: '1',
          title: 'Be Respectful',
          description:
            'Treat others with respect. No harassment, hate speech, or personal attacks.',
          order: 1,
        },
        {
          id: '2',
          title: 'Stay On Topic',
          description: "Keep discussions relevant to the forum's purpose.",
          order: 2,
        },
        {
          id: '3',
          title: 'No Spam',
          description: "Don't post spam, self-promotion, or duplicate content.",
          order: 3,
        },
      ]);

      // Mock mod queue
      setModQueue([
        {
          id: '1',
          type: 'report',
          content: 'Inappropriate language in post',
          author: 'user123',
          authorId: '1',
          reason: 'Harassment',
          reportedBy: 'user456',
          createdAt: new Date().toISOString(),
          status: 'pending',
        },
        {
          id: '2',
          type: 'post',
          content: 'New post awaiting approval',
          author: 'newuser',
          authorId: '2',
          createdAt: new Date().toISOString(),
          status: 'pending',
        },
      ]);

      // Mock members
      setMembers([
        {
          id: '1',
          username: 'topuser',
          displayName: 'Top User',
          role: 'admin',
          joinedAt: '2024-01-01',
          postCount: 150,
          karma: 500,
        },
        {
          id: '2',
          username: 'activemod',
          displayName: 'Active Mod',
          role: 'moderator',
          joinedAt: '2024-02-15',
          postCount: 89,
          karma: 320,
        },
        {
          id: '3',
          username: 'contributor1',
          displayName: 'Contributor One',
          role: 'contributor',
          joinedAt: '2024-03-20',
          postCount: 45,
          karma: 180,
        },
      ]);
    }
  }, [forum]);

  // Redirect if not owner/moderator
  useEffect(() => {
    if (forum && !isModerator) {
      navigate(`/forums/${forumSlug}`);
    }
  }, [forum, isModerator, navigate, forumSlug]);

  // Handlers
  const handleSave = useCallback(async () => {
    if (!forum) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await updateForum(forum.id, {
        name,
        description,
        isPublic,
        isNsfw,
        iconUrl: appearance.iconUrl,
        bannerUrl: appearance.bannerUrl,
        customCss: appearance.customCss,
      });
      setSuccess('Settings saved successfully!');
      HapticFeedback.success();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save settings';
      setError(errorMessage);
      HapticFeedback.error();
    } finally {
      setIsSaving(false);
    }
  }, [forum, updateForum, name, description, isPublic, isNsfw, appearance]);

  const handleDelete = useCallback(async () => {
    if (!forum || deleteConfirmText !== forum.name) return;

    try {
      await deleteForum(forum.id);
      navigate('/forums');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete forum';
      setError(errorMessage);
    }
  }, [forum, deleteConfirmText, deleteForum, navigate]);

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
  }, [newCategoryName, categories]);

  const removeCategory = useCallback((categoryId: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
    HapticFeedback.medium();
  }, []);

  const updateCategory = useCallback((index: number, category: ForumCategory) => {
    setCategories((prev) => {
      const updated = [...prev];
      updated[index] = category;
      return updated;
    });
  }, []);

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
  }, [rules]);

  const updateRule = useCallback(
    (ruleId: string, field: keyof ForumRule, value: string | number) => {
      setRules((prev) => prev.map((r) => (r.id === ruleId ? { ...r, [field]: value } : r)));
    },
    []
  );

  const removeRule = useCallback((ruleId: string) => {
    setRules((prev) => prev.filter((r) => r.id !== ruleId));
    HapticFeedback.medium();
  }, []);

  const addFlair = useCallback(() => {
    const newFlair: PostFlair = {
      id: `flair_${Date.now()}`,
      name: 'New Flair',
      color: '#8B5CF6',
      emoji: '🏷️',
    };
    setFlairs((prev) => [...prev, newFlair]);
    HapticFeedback.light();
  }, []);

  const updateFlair = useCallback(
    (flairId: string, field: keyof PostFlair, value: string | boolean) => {
      setFlairs((prev) => prev.map((f) => (f.id === flairId ? { ...f, [field]: value } : f)));
    },
    []
  );

  const removeFlair = useCallback((flairId: string) => {
    setFlairs((prev) => prev.filter((f) => f.id !== flairId));
    HapticFeedback.medium();
  }, []);

  const handleModQueueAction = useCallback((itemId: string, action: 'approve' | 'reject') => {
    setModQueue((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, status: action === 'approve' ? 'approved' : 'rejected' }
          : item
      )
    );
    HapticFeedback.success();
  }, []);

  const updateMemberRole = useCallback((memberId: string, newRole: string) => {
    setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)));
    HapticFeedback.medium();
  }, []);

  const addModerator = useCallback((mod: ForumModerator) => {
    setModerators((prev) => [...prev, mod]);
  }, []);

  const removeModerator = useCallback((modId: string) => {
    setModerators((prev) => prev.filter((m) => m.id !== modId));
  }, []);

  return {
    // Navigation
    forumSlug,
    navigate,
    // Forum data
    forum,
    user,
    isOwner,
    isModerator,
    // Tab state
    activeTab,
    setActiveTab,
    // Save state
    isSaving,
    error,
    success,
    // General settings
    name,
    setName,
    description,
    setDescription,
    isPublic,
    setIsPublic,
    isNsfw,
    setIsNsfw,
    requireApproval,
    setRequireApproval,
    // Appearance
    appearance,
    setAppearance,
    // Categories
    categories,
    newCategoryName,
    setNewCategoryName,
    editingCategory,
    setEditingCategory,
    addCategory,
    removeCategory,
    updateCategory,
    // Moderators
    moderators,
    newModUsername,
    setNewModUsername,
    addModerator,
    removeModerator,
    // Members
    members,
    memberSearch,
    setMemberSearch,
    memberFilter,
    setMemberFilter,
    updateMemberRole,
    // Rules
    rules,
    editingRule,
    setEditingRule,
    addRule,
    updateRule,
    removeRule,
    // Flairs
    flairs,
    addFlair,
    updateFlair,
    removeFlair,
    // Mod queue
    modQueue,
    queueFilter,
    setQueueFilter,
    handleModQueueAction,
    // Analytics
    analytics,
    // Delete
    showDeleteConfirm,
    setShowDeleteConfirm,
    deleteConfirmText,
    setDeleteConfirmText,
    // Actions
    handleSave,
    handleDelete,
  };
}
