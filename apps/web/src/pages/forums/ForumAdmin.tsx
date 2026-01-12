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
  Cog6ToothIcon,
  PaintBrushIcon,
  UserGroupIcon,
  FolderIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  TagIcon,
  DocumentTextIcon,
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
  FlagIcon,
  ChatBubbleLeftRightIcon,
  ArrowTrendingUpIcon,
  GlobeAltIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import GlassCard from '@/components/ui/GlassCard';
import { useForumStore, type ForumCategory, type ForumModerator } from '@/stores/forumStore';
import { useAuthStore } from '@/stores/authStore';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';

// Tab configuration
type AdminTab = 'general' | 'appearance' | 'moderators' | 'categories' | 'members' | 'posts' | 'rules' | 'analytics' | 'modqueue';

interface TabConfig {
  id: AdminTab;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const TABS: TabConfig[] = [
  { id: 'general', name: 'General', icon: Cog6ToothIcon, description: 'Basic forum settings' },
  { id: 'appearance', name: 'Appearance', icon: PaintBrushIcon, description: 'Customize look and feel' },
  { id: 'moderators', name: 'Moderators', icon: ShieldCheckIcon, description: 'Manage mod team' },
  { id: 'categories', name: 'Categories', icon: FolderIcon, description: 'Organize content' },
  { id: 'members', name: 'Members', icon: UserGroupIcon, description: 'Manage members' },
  { id: 'posts', name: 'Post Settings', icon: TagIcon, description: 'Flairs and prefixes' },
  { id: 'rules', name: 'Rules', icon: DocumentTextIcon, description: 'Community guidelines' },
  { id: 'analytics', name: 'Analytics', icon: ChartBarIcon, description: 'Forum insights' },
  { id: 'modqueue', name: 'Mod Queue', icon: FlagIcon, description: 'Reports and approvals' },
];

// Theme presets
const THEME_PRESETS = [
  { id: 'default', name: 'Default', primary: '#8B5CF6', secondary: '#6366F1', accent: '#EC4899' },
  { id: 'ocean', name: 'Ocean', primary: '#0EA5E9', secondary: '#06B6D4', accent: '#14B8A6' },
  { id: 'forest', name: 'Forest', primary: '#22C55E', secondary: '#10B981', accent: '#84CC16' },
  { id: 'sunset', name: 'Sunset', primary: '#F97316', secondary: '#EF4444', accent: '#F59E0B' },
  { id: 'midnight', name: 'Midnight', primary: '#6366F1', secondary: '#8B5CF6', accent: '#A855F7' },
  { id: 'rose', name: 'Rose', primary: '#EC4899', secondary: '#F43F5E', accent: '#FB7185' },
  { id: 'monochrome', name: 'Monochrome', primary: '#71717A', secondary: '#52525B', accent: '#A1A1AA' },
  { id: 'neon', name: 'Neon', primary: '#00FF87', secondary: '#00D9FF', accent: '#FF00E5' },
];

// Member role options
const MEMBER_ROLES = [
  { id: 'member', name: 'Member', color: 'text-gray-400', permissions: ['post', 'comment', 'vote'] },
  { id: 'trusted', name: 'Trusted', color: 'text-blue-400', permissions: ['post', 'comment', 'vote', 'report'] },
  { id: 'contributor', name: 'Contributor', color: 'text-green-400', permissions: ['post', 'comment', 'vote', 'report', 'flair'] },
  { id: 'moderator', name: 'Moderator', color: 'text-purple-400', permissions: ['all'] },
  { id: 'admin', name: 'Admin', color: 'text-yellow-400', permissions: ['all'] },
];

// Post flair presets
const DEFAULT_FLAIRS = [
  { id: 'discussion', name: 'Discussion', color: '#3B82F6', emoji: '💬' },
  { id: 'question', name: 'Question', color: '#8B5CF6', emoji: '❓' },
  { id: 'help', name: 'Help', color: '#F59E0B', emoji: '🆘' },
  { id: 'solved', name: 'Solved', color: '#22C55E', emoji: '✅' },
  { id: 'announcement', name: 'Announcement', color: '#EF4444', emoji: '📢' },
  { id: 'guide', name: 'Guide', color: '#14B8A6', emoji: '📖' },
  { id: 'news', name: 'News', color: '#0EA5E9', emoji: '📰' },
  { id: 'bug', name: 'Bug', color: '#DC2626', emoji: '🐛' },
  { id: 'feature', name: 'Feature Request', color: '#A855F7', emoji: '✨' },
  { id: 'media', name: 'Media', color: '#EC4899', emoji: '🎬' },
];

interface ForumAppearance {
  iconUrl: string;
  bannerUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  themePreset: string;
  customCss: string;
  headerStyle: 'default' | 'banner' | 'minimal' | 'gradient';
  cardStyle: 'default' | 'compact' | 'cozy' | 'magazine';
}

interface ForumRule {
  id: string;
  title: string;
  description: string;
  order: number;
}

interface PostFlair {
  id: string;
  name: string;
  color: string;
  emoji?: string;
  modOnly?: boolean;
}

interface MemberData {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  role: string;
  joinedAt: string;
  postCount: number;
  karma: number;
}

interface ModQueueItem {
  id: string;
  type: 'post' | 'comment' | 'report';
  content: string;
  author: string;
  authorId: string;
  reason?: string;
  reportedBy?: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export default function ForumAdmin() {
  const { forumSlug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { forums, fetchForum, updateForum, deleteForum } = useForumStore();

  const forum = forums.find((f) => f.slug === forumSlug);
  const isOwner = forum?.ownerId === user?.id;
  const isModerator = forum?.moderators?.some(m => m.userId === user?.id) || isOwner;

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
        { id: '1', title: 'Be Respectful', description: 'Treat others with respect. No harassment, hate speech, or personal attacks.', order: 1 },
        { id: '2', title: 'Stay On Topic', description: 'Keep discussions relevant to the forum\'s purpose.', order: 2 },
        { id: '3', title: 'No Spam', description: 'Don\'t post spam, self-promotion, or duplicate content.', order: 3 },
      ]);

      // Mock mod queue
      setModQueue([
        { id: '1', type: 'report', content: 'Inappropriate language in post', author: 'user123', authorId: '1', reason: 'Harassment', reportedBy: 'user456', createdAt: new Date().toISOString(), status: 'pending' },
        { id: '2', type: 'post', content: 'New post awaiting approval', author: 'newuser', authorId: '2', createdAt: new Date().toISOString(), status: 'pending' },
      ]);

      // Mock members
      setMembers([
        { id: '1', username: 'topuser', displayName: 'Top User', role: 'admin', joinedAt: '2024-01-01', postCount: 150, karma: 500 },
        { id: '2', username: 'activemod', displayName: 'Active Mod', role: 'moderator', joinedAt: '2024-02-15', postCount: 89, karma: 320 },
        { id: '3', username: 'contributor1', displayName: 'Contributor One', role: 'contributor', joinedAt: '2024-03-20', postCount: 45, karma: 180 },
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
    setCategories(categories.filter(c => c.id !== categoryId));
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
    setRules(rules.map(r => r.id === ruleId ? { ...r, [field]: value } : r));
  };

  const removeRule = (ruleId: string) => {
    setRules(rules.filter(r => r.id !== ruleId));
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
    setFlairs(flairs.map(f => f.id === flairId ? { ...f, [field]: value } : f));
  };

  const removeFlair = (flairId: string) => {
    setFlairs(flairs.filter(f => f.id !== flairId));
    HapticFeedback.medium();
  };

  const handleModQueueAction = (itemId: string, action: 'approve' | 'reject') => {
    setModQueue(modQueue.map(item =>
      item.id === itemId ? { ...item, status: action === 'approve' ? 'approved' : 'rejected' } : item
    ));
    HapticFeedback.success();
  };

  const updateMemberRole = (memberId: string, newRole: string) => {
    setMembers(members.map(m => m.id === memberId ? { ...m, role: newRole } : m));
    HapticFeedback.medium();
  };

  if (!forum) {
    return (
      <div className="flex-1 flex items-center justify-center bg-dark-900">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (!isModerator) {
    return (
      <div className="flex-1 flex items-center justify-center bg-dark-900">
        <GlassCard className="p-8 text-center">
          <ShieldCheckIcon className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400">You don't have permission to access this page.</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="flex-1 flex bg-dark-900 overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-dark-800 border-r border-dark-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-dark-700">
          <Link
            to={`/forums/${forumSlug}`}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span className="text-sm">Back to Forum</span>
          </Link>
          <div className="flex items-center gap-3">
            {appearance.iconUrl ? (
              <img src={appearance.iconUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">{forum.name[0]}</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-white truncate">{forum.name}</h1>
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
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all mb-1 ${
                activeTab === tab.id
                  ? 'bg-primary-500/20 text-primary-400'
                  : 'text-gray-400 hover:bg-dark-700 hover:text-white'
              }`}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
            >
              <tab.icon className="h-5 w-5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{tab.name}</div>
                <div className="text-xs opacity-60 truncate">{tab.description}</div>
              </div>
              {tab.id === 'modqueue' && modQueue.filter(i => i.status === 'pending').length > 0 && (
                <span className="px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                  {modQueue.filter(i => i.status === 'pending').length}
                </span>
              )}
            </motion.button>
          ))}
        </nav>

        {/* Save Button */}
        <div className="p-4 border-t border-dark-700">
          <motion.button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
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
              className={`m-4 p-4 rounded-lg ${
                error ? 'bg-red-500/20 border border-red-500 text-red-400' : 'bg-green-500/20 border border-green-500 text-green-400'
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
              <motion.div
                key="general"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">General Settings</h2>
                  <p className="text-gray-400">Basic forum configuration and privacy settings.</p>
                </div>

                <GlassCard className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Forum Identity</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Forum Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2.5 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                        placeholder="Describe your forum..."
                      />
                    </div>
                  </div>
                </GlassCard>

                <GlassCard className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Privacy & Access</h3>
                  <div className="space-y-4">
                    <label className="flex items-start gap-4 p-4 bg-dark-700/50 rounded-lg cursor-pointer hover:bg-dark-700 transition-colors">
                      <input
                        type="radio"
                        checked={isPublic}
                        onChange={() => setIsPublic(true)}
                        className="mt-1"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <GlobeAltIcon className="h-5 w-5 text-green-500" />
                          <span className="font-medium text-white">Public</span>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">Anyone can view and join</p>
                      </div>
                    </label>
                    <label className="flex items-start gap-4 p-4 bg-dark-700/50 rounded-lg cursor-pointer hover:bg-dark-700 transition-colors">
                      <input
                        type="radio"
                        checked={!isPublic}
                        onChange={() => setIsPublic(false)}
                        className="mt-1"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <LockClosedIcon className="h-5 w-5 text-yellow-500" />
                          <span className="font-medium text-white">Private</span>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">Only members can view content</p>
                      </div>
                    </label>
                  </div>

                  <div className="mt-6 space-y-3">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isNsfw}
                        onChange={(e) => setIsNsfw(e.target.checked)}
                        className="w-5 h-5 rounded bg-dark-700 border-dark-600 text-primary-500"
                      />
                      <div>
                        <span className="font-medium text-white">NSFW Content (18+)</span>
                        <p className="text-sm text-gray-400">This forum contains adult content</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={requireApproval}
                        onChange={(e) => setRequireApproval(e.target.checked)}
                        className="w-5 h-5 rounded bg-dark-700 border-dark-600 text-primary-500"
                      />
                      <div>
                        <span className="font-medium text-white">Require Post Approval</span>
                        <p className="text-sm text-gray-400">All posts must be approved by moderators</p>
                      </div>
                    </label>
                  </div>
                </GlassCard>

                {/* Danger Zone */}
                {isOwner && (
                  <GlassCard className="p-6 border-red-500/30">
                    <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
                      <ExclamationTriangleIcon className="h-5 w-5" />
                      Danger Zone
                    </h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-white">Delete Forum</h4>
                        <p className="text-sm text-gray-400">Permanently delete this forum and all content</p>
                      </div>
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
                      >
                        <TrashIcon className="h-4 w-4" />
                        Delete
                      </button>
                    </div>

                    {showDeleteConfirm && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 p-4 bg-dark-800 rounded-lg"
                      >
                        <p className="text-sm text-gray-300 mb-3">
                          Type <span className="font-mono text-red-400">{forum.name}</span> to confirm:
                        </p>
                        <input
                          type="text"
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white mb-3"
                        />
                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              setShowDeleteConfirm(false);
                              setDeleteConfirmText('');
                            }}
                            className="px-4 py-2 bg-dark-600 hover:bg-dark-500 text-white rounded-lg"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleDelete}
                            disabled={deleteConfirmText !== forum.name}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white rounded-lg"
                          >
                            Delete Forever
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </GlassCard>
                )}
              </motion.div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <motion.div
                key="appearance"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Appearance</h2>
                  <p className="text-gray-400">Customize your forum's look and feel.</p>
                </div>

                {/* Preview */}
                <GlassCard className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Live Preview</h3>
                  <div
                    className="rounded-xl overflow-hidden border border-dark-600"
                    style={{
                      '--primary': appearance.primaryColor,
                      '--secondary': appearance.secondaryColor,
                    } as React.CSSProperties}
                  >
                    {appearance.bannerUrl ? (
                      <div className="h-32 bg-cover bg-center" style={{ backgroundImage: `url(${appearance.bannerUrl})` }} />
                    ) : (
                      <div
                        className="h-32"
                        style={{ background: `linear-gradient(135deg, ${appearance.primaryColor}, ${appearance.secondaryColor})` }}
                      />
                    )}
                    <div className="p-4 bg-dark-800 flex items-center gap-4">
                      {appearance.iconUrl ? (
                        <img src={appearance.iconUrl} alt="" className="h-16 w-16 rounded-xl object-cover -mt-12 border-4 border-dark-800" />
                      ) : (
                        <div
                          className="h-16 w-16 rounded-xl -mt-12 border-4 border-dark-800 flex items-center justify-center"
                          style={{ background: `linear-gradient(135deg, ${appearance.primaryColor}, ${appearance.secondaryColor})` }}
                        >
                          <span className="text-white font-bold text-2xl">{forum.name[0]}</span>
                        </div>
                      )}
                      <div>
                        <h4 className="text-xl font-bold text-white">{name || forum.name}</h4>
                        <p className="text-sm text-gray-400">{forum.memberCount} members</p>
                      </div>
                    </div>
                  </div>
                </GlassCard>

                {/* Theme Presets */}
                <GlassCard className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Theme Presets</h3>
                  <div className="grid grid-cols-4 gap-3">
                    {THEME_PRESETS.map((theme) => (
                      <motion.button
                        key={theme.id}
                        onClick={() => {
                          setAppearance({
                            ...appearance,
                            themePreset: theme.id,
                            primaryColor: theme.primary,
                            secondaryColor: theme.secondary,
                            accentColor: theme.accent,
                          });
                          HapticFeedback.light();
                        }}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          appearance.themePreset === theme.id
                            ? 'border-primary-500'
                            : 'border-dark-600 hover:border-dark-500'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div
                          className="h-8 rounded-lg mb-2"
                          style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` }}
                        />
                        <span className="text-sm text-white">{theme.name}</span>
                      </motion.button>
                    ))}
                  </div>
                </GlassCard>

                {/* Custom Colors */}
                <GlassCard className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Custom Colors</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Primary</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={appearance.primaryColor}
                          onChange={(e) => setAppearance({ ...appearance, primaryColor: e.target.value, themePreset: 'custom' })}
                          className="h-10 w-16 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={appearance.primaryColor}
                          onChange={(e) => setAppearance({ ...appearance, primaryColor: e.target.value, themePreset: 'custom' })}
                          className="flex-1 px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Secondary</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={appearance.secondaryColor}
                          onChange={(e) => setAppearance({ ...appearance, secondaryColor: e.target.value, themePreset: 'custom' })}
                          className="h-10 w-16 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={appearance.secondaryColor}
                          onChange={(e) => setAppearance({ ...appearance, secondaryColor: e.target.value, themePreset: 'custom' })}
                          className="flex-1 px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Accent</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={appearance.accentColor}
                          onChange={(e) => setAppearance({ ...appearance, accentColor: e.target.value, themePreset: 'custom' })}
                          className="h-10 w-16 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={appearance.accentColor}
                          onChange={(e) => setAppearance({ ...appearance, accentColor: e.target.value, themePreset: 'custom' })}
                          className="flex-1 px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </GlassCard>

                {/* Images */}
                <GlassCard className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Images</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Icon URL</label>
                      <div className="flex items-center gap-3">
                        <div className="h-16 w-16 rounded-xl bg-dark-700 flex items-center justify-center overflow-hidden">
                          {appearance.iconUrl ? (
                            <img src={appearance.iconUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <PhotoIcon className="h-8 w-8 text-gray-500" />
                          )}
                        </div>
                        <input
                          type="text"
                          value={appearance.iconUrl}
                          onChange={(e) => setAppearance({ ...appearance, iconUrl: e.target.value })}
                          placeholder="https://example.com/icon.png"
                          className="flex-1 px-4 py-2.5 bg-dark-700 border border-dark-600 rounded-lg text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Banner URL</label>
                      <div className="space-y-2">
                        <div className="h-24 rounded-xl bg-dark-700 flex items-center justify-center overflow-hidden">
                          {appearance.bannerUrl ? (
                            <img src={appearance.bannerUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <PhotoIcon className="h-8 w-8 text-gray-500" />
                          )}
                        </div>
                        <input
                          type="text"
                          value={appearance.bannerUrl}
                          onChange={(e) => setAppearance({ ...appearance, bannerUrl: e.target.value })}
                          placeholder="https://example.com/banner.png"
                          className="w-full px-4 py-2.5 bg-dark-700 border border-dark-600 rounded-lg text-white"
                        />
                      </div>
                    </div>
                  </div>
                </GlassCard>

                {/* Custom CSS */}
                <GlassCard className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Custom CSS</h3>
                  <p className="text-sm text-gray-400 mb-3">Advanced: Add custom styles to your forum.</p>
                  <textarea
                    value={appearance.customCss}
                    onChange={(e) => setAppearance({ ...appearance, customCss: e.target.value })}
                    rows={8}
                    placeholder="/* Custom CSS goes here */"
                    className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white font-mono text-sm resize-none"
                  />
                </GlassCard>
              </motion.div>
            )}

            {/* Categories Tab */}
            {activeTab === 'categories' && (
              <motion.div
                key="categories"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Categories</h2>
                  <p className="text-gray-400">Organize posts into categories/subforums.</p>
                </div>

                <GlassCard className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="New category name..."
                      className="flex-1 px-4 py-2.5 bg-dark-700 border border-dark-600 rounded-lg text-white"
                      onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                    />
                    <motion.button
                      onClick={addCategory}
                      className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center gap-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <PlusIcon className="h-5 w-5" />
                      Add
                    </motion.button>
                  </div>

                  {categories.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <FolderIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No categories yet. Add one to organize your posts.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {categories.map((category, index) => (
                        <motion.div
                          key={category.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-3 p-3 bg-dark-700/50 rounded-lg group"
                        >
                          <div className="text-gray-500 cursor-move">
                            <EllipsisHorizontalIcon className="h-5 w-5" />
                          </div>
                          <FolderIcon className="h-5 w-5 text-primary-400" />
                          {editingCategory === category.id ? (
                            <input
                              type="text"
                              value={category.name}
                              onChange={(e) => {
                                const updated = [...categories];
                                updated[index] = { ...category, name: e.target.value };
                                setCategories(updated);
                              }}
                              onBlur={() => setEditingCategory(null)}
                              onKeyDown={(e) => e.key === 'Enter' && setEditingCategory(null)}
                              className="flex-1 px-2 py-1 bg-dark-600 border border-dark-500 rounded text-white"
                              autoFocus
                            />
                          ) : (
                            <span className="flex-1 text-white">{category.name}</span>
                          )}
                          <span className="text-sm text-gray-500">{category.postCount || 0} posts</span>
                          <button
                            onClick={() => setEditingCategory(category.id)}
                            className="p-1 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => removeCategory(category.id)}
                            className="p-1 text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </GlassCard>
              </motion.div>
            )}

            {/* Moderators Tab */}
            {activeTab === 'moderators' && (
              <motion.div
                key="moderators"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Moderators</h2>
                  <p className="text-gray-400">Manage your moderation team.</p>
                </div>

                <GlassCard className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="relative flex-1">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                      <input
                        type="text"
                        value={newModUsername}
                        onChange={(e) => setNewModUsername(e.target.value)}
                        placeholder="Search username to add..."
                        className="w-full pl-10 pr-4 py-2.5 bg-dark-700 border border-dark-600 rounded-lg text-white"
                      />
                    </div>
                    <motion.button
                      onClick={() => {
                        if (newModUsername.trim()) {
                          const newMod: ForumModerator = {
                            id: `mod_${Date.now()}`,
                            forumId: forum.id,
                            userId: `user_${Date.now()}`,
                            username: newModUsername.trim(),
                            permissions: ['all'],
                            addedAt: new Date().toISOString(),
                          };
                          setModerators([...moderators, newMod]);
                          setNewModUsername('');
                          HapticFeedback.success();
                        }
                      }}
                      className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center gap-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <PlusIcon className="h-5 w-5" />
                      Add
                    </motion.button>
                  </div>

                  {/* Owner */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Owner</h4>
                    <div className="flex items-center gap-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                        <span className="text-white font-bold">{user?.displayName?.[0] || 'O'}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{user?.displayName || user?.username}</span>
                          <span className="px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded-full">Owner</span>
                        </div>
                        <span className="text-sm text-gray-400">Full access to all settings</span>
                      </div>
                    </div>
                  </div>

                  {/* Moderators List */}
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Moderators</h4>
                  {moderators.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <ShieldCheckIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No moderators yet. Add team members to help manage your forum.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {moderators.map((mod) => (
                        <motion.div
                          key={mod.id}
                          className="flex items-center gap-3 p-3 bg-dark-700/50 rounded-lg group"
                        >
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <span className="text-white font-bold">{mod.username?.[0]?.toUpperCase() || 'M'}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white">{mod.username}</span>
                              <span className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded-full">Moderator</span>
                            </div>
                            <span className="text-sm text-gray-400">
                              Added {new Date(mod.addedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setModerators(moderators.filter(m => m.id !== mod.id));
                              HapticFeedback.medium();
                            }}
                            className="p-2 text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </GlassCard>
              </motion.div>
            )}

            {/* Members Tab */}
            {activeTab === 'members' && (
              <motion.div
                key="members"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Members</h2>
                  <p className="text-gray-400">Manage forum members and their roles.</p>
                </div>

                <GlassCard className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="relative flex-1">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                      <input
                        type="text"
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                        placeholder="Search members..."
                        className="w-full pl-10 pr-4 py-2.5 bg-dark-700 border border-dark-600 rounded-lg text-white"
                      />
                    </div>
                    <select
                      value={memberFilter}
                      onChange={(e) => setMemberFilter(e.target.value)}
                      className="px-4 py-2.5 bg-dark-700 border border-dark-600 rounded-lg text-white"
                    >
                      <option value="all">All Roles</option>
                      {MEMBER_ROLES.map(role => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    {members
                      .filter(m =>
                        (memberFilter === 'all' || m.role === memberFilter) &&
                        (m.username.toLowerCase().includes(memberSearch.toLowerCase()) ||
                         m.displayName.toLowerCase().includes(memberSearch.toLowerCase()))
                      )
                      .map((member) => (
                        <motion.div
                          key={member.id}
                          className="flex items-center gap-3 p-3 bg-dark-700/50 rounded-lg"
                        >
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center">
                            <span className="text-white font-bold">{member.displayName[0]}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white">{member.displayName}</span>
                              <span className={`text-xs ${MEMBER_ROLES.find(r => r.id === member.role)?.color}`}>
                                @{member.username}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-400">
                              <span>{member.postCount} posts</span>
                              <span>{member.karma} karma</span>
                              <span>Joined {new Date(member.joinedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <select
                            value={member.role}
                            onChange={(e) => updateMemberRole(member.id, e.target.value)}
                            className={`px-3 py-1.5 bg-dark-600 border border-dark-500 rounded-lg text-sm ${
                              MEMBER_ROLES.find(r => r.id === member.role)?.color
                            }`}
                          >
                            {MEMBER_ROLES.map(role => (
                              <option key={role.id} value={role.id}>{role.name}</option>
                            ))}
                          </select>
                        </motion.div>
                      ))}
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {/* Post Settings Tab */}
            {activeTab === 'posts' && (
              <motion.div
                key="posts"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Post Settings</h2>
                  <p className="text-gray-400">Configure post flairs and prefixes.</p>
                </div>

                <GlassCard className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white">Post Flairs</h3>
                    <motion.button
                      onClick={addFlair}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center gap-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <PlusIcon className="h-5 w-5" />
                      Add Flair
                    </motion.button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {flairs.map((flair) => (
                      <motion.div
                        key={flair.id}
                        className="flex items-center gap-3 p-3 bg-dark-700/50 rounded-lg group"
                      >
                        <div
                          className="px-3 py-1 rounded-full text-sm font-medium text-white"
                          style={{ backgroundColor: flair.color }}
                        >
                          {flair.emoji && <span className="mr-1">{flair.emoji}</span>}
                          {flair.name}
                        </div>
                        <div className="flex-1" />
                        <input
                          type="color"
                          value={flair.color}
                          onChange={(e) => updateFlair(flair.id, 'color', e.target.value)}
                          className="h-6 w-6 rounded cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                        />
                        <button
                          onClick={() => removeFlair(flair.id)}
                          className="p-1 text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {/* Rules Tab */}
            {activeTab === 'rules' && (
              <motion.div
                key="rules"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Community Rules</h2>
                  <p className="text-gray-400">Define guidelines for your community.</p>
                </div>

                <GlassCard className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white">Rules</h3>
                    <motion.button
                      onClick={addRule}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center gap-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <PlusIcon className="h-5 w-5" />
                      Add Rule
                    </motion.button>
                  </div>

                  <div className="space-y-3">
                    {rules.map((rule, index) => (
                      <motion.div
                        key={rule.id}
                        className="p-4 bg-dark-700/50 rounded-lg group"
                      >
                        <div className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center font-bold">
                            {index + 1}
                          </span>
                          <div className="flex-1">
                            {editingRule === rule.id ? (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={rule.title}
                                  onChange={(e) => updateRule(rule.id, 'title', e.target.value)}
                                  className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-lg text-white font-medium"
                                  placeholder="Rule title"
                                />
                                <textarea
                                  value={rule.description}
                                  onChange={(e) => updateRule(rule.id, 'description', e.target.value)}
                                  className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-lg text-white resize-none"
                                  rows={2}
                                  placeholder="Rule description"
                                />
                                <button
                                  onClick={() => setEditingRule(null)}
                                  className="px-3 py-1 bg-primary-600 text-white rounded text-sm"
                                >
                                  Done
                                </button>
                              </div>
                            ) : (
                              <>
                                <h4 className="font-semibold text-white">{rule.title}</h4>
                                <p className="text-sm text-gray-400 mt-1">{rule.description}</p>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setEditingRule(rule.id)}
                              className="p-1 text-gray-400 hover:text-white"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => removeRule(rule.id)}
                              className="p-1 text-gray-400 hover:text-red-400"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Analytics</h2>
                  <p className="text-gray-400">Forum performance and insights.</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <GlassCard className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/20">
                        <UsersIcon className="h-6 w-6 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">{analytics.totalMembers}</p>
                        <p className="text-sm text-gray-400">Total Members</p>
                      </div>
                    </div>
                  </GlassCard>
                  <GlassCard className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-500/20">
                        <ChatBubbleLeftRightIcon className="h-6 w-6 text-green-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">{analytics.totalPosts}</p>
                        <p className="text-sm text-gray-400">Total Posts</p>
                      </div>
                    </div>
                  </GlassCard>
                  <GlassCard className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-500/20">
                        <ArrowTrendingUpIcon className="h-6 w-6 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">{analytics.postsThisWeek}</p>
                        <p className="text-sm text-gray-400">Posts This Week</p>
                      </div>
                    </div>
                  </GlassCard>
                  <GlassCard className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-yellow-500/20">
                        <SparklesIcon className="h-6 w-6 text-yellow-400" />
                      </div>
                      <div>
                        <p className={`text-2xl font-bold ${analytics.growthRate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {analytics.growthRate >= 0 ? '+' : ''}{analytics.growthRate}%
                        </p>
                        <p className="text-sm text-gray-400">Growth Rate</p>
                      </div>
                    </div>
                  </GlassCard>
                </div>

                <GlassCard className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Top Contributors</h3>
                  <div className="space-y-3">
                    {analytics.topPosters.map((poster, index) => (
                      <div key={poster.username} className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0 ? 'bg-yellow-500 text-black' :
                          index === 1 ? 'bg-gray-400 text-black' :
                          'bg-orange-600 text-white'
                        }`}>
                          {index + 1}
                        </span>
                        <span className="flex-1 text-white">{poster.username}</span>
                        <span className="text-gray-400">{poster.count} posts</span>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {/* Mod Queue Tab */}
            {activeTab === 'modqueue' && (
              <motion.div
                key="modqueue"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Moderation Queue</h2>
                  <p className="text-gray-400">Review reports and pending content.</p>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  {(['all', 'pending', 'reports'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setQueueFilter(filter)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        queueFilter === filter
                          ? 'bg-primary-500 text-white'
                          : 'bg-dark-700 text-gray-400 hover:text-white'
                      }`}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </button>
                  ))}
                </div>

                <GlassCard className="p-6">
                  {modQueue.filter(item =>
                    queueFilter === 'all' ||
                    (queueFilter === 'pending' && item.status === 'pending') ||
                    (queueFilter === 'reports' && item.type === 'report')
                  ).length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <CheckIcon className="h-12 w-12 mx-auto mb-3 text-green-400" />
                      <p className="text-lg font-medium text-white">All caught up!</p>
                      <p className="text-sm">No items need your attention.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {modQueue
                        .filter(item =>
                          queueFilter === 'all' ||
                          (queueFilter === 'pending' && item.status === 'pending') ||
                          (queueFilter === 'reports' && item.type === 'report')
                        )
                        .map((item) => (
                          <motion.div
                            key={item.id}
                            className={`p-4 rounded-lg border ${
                              item.status === 'pending'
                                ? 'bg-dark-700/50 border-dark-600'
                                : item.status === 'approved'
                                ? 'bg-green-500/10 border-green-500/30'
                                : 'bg-red-500/10 border-red-500/30'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${
                                item.type === 'report' ? 'bg-red-500/20' : 'bg-blue-500/20'
                              }`}>
                                {item.type === 'report' ? (
                                  <FlagIcon className="h-5 w-5 text-red-400" />
                                ) : (
                                  <DocumentTextIcon className="h-5 w-5 text-blue-400" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                                    item.type === 'report' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                                  }`}>
                                    {item.type}
                                  </span>
                                  <span className="text-sm text-gray-400">by {item.author}</span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(item.createdAt).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-white">{item.content}</p>
                                {item.reason && (
                                  <p className="text-sm text-red-400 mt-1">Reason: {item.reason}</p>
                                )}
                              </div>
                              {item.status === 'pending' && (
                                <div className="flex items-center gap-2">
                                  <motion.button
                                    onClick={() => handleModQueueAction(item.id, 'approve')}
                                    className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <CheckIcon className="h-5 w-5" />
                                  </motion.button>
                                  <motion.button
                                    onClick={() => handleModQueueAction(item.id, 'reject')}
                                    className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <XMarkIcon className="h-5 w-5" />
                                  </motion.button>
                                </div>
                              )}
                              {item.status !== 'pending' && (
                                <span className={`px-3 py-1 text-sm rounded-full ${
                                  item.status === 'approved'
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-red-500/20 text-red-400'
                                }`}>
                                  {item.status}
                                </span>
                              )}
                            </div>
                          </motion.div>
                        ))}
                    </div>
                  )}
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
