/**
 * useForumAdmin hook - thin orchestrator composing state and actions
 */

import { useForumAdminState } from './useForumAdminState';
import { useForumAdminActions } from './useForumAdminActions';

export function useForumAdmin() {
  const state = useForumAdminState();

  const actions = useForumAdminActions({
    categories: state.categories,
    setCategories: state.setCategories,
    newCategoryName: state.newCategoryName,
    setNewCategoryName: state.setNewCategoryName,
    rules: state.rules,
    setRules: state.setRules,
    setEditingRule: state.setEditingRule,
    setFlairs: state.setFlairs,
    setModQueue: state.setModQueue,
    setMembers: state.setMembers,
    setModerators: state.setModerators,
  });

  return {
    // Navigation
    forumSlug: state.forumSlug,
    navigate: state.navigate,
    // Forum data
    forum: state.forum,
    user: state.user,
    isOwner: state.isOwner,
    isModerator: state.isModerator,
    // Tab state
    activeTab: state.activeTab,
    setActiveTab: state.setActiveTab,
    // Save state
    isSaving: state.isSaving,
    error: state.error,
    success: state.success,
    // General settings
    name: state.name,
    setName: state.setName,
    description: state.description,
    setDescription: state.setDescription,
    isPublic: state.isPublic,
    setIsPublic: state.setIsPublic,
    isNsfw: state.isNsfw,
    setIsNsfw: state.setIsNsfw,
    requireApproval: state.requireApproval,
    setRequireApproval: state.setRequireApproval,
    // Appearance
    appearance: state.appearance,
    setAppearance: state.setAppearance,
    // Categories
    categories: state.categories,
    newCategoryName: state.newCategoryName,
    setNewCategoryName: state.setNewCategoryName,
    editingCategory: state.editingCategory,
    setEditingCategory: state.setEditingCategory,
    addCategory: actions.addCategory,
    removeCategory: actions.removeCategory,
    updateCategory: actions.updateCategory,
    // Moderators
    moderators: state.moderators,
    newModUsername: state.newModUsername,
    setNewModUsername: state.setNewModUsername,
    addModerator: actions.addModerator,
    removeModerator: actions.removeModerator,
    // Members
    members: state.members,
    memberSearch: state.memberSearch,
    setMemberSearch: state.setMemberSearch,
    memberFilter: state.memberFilter,
    setMemberFilter: state.setMemberFilter,
    updateMemberRole: actions.updateMemberRole,
    // Rules
    rules: state.rules,
    editingRule: state.editingRule,
    setEditingRule: state.setEditingRule,
    addRule: actions.addRule,
    updateRule: actions.updateRule,
    removeRule: actions.removeRule,
    // Flairs
    flairs: state.flairs,
    addFlair: actions.addFlair,
    updateFlair: actions.updateFlair,
    removeFlair: actions.removeFlair,
    // Mod queue
    modQueue: state.modQueue,
    queueFilter: state.queueFilter,
    setQueueFilter: state.setQueueFilter,
    handleModQueueAction: actions.handleModQueueAction,
    // Analytics
    analytics: state.analytics,
    // Delete
    showDeleteConfirm: state.showDeleteConfirm,
    setShowDeleteConfirm: state.setShowDeleteConfirm,
    deleteConfirmText: state.deleteConfirmText,
    setDeleteConfirmText: state.setDeleteConfirmText,
    // Actions
    handleSave: state.handleSave,
    handleDelete: state.handleDelete,
  };
}
