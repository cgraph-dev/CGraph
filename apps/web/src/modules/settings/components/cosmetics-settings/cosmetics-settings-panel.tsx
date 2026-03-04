/**
 * Cosmetics Settings Panel
 *
 * Comprehensive settings UI for managing:
 * - Avatar borders with live preview
 * - Profile themes with real-time switching
 * - Chat effects configuration
 *
 * Features:
 * - Tabbed interface
 * - Grid/List view toggle
 * - Filters by rarity, theme, owned
 * - Search functionality
 * - Live previews
 * - Equip/Unequip actions
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

import type { SettingsTab, ViewMode, FilterState } from './types';
import { DEFAULT_FILTERS } from './constants';
import { AvatarBordersSection } from './avatar-borders-section';
import { ProfileThemesSection } from './profile-themes-section';
import { ChatEffectsSection } from './chat-effects-section';

// =============================================================================
// CONSTANTS
// =============================================================================

const TABS: { id: SettingsTab; label: string }[] = [
  { id: 'borders', label: '🎨 Avatar Borders' },
  { id: 'themes', label: '🖼️ Profile Themes' },
  { id: 'chat-effects', label: '✨ Chat Effects' },
];

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * unknown for the settings module.
 */
/**
 * Cosmetics Settings Panel component.
 */
export function CosmeticsSettingsPanel() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('borders');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  return (
    <div className="min-h-screen bg-black/95 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <h1 className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-2xl font-bold text-transparent">
            Cosmetics Settings
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Customize your avatar, profile, and chat appearance
          </p>
        </div>

        {/* Tabs */}
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-6 py-3 text-sm font-medium transition-all ${
                  activeTab === tab.id ? 'text-cyan-400' : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}

                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-500"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'borders' && (
            <motion.div
              key="borders"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <AvatarBordersSection
                filters={filters}
                setFilters={setFilters}
                viewMode={viewMode}
                setViewMode={setViewMode}
              />
            </motion.div>
          )}

          {activeTab === 'themes' && (
            <motion.div
              key="themes"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ProfileThemesSection
                filters={filters}
                setFilters={setFilters}
                viewMode={viewMode}
                setViewMode={setViewMode}
              />
            </motion.div>
          )}

          {activeTab === 'chat-effects' && (
            <motion.div
              key="chat-effects"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ChatEffectsSection />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default CosmeticsSettingsPanel;
