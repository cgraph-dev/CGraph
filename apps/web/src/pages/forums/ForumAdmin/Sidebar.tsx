/**
 * Sidebar component for Forum Admin Dashboard
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { TABS } from './constants';
import type { AdminTab, ForumAppearance, ModQueueItem } from './types';

interface SidebarProps {
  forumSlug: string;
  forumName: string;
  appearance: ForumAppearance;
  activeTab: AdminTab;
  modQueue: ModQueueItem[];
  isSaving: boolean;
  onTabChange: (tab: AdminTab) => void;
  onSave: () => void;
}

export function Sidebar({
  forumSlug,
  forumName,
  appearance,
  activeTab,
  modQueue,
  isSaving,
  onTabChange,
  onSave,
}: SidebarProps) {
  const pendingCount = modQueue.filter((i) => i.status === 'pending').length;

  return (
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
              <span className="text-lg font-bold text-white">{forumName[0]}</span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-bold text-white">{forumName}</h1>
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
              onTabChange(tab.id);
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
            {tab.id === 'modqueue' && pendingCount > 0 && (
              <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
                {pendingCount}
              </span>
            )}
          </motion.button>
        ))}
      </nav>

      {/* Save Button */}
      <div className="border-t border-dark-700 p-4">
        <motion.button
          onClick={onSave}
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
  );
}
