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
import { AnimatedBorder } from '../customization-demo/effects';
import type { ForumCategory, ForumBoard, ActiveTab } from './types';

import { GradientText } from '../marketing/ui/GradientText';

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
          <span className="section-header__badge section-header__badge--purple">
            Revolutionary Forums
          </span>
          <h2 className="mb-4 font-zentry text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Build Your Community,{' '}
            <GradientText variant="emerald-purple" animated className="title-fx--air">
              Your Way
            </GradientText>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-400">
            The first forum platform with true drag-and-drop organization. Arrange boards,
            categories, and threads exactly how your community needs them.
          </p>
        </motion.div>

        <div className="mb-8 flex justify-center gap-2">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'border-white/50 bg-white/10 text-white'
                  : 'border-white/10 text-gray-400 hover:border-white/30'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </motion.button>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-5">
          <div className="min-w-0 lg:col-span-3">
            <AnimatedBorder className="h-full">
              <motion.div
                className="h-full overflow-x-auto rounded-2xl bg-gray-900/50 p-4 backdrop-blur-sm sm:p-6"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="box-border h-3 w-3 rounded-full border border-red-500/50 bg-red-500/20" />
                      <div className="box-border h-3 w-3 rounded-full border border-yellow-500/50 bg-yellow-500/20" />
                      <div className="box-border h-3 w-3 rounded-full border border-green-500/50 bg-green-500/20" />
                    </div>
                    <span className="text-sm font-medium text-gray-400">Forum Organization</span>
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
                          className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-gray-400 hover:border-white/20 hover:text-white"
                        >
                          Reset
                        </button>
                        <button
                          onClick={handleSave}
                          className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-400 hover:bg-emerald-500/20"
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
            </AnimatedBorder>
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
