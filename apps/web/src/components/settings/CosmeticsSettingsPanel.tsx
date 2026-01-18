import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAvatarBorderStore, BorderTheme, BorderRarity } from '@/stores/avatarBorderStore';
import { useProfileThemeStore } from '@/stores/profileThemeStore';
import { useChatEffectsStore } from '@/stores/chatEffectsStore';
import { AvatarBorderRenderer } from '@/components/avatar/AvatarBorderRenderer';

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
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            Cosmetics Settings
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Customize your avatar, profile, and chat appearance
          </p>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {(['borders', 'themes', 'chat-effects'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-medium transition-all relative ${
                  activeTab === tab
                    ? 'text-cyan-400'
                    : 'text-gray-400 hover:text-white'
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
      <div className="max-w-7xl mx-auto px-6 py-8">
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
    borders,
    unlockedBorders,
    equippedBorderId,
    getFilteredBorders,
    equipBorder,
    purchaseBorder,
  } = useAvatarBorderStore();

  const [selectedBorder, setSelectedBorder] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  const filteredBorders = useMemo(() => {
    let result = getFilteredBorders(
      filters.theme === 'all' ? undefined : filters.theme,
      filters.rarity === 'all' ? undefined : filters.rarity
    );

    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(
        (b) =>
          b.name.toLowerCase().includes(search) ||
          b.description?.toLowerCase().includes(search)
      );
    }

    if (!filters.showLocked) {
      result = result.filter((b) => unlockedBorders.some((u) => u.borderId === b.id));
    }

    return result;
  }, [getFilteredBorders, filters, unlockedBorders]);

  const handleEquip = useCallback(async (borderId: string) => {
    await equipBorder(borderId);
  }, [equipBorder]);

  const handlePurchase = useCallback(async (borderId: string) => {
    setPurchasing(true);
    try {
      const result = await purchaseBorder(borderId);
      if (result.success) {
        // Show success notification
      }
    } finally {
      setPurchasing(false);
    }
  }, [purchaseBorder]);

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
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <input
            type="text"
            placeholder="Search borders..."
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg 
                       text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        {/* Theme Filter */}
        <select
          value={filters.theme}
          onChange={(e) => setFilters((f) => ({ ...f, theme: e.target.value as BorderTheme | 'all' }))}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white 
                     focus:outline-none focus:border-cyan-500/50"
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
          onChange={(e) => setFilters((f) => ({ ...f, rarity: e.target.value as BorderRarity | 'all' }))}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white 
                     focus:outline-none focus:border-cyan-500/50"
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
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white/10' : ''}`}
          >
            <GridIcon />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${viewMode === 'list' ? 'bg-white/10' : ''}`}
          >
            <ListIcon />
          </button>
        </div>
      </div>

      {/* Equipped Border Preview */}
      {equippedBorderId && (
        <div className="p-6 bg-white/5 rounded-xl border border-white/10">
          <h3 className="text-sm font-medium text-gray-400 mb-4">Currently Equipped</h3>
          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24">
              <AvatarBorderRenderer
                borderId={equippedBorderId}
                size={96}
                avatarUrl="/default-avatar.png"
              />
            </div>
            <div>
              <p className="font-medium">
                {borders.find((b) => b.id === equippedBorderId)?.name}
              </p>
              <p className="text-sm text-gray-400">
                {borders.find((b) => b.id === equippedBorderId)?.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Border Grid */}
      <div
        className={
          viewMode === 'grid'
            ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'
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
              className={`relative group cursor-pointer ${
                viewMode === 'grid'
                  ? 'aspect-square'
                  : 'flex items-center gap-4 p-4'
              } bg-white/5 rounded-xl border transition-all ${
                isEquipped
                  ? 'border-cyan-500/50 ring-2 ring-cyan-500/20'
                  : selectedBorder === border.id
                  ? 'border-white/20'
                  : 'border-white/5 hover:border-white/10'
              }`}
              onClick={() => setSelectedBorder(border.id)}
            >
              {/* Preview */}
              <div className={`${viewMode === 'grid' ? 'p-4' : ''} flex items-center justify-center`}>
                <AvatarBorderRenderer
                  borderId={border.id}
                  size={viewMode === 'grid' ? 80 : 56}
                  avatarUrl="/default-avatar.png"
                />
              </div>

              {/* Info */}
              <div className={viewMode === 'grid' ? 'absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80' : 'flex-1'}>
                <p className="text-sm font-medium truncate">{border.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${
                      rarityColors[border.rarity] || rarityColors.common
                    }`}
                  >
                    {border.rarity}
                  </span>
                  {border.theme && (
                    <span className="text-xs text-gray-500">{border.theme}</span>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              {isEquipped && (
                <div className="absolute top-2 right-2 px-2 py-1 bg-cyan-500 rounded-full text-xs font-medium">
                  Equipped
                </div>
              )}
              
              {!isOwned && (
                <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 rounded-full text-xs">
                  🔒 {border.coinCost > 0 ? `${border.coinCost} coins` : border.unlockType}
                </div>
              )}

              {/* Hover Actions */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {isOwned ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEquip(border.id);
                    }}
                    disabled={isEquipped}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isEquipped
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-cyan-500 hover:bg-cyan-600'
                    }`}
                  >
                    {isEquipped ? 'Equipped' : 'Equip'}
                  </button>
                ) : border.coinCost > 0 ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePurchase(border.id);
                    }}
                    disabled={purchasing}
                    className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg text-sm font-medium"
                  >
                    {purchasing ? 'Purchasing...' : `Buy ${border.coinCost}`}
                  </button>
                ) : (
                  <span className="text-sm text-gray-400">
                    Unlock via {border.unlockType}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredBorders.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No borders match your filters
        </div>
      )}
    </div>
  );
}

// ==================== PROFILE THEMES SECTION ====================

function ProfileThemesSection({ filters, setFilters, viewMode }: SectionProps) {
  const {
    presets,
    activePresetId,
    activatePreset,
  } = useProfileThemeStore();

  const filteredPresets = useMemo(() => {
    let result = presets;

    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.description?.toLowerCase().includes(search)
      );
    }

    return result;
  }, [presets, filters.search]);

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative max-w-md">
        <input
          type="text"
          placeholder="Search themes..."
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg 
                     text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
        />
      </div>

      {/* Theme Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPresets.map((preset) => {
          const isActive = activePresetId === preset.id;

          return (
            <motion.div
              key={preset.id}
              layout
              className={`relative overflow-hidden rounded-xl border transition-all cursor-pointer ${
                isActive
                  ? 'border-cyan-500/50 ring-2 ring-cyan-500/20'
                  : 'border-white/10 hover:border-white/20'
              }`}
              style={{
                background: preset.backgroundConfig?.type === 'gradient'
                  ? preset.backgroundConfig.value
                  : preset.colors?.background || '#1a1a1a',
              }}
              onClick={() => activatePreset(preset.id)}
            >
              {/* Preview Content */}
              <div className="p-6 min-h-[200px]">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-12 h-12 rounded-full"
                    style={{ background: preset.colors?.accent || '#3b82f6' }}
                  />
                  <div>
                    <h3
                      className="font-semibold"
                      style={{ color: preset.colors?.primary || '#ffffff' }}
                    >
                      {preset.name}
                    </h3>
                    <p
                      className="text-sm"
                      style={{ color: preset.colors?.secondary || '#888888' }}
                    >
                      {preset.category}
                    </p>
                  </div>
                </div>

                <p
                  className="text-sm line-clamp-2"
                  style={{ color: preset.colors?.text || '#ffffff' }}
                >
                  {preset.description}
                </p>

                {/* Color Palette */}
                <div className="flex gap-2 mt-4">
                  {Object.entries(preset.colors || {}).slice(0, 5).map(([key, value]) => (
                    <div
                      key={key}
                      className="w-6 h-6 rounded-full border border-white/20"
                      style={{ background: value }}
                      title={key}
                    />
                  ))}
                </div>
              </div>

              {/* Active Badge */}
              {isActive && (
                <div className="absolute top-3 right-3 px-3 py-1 bg-cyan-500 rounded-full text-xs font-medium">
                  Active
                </div>
              )}

              {/* Rarity Badge */}
              <div className="absolute top-3 left-3 px-2 py-1 bg-black/50 rounded-full text-xs">
                {preset.rarity || 'common'}
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
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              activeSubTab === tab
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'bg-white/5 text-gray-400 hover:text-white border border-transparent'
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {messageEffects.map((effect) => {
            const isActive = activeMessageEffect === effect.id;

            return (
              <motion.div
                key={effect.id}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isActive
                    ? 'border-cyan-500/50 bg-cyan-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
                onClick={() => activateEffect(effect.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="text-2xl mb-2">{effect.icon || '✨'}</div>
                <h4 className="font-medium">{effect.name}</h4>
                <p className="text-xs text-gray-500 mt-1">{effect.description}</p>
                
                {isActive && (
                  <div className="mt-2 text-xs text-cyan-400">Active</div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Bubble Styles */}
      {activeSubTab === 'bubble' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {bubbleStyles.map((style) => {
            const isActive = activeBubbleStyle === style.id;

            return (
              <motion.div
                key={style.id}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
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
                  className="p-3 mb-3 text-sm"
                  style={{
                    borderRadius: style.borderRadius || 18,
                    background: style.gradient || 'rgba(255,255,255,0.1)',
                    boxShadow: style.glowColor
                      ? `0 0 20px ${style.glowColor}`
                      : undefined,
                  }}
                >
                  Preview message
                </div>
                
                <h4 className="font-medium">{style.name}</h4>
                
                {isActive && (
                  <div className="mt-2 text-xs text-cyan-400">Active</div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Typing Indicators */}
      {activeSubTab === 'typing' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {typingIndicators.map((indicator) => {
            const isActive = activeTypingIndicator === indicator.id;

            return (
              <motion.div
                key={indicator.id}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isActive
                    ? 'border-cyan-500/50 bg-cyan-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
                onClick={() => activateTypingIndicator(indicator.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Preview Animation */}
                <div className="h-8 flex items-center justify-center mb-3">
                  <TypingPreview type={indicator.id} />
                </div>
                
                <h4 className="font-medium">{indicator.name}</h4>
                
                {isActive && (
                  <div className="mt-2 text-xs text-cyan-400">Active</div>
                )}
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
            className="w-2 h-2 bg-gray-400 rounded-full"
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
        className="w-6 h-6 rounded-full border-2 border-gray-400"
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
          className="w-2 h-2 bg-gray-400 rounded-full"
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
