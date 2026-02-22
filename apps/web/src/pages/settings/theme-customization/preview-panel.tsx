import { motion } from 'framer-motion';
import { useThemeStore, THEME_COLORS } from '@/stores/theme';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import { ThemedChatBubble } from '@/components/theme/themed-chat-bubble';

export function PreviewPanel() {
  const theme = useThemeStore((state) => state.theme);
  const colors = THEME_COLORS[theme.colorPreset];

  return (
    <motion.div
      className="sticky top-24 rounded-xl border border-gray-800 bg-gray-900/50 p-6 backdrop-blur-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h2 className="mb-4 text-lg font-semibold">Live Preview</h2>

      {/* Avatar Preview */}
      <div className="mb-6 flex justify-center">
        <ThemedAvatar src="/default-avatar.png" alt="Preview" size="xlarge" />
      </div>

      {/* User Info */}
      <div className="mb-6 text-center">
        <h3 className="text-lg font-bold">Your Name</h3>
        <p className="text-sm text-gray-400">@username</p>
      </div>

      {/* Chat Bubble Previews */}
      <div className="space-y-4 rounded-lg bg-gray-950/50 p-4">
        <ThemedChatBubble
          message="This is how your messages will look!"
          timestamp="12:34 PM"
          isOwn={true}
          userName="You"
          userAvatar="/default-avatar.png"
        />
        <ThemedChatBubble
          message="Others see their own theme on their messages"
          timestamp="12:35 PM"
          isOwn={false}
          userName="Friend"
          userAvatar="/default-avatar.png"
          userTheme={{
            chatBubbleColor: 'purple',
            chatBubbleStyle: 'rounded',
          }}
        />
      </div>

      {/* Theme Info */}
      <div className="mt-6 rounded-lg border border-gray-700 bg-gray-800/50 p-4">
        <div className="space-y-1 text-xs text-gray-400">
          <div className="flex justify-between">
            <span>Color:</span>
            <span className="font-medium" style={{ color: colors.primary }}>
              {colors.name}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Avatar Border:</span>
            <span className="font-medium text-white">{theme.avatarBorder}</span>
          </div>
          <div className="flex justify-between">
            <span>Bubble Style:</span>
            <span className="font-medium text-white">{theme.chatBubbleStyle}</span>
          </div>
          <div className="flex justify-between">
            <span>Effect:</span>
            <span className="font-medium text-white">{theme.effectPreset}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
