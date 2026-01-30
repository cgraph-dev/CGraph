import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAvatarBorderStore } from '@/stores/avatarBorderStore';
import type { BorderTheme, BorderRarity } from '@/types/avatar-borders';
import { useThemeStore, THEME_PRESETS, type ThemePresetConfig } from '@/stores/theme';
import { useChatEffectsStore } from '@/stores/chatEffectsStore';
import { AvatarBorderRenderer } from '@/components/avatar/AvatarBorderRenderer';

// Convert THEME_PRESETS record to array with id
interface ThemePresetWithId extends ThemePresetConfig {
  id: string;
  description?: string;
  backgroundConfig?: ThemePresetConfig['background'];
}

const THEME_PRESETS_ARRAY: ThemePresetWithId[] = Object.entries(THEME_PRESETS).map(
  ([id, config]) => ({
    ...config,
    id,
    description: `${config.name} theme`,
    backgroundConfig: config.background,
  })
);

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

// ==================== TYPES ====================

type SettingsTab = 'borders' | 'themes' | 'chat-effects';
type ViewMode = 'grid' | 'list';

interface FilterState {
  search: string;
  rarity: BorderRarity | 'all';
  theme: BorderTheme | 'all';
  showOwned: boolean;
  showLocked: boolean;
}

// ==================== COMPONENT ====================

export function CosmeticsSettingsPanel() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('borders');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    rarity: 'all',
    theme: 'all',
    showOwned: true,
    showLocked: true,
  });

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
            {(['borders', 'themes', 'chat-effects'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-6 py-3 text-sm font-medium transition-all ${
                  activeTab === tab ? 'text-cyan-400' : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab === 'borders' && '🎨 Avatar Borders'}
                {tab === 'themes' && '🖼️ Profile Themes'}
                {tab === 'chat-effects' && '✨ Chat Effects'}

                {activeTab === tab && (
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

// ==================== AVATAR BORDERS SECTION ====================

interface SectionProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

function AvatarBordersSection({ filters, setFilters, viewMode, setViewMode }: SectionProps) {
  const {
    allBorders,
    unlockedBorders,
    preferences,
    getFilteredBorders,
    equipBorder,
    purchaseBorder,
  } = useAvatarBorderStore();

  const equippedBorderId = preferences.equippedBorderId;
  const [selectedBorder, setSelectedBorder] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  const filteredBorders = useMemo(() => {
    let result = getFilteredBorders();

    // Apply additional filters from props
    if (filters.theme !== 'all') {
      result = result.filter((b) => b.theme === filters.theme);
    }
    if (filters.rarity !== 'all') {
      result = result.filter((b) => b.rarity === filters.rarity);
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(
        (b) =>
          b.name.toLowerCase().includes(search) || b.description?.toLowerCase().includes(search)
      );
    }

    if (!filters.showLocked) {
      result = result.filter((b) => unlockedBorders.some((u) => u.borderId === b.id));
    }

    return result;
  }, [getFilteredBorders, filters, unlockedBorders]);

  const handleEquip = useCallback(
    async (borderId: string) => {
      await equipBorder(borderId);
    },
    [equipBorder]
  );

  const handlePurchase = useCallback(
    async (borderId: string) => {
      setPurchasing(true);
      try {
        const success = await purchaseBorder(borderId);
        if (success) {
          // Show success notification
        }
      } finally {
        setPurchasing(false);
      }
    },
    [purchaseBorder]
  );

  const rarityColors: Record<string, string> = {
    common: 'from-gray-400 to-gray-500',
    uncommon: 'from-green-400 to-green-600',
    rare: 'from-blue-400 to-blue-600',
    epic: 'from-purple-400 to-purple-600',
    legendary: 'from-orange-400 to-orange-600',
    mythic: 'from-pink-400 to-pink-600',
    unique: 'from-cyan-400 via-purple-500 to-pink-500',
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative min-w-[200px] max-w-md flex-1">
          <input
            type="text"
            placeholder="Search borders..."
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none"
          />
        </div>

        {/* Theme Filter */}
        <select
          value={filters.theme}
          onChange={(e) =>
            setFilters((f) => ({ ...f, theme: e.target.value as BorderTheme | 'all' }))
          }
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-cyan-500/50 focus:outline-none"
        >
          <option value="all">All Themes</option>
          <option value="8bit">8-Bit</option>
          <option value="cyberpunk">Cyberpunk</option>
          <option value="fantasy">Fantasy</option>
          <option value="cosmic">Cosmic</option>
          <option value="elemental">Elemental</option>
          <option value="premium">Premium</option>
        </select>

        {/* Rarity Filter */}
        <select
          value={filters.rarity}
          onChange={(e) =>
            setFilters((f) => ({ ...f, rarity: e.target.value as BorderRarity | 'all' }))
          }
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-cyan-500/50 focus:outline-none"
        >
          <option value="all">All Rarities</option>
          <option value="common">Common</option>
          <option value="uncommon">Uncommon</option>
          <option value="rare">Rare</option>
          <option value="epic">Epic</option>
          <option value="legendary">Legendary</option>
          <option value="mythic">Mythic</option>
        </select>

        {/* View Toggle */}
        <div className="flex items-center gap-1 rounded-lg bg-white/5 p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`rounded p-2 ${viewMode === 'grid' ? 'bg-white/10' : ''}`}
          >
            <GridIcon />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`rounded p-2 ${viewMode === 'list' ? 'bg-white/10' : ''}`}
          >
            <ListIcon />
          </button>
        </div>
      </div>

      {/* Equipped Border Preview */}
      {equippedBorderId && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-4 text-sm font-medium text-gray-400">Currently Equipped</h3>
          <div className="flex items-center gap-6">
            <div className="relative h-24 w-24">
              <AvatarBorderRenderer
                border={allBorders.find((b) => b.id === equippedBorderId)}
                size={96}
                src="/default-avatar.png"
              />
            </div>
            <div>
              <p className="font-medium">
                {allBorders.find((b) => b.id === equippedBorderId)?.name}
              </p>
              <p className="text-sm text-gray-400">
                {allBorders.find((b) => b.id === equippedBorderId)?.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Border Grid */}
      <div
        className={
          viewMode === 'grid'
            ? 'grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
            : 'space-y-3'
        }
      >
        {filteredBorders.map((border) => {
          const isOwned = unlockedBorders.some((u) => u.borderId === border.id);
          const isEquipped = equippedBorderId === border.id;

          return (
            <motion.div
              key={border.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`group relative cursor-pointer ${
                viewMode === 'grid' ? 'aspect-square' : 'flex items-center gap-4 p-4'
              } rounded-xl border bg-white/5 transition-all ${
                isEquipped
                  ? 'border-cyan-500/50 ring-2 ring-cyan-500/20'
                  : selectedBorder === border.id
                    ? 'border-white/20'
                    : 'border-white/5 hover:border-white/10'
              }`}
              onClick={() => setSelectedBorder(border.id)}
            >
              {/* Preview */}
              <div
                className={`${viewMode === 'grid' ? 'p-4' : ''} flex items-center justify-center`}
              >
                <AvatarBorderRenderer
                  border={border}
                  size={viewMode === 'grid' ? 80 : 56}
                  src="/default-avatar.png"
                />
              </div>

              {/* Info */}
              <div
                className={
                  viewMode === 'grid'
                    ? 'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 p-3'
                    : 'flex-1'
                }
              >
                <p className="truncate text-sm font-medium">{border.name}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`rounded-full bg-gradient-to-r px-2 py-0.5 text-xs ${
                      rarityColors[border.rarity] || rarityColors.common
                    }`}
                  >
                    {border.rarity}
                  </span>
                  {border.theme && <span className="text-xs text-gray-500">{border.theme}</span>}
                </div>
              </div>

              {/* Status Badge */}
              {isEquipped && (
                <div className="absolute right-2 top-2 rounded-full bg-cyan-500 px-2 py-1 text-xs font-medium">
                  Equipped
                </div>
              )}

              {!isOwned && (
                <div className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-xs">
                  🔒 {(border.coinCost ?? 0) > 0 ? `${border.coinCost} coins` : border.unlockType}
                </div>
              )}

              {/* Hover Actions */}
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                {isOwned ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEquip(border.id);
                    }}
                    disabled={isEquipped}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      isEquipped
                        ? 'cursor-not-allowed bg-gray-600'
                        : 'bg-cyan-500 hover:bg-cyan-600'
                    }`}
                  >
                    {isEquipped ? 'Equipped' : 'Equip'}
                  </button>
                ) : (border.coinCost ?? 0) > 0 ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePurchase(border.id);
                    }}
                    disabled={purchasing}
                    className="rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 px-4 py-2 text-sm font-medium"
                  >
                    {purchasing ? 'Purchasing...' : `Buy ${border.coinCost}`}
                  </button>
                ) : (
                  <span className="text-sm text-gray-400">Unlock via {border.unlockType}</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredBorders.length === 0 && (
        <div className="py-12 text-center text-gray-500">No borders match your filters</div>
      )}
    </div>
  );
}

// ==================== PROFILE THEMES SECTION ====================

function ProfileThemesSection({ filters, setFilters, viewMode: _viewMode }: SectionProps) {
  void _viewMode; // Reserved for future view mode toggle
  const profileThemeId = useThemeStore((s) => s.profileThemeId);
  const setProfileTheme = useThemeStore((s) => s.setProfileTheme);

  const filteredPresets = useMemo(() => {
    let result = THEME_PRESETS_ARRAY;

    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(
        (p: ThemePresetWithId) =>
          p.name.toLowerCase().includes(search) || p.description?.toLowerCase().includes(search)
      );
    }

    return result;
  }, [filters.search]);

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative max-w-md">
        <input
          type="text"
          placeholder="Search themes..."
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none"
        />
      </div>

      {/* Theme Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredPresets.map((preset: ThemePresetWithId) => {
          const isActive = profileThemeId === preset.id;

          return (
            <motion.div
              key={preset.id}
              layout
              className={`relative cursor-pointer overflow-hidden rounded-xl border transition-all ${
                isActive
                  ? 'border-cyan-500/50 ring-2 ring-cyan-500/20'
                  : 'border-white/10 hover:border-white/20'
              }`}
              style={{
                background:
                  preset.backgroundConfig?.type === 'gradient'
                    ? preset.backgroundConfig.value
                    : preset.colors?.background || '#1a1a1a',
              }}
              onClick={() => setProfileTheme(preset.id)}
            >
              {/* Preview Content */}
              <div className="min-h-[200px] p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className="h-12 w-12 rounded-full"
                    style={{ background: preset.colors?.accent || '#3b82f6' }}
                  />
                  <div>
                    <h3
                      className="font-semibold"
                      style={{ color: preset.colors?.primary || '#ffffff' }}
                    >
                      {preset.name}
                    </h3>
                    <p className="text-sm" style={{ color: preset.colors?.secondary || '#888888' }}>
                      Profile Theme
                    </p>
                  </div>
                </div>

                <p
                  className="line-clamp-2 text-sm"
                  style={{ color: preset.colors?.text || '#ffffff' }}
                >
                  {preset.description}
                </p>

                {/* Color Palette */}
                <div className="mt-4 flex gap-2">
                  {Object.entries(preset.colors || {})
                    .slice(0, 5)
                    .map(([key, value]) => (
                      <div
                        key={key}
                        className="h-6 w-6 rounded-full border border-white/20"
                        style={{ background: value }}
                        title={key}
                      />
                    ))}
                </div>
              </div>

              {/* Active Badge */}
              {isActive && (
                <div className="absolute right-3 top-3 rounded-full bg-cyan-500 px-3 py-1 text-xs font-medium">
                  Active
                </div>
              )}

              {/* Category Badge */}
              <div className="absolute left-3 top-3 rounded-full bg-black/50 px-2 py-1 text-xs">
                {preset.cardLayout || 'standard'}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ==================== CHAT EFFECTS SECTION ====================

function ChatEffectsSection() {
  const {
    messageEffects,
    bubbleStyles,
    typingIndicators,
    activeMessageEffect,
    activeBubbleStyle,
    activeTypingIndicator,
    activateEffect,
    activateBubbleStyle,
    activateTypingIndicator,
  } = useChatEffectsStore();

  const [activeSubTab, setActiveSubTab] = useState<'message' | 'bubble' | 'typing'>('message');

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="flex gap-2">
        {(['message', 'bubble', 'typing'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`rounded-lg px-4 py-2 text-sm transition-colors ${
              activeSubTab === tab
                ? 'border border-cyan-500/30 bg-cyan-500/20 text-cyan-400'
                : 'border border-transparent bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            {tab === 'message' && '💬 Message Effects'}
            {tab === 'bubble' && '🫧 Bubble Styles'}
            {tab === 'typing' && '⌨️ Typing Indicators'}
          </button>
        ))}
      </div>

      {/* Message Effects */}
      {activeSubTab === 'message' && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {messageEffects.map((effect) => {
            const isActive = activeMessageEffect?.effect === effect.id;

            return (
              <motion.div
                key={effect.id}
                className={`cursor-pointer rounded-xl border p-4 transition-all ${
                  isActive
                    ? 'border-cyan-500/50 bg-cyan-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
                onClick={() => activateEffect(effect.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="mb-2 text-2xl">{effect.icon || '✨'}</div>
                <h4 className="font-medium">{effect.name}</h4>
                <p className="mt-1 text-xs text-gray-500">{effect.description}</p>

                {isActive && <div className="mt-2 text-xs text-cyan-400">Active</div>}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Bubble Styles */}
      {activeSubTab === 'bubble' && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {bubbleStyles.map((style) => {
            const isActive = activeBubbleStyle?.style === style.id;

            return (
              <motion.div
                key={style.id}
                className={`cursor-pointer rounded-xl border p-4 transition-all ${
                  isActive
                    ? 'border-cyan-500/50 bg-cyan-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
                onClick={() => activateBubbleStyle(style.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Preview Bubble */}
                <div
                  className="mb-3 p-3 text-sm"
                  style={{
                    borderRadius: style.borderRadius || 18,
                    background: style.gradient || 'rgba(255,255,255,0.1)',
                    boxShadow: style.glowColor ? `0 0 20px ${style.glowColor}` : undefined,
                  }}
                >
                  Preview message
                </div>

                <h4 className="font-medium">{style.name}</h4>

                {isActive && <div className="mt-2 text-xs text-cyan-400">Active</div>}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Typing Indicators */}
      {activeSubTab === 'typing' && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {typingIndicators.map((indicator) => {
            const isActive = activeTypingIndicator?.style === indicator.id;

            return (
              <motion.div
                key={indicator.id}
                className={`cursor-pointer rounded-xl border p-4 transition-all ${
                  isActive
                    ? 'border-cyan-500/50 bg-cyan-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
                onClick={() => activateTypingIndicator(indicator.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Preview Animation */}
                <div className="mb-3 flex h-8 items-center justify-center">
                  <TypingPreview type={indicator.id} />
                </div>

                <h4 className="font-medium">{indicator.name}</h4>

                {isActive && <div className="mt-2 text-xs text-cyan-400">Active</div>}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ==================== HELPER COMPONENTS ====================

function TypingPreview({ type }: { type: string }) {
  if (type === 'dots' || type === 'wave') {
    return (
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-2 w-2 rounded-full bg-gray-400"
            animate={{
              y: type === 'wave' ? [0, -6, 0] : [0, -4, 0],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
            }}
          />
        ))}
      </div>
    );
  }

  if (type === 'pulse') {
    return (
      <motion.div
        className="h-6 w-6 rounded-full border-2 border-gray-400"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{ duration: 1, repeat: Infinity }}
      />
    );
  }

  return (
    <div className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="h-2 w-2 rounded-full bg-gray-400"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <rect x="1" y="1" width="6" height="6" rx="1" />
      <rect x="9" y="1" width="6" height="6" rx="1" />
      <rect x="1" y="9" width="6" height="6" rx="1" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <rect x="1" y="2" width="14" height="3" rx="1" />
      <rect x="1" y="7" width="14" height="3" rx="1" />
      <rect x="1" y="12" width="14" height="3" rx="1" />
    </svg>
  );
}

export default CosmeticsSettingsPanel;
