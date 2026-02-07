/**
 * ChatBubbleSettings - Hybrid Store Integration Example
 *
 * This is a PROOF-OF-CONCEPT showing how to use BOTH stores:
 * - chatBubbleStore: UI-specific state (localStorage only)
 * - unifiedCustomizationStore: Backend-synced state (cross-device)
 *
 * USAGE INSTRUCTIONS:
 * 1. Use this pattern for backend-synced fields (color, opacity, radius, etc.)
 * 2. Keep old store for UI-only fields (maxWidth, spacing, etc.)
 * 3. Show "Syncing..." indicator during backend sync
 * 4. Local UI updates immediately (optimistic)
 * 5. Backend sync happens asynchronously
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useChatBubbleStore, type ChatBubbleConfig } from '@/stores/theme';
import { useChatCustomization } from '@/stores/unifiedCustomizationStore';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { ChatBubbleLeftIcon, SwatchIcon, CheckIcon, CloudIcon } from '@heroicons/react/24/outline';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ChatBubbleSettings');

export default function ChatBubbleSettingsHybrid() {
  // === LOCAL UI STATE (localStorage only) ===
  const themeStore = useChatBubbleStore();
  const style = themeStore.chatBubble;
  const updateStyle = (updates: Partial<ChatBubbleConfig>) => themeStore.updateChatBubble(updates);

  // === BACKEND-SYNCED STATE (cross-device) ===
  const { chat, updateChat, isSyncing } = useChatCustomization();

  const [activeTab, setActiveTab] = useState<'colors' | 'advanced'>('colors');

  // ========================================================================
  // BACKEND-SYNCED FIELD HANDLER (with local + backend sync)
  // ========================================================================
  const handleBubbleColorChange = async (color: string) => {
    // 1. Update local UI immediately (optimistic)
    updateStyle({ ownMessageBg: color });

    // 2. Sync to backend for cross-device persistence
    try {
      await updateChat({ bubbleColor: color });
      HapticFeedback.success();
    } catch (error) {
      logger.error('Failed to sync color:', error);
      // Local state still works even if sync fails
      HapticFeedback.error();
    }
  };

  const handleBubbleRadiusChange = async (radius: number) => {
    // Update local UI
    updateStyle({ borderRadius: radius });

    // Sync to backend
    try {
      await updateChat({ bubbleRadius: radius });
    } catch (error) {
      logger.error('Failed to sync radius:', error);
    }
  };

  const handleTextSizeChange = async (size: number) => {
    // Note: text size might not be in chatBubbleStore
    // This is a backend-only field

    try {
      await updateChat({ textSize: size });
      HapticFeedback.success();
    } catch (error) {
      logger.error('Failed to sync text size:', error);
    }
  };

  // ========================================================================
  // LOCAL-ONLY FIELD HANDLER (no backend sync)
  // ========================================================================
  const handleMaxWidthChange = (width: number) => {
    // This field is NOT in backend schema
    // Only update local UI state
    updateStyle({ maxWidth: width });
    HapticFeedback.light();
  };

  const handleShowTimestampToggle = () => {
    // UI-only preference
    updateStyle({ showTimestamp: !style.showTimestamp });
    HapticFeedback.light();
  };

  return (
    <div className="space-y-6">
      {/* Header with Sync Status */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-3 text-2xl font-bold text-white">
            <ChatBubbleLeftIcon className="h-7 w-7 text-primary-400" />
            Chat Bubble Customization
          </h2>
          <p className="mt-1 text-gray-400">Personalize your message bubbles</p>
        </div>

        {/* Sync Status Indicator */}
        <div className="flex items-center gap-2">
          {isSyncing ? (
            <motion.div
              className="flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/20 px-3 py-1.5"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <CloudIcon className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-blue-400">Syncing...</span>
            </motion.div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/20 px-3 py-1.5">
              <CheckIcon className="h-4 w-4 text-green-400" />
              <span className="text-xs text-green-400">Synced</span>
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2">
        <motion.button
          onClick={() => setActiveTab('colors')}
          className={`flex items-center gap-2 rounded-xl px-4 py-3 font-medium ${
            activeTab === 'colors'
              ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white'
              : 'bg-dark-700 text-gray-400'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <SwatchIcon className="h-5 w-5" />
          Colors (Synced)
        </motion.button>
        <motion.button
          onClick={() => setActiveTab('advanced')}
          className={`flex items-center gap-2 rounded-xl px-4 py-3 font-medium ${
            activeTab === 'advanced'
              ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white'
              : 'bg-dark-700 text-gray-400'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Advanced (Local Only)
        </motion.button>
      </div>

      {/* Colors Tab - BACKEND-SYNCED FIELDS */}
      {activeTab === 'colors' && (
        <GlassCard variant="frosted" className="p-6">
          <div className="space-y-6">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-white">Bubble Color</label>
                <span className="text-xs text-primary-400">✓ Cross-Device Sync</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={style.ownMessageBg}
                  onChange={(e) => handleBubbleColorChange(e.target.value)}
                  className="h-12 w-24 cursor-pointer rounded-lg"
                  disabled={isSyncing}
                />
                <span className="text-gray-400">{style.ownMessageBg}</span>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                This color will sync across all your devices
              </p>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-white">
                  Border Radius: {style.borderRadius}px
                </label>
                <span className="text-xs text-primary-400">✓ Cross-Device Sync</span>
              </div>
              <input
                type="range"
                min="0"
                max="32"
                value={style.borderRadius}
                onChange={(e) => handleBubbleRadiusChange(Number(e.target.value))}
                className="w-full"
                disabled={isSyncing}
              />
              <p className="mt-2 text-xs text-gray-500">
                Rounded corners for your message bubbles (0-32px)
              </p>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-white">
                  Text Size: {chat.textSize}px
                </label>
                <span className="text-xs text-primary-400">✓ Cross-Device Sync</span>
              </div>
              <input
                type="range"
                min="12"
                max="20"
                value={chat.textSize}
                onChange={(e) => handleTextSizeChange(Number(e.target.value))}
                className="w-full"
                disabled={isSyncing}
              />
              <p className="mt-2 text-xs text-gray-500">Font size for message text (12-20px)</p>
            </div>

            {/* Show current backend values */}
            <div className="rounded-lg border border-primary-500/20 bg-dark-900/50 p-4">
              <h4 className="mb-2 text-xs font-bold text-primary-400">
                Backend State (Cross-Device)
              </h4>
              <pre className="overflow-x-auto text-xs text-gray-400">
                {JSON.stringify(
                  {
                    bubbleColor: chat.bubbleColor,
                    bubbleOpacity: chat.bubbleOpacity,
                    bubbleRadius: chat.bubbleRadius,
                    textSize: chat.textSize,
                    textWeight: chat.textWeight,
                    fontFamily: chat.fontFamily,
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Advanced Tab - LOCAL-ONLY FIELDS */}
      {activeTab === 'advanced' && (
        <GlassCard variant="frosted" className="p-6">
          <div className="space-y-6">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-white">
                  Max Width: {style.maxWidth}%
                </label>
                <span className="text-xs text-gray-400">Local Only</span>
              </div>
              <input
                type="range"
                min="40"
                max="90"
                value={style.maxWidth}
                onChange={(e) => handleMaxWidthChange(Number(e.target.value))}
                className="w-full"
              />
              <p className="mt-2 text-xs text-gray-500">
                Maximum width of chat bubbles (local preference only)
              </p>
            </div>

            <div>
              <label className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">Show Timestamp</span>
                <span className="text-xs text-gray-400">Local Only</span>
              </label>
              <button
                onClick={handleShowTimestampToggle}
                className={`mt-2 w-full rounded-lg border px-4 py-2 transition-colors ${
                  style.showTimestamp
                    ? 'border-primary-500 bg-primary-600 text-white'
                    : 'border-dark-600 bg-dark-700 text-gray-400'
                }`}
              >
                {style.showTimestamp ? 'Enabled' : 'Disabled'}
              </button>
              <p className="mt-2 text-xs text-gray-500">UI preference (not synced to backend)</p>
            </div>

            {/* Show current local state */}
            <div className="rounded-lg border border-gray-500/20 bg-dark-900/50 p-4">
              <h4 className="mb-2 text-xs font-bold text-gray-400">
                Local State (This Device Only)
              </h4>
              <pre className="overflow-x-auto text-xs text-gray-400">
                {JSON.stringify(
                  {
                    maxWidth: style.maxWidth,
                    spacing: style.spacing,
                    showTimestamp: style.showTimestamp,
                    timestampPosition: style.timestampPosition,
                    showAvatar: style.showAvatar,
                    avatarSize: style.avatarSize,
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Preview Section */}
      <GlassCard variant="frosted" className="p-6">
        <h3 className="mb-4 text-lg font-bold text-white">Live Preview</h3>
        <div className="space-y-4 rounded-xl bg-dark-900/50 p-4">
          {/* Sample message with current styles */}
          <div className="flex flex-row-reverse items-end gap-2">
            <div
              className="px-4 py-2"
              style={{
                backgroundColor: style.ownMessageBg,
                borderRadius: `${style.borderRadius}px`,
                color: style.ownMessageText,
                maxWidth: `${style.maxWidth}%`,
                fontSize: `${chat.textSize}px`,
                fontWeight: chat.textWeight,
                fontFamily: chat.fontFamily,
              }}
            >
              <p>This is a preview of your customized chat bubble! 🎨</p>
              {style.showTimestamp && (
                <span className="mt-1 block text-xs opacity-70">
                  {style.timestampPosition === 'inside' ? '12:34 PM' : ''}
                </span>
              )}
            </div>
            {style.showTimestamp && style.timestampPosition === 'outside' && (
              <span className="text-xs text-gray-500">12:34 PM</span>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Info Box */}
      <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
        <h4 className="mb-2 text-sm font-bold text-blue-400">💡 How Hybrid Storage Works</h4>
        <ul className="space-y-1 text-xs text-gray-300">
          <li>
            ✓ <strong>Synced fields</strong> (color, radius, text size) persist across devices
          </li>
          <li>
            ✓ <strong>Local fields</strong> (max width, timestamp) are device-specific
          </li>
          <li>✓ Changes happen instantly (optimistic updates)</li>
          <li>✓ Backend sync happens in the background</li>
          <li>✓ Local state works even if backend is offline</li>
        </ul>
      </div>
    </div>
  );
}
