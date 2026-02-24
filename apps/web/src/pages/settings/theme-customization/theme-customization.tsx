/**
 * Theme customization settings page.
 * @module
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStore, THEME_COLORS } from '@/stores/theme';
import type { TabType } from './types';
import { TABS } from './constants';
import { useThemeExport } from './useThemeExport';
import { PreviewPanel } from './preview-panel';
import { ThemeTab } from './theme-tab';
import { AvatarTab } from './avatar-tab';
import { ChatTab } from './chat-tab';
import { EffectsTab } from './effects-tab';
import { tweens } from '@/lib/animation-presets';

export default function ThemeCustomization() {
  const [activeTab, setActiveTab] = useState<TabType>('theme');
  const theme = useThemeStore((state) => state.theme);
  const resetTheme = useThemeStore((state) => state.resetTheme);
  const { handleExport, handleImport } = useThemeExport();

  const colors = THEME_COLORS[theme.colorPreset];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Theme Customization</h1>
              <p className="mt-1 text-sm text-gray-400">Personalize your identity across CGraph</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="rounded-lg bg-gray-800 px-4 py-2 text-sm transition-colors hover:bg-gray-700"
              >
                Export Theme
              </button>
              <button
                onClick={handleImport}
                className="rounded-lg bg-gray-800 px-4 py-2 text-sm transition-colors hover:bg-gray-700"
              >
                Import Theme
              </button>
              <button
                onClick={resetTheme}
                className="rounded-lg bg-red-600/20 px-4 py-2 text-sm text-red-400 transition-colors hover:bg-red-600/30"
              >
                Reset to Default
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Preview Panel */}
          <div className="space-y-6 lg:col-span-1">
            <PreviewPanel />
          </div>

          {/* Customization Panel */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="mb-6 flex gap-2 overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap rounded-lg px-4 py-2 transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r text-white shadow-lg'
                      : 'hover:bg-gray-750 bg-gray-800 text-gray-400'
                  }`}
                  style={
                    activeTab === tab.id
                      ? {
                          background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                        }
                      : undefined
                  }
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={tweens.fast}
                className="space-y-6"
              >
                {activeTab === 'theme' && <ThemeTab />}
                {activeTab === 'avatar' && <AvatarTab />}
                {activeTab === 'chat' && <ChatTab />}
                {activeTab === 'effects' && <EffectsTab />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
