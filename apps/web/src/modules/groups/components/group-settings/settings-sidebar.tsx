/**
 * SettingsSidebar component
 * @module modules/groups/components/group-settings
 */

import { motion } from 'framer-motion';
import type { Group } from '@/modules/groups/store';
import type { TabId } from './types';
import { SETTINGS_TABS } from './constants';

interface SettingsSidebarProps {
  group: Group;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function SettingsSidebar({ group, activeTab, onTabChange }: SettingsSidebarProps) {
  return (
    <div className="w-56 border-r border-gray-700/50 bg-dark-800/50 p-4">
      <div className="mb-6 flex items-center gap-3 border-b border-gray-700/50 pb-4">
        <div className="h-10 w-10 overflow-hidden rounded-xl">
          {group.iconUrl ? (
            <img src={group.iconUrl} alt={group.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-600 to-purple-600">
              <span className="font-bold text-white">{group.name.slice(0, 2).toUpperCase()}</span>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-white">{group.name}</h3>
          <p className="text-xs text-gray-400">Group Settings</p>
        </div>
      </div>

      <nav className="space-y-1">
        {SETTINGS_TABS.map((tab) => (
          <motion.button
            key={tab.id}
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onTabChange(tab.id)}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
              activeTab === tab.id
                ? 'bg-primary-600/20 text-primary-400'
                : tab.id === 'danger'
                  ? 'text-red-400 hover:bg-red-500/10'
                  : 'text-gray-400 hover:bg-dark-700 hover:text-white'
            }`}
          >
            <tab.icon className="h-5 w-5" />
            <span>{tab.label}</span>
          </motion.button>
        ))}
      </nav>
    </div>
  );
}
