/**
 * useForumAdminState - state declarations and core save/delete handlers for forum admin
 */

import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForumStore, type ForumCategory, type ForumModerator } from '@/modules/forums/store';
import { useAuthStore } from '@/modules/auth/store';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { DEFAULT_FLAIRS, DEFAULT_APPEARANCE } from './constants';
import { useForumAdminInit } from './useForumAdminInit';
import type {
  AdminTab,
  ForumAppearance,
  ForumRule,
  PostFlair,
  MemberData,
  ModQueueItem,
  ForumAnalytics,
} from './types';

export function useForumAdminState() {
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

  // Delegate initialization effects
  useForumAdminInit({
    forum,
    forumSlug,
    isModerator,
    fetchForum,
    setName,
    setDescription,
    setIsPublic,
    setIsNsfw,
    setCategories,
    setModerators,
    setAppearance,
    setAnalytics,
    setRules,
    setModQueue,
    setMembers,
  });

  // Core save/delete handlers
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
    setCategories,
    newCategoryName,
    setNewCategoryName,
    editingCategory,
    setEditingCategory,
    // Moderators
    moderators,
    setModerators,
    newModUsername,
    setNewModUsername,
    // Members
    members,
    setMembers,
    memberSearch,
    setMemberSearch,
    memberFilter,
    setMemberFilter,
    // Rules
    rules,
    setRules,
    editingRule,
    setEditingRule,
    // Flairs
    flairs,
    setFlairs,
    // Mod queue
    modQueue,
    setModQueue,
    queueFilter,
    setQueueFilter,
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
