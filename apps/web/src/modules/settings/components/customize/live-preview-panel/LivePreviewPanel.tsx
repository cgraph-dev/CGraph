/**
 * LivePreviewPanel - Main component
 *
 * Real-time preview of all customization settings.
 * Shows profile card, avatar, and chat bubbles with live updates.
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useShallow } from 'zustand/react/shallow';
import {
  useCustomizationStore,
  THEME_COLORS as themeColors,
  PROFILE_THEME_TO_COLOR,
} from '@/stores/customization';
import { ChatBubble } from './ChatBubble';
import { ProfileCardPreview } from './ProfileCardPreview';

export const LivePreviewPanel = memo(function LivePreviewPanel() {
  // Get store states with shallow comparison
  const settings = useCustomizationStore(
    useShallow((state) => ({
      themePreset: state.themePreset,
      isSaving: state.isSaving,
      isDirty: state.isDirty,
      profileTheme: state.profileTheme,
    }))
  );

  const isSaving = settings.isSaving;
  const isDirty = settings.isDirty;

  // Determine effective color from profile theme
  const effectiveColorPreset =
    (settings.profileTheme && PROFILE_THEME_TO_COLOR[settings.profileTheme]) ||
    settings.themePreset;
  const colors = themeColors[effectiveColorPreset];

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Live Preview</h3>
          <p className="text-xs text-white/60">See your changes in real-time</p>
        </div>

        {/* Sync indicator */}
        <AnimatePresence mode="wait">
          {isSaving ? (
            <motion.div
              key="saving"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 rounded-full bg-yellow-500/20 px-2 py-1"
            >
              <motion.div
                className="h-2 w-2 rounded-full bg-yellow-400"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
              <span className="text-[10px] text-yellow-400">Saving...</span>
            </motion.div>
          ) : isDirty ? (
            <motion.div
              key="unsaved"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 rounded-full bg-orange-500/20 px-2 py-1"
            >
              <div className="h-2 w-2 rounded-full bg-orange-400" />
              <span className="text-[10px] text-orange-400">Unsaved</span>
            </motion.div>
          ) : (
            <motion.div
              key="saved"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2 py-1"
            >
              <div className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-[10px] text-emerald-400">Saved</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Profile Preview */}
      <div className="mb-6">
        <ProfileCardPreview />
      </div>

      {/* Chat Preview */}
      <div className="flex-1 rounded-xl border border-white/10 bg-black/20 p-3">
        <div className="mb-3 text-xs font-medium text-white/60">Chat Preview</div>
        <div className="space-y-3">
          <ChatBubble message="Hey, nice profile!" isOwn={false} timestamp="12:34" />
          <ChatBubble message="Thanks! Just customized it 🎨" isOwn={true} timestamp="12:35" />
          <ChatBubble message="The border effect looks amazing" isOwn={false} timestamp="12:36" />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/60">Active Theme</span>
          <span className="font-medium" style={{ color: colors.primary }}>
            {colors.name}
          </span>
        </div>
      </div>
    </div>
  );
});

export default LivePreviewPanel;
