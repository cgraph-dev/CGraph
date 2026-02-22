/**
 * Forum Admin Dashboard
 *
 * Comprehensive forum management panel with:
 * - Appearance customization (themes, colors, banners, icons)
 * - Moderator management
 * - Category/subforum management
 * - Member management with roles
 * - Post settings (flairs, prefixes, rules)
 * - Analytics and insights
 * - Moderation queue
 */

import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { useForumAdmin } from './forum-admin/useForumAdmin';
import { Sidebar } from './forum-admin/sidebar';
import { AdminContent } from './forum-admin/admin-content';

export default function ForumAdmin() {
  const {
    // Navigation
    forumSlug,
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
  } = useForumAdmin();

  // Loading state
  if (!forum) {
    return (
      <div className="flex flex-1 items-center justify-center bg-dark-900">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  // Access denied
  if (!isModerator) {
    return (
      <div className="flex flex-1 items-center justify-center bg-dark-900">
        <GlassCard className="p-8 text-center">
          <ShieldCheckIcon className="mx-auto mb-4 h-16 w-16 text-red-400" />
          <h2 className="mb-2 text-xl font-bold text-white">Access Denied</h2>
          <p className="text-gray-400">You don't have permission to access this page.</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden bg-dark-900">
      <Sidebar
        forumSlug={forumSlug || ''}
        forumName={forum.name}
        appearance={appearance}
        activeTab={activeTab}
        modQueue={modQueue}
        isSaving={isSaving}
        onTabChange={setActiveTab}
        onSave={handleSave}
      />

      <AdminContent
        activeTab={activeTab}
        error={error}
        success={success}
        name={name}
        description={description}
        isPublic={isPublic}
        isNsfw={isNsfw}
        requireApproval={requireApproval}
        isOwner={isOwner}
        forumName={forum.name}
        forumId={forum.id}
        memberCount={forum.memberCount || 0}
        showDeleteConfirm={showDeleteConfirm}
        deleteConfirmText={deleteConfirmText}
        onNameChange={setName}
        onDescriptionChange={setDescription}
        onPublicChange={setIsPublic}
        onNsfwChange={setIsNsfw}
        onRequireApprovalChange={setRequireApproval}
        onShowDeleteConfirm={setShowDeleteConfirm}
        onDeleteConfirmTextChange={setDeleteConfirmText}
        onDelete={handleDelete}
        appearance={appearance}
        setAppearance={setAppearance}
        categories={categories}
        newCategoryName={newCategoryName}
        editingCategory={editingCategory}
        onNewCategoryNameChange={setNewCategoryName}
        onAddCategory={addCategory}
        onEditCategory={setEditingCategory}
        onUpdateCategory={updateCategory}
        onRemoveCategory={removeCategory}
        moderators={moderators}
        newModUsername={newModUsername}
        ownerDisplayName={user?.displayName || user?.username || ''}
        onNewModUsernameChange={setNewModUsername}
        onAddModerator={addModerator}
        onRemoveModerator={removeModerator}
        members={members}
        memberSearch={memberSearch}
        memberFilter={memberFilter}
        onMemberSearchChange={setMemberSearch}
        onMemberFilterChange={setMemberFilter}
        onUpdateMemberRole={updateMemberRole}
        flairs={flairs}
        onAddFlair={addFlair}
        onUpdateFlair={updateFlair}
        onRemoveFlair={removeFlair}
        rules={rules}
        editingRule={editingRule}
        onAddRule={addRule}
        onEditRule={setEditingRule}
        onUpdateRule={updateRule}
        onRemoveRule={removeRule}
        analytics={analytics}
        modQueue={modQueue}
        queueFilter={queueFilter}
        onQueueFilterChange={setQueueFilter}
        onModQueueAction={handleModQueueAction}
      />
    </div>
  );
}
