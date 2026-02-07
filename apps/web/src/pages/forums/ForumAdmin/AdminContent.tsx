/**
 * AdminContent component - renders the active tab content
 */

import { motion, AnimatePresence } from 'framer-motion';
import type { ForumCategory, ForumModerator } from '@/modules/forums/store';
import type {
  AdminTab,
  ForumAppearance,
  ForumRule,
  PostFlair,
  MemberData,
  ModQueueItem,
  ForumAnalytics,
} from './types';
import {
  GeneralPanel,
  AnalyticsPanel,
  ModQueuePanel,
  AppearancePanel,
  CategoriesPanel,
  ModeratorsPanel,
  MembersPanel,
  PostsPanel,
  RulesPanel,
} from './panels';

interface AdminContentProps {
  activeTab: AdminTab;
  error: string | null;
  success: string | null;
  // General
  name: string;
  description: string;
  isPublic: boolean;
  isNsfw: boolean;
  requireApproval: boolean;
  isOwner: boolean;
  forumName: string;
  forumId: string;
  memberCount: number;
  showDeleteConfirm: boolean;
  deleteConfirmText: string;
  onNameChange: (name: string) => void;
  onDescriptionChange: (desc: string) => void;
  onPublicChange: (isPublic: boolean) => void;
  onNsfwChange: (isNsfw: boolean) => void;
  onRequireApprovalChange: (require: boolean) => void;
  onShowDeleteConfirm: (show: boolean) => void;
  onDeleteConfirmTextChange: (text: string) => void;
  onDelete: () => void;
  // Appearance
  appearance: ForumAppearance;
  setAppearance: React.Dispatch<React.SetStateAction<ForumAppearance>>;
  // Categories
  categories: ForumCategory[];
  newCategoryName: string;
  editingCategory: string | null;
  onNewCategoryNameChange: (name: string) => void;
  onAddCategory: () => void;
  onEditCategory: (id: string | null) => void;
  onUpdateCategory: (index: number, category: ForumCategory) => void;
  onRemoveCategory: (id: string) => void;
  // Moderators
  moderators: ForumModerator[];
  newModUsername: string;
  ownerDisplayName: string;
  onNewModUsernameChange: (username: string) => void;
  onAddModerator: (mod: ForumModerator) => void;
  onRemoveModerator: (id: string) => void;
  // Members
  members: MemberData[];
  memberSearch: string;
  memberFilter: string;
  onMemberSearchChange: (search: string) => void;
  onMemberFilterChange: (filter: string) => void;
  onUpdateMemberRole: (memberId: string, role: string) => void;
  // Flairs
  flairs: PostFlair[];
  onAddFlair: () => void;
  onUpdateFlair: (flairId: string, field: keyof PostFlair, value: string | boolean) => void;
  onRemoveFlair: (id: string) => void;
  // Rules
  rules: ForumRule[];
  editingRule: string | null;
  onAddRule: () => void;
  onEditRule: (id: string | null) => void;
  onUpdateRule: (ruleId: string, field: keyof ForumRule, value: string | number) => void;
  onRemoveRule: (id: string) => void;
  // Analytics
  analytics: ForumAnalytics;
  // Mod queue
  modQueue: ModQueueItem[];
  queueFilter: 'all' | 'pending' | 'reports';
  onQueueFilterChange: (filter: 'all' | 'pending' | 'reports') => void;
  onModQueueAction: (itemId: string, action: 'approve' | 'reject') => void;
}

export function AdminContent({
  activeTab,
  error,
  success,
  name,
  description,
  isPublic,
  isNsfw,
  requireApproval,
  isOwner,
  forumName,
  forumId,
  memberCount,
  showDeleteConfirm,
  deleteConfirmText,
  onNameChange,
  onDescriptionChange,
  onPublicChange,
  onNsfwChange,
  onRequireApprovalChange,
  onShowDeleteConfirm,
  onDeleteConfirmTextChange,
  onDelete,
  appearance,
  setAppearance,
  categories,
  newCategoryName,
  editingCategory,
  onNewCategoryNameChange,
  onAddCategory,
  onEditCategory,
  onUpdateCategory,
  onRemoveCategory,
  moderators,
  newModUsername,
  ownerDisplayName,
  onNewModUsernameChange,
  onAddModerator,
  onRemoveModerator,
  members,
  memberSearch,
  memberFilter,
  onMemberSearchChange,
  onMemberFilterChange,
  onUpdateMemberRole,
  flairs,
  onAddFlair,
  onUpdateFlair,
  onRemoveFlair,
  rules,
  editingRule,
  onAddRule,
  onEditRule,
  onUpdateRule,
  onRemoveRule,
  analytics,
  modQueue,
  queueFilter,
  onQueueFilterChange,
  onModQueueAction,
}: AdminContentProps) {
  return (
    <main className="flex-1 overflow-y-auto">
      {/* Messages */}
      <AnimatePresence>
        {(error || success) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`m-4 rounded-lg p-4 ${
              error
                ? 'border border-red-500 bg-red-500/20 text-red-400'
                : 'border border-green-500 bg-green-500/20 text-green-400'
            }`}
          >
            {error || success}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'general' && (
            <GeneralPanel
              name={name}
              description={description}
              isPublic={isPublic}
              isNsfw={isNsfw}
              requireApproval={requireApproval}
              isOwner={isOwner}
              forumName={forumName}
              showDeleteConfirm={showDeleteConfirm}
              deleteConfirmText={deleteConfirmText}
              onNameChange={onNameChange}
              onDescriptionChange={onDescriptionChange}
              onPublicChange={onPublicChange}
              onNsfwChange={onNsfwChange}
              onRequireApprovalChange={onRequireApprovalChange}
              onShowDeleteConfirm={onShowDeleteConfirm}
              onDeleteConfirmTextChange={onDeleteConfirmTextChange}
              onDelete={onDelete}
            />
          )}

          {activeTab === 'appearance' && (
            <AppearancePanel
              appearance={appearance}
              setAppearance={setAppearance}
              forumName={forumName}
              displayName={name}
              memberCount={memberCount}
            />
          )}

          {activeTab === 'categories' && (
            <CategoriesPanel
              categories={categories}
              newCategoryName={newCategoryName}
              editingCategory={editingCategory}
              onNewCategoryNameChange={onNewCategoryNameChange}
              onAddCategory={onAddCategory}
              onEditCategory={onEditCategory}
              onUpdateCategory={onUpdateCategory}
              onRemoveCategory={onRemoveCategory}
            />
          )}

          {activeTab === 'moderators' && (
            <ModeratorsPanel
              moderators={moderators}
              newModUsername={newModUsername}
              ownerDisplayName={ownerDisplayName}
              forumId={forumId}
              onNewModUsernameChange={onNewModUsernameChange}
              onAddModerator={onAddModerator}
              onRemoveModerator={onRemoveModerator}
            />
          )}

          {activeTab === 'members' && (
            <MembersPanel
              members={members}
              memberSearch={memberSearch}
              memberFilter={memberFilter}
              onSearchChange={onMemberSearchChange}
              onFilterChange={onMemberFilterChange}
              onUpdateMemberRole={onUpdateMemberRole}
            />
          )}

          {activeTab === 'posts' && (
            <PostsPanel
              flairs={flairs}
              onAddFlair={onAddFlair}
              onUpdateFlair={onUpdateFlair}
              onRemoveFlair={onRemoveFlair}
            />
          )}

          {activeTab === 'rules' && (
            <RulesPanel
              rules={rules}
              editingRule={editingRule}
              onAddRule={onAddRule}
              onEditRule={onEditRule}
              onUpdateRule={onUpdateRule}
              onRemoveRule={onRemoveRule}
            />
          )}

          {activeTab === 'analytics' && <AnalyticsPanel analytics={analytics} />}

          {activeTab === 'modqueue' && (
            <ModQueuePanel
              modQueue={modQueue}
              queueFilter={queueFilter}
              onFilterChange={onQueueFilterChange}
              onAction={onModQueueAction}
            />
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
