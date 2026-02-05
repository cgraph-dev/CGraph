/**
 * UI Customization Settings Component
 *
 * Provides extensive user control over every aspect of the UI experience.
 * Features include theme customization, animation controls, particle systems,
 * glassmorphism effects, typography, spacing, and accessibility options.
 *
 * All settings persist to localStorage and apply instantly across the app.
 *
 * @module modules/settings/components/ui-customization
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SparklesIcon,
  SwatchIcon,
  BeakerIcon,
  BoltIcon,
  Cog6ToothIcon,
  ArrowPathIcon,
  PaintBrushIcon,
} from '@heroicons/react/24/outline';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';

import { useUIPreferences, applyPreferencesToDOM } from './store';
import {
  ThemeSettings,
  EffectsSettings,
  AnimationsSettings,
  TypographySettings,
  AdvancedSettings,
} from './settings-tabs';
import { ExportImportModal } from './ExportImportModal';

type TabId = 'theme' | 'effects' | 'animations' | 'typography' | 'advanced';

export default function UICustomizationSettings() {
  const { preferences, updatePreference, resetToDefaults, exportPreferences, importPreferences } =
    useUIPreferences();
  const [activeTab, setActiveTab] = useState<TabId>('theme');
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    applyPreferencesToDOM(preferences);
  }, [preferences]);

  const tabs = [
    { id: 'theme' as const, label: 'Theme & Colors', icon: SwatchIcon },
    { id: 'effects' as const, label: 'Glass & Effects', icon: SparklesIcon },
    { id: 'animations' as const, label: 'Animations', icon: BoltIcon },
    { id: 'typography' as const, label: 'Typography', icon: PaintBrushIcon },
    { id: 'advanced' as const, label: 'Advanced', icon: BeakerIcon },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-3 text-2xl font-bold text-white">
            <Cog6ToothIcon className="h-7 w-7 text-primary-400" />
            UI Customization
          </h2>
          <p className="mt-1 text-gray-400">Personalize every aspect of your CGraph experience</p>
        </div>

        <div className="flex gap-2">
          <motion.button
            onClick={() => setShowExportModal(true)}
            className="rounded-lg bg-dark-700 px-4 py-2 text-white transition-colors hover:bg-dark-600"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Export/Import
          </motion.button>
          <motion.button
            onClick={() => {
              if (confirm('Reset all settings to defaults?')) {
                resetToDefaults();
              }
            }}
            className="rounded-lg border border-red-500/30 bg-red-500/20 px-4 py-2 text-red-400 transition-colors hover:bg-red-500/30"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowPathIcon className="h-5 w-5" />
          </motion.button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <motion.button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                HapticFeedback.light();
              }}
              className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-3 font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-lg'
                  : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'theme' && (
            <ThemeSettings preferences={preferences} updatePreference={updatePreference} />
          )}
          {activeTab === 'effects' && (
            <EffectsSettings preferences={preferences} updatePreference={updatePreference} />
          )}
          {activeTab === 'animations' && (
            <AnimationsSettings preferences={preferences} updatePreference={updatePreference} />
          )}
          {activeTab === 'typography' && (
            <TypographySettings preferences={preferences} updatePreference={updatePreference} />
          )}
          {activeTab === 'advanced' && (
            <AdvancedSettings preferences={preferences} updatePreference={updatePreference} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Export/Import Modal */}
      <AnimatePresence>
        {showExportModal && (
          <ExportImportModal
            exportData={exportPreferences()}
            onImport={(data) => {
              importPreferences(data);
              setShowExportModal(false);
            }}
            onClose={() => setShowExportModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
