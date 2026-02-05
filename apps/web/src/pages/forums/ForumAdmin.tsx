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

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeftIcon,
  TrashIcon,
  PlusIcon,
  PencilIcon,
  PhotoIcon,
  CheckIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  EllipsisHorizontalIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  UsersIcon,
  ChatBubbleLeftRightIcon,
  ArrowTrendingUpIcon,
  GlobeAltIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { useForumStore, type ForumCategory, type ForumModerator } from '@/stores/forumStore';
import { useAuthStore } from '@/stores/authStore';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';

// Import types and constants from module
import type {
  AdminTab,
  ForumAppearance,
  ForumRule,
  PostFlair,
  MemberData,
  ModQueueItem,
  ForumAnalytics,
} from './ForumAdmin/types';
import {
  TABS,
  THEME_PRESETS,
  MEMBER_ROLES,
  DEFAULT_FLAIRS,
  DEFAULT_APPEARANCE,
  DEFAULT_RULES,
} from './ForumAdmin/constants';
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
} from './ForumAdmin/panels';

export default function ForumAdmin() {
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
  const [appearance, setAppearance] = useState<ForumAppearance>({
    iconUrl: '',
    bannerUrl: '',
    primaryColor: '#8B5CF6',
    secondaryColor: '#6366F1',
    accentColor: '#EC4899',
    themePreset: 'default',
    customCss: '',
    headerStyle: 'default',
    cardStyle: 'default',
  });

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
  const [analytics, setAnalytics] = useState({
    totalMembers: 0,
    activeMembers: 0,
    totalPosts: 0,
    totalComments: 0,
    postsToday: 0,
    postsThisWeek: 0,
    topPosters: [] as { username: string; count: number }[],
    growthRate: 0,
  });

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    if (forumSlug) {
      fetchForum(forumSlug);
    }
  }, [forumSlug, fetchForum]);

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

  const handleSave = async () => {
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
  };

  const handleDelete = async () => {
    if (!forum || deleteConfirmText !== forum.name) return;

    try {
      await deleteForum(forum.id);
      navigate('/forums');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete forum';
      setError(errorMessage);
    }
  };

  const addCategory = () => {
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
  };

  const removeCategory = (categoryId: string) => {
    setCategories(categories.filter((c) => c.id !== categoryId));
    HapticFeedback.medium();
  };

  const addRule = () => {
    const newRule: ForumRule = {
      id: `rule_${Date.now()}`,
      title: 'New Rule',
      description: 'Rule description...',
      order: rules.length + 1,
    };
    setRules([...rules, newRule]);
    setEditingRule(newRule.id);
    HapticFeedback.light();
  };

  const updateRule = (ruleId: string, field: keyof ForumRule, value: string | number) => {
    setRules(rules.map((r) => (r.id === ruleId ? { ...r, [field]: value } : r)));
  };

  const removeRule = (ruleId: string) => {
    setRules(rules.filter((r) => r.id !== ruleId));
    HapticFeedback.medium();
  };

  const addFlair = () => {
    const newFlair: PostFlair = {
      id: `flair_${Date.now()}`,
      name: 'New Flair',
      color: '#8B5CF6',
      emoji: '🏷️',
    };
    setFlairs([...flairs, newFlair]);
    HapticFeedback.light();
  };

  const updateFlair = (flairId: string, field: keyof PostFlair, value: string | boolean) => {
    setFlairs(flairs.map((f) => (f.id === flairId ? { ...f, [field]: value } : f)));
  };

  const removeFlair = (flairId: string) => {
    setFlairs(flairs.filter((f) => f.id !== flairId));
    HapticFeedback.medium();
  };

  const handleModQueueAction = (itemId: string, action: 'approve' | 'reject') => {
    setModQueue(
      modQueue.map((item) =>
        item.id === itemId
          ? { ...item, status: action === 'approve' ? 'approved' : 'rejected' }
          : item
      )
    );
    HapticFeedback.success();
  };

  const updateMemberRole = (memberId: string, newRole: string) => {
    setMembers(members.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)));
    HapticFeedback.medium();
  };

  if (!forum) {
    return (
      <div className="flex flex-1 items-center justify-center bg-dark-900">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

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
      {/* Sidebar Navigation */}
      <aside className="flex w-64 flex-col border-r border-dark-700 bg-dark-800">
        {/* Header */}
        <div className="border-b border-dark-700 p-4">
          <Link
            to={`/forums/${forumSlug}`}
            className="mb-4 flex items-center gap-2 text-gray-400 transition-colors hover:text-white"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span className="text-sm">Back to Forum</span>
          </Link>
          <div className="flex items-center gap-3">
            {appearance.iconUrl ? (
              <img src={appearance.iconUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-purple-600">
                <span className="text-lg font-bold text-white">{forum.name[0]}</span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="truncate font-bold text-white">{forum.name}</h1>
              <p className="text-xs text-gray-400">Admin Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2">
          {TABS.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                HapticFeedback.light();
              }}
              className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all ${
                activeTab === tab.id
                  ? 'bg-primary-500/20 text-primary-400'
                  : 'text-gray-400 hover:bg-dark-700 hover:text-white'
              }`}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
            >
              <tab.icon className="h-5 w-5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{tab.name}</div>
                <div className="truncate text-xs opacity-60">{tab.description}</div>
              </div>
              {tab.id === 'modqueue' &&
                modQueue.filter((i) => i.status === 'pending').length > 0 && (
                  <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
                    {modQueue.filter((i) => i.status === 'pending').length}
                  </span>
                )}
            </motion.button>
          ))}
        </nav>

        {/* Save Button */}
        <div className="border-t border-dark-700 p-4">
          <motion.button
            onClick={handleSave}
            disabled={isSaving}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 py-2.5 font-medium text-white transition-colors hover:bg-primary-700 disabled:bg-primary-600/50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isSaving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4" />
                Save Changes
              </>
            )}
          </motion.button>
        </div>
      </aside>

      {/* Main Content */}
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
            {/* General Tab */}
            {activeTab === 'general' && (
              <GeneralPanel
                name={name}
                description={description}
                isPublic={isPublic}
                isNsfw={isNsfw}
                requireApproval={requireApproval}
                isOwner={isOwner}
                forumName={forum.name}
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
              />
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <AppearancePanel
                appearance={appearance}
                setAppearance={setAppearance}
                forumName={forum.name}
                displayName={name}
                memberCount={forum.memberCount}
              />
            )}

            {/* Categories Tab */}
            {activeTab === 'categories' && (
              <CategoriesPanel
                categories={categories}
                newCategoryName={newCategoryName}
                editingCategory={editingCategory}
                onNewCategoryNameChange={setNewCategoryName}
                onAddCategory={addCategory}
                onEditCategory={setEditingCategory}
                onUpdateCategory={(index, category) => {
                  const updated = [...categories];
                  updated[index] = category;
                  setCategories(updated);
                }}
                onRemoveCategory={removeCategory}
              />
            )}

            {/* Moderators Tab */}
            {activeTab === 'moderators' && (
              <ModeratorsPanel
                moderators={moderators}
                newModUsername={newModUsername}
                ownerDisplayName={user?.displayName || user?.username || ''}
                forumId={forum.id}
                onNewModUsernameChange={setNewModUsername}
                onAddModerator={(mod) => setModerators([...moderators, mod])}
                onRemoveModerator={(modId) =>
                  setModerators(moderators.filter((m) => m.id !== modId))
                }
              />
            )}

            {/* Members Tab */}
            {activeTab === 'members' && (
              <MembersPanel
                members={members}
                memberSearch={memberSearch}
                memberFilter={memberFilter}
                onSearchChange={setMemberSearch}
                onFilterChange={setMemberFilter}
                onUpdateMemberRole={updateMemberRole}
              />
            )}

            {/* Post Settings Tab */}
            {activeTab === 'posts' && (
              <PostsPanel
                flairs={flairs}
                onAddFlair={addFlair}
                onUpdateFlair={updateFlair}
                onRemoveFlair={removeFlair}
              />
            )}

            {/* Rules Tab */}
            {activeTab === 'rules' && (
              <RulesPanel
                rules={rules}
                editingRule={editingRule}
                onAddRule={addRule}
                onEditRule={setEditingRule}
                onUpdateRule={updateRule}
                onRemoveRule={removeRule}
              />
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && <AnalyticsPanel analytics={analytics} />}

            {/* Mod Queue Tab */}
            {activeTab === 'modqueue' && (
              <ModQueuePanel
                modQueue={modQueue}
                queueFilter={queueFilter}
                onFilterChange={setQueueFilter}
                onAction={handleModQueueAction}
              />
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
