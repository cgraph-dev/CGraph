/**
 * Live Preview Component
 *
 * Real-time preview panel for theme changes.
 */

import { motion } from 'framer-motion';
import { ThemedAvatar } from '../ThemedAvatar';
import { ThemedChatBubble } from '../ThemedChatBubble';

// =============================================================================
// TYPES
// =============================================================================

interface LivePreviewProps {
  isVisible: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function LivePreview({ isVisible }: LivePreviewProps) {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 320, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      className="overflow-hidden border-l border-gray-700/50 p-6"
    >
      <h4 className="mb-4 text-sm font-semibold text-gray-400">Live Preview</h4>

      {/* Avatar Preview */}
      <div className="mb-6">
        <p className="mb-2 text-xs text-gray-500">Avatar</p>
        <div className="flex justify-center">
          <ThemedAvatar src="/placeholder-avatar.jpg" alt="Preview" size="xlarge" />
        </div>
      </div>

      {/* Chat Preview */}
      <div className="space-y-3">
        <p className="mb-2 text-xs text-gray-500">Chat Bubbles</p>
        <ThemedChatBubble
          message="Hey! How's it going? 👋"
          timestamp="2:34 PM"
          isOwn={false}
          userName="Alex"
          showAvatar={false}
        />
        <ThemedChatBubble
          message="I'm doing great! Love the new theme 🎨"
          timestamp="2:35 PM"
          isOwn={true}
          showAvatar={false}
        />
      </div>
    </motion.div>
  );
}

export default LivePreview;
