import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useThemeStore,
  THEME_COLORS,
  type ThemeColorPreset,
  type AvatarBorderType,
  type ChatBubbleStylePreset,
  type EffectPreset,
} from '@/stores/themeStore';
import { ThemedAvatar } from '@/components/theme/ThemedAvatar';
import { ThemedChatBubble } from '@/components/theme/ThemedChatBubble';

type TabType = 'theme' | 'avatar' | 'chat' | 'effects';

export default function ThemeCustomization() {
  const [activeTab, setActiveTab] = useState<TabType>('theme');
  const theme = useThemeStore((state) => state.theme);
  const resetTheme = useThemeStore((state) => state.resetTheme);
  const exportTheme = useThemeStore((state) => state.exportTheme);
  const importTheme = useThemeStore((state) => state.importTheme);

  const colors = THEME_COLORS[theme.colorPreset];

  const tabs = [
    { id: 'theme' as const, label: 'Theme', icon: '🎨' },
    { id: 'avatar' as const, label: 'Avatar', icon: '👤' },
    { id: 'chat' as const, label: 'Chat Bubbles', icon: '💬' },
    { id: 'effects' as const, label: 'Effects', icon: '✨' },
  ];

  const handleExport = () => {
    const json = exportTheme();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cgraph-theme.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const json = e.target?.result as string;
          const success = importTheme(json);
          if (success) {
            alert('Theme imported successfully!');
          } else {
            alert('Failed to import theme. Please check the file format.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

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
          </div>

          {/* Customization Panel */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="mb-6 flex gap-2 overflow-x-auto">
              {tabs.map((tab) => (
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
                transition={{ duration: 0.2 }}
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

// Theme Tab Component
function ThemeTab() {
  const { theme, setColorPreset, applyPreset } = useThemeStore();

  const presets: Array<{ id: string; name: string; description: string }> = [
    { id: 'minimal', name: 'Minimal', description: 'Clean and simple' },
    { id: 'modern', name: 'Modern', description: 'Sleek glassmorphism' },
    { id: 'vibrant', name: 'Vibrant', description: 'Bold and colorful' },
    { id: 'elegant', name: 'Elegant', description: 'Sophisticated and refined' },
    { id: 'gaming', name: 'Gaming', description: 'High-energy cyberpunk' },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Presets */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <h3 className="mb-4 text-lg font-semibold">Quick Presets</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {presets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset.id)}
              className="rounded-lg border border-gray-700 bg-gray-800/50 p-4 text-left transition-all hover:bg-gray-800"
            >
              <div className="mb-1 text-sm font-medium">{preset.name}</div>
              <div className="text-xs text-gray-400">{preset.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Color Themes */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <h3 className="mb-4 text-lg font-semibold">Color Theme</h3>
        <div className="grid grid-cols-4 gap-3 md:grid-cols-6">
          {(Object.keys(THEME_COLORS) as ThemeColorPreset[]).map((colorKey) => {
            const color = THEME_COLORS[colorKey];
            return (
              <button
                key={colorKey}
                onClick={() => setColorPreset(colorKey)}
                className={`relative aspect-square rounded-lg transition-all ${
                  theme.colorPreset === colorKey ? 'scale-110 ring-2 ring-white' : 'hover:scale-105'
                }`}
                style={{
                  background: `linear-gradient(135deg, ${color.primary}, ${color.secondary})`,
                }}
                title={color.name}
              >
                {theme.colorPreset === colorKey && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl">✓</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Avatar Tab Component
function AvatarTab() {
  const { theme, setAvatarBorder, updateTheme } = useThemeStore();

  const borders: Array<{ type: AvatarBorderType; name: string; premium?: boolean }> = [
    { type: 'none', name: 'None' },
    { type: 'static', name: 'Static' },
    { type: 'glow', name: 'Glow' },
    { type: 'pulse', name: 'Pulse' },
    { type: 'rotate', name: 'Orbit', premium: true },
    { type: 'fire', name: 'Inferno', premium: true },
    { type: 'ice', name: 'Frost', premium: true },
    { type: 'electric', name: 'Storm', premium: true },
    { type: 'legendary', name: 'Legendary', premium: true },
    { type: 'mythic', name: 'Mythic', premium: true },
  ];

  return (
    <div className="space-y-6">
      {/* Border Style */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <h3 className="mb-4 text-lg font-semibold">Border Style</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {borders.map((border) => (
            <button
              key={border.type}
              onClick={() => setAvatarBorder(border.type)}
              className={`rounded-lg border p-3 transition-all ${
                theme.avatarBorder === border.type
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-gray-700 bg-gray-800/50 hover:bg-gray-800'
              }`}
            >
              <div className="text-sm font-medium">{border.name}</div>
              {border.premium && <span className="text-xs text-yellow-400">👑 Premium</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Avatar Size */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <h3 className="mb-4 text-lg font-semibold">Avatar Size</h3>
        <div className="flex gap-3">
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <button
              key={size}
              onClick={() => updateTheme({ avatarSize: size })}
              className={`rounded-lg border px-4 py-2 capitalize transition-all ${
                theme.avatarSize === size
                  ? 'border-emerald-500 bg-emerald-500/10 text-white'
                  : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:bg-gray-800'
              }`}
            >
              {size === 'sm' ? 'Small' : size === 'md' ? 'Medium' : 'Large'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Chat Tab Component
function ChatTab() {
  const { theme, setChatBubbleStyle, updateTheme } = useThemeStore();

  const styles: Array<{ type: ChatBubbleStylePreset; name: string }> = [
    { type: 'default', name: 'Default' },
    { type: 'rounded', name: 'Rounded' },
    { type: 'sharp', name: 'Sharp' },
    { type: 'cloud', name: 'Cloud' },
    { type: 'modern', name: 'Modern' },
    { type: 'retro', name: 'Retro' },
    { type: 'bubble', name: 'Bubble' },
    { type: 'glassmorphism', name: 'Glass' },
  ];

  return (
    <div className="space-y-6">
      {/* Bubble Style */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <h3 className="mb-4 text-lg font-semibold">Bubble Style</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {styles.map((style) => (
            <button
              key={style.type}
              onClick={() => setChatBubbleStyle(style.type)}
              className={`rounded-lg border p-3 transition-all ${
                theme.chatBubbleStyle === style.type
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-gray-700 bg-gray-800/50 hover:bg-gray-800'
              }`}
            >
              {style.name}
            </button>
          ))}
        </div>
      </div>

      {/* Border Radius */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <h3 className="mb-4 text-lg font-semibold">Border Radius: {theme.bubbleBorderRadius}px</h3>
        <input
          type="range"
          min="0"
          max="50"
          value={theme.bubbleBorderRadius}
          onChange={(e) => updateTheme({ bubbleBorderRadius: parseInt(e.target.value) })}
          className="w-full"
        />
      </div>

      {/* Shadow Intensity */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <h3 className="mb-4 text-lg font-semibold">
          Shadow Intensity: {theme.bubbleShadowIntensity}%
        </h3>
        <input
          type="range"
          min="0"
          max="100"
          value={theme.bubbleShadowIntensity}
          onChange={(e) => updateTheme({ bubbleShadowIntensity: parseInt(e.target.value) })}
          className="w-full"
        />
      </div>

      {/* Options */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <h3 className="mb-4 text-lg font-semibold">Options</h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3">
            <span>Show Tail</span>
            <input
              type="checkbox"
              checked={theme.bubbleShowTail ?? true}
              onChange={(e) => updateTheme({ bubbleShowTail: e.target.checked })}
              className="h-5 w-5"
            />
          </label>
          <label className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3">
            <span>Glass Effect</span>
            <input
              type="checkbox"
              checked={theme.bubbleGlassEffect}
              onChange={(e) => updateTheme({ bubbleGlassEffect: e.target.checked })}
              className="h-5 w-5"
            />
          </label>
          <label className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3">
            <span>Hover Effect</span>
            <input
              type="checkbox"
              checked={theme.bubbleHoverEffect ?? true}
              onChange={(e) => updateTheme({ bubbleHoverEffect: e.target.checked })}
              className="h-5 w-5"
            />
          </label>
        </div>
      </div>
    </div>
  );
}

// Effects Tab Component
function EffectsTab() {
  const {
    theme,
    setEffect,
    setAnimationSpeed,
    toggleParticles,
    toggleGlow,
    toggleBlur,
    toggleAnimatedBackground,
  } = useThemeStore();

  const effects: Array<{ type: EffectPreset; name: string }> = [
    { type: 'glassmorphism', name: 'Glassmorphism' },
    { type: 'neon', name: 'Neon' },
    { type: 'holographic', name: 'Holographic' },
    { type: 'minimal', name: 'Minimal' },
    { type: 'aurora', name: 'Aurora' },
    { type: 'cyberpunk', name: 'Cyberpunk' },
  ];

  return (
    <div className="space-y-6">
      {/* Effect Style */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <h3 className="mb-4 text-lg font-semibold">Effect Style</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {effects.map((effect) => (
            <button
              key={effect.type}
              onClick={() => setEffect(effect.type)}
              className={`rounded-lg border p-3 transition-all ${
                theme.effectPreset === effect.type
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-gray-700 bg-gray-800/50 hover:bg-gray-800'
              }`}
            >
              {effect.name}
            </button>
          ))}
        </div>
      </div>

      {/* Animation Speed */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <h3 className="mb-4 text-lg font-semibold">Animation Speed</h3>
        <div className="flex gap-3">
          {(['slow', 'normal', 'fast'] as const).map((speed) => (
            <button
              key={speed}
              onClick={() => setAnimationSpeed(speed)}
              className={`flex-1 rounded-lg border px-4 py-2 capitalize transition-all ${
                theme.animationSpeed === speed
                  ? 'border-emerald-500 bg-emerald-500/10 text-white'
                  : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:bg-gray-800'
              }`}
            >
              {speed}
            </button>
          ))}
        </div>
      </div>

      {/* Toggle Effects */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <h3 className="mb-4 text-lg font-semibold">Visual Effects</h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3">
            <div>
              <div className="font-medium">Particles</div>
              <div className="text-xs text-gray-400">Animated particle effects</div>
            </div>
            <input
              type="checkbox"
              checked={theme.particlesEnabled}
              onChange={toggleParticles}
              className="h-5 w-5"
            />
          </label>
          <label className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3">
            <div>
              <div className="font-medium">Glow</div>
              <div className="text-xs text-gray-400">Glowing borders and effects</div>
            </div>
            <input
              type="checkbox"
              checked={theme.glowEnabled}
              onChange={toggleGlow}
              className="h-5 w-5"
            />
          </label>
          <label className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3">
            <div>
              <div className="font-medium">Blur</div>
              <div className="text-xs text-gray-400">Backdrop blur effects</div>
            </div>
            <input
              type="checkbox"
              checked={theme.blurEnabled ?? false}
              onChange={toggleBlur}
              className="h-5 w-5"
            />
          </label>
          <label className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3">
            <div>
              <div className="font-medium">Animated Background</div>
              <div className="text-xs text-gray-400">Moving gradient backgrounds</div>
            </div>
            <input
              type="checkbox"
              checked={theme.animatedBackground ?? false}
              onChange={toggleAnimatedBackground}
              className="h-5 w-5"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
