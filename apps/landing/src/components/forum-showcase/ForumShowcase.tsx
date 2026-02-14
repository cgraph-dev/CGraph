/**
 * ForumShowcase Component
 * Interactive demonstration of CGraph's drag-and-drop community forums
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { initialCategories, tabs } from './constants';
import { OrganizeTab } from './OrganizeTab';
import { ThreadsTab } from './ThreadsTab';
import { ModerationTab } from './ModerationTab';
import { FeaturesSidebar } from './FeaturesSidebar';
import { FlowingBorder } from '../customization-demo/effects';
import type { ForumCategory, ForumBoard, ActiveTab } from './types';
import { springs } from './springs';
import { StarBorder } from '../effects';

export function ForumShowcase() {
  const [categories, setCategories] = useState<ForumCategory[]>(initialCategories);
  const [draggingBoardId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('organize');
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
  }, []);

  const handleReset = useCallback(() => {
    setCategories(initialCategories);
    setHasChanges(false);
  }, []);

  return (
    <section className="relative overflow-hidden bg-transparent py-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.03),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(139,92,246,0.03),transparent_50%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <StarBorder
            color="#a855f7"
            speed="5s"
            className="section-header__badge section-header__badge--purple"
          >
            Revolutionary Forums
          </StarBorder>
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

        <div className="mb-8 flex justify-center">
          <div className="inline-flex rounded-xl bg-gray-800/50 p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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
                    transition={springs.stiff}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-5">
          <div className="min-w-0 lg:col-span-3">
            <motion.div
              className="panel-border-glow overflow-x-auto rounded-2xl bg-gray-900/50 p-4 sm:p-6"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <FlowingBorder borderRadius="1rem" />
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

              <AnimatePresence mode="wait">
                {activeTab === 'organize' && (
                  <OrganizeTab
                    categories={categories}
                    setCategories={setCategories}
                    toggleCategory={toggleCategory}
                    reorderBoards={reorderBoards}
                    draggingBoardId={draggingBoardId}
                  />
                )}
                {activeTab === 'threads' && <ThreadsTab />}
                {activeTab === 'moderation' && <ModerationTab />}
              </AnimatePresence>
            </motion.div>
          </div>

          <div className="lg:col-span-2">
            <FeaturesSidebar />
          </div>
        </div>
      </div>
    </section>
  );
}

export default ForumShowcase;
