/**
 * Revolutionary Forum Showcase
 *
 * Interactive demonstration of CGraph's drag-and-drop community forums.
 * Users can experience the revolutionary way to organize communities.
 */

import { useState, useCallback, memo } from 'react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';

// =============================================================================
// TYPES
// =============================================================================

interface ForumBoard {
  id: string;
  name: string;
  icon: string;
  description: string;
  threads: number;
  posts: number;
  color: string;
}

interface ForumCategory {
  id: string;
  name: string;
  icon: string;
  boards: ForumBoard[];
  collapsed: boolean;
}

// =============================================================================
// SAMPLE DATA
// =============================================================================

const initialCategories: ForumCategory[] = [
  {
    id: 'announcements',
    name: 'Announcements',
    icon: '📢',
    collapsed: false,
    boards: [
      {
        id: 'news',
        name: 'News & Updates',
        icon: '📰',
        description: 'Latest platform updates',
        threads: 42,
        posts: 156,
        color: '#10b981',
      },
      {
        id: 'events',
        name: 'Events',
        icon: '🎉',
        description: 'Community events calendar',
        threads: 18,
        posts: 89,
        color: '#06b6d4',
      },
    ],
  },
  {
    id: 'community',
    name: 'Community',
    icon: '👥',
    collapsed: false,
    boards: [
      {
        id: 'introductions',
        name: 'Introductions',
        icon: '👋',
        description: 'Say hello to the community',
        threads: 234,
        posts: 1205,
        color: '#8b5cf6',
      },
      {
        id: 'general',
        name: 'General Discussion',
        icon: '💬',
        description: 'Talk about anything',
        threads: 892,
        posts: 5621,
        color: '#f97316',
      },
      {
        id: 'showcase',
        name: 'Project Showcase',
        icon: '🚀',
        description: 'Share your creations',
        threads: 156,
        posts: 743,
        color: '#ec4899',
      },
    ],
  },
  {
    id: 'support',
    name: 'Support',
    icon: '🛠️',
    collapsed: false,
    boards: [
      {
        id: 'help',
        name: 'Help & Questions',
        icon: '❓',
        description: 'Get help from the community',
        threads: 567,
        posts: 2341,
        color: '#eab308',
      },
      {
        id: 'bugs',
        name: 'Bug Reports',
        icon: '🐛',
        description: 'Report issues',
        threads: 89,
        posts: 412,
        color: '#ef4444',
      },
      {
        id: 'feedback',
        name: 'Feedback',
        icon: '💡',
        description: 'Share your ideas',
        threads: 123,
        posts: 678,
        color: '#22c55e',
      },
    ],
  },
];

// =============================================================================
// DRAGGABLE BOARD COMPONENT
// =============================================================================

interface DraggableBoardProps {
  board: ForumBoard;
  isDragging: boolean;
}

const DraggableBoard = memo(function DraggableBoard({ board, isDragging }: DraggableBoardProps) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={board}
      id={board.id}
      dragListener={false}
      dragControls={dragControls}
      className={`group relative flex items-center gap-4 rounded-xl border bg-gray-800/50 p-4 transition-all ${
        isDragging
          ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/20'
          : 'border-gray-700/50 hover:border-gray-600'
      }`}
      whileDrag={{ scale: 1.02, zIndex: 50 }}
      layout
    >
      {/* Drag handle */}
      <motion.div
        className="cursor-grab touch-none text-gray-500 hover:text-gray-300 active:cursor-grabbing"
        onPointerDown={(e) => dragControls.start(e)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </motion.div>

      {/* Board icon */}
      <div
        className="flex h-12 w-12 items-center justify-center rounded-lg text-2xl"
        style={{ backgroundColor: `${board.color}20` }}
      >
        {board.icon}
      </div>

      {/* Board info */}
      <div className="min-w-0 flex-1">
        <h4 className="truncate font-semibold text-white">{board.name}</h4>
        <p className="truncate text-sm text-gray-400">{board.description}</p>
      </div>

      {/* Stats */}
      <div className="hidden items-center gap-4 text-sm text-gray-500 sm:flex">
        <div className="text-center">
          <div className="font-medium text-white">{board.threads}</div>
          <div className="text-xs">threads</div>
        </div>
        <div className="text-center">
          <div className="font-medium text-white">{board.posts}</div>
          <div className="text-xs">posts</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
        <button className="rounded-lg p-2 text-gray-400 hover:bg-gray-700 hover:text-white">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
        </button>
        <button className="rounded-lg p-2 text-gray-400 hover:bg-gray-700 hover:text-white">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </div>
    </Reorder.Item>
  );
});

// =============================================================================
// CATEGORY COMPONENT
// =============================================================================

interface CategoryProps {
  category: ForumCategory;
  onToggle: () => void;
  onReorderBoards: (boards: ForumBoard[]) => void;
  draggingBoardId: string | null;
}

const Category = memo(function Category({
  category,
  onToggle,
  onReorderBoards,
  draggingBoardId,
}: CategoryProps) {
  return (
    <motion.div
      layout
      className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/50"
    >
      {/* Category header */}
      <button
        className="flex w-full items-center gap-3 p-4 transition-colors hover:bg-gray-800/50"
        onClick={onToggle}
      >
        <span className="text-2xl">{category.icon}</span>
        <span className="flex-1 text-left font-semibold text-white">{category.name}</span>
        <span className="text-sm text-gray-500">{category.boards.length} boards</span>
        <motion.svg
          className="h-5 w-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          animate={{ rotate: category.collapsed ? 0 : 180 }}
          transition={{ duration: 0.2 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>

      {/* Boards */}
      <AnimatePresence>
        {!category.collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <Reorder.Group
              axis="y"
              values={category.boards}
              onReorder={onReorderBoards}
              className="space-y-2 p-4 pt-0"
            >
              {category.boards.map((board) => (
                <DraggableBoard
                  key={board.id}
                  board={board}
                  isDragging={draggingBoardId === board.id}
                />
              ))}
            </Reorder.Group>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

// =============================================================================
// FEATURE CARDS
// =============================================================================

const features = [
  {
    icon: '🎯',
    title: 'Drag & Drop',
    description: 'Reorganize boards instantly with intuitive drag and drop',
  },
  {
    icon: '📁',
    title: 'Categories',
    description: 'Group related boards into collapsible categories',
  },
  {
    icon: '🎨',
    title: 'Custom Icons',
    description: 'Personalize each board with custom icons and colors',
  },
  {
    icon: '📊',
    title: 'Live Stats',
    description: 'Real-time thread and post counts per board',
  },
  {
    icon: '🔐',
    title: 'Permissions',
    description: 'Fine-grained access control per board',
  },
  {
    icon: '⚡',
    title: 'Instant Save',
    description: 'Changes sync automatically across all devices',
  },
];

// =============================================================================
// THREAD PREFIXES DEMO
// =============================================================================

const threadPrefixes = [
  { name: 'SOLVED', color: '#22c55e', bg: '#22c55e20' },
  { name: 'HELP', color: '#eab308', bg: '#eab30820' },
  { name: 'BUG', color: '#ef4444', bg: '#ef444420' },
  { name: 'FEATURE', color: '#8b5cf6', bg: '#8b5cf620' },
  { name: 'DISCUSSION', color: '#06b6d4', bg: '#06b6d420' },
  { name: 'ANNOUNCEMENT', color: '#ec4899', bg: '#ec489920' },
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ForumShowcase() {
  const [categories, setCategories] = useState<ForumCategory[]>(initialCategories);
  const [draggingBoardId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'organize' | 'threads' | 'moderation'>('organize');
  const [hasChanges, setHasChanges] = useState(false);

  const toggleCategory = useCallback((categoryId: string) => {
    setCategories((prev) =>
      prev.map((cat) => (cat.id === categoryId ? { ...cat, collapsed: !cat.collapsed } : cat))
    );
  }, []);

  const reorderBoards = useCallback((categoryId: string, newBoards: ForumBoard[]) => {
    setCategories((prev) =>
      prev.map((cat) => (cat.id === categoryId ? { ...cat, boards: newBoards } : cat))
    );
    setHasChanges(true);
  }, []);

  const handleSave = useCallback(() => {
    setHasChanges(false);
    // Simulated save animation
  }, []);

  const handleReset = useCallback(() => {
    setCategories(initialCategories);
    setHasChanges(false);
  }, []);

  return (
    <section className="relative overflow-hidden bg-transparent py-24">
      {/* Background - subtle gradients that blend with parent */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.03),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(139,92,246,0.03),transparent_50%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="mb-4 inline-block animate-[badge-subtle-pulse_4s_ease-in-out_infinite] cursor-default rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1 text-sm text-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.15),0_0_24px_rgba(168,85,247,0.08)] transition-all duration-300 hover:scale-[1.02] hover:animate-none hover:border-purple-500/60 hover:bg-purple-500/20 hover:shadow-[0_0_20px_rgba(168,85,247,0.3),0_0_40px_rgba(168,85,247,0.15)]">
            🏛️ Revolutionary Forums
          </span>
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Build Your Community,{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-purple-400 bg-clip-text text-transparent">
              Your Way
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-400">
            The first forum platform with true drag-and-drop organization. Arrange boards,
            categories, and threads exactly how your community needs them.
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <div className="mb-8 flex justify-center">
          <div className="inline-flex rounded-xl bg-gray-800/50 p-1">
            {[
              { id: 'organize', label: 'Organize Boards', icon: '📋' },
              { id: 'threads', label: 'Thread Prefixes', icon: '🏷️' },
              { id: 'moderation', label: 'Moderation', icon: '🛡️' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id ? 'text-white' : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeForumTab"
                    className="absolute inset-0 rounded-lg bg-emerald-500/20"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Interactive Demo */}
          <div className="lg:col-span-3">
            <motion.div
              className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              {/* Demo Header */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                  </div>
                  <span className="text-sm text-gray-400">Forum Organization</span>
                </div>

                <AnimatePresence>
                  {hasChanges && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex items-center gap-2"
                    >
                      <button
                        onClick={handleReset}
                        className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-400 hover:text-white"
                      >
                        Reset
                      </button>
                      <button
                        onClick={handleSave}
                        className="rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-600"
                      >
                        Save Changes
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                {activeTab === 'organize' && (
                  <motion.div
                    key="organize"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <p className="mb-4 text-sm text-gray-400">
                      👆 Try dragging boards to reorder them within categories
                    </p>
                    <Reorder.Group
                      axis="y"
                      values={categories}
                      onReorder={setCategories}
                      className="space-y-4"
                    >
                      {categories.map((category) => (
                        <Reorder.Item key={category.id} value={category} dragListener={false}>
                          <Category
                            category={category}
                            onToggle={() => toggleCategory(category.id)}
                            onReorderBoards={(boards) => reorderBoards(category.id, boards)}
                            draggingBoardId={draggingBoardId}
                          />
                        </Reorder.Item>
                      ))}
                    </Reorder.Group>
                  </motion.div>
                )}

                {activeTab === 'threads' && (
                  <motion.div
                    key="threads"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <p className="text-sm text-gray-400">
                      Organize threads with customizable prefixes and status badges
                    </p>

                    {/* Prefix Tags */}
                    <div className="flex flex-wrap gap-2">
                      {threadPrefixes.map((prefix) => (
                        <motion.span
                          key={prefix.name}
                          className="rounded-full px-3 py-1 text-xs font-semibold"
                          style={{ backgroundColor: prefix.bg, color: prefix.color }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {prefix.name}
                        </motion.span>
                      ))}
                    </div>

                    {/* Sample Threads */}
                    <div className="space-y-3">
                      {[
                        {
                          prefix: 'SOLVED',
                          title: 'How to set up end-to-end encryption?',
                          replies: 24,
                          views: 1203,
                        },
                        {
                          prefix: 'HELP',
                          title: 'Need help with forum permissions',
                          replies: 8,
                          views: 456,
                        },
                        {
                          prefix: 'ANNOUNCEMENT',
                          title: 'New drag-and-drop feature released!',
                          replies: 156,
                          views: 8921,
                        },
                        {
                          prefix: 'DISCUSSION',
                          title: 'Best practices for community moderation',
                          replies: 67,
                          views: 2341,
                        },
                      ].map((thread, i) => {
                        const prefixData = threadPrefixes.find((p) => p.name === thread.prefix);
                        return (
                          <motion.div
                            key={i}
                            className="flex items-center gap-3 rounded-xl border border-gray-700/50 bg-gray-800/30 p-4"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                          >
                            <span
                              className="rounded-full px-2 py-0.5 text-xs font-semibold"
                              style={{ backgroundColor: prefixData?.bg, color: prefixData?.color }}
                            >
                              {thread.prefix}
                            </span>
                            <span className="flex-1 truncate text-white">{thread.title}</span>
                            <div className="hidden items-center gap-4 text-sm text-gray-500 sm:flex">
                              <span>💬 {thread.replies}</span>
                              <span>👁️ {thread.views}</span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'moderation' && (
                  <motion.div
                    key="moderation"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <p className="text-sm text-gray-400">
                      Powerful moderation tools to keep your community safe
                    </p>

                    {/* Moderation Actions */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      {[
                        {
                          icon: '📌',
                          title: 'Pin Threads',
                          desc: 'Highlight important discussions',
                        },
                        { icon: '🔒', title: 'Lock Threads', desc: 'Prevent further replies' },
                        { icon: '🔀', title: 'Move Threads', desc: 'Reorganize between boards' },
                        {
                          icon: '✂️',
                          title: 'Split Threads',
                          desc: 'Separate off-topic discussions',
                        },
                        { icon: '🔗', title: 'Merge Threads', desc: 'Combine duplicate topics' },
                        { icon: '⚠️', title: 'User Warnings', desc: 'Track rule violations' },
                      ].map((action, i) => (
                        <motion.div
                          key={i}
                          className="flex items-start gap-3 rounded-xl border border-gray-700/50 bg-gray-800/30 p-4"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          whileHover={{ borderColor: 'rgba(16, 185, 129, 0.5)' }}
                        >
                          <span className="text-2xl">{action.icon}</span>
                          <div>
                            <h4 className="font-medium text-white">{action.title}</h4>
                            <p className="text-sm text-gray-400">{action.desc}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Moderation Queue Preview */}
                    <div className="rounded-xl border border-gray-700/50 bg-gray-800/30 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <h4 className="font-medium text-white">Moderation Queue</h4>
                        <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">
                          3 pending
                        </span>
                      </div>
                      <div className="space-y-2">
                        {[
                          { type: 'Report', item: 'Spam post in General Discussion' },
                          { type: 'Flagged', item: 'New user post awaiting approval' },
                          { type: 'Appeal', item: 'User warning appeal #1234' },
                        ].map((item, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <span className="rounded bg-gray-700 px-1.5 py-0.5 text-xs text-gray-400">
                              {item.type}
                            </span>
                            <span className="text-gray-300">{item.item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Features Sidebar */}
          <div className="lg:col-span-2">
            <motion.div
              className="sticky top-24 space-y-4"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="text-lg font-semibold text-white">Revolutionary Features</h3>

              <div className="space-y-3">
                {features.map((feature, i) => (
                  <motion.div
                    key={feature.title}
                    className="flex items-start gap-3 rounded-xl border border-gray-800 bg-gray-900/50 p-4 transition-colors hover:border-emerald-500/30"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <span className="text-2xl">{feature.icon}</span>
                    <div>
                      <h4 className="font-medium text-white">{feature.title}</h4>
                      <p className="text-sm text-gray-400">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* CTA */}
              <motion.div
                className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-purple-500/10 p-6 text-center"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
              >
                <h4 className="mb-2 font-semibold text-white">Ready to build your community?</h4>
                <p className="mb-4 text-sm text-gray-400">Create your first forum in minutes</p>
                <a
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-2.5 font-medium text-white transition-colors hover:bg-emerald-600"
                >
                  Get Started Free
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </a>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ForumShowcase;
