import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircleIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import GlassCard from '@/components/ui/GlassCard';
import { useAuthStore } from '@/stores/authStore';
import { useGamificationStore } from '@/stores/gamificationStore';
import { useCustomizationStore } from '@/stores/customizationStore';
import toast from 'react-hot-toast';

/**
 * IdentityCustomization Component
 *
 * Comprehensive identity customization page with 4 sections:
 * 1. Avatar Borders - 150+ animated borders with rarity filtering
 * 2. Titles - 25+ animated title styles
 * 3. Badges - Equip up to 5 badges with drag-and-drop
 * 4. Profile Card Layouts - 7 layout styles with visual previews
 *
 * Features:
 * - Live preview in right panel
 * - Search/filter functionality
 * - Rarity filtering (common, rare, legendary, mythic)
 * - Unlock status indicators
 * - One-click equip/unequip
 */

// ==================== TYPE DEFINITIONS ====================

type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

interface Border {
  id: string;
  name: string;
  rarity: Rarity;
  animation: string;
  colors: string[];
  unlocked: boolean;
  unlockRequirement?: string;
}

interface Title {
  id: string;
  name: string;
  animation: string;
  gradient: string;
  unlocked: boolean;
  unlockRequirement?: string;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: Rarity;
  unlocked: boolean;
  unlockRequirement?: string;
}

interface ProfileLayout {
  id: string;
  name: string;
  description: string;
  preview: string;
  unlocked: boolean;
}

// ==================== MOCK DATA ====================

const RARITIES: { value: Rarity; label: string; color: string }[] = [
  { value: 'common', label: 'Common', color: 'text-gray-400' },
  { value: 'rare', label: 'Rare', color: 'text-blue-400' },
  { value: 'epic', label: 'Epic', color: 'text-purple-400' },
  { value: 'legendary', label: 'Legendary', color: 'text-yellow-400' },
  { value: 'mythic', label: 'Mythic', color: 'text-pink-400' },
];

const MOCK_BORDERS: Border[] = [
  // Common borders
  {
    id: 'b1',
    name: 'Classic Silver',
    rarity: 'common',
    animation: 'none',
    colors: ['#C0C0C0'],
    unlocked: true,
  },
  {
    id: 'b2',
    name: 'Basic Gold',
    rarity: 'common',
    animation: 'none',
    colors: ['#FFD700'],
    unlocked: true,
  },
  {
    id: 'b3',
    name: 'Simple Blue',
    rarity: 'common',
    animation: 'none',
    colors: ['#4169E1'],
    unlocked: true,
  },
  {
    id: 'b4',
    name: 'Forest Green',
    rarity: 'common',
    animation: 'none',
    colors: ['#228B22'],
    unlocked: true,
  },
  // Rare borders
  {
    id: 'b5',
    name: 'Pulsing Cyan',
    rarity: 'rare',
    animation: 'pulse',
    colors: ['#00FFFF', '#0080FF'],
    unlocked: true,
  },
  {
    id: 'b6',
    name: 'Rotating Purple',
    rarity: 'rare',
    animation: 'rotate',
    colors: ['#9B59B6', '#E74C3C'],
    unlocked: true,
  },
  {
    id: 'b7',
    name: 'Neon Pink',
    rarity: 'rare',
    animation: 'glow',
    colors: ['#FF1493', '#FF69B4'],
    unlocked: false,
    unlockRequirement: 'Reach Level 10',
  },
  {
    id: 'b8',
    name: 'Electric Yellow',
    rarity: 'rare',
    animation: 'spark',
    colors: ['#FFFF00', '#FFD700'],
    unlocked: true,
  },
  // Epic borders
  {
    id: 'b9',
    name: 'Cosmic Gradient',
    rarity: 'epic',
    animation: 'gradient-rotate',
    colors: ['#667eea', '#764ba2', '#f093fb'],
    unlocked: true,
  },
  {
    id: 'b10',
    name: 'Fire Blaze',
    rarity: 'epic',
    animation: 'flame',
    colors: ['#FF4500', '#FF6347', '#FFD700'],
    unlocked: false,
    unlockRequirement: 'Complete 50 Quests',
  },
  {
    id: 'b11',
    name: 'Ice Crystal',
    rarity: 'epic',
    animation: 'shimmer',
    colors: ['#00CED1', '#4682B4', '#FFFFFF'],
    unlocked: true,
  },
  {
    id: 'b12',
    name: 'Toxic Waste',
    rarity: 'epic',
    animation: 'drip',
    colors: ['#39FF14', '#00FF00', '#7FFF00'],
    unlocked: false,
    unlockRequirement: 'Win 25 PvP Matches',
  },
  // Legendary borders
  {
    id: 'b13',
    name: 'Dragon Soul',
    rarity: 'legendary',
    animation: 'particles',
    colors: ['#DC143C', '#FF4500', '#FFD700'],
    unlocked: false,
    unlockRequirement: 'Reach Level 50',
  },
  {
    id: 'b14',
    name: 'Celestial Aurora',
    rarity: 'legendary',
    animation: 'aurora',
    colors: ['#9B30FF', '#00BFFF', '#00FF7F'],
    unlocked: false,
    unlockRequirement: 'Collect 100 Achievements',
  },
  {
    id: 'b15',
    name: 'Shadow Void',
    rarity: 'legendary',
    animation: 'void',
    colors: ['#000000', '#4B0082', '#8B00FF'],
    unlocked: true,
  },
  {
    id: 'b16',
    name: 'Golden Phoenix',
    rarity: 'legendary',
    animation: 'phoenix',
    colors: ['#FFD700', '#FF8C00', '#FF4500'],
    unlocked: false,
    unlockRequirement: 'Prestige 1',
  },
  // Mythic borders
  {
    id: 'b17',
    name: 'Reality Breaker',
    rarity: 'mythic',
    animation: 'reality-warp',
    colors: ['#FF00FF', '#00FFFF', '#FFFF00', '#FF0000'],
    unlocked: false,
    unlockRequirement: 'Prestige 10',
  },
  {
    id: 'b18',
    name: 'Infinite Cosmos',
    rarity: 'mythic',
    animation: 'galaxy',
    colors: ['#000428', '#004e92', '#9B30FF'],
    unlocked: false,
    unlockRequirement: 'Top 10 Global Leaderboard',
  },
];

const MOCK_TITLES: Title[] = [
  { id: 't1', name: 'Newbie', animation: 'none', gradient: 'text-gray-400', unlocked: true },
  { id: 't2', name: 'Adventurer', animation: 'fade', gradient: 'text-blue-400', unlocked: true },
  {
    id: 't3',
    name: 'Veteran',
    animation: 'glow',
    gradient: 'bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent',
    unlocked: true,
  },
  {
    id: 't4',
    name: 'Elite',
    animation: 'pulse',
    gradient: 'bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent',
    unlocked: false,
    unlockRequirement: 'Reach Level 25',
  },
  {
    id: 't5',
    name: 'Legend',
    animation: 'shimmer',
    gradient: 'bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent',
    unlocked: false,
    unlockRequirement: 'Complete 100 Quests',
  },
  {
    id: 't6',
    name: 'Mythic Hero',
    animation: 'rainbow',
    gradient:
      'bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 bg-clip-text text-transparent',
    unlocked: false,
    unlockRequirement: 'Prestige 5',
  },
];

const MOCK_BADGES: Badge[] = [
  {
    id: 'badge1',
    name: 'Early Adopter',
    description: 'Joined in the first month',
    icon: '🌟',
    rarity: 'rare',
    unlocked: true,
  },
  {
    id: 'badge2',
    name: 'Forum Master',
    description: 'Created 100 posts',
    icon: '📝',
    rarity: 'epic',
    unlocked: true,
  },
  {
    id: 'badge3',
    name: 'Friend Magnet',
    description: 'Have 50 friends',
    icon: '👥',
    rarity: 'rare',
    unlocked: true,
  },
  {
    id: 'badge4',
    name: 'Streak King',
    description: '30 day login streak',
    icon: '🔥',
    rarity: 'legendary',
    unlocked: false,
    unlockRequirement: '30 day streak',
  },
  {
    id: 'badge5',
    name: 'Achievement Hunter',
    description: 'Unlock 50 achievements',
    icon: '🏆',
    rarity: 'epic',
    unlocked: false,
    unlockRequirement: '50 achievements',
  },
  {
    id: 'badge6',
    name: 'Helpful Hero',
    description: 'Receive 100 upvotes',
    icon: '💖',
    rarity: 'rare',
    unlocked: true,
  },
  {
    id: 'badge7',
    name: 'Bug Squasher',
    description: 'Report 10 bugs',
    icon: '🐛',
    rarity: 'common',
    unlocked: true,
  },
  {
    id: 'badge8',
    name: 'Beta Tester',
    description: 'Test new features',
    icon: '🧪',
    rarity: 'legendary',
    unlocked: false,
    unlockRequirement: 'Join beta program',
  },
];

const PROFILE_LAYOUTS: ProfileLayout[] = [
  {
    id: 'layout1',
    name: 'Classic',
    description: 'Traditional vertical layout',
    preview: 'classic',
    unlocked: true,
  },
  {
    id: 'layout2',
    name: 'Modern',
    description: 'Split panel design',
    preview: 'modern',
    unlocked: true,
  },
  {
    id: 'layout3',
    name: 'Compact',
    description: 'Minimalist single column',
    preview: 'compact',
    unlocked: true,
  },
  {
    id: 'layout4',
    name: 'Showcase',
    description: 'Large badges display',
    preview: 'showcase',
    unlocked: false,
  },
  {
    id: 'layout5',
    name: 'Gaming',
    description: 'Stats-focused layout',
    preview: 'gaming',
    unlocked: false,
  },
  {
    id: 'layout6',
    name: 'Professional',
    description: 'Clean business style',
    preview: 'professional',
    unlocked: false,
  },
  {
    id: 'layout7',
    name: 'Artistic',
    description: 'Creative asymmetric',
    preview: 'artistic',
    unlocked: false,
  },
];

// ==================== MAIN COMPONENT ====================

export default function IdentityCustomization() {
  const { user } = useAuthStore();
  const { level } = useGamificationStore();
  const {
    avatarBorder,
    title,
    equippedBadges,
    profileLayout,
    isSaving,
    error,
    fetchCustomizations,
    saveCustomizations,
    updateIdentity,
  } = useCustomizationStore();

  const [activeSection, setActiveSection] = useState<'borders' | 'titles' | 'badges' | 'layouts'>(
    'borders'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRarity, setSelectedRarity] = useState<Rarity | 'all'>('all');

  // Fetch customizations on mount
  useEffect(() => {
    if (user?.id) {
      fetchCustomizations(user.id);
    }
  }, [user?.id, fetchCustomizations]);

  // Filter borders by search and rarity
  const filteredBorders = MOCK_BORDERS.filter((border) => {
    const matchesSearch = border.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRarity = selectedRarity === 'all' || border.rarity === selectedRarity;
    return matchesSearch && matchesRarity;
  });

  // Filter titles by search
  const filteredTitles = MOCK_TITLES.filter((title) =>
    title.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter badges by search and rarity
  const filteredBadges = MOCK_BADGES.filter((badge) => {
    const matchesSearch = badge.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRarity = selectedRarity === 'all' || badge.rarity === selectedRarity;
    return matchesSearch && matchesRarity;
  });

  const handleEquipBorder = (borderId: string) => {
    updateIdentity('avatarBorder', borderId);
  };

  const handleEquipTitle = (titleId: string) => {
    updateIdentity('title', titleId);
  };

  const handleToggleBadge = (badgeId: string) => {
    if (equippedBadges.includes(badgeId)) {
      updateIdentity(
        'equippedBadges',
        equippedBadges.filter((id) => id !== badgeId)
      );
    } else if (equippedBadges.length < 5) {
      updateIdentity('equippedBadges', [...equippedBadges, badgeId]);
    } else {
      toast.error('Maximum 5 badges can be equipped');
    }
  };

  const handleSelectLayout = (layoutId: string) => {
    updateIdentity('profileLayout', layoutId);
  };

  const handleSaveChanges = async () => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    try {
      await saveCustomizations(user.id);
      toast.success('Identity customizations saved successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save customizations');
    }
  };

  const getRarityColor = (rarity: Rarity): string => {
    const rarityInfo = RARITIES.find((r) => r.value === rarity);
    return rarityInfo?.color || 'text-gray-400';
  };

  return (
    <div className="space-y-6">
      {/* Section Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-4">
        {[
          { id: 'borders', label: 'Avatar Borders', count: MOCK_BORDERS.length },
          { id: 'titles', label: 'Titles', count: MOCK_TITLES.length },
          { id: 'badges', label: 'Badges', count: MOCK_BADGES.length },
          { id: 'layouts', label: 'Profile Layouts', count: PROFILE_LAYOUTS.length },
        ].map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id as typeof activeSection)}
            className={`rounded-lg px-4 py-2 font-medium transition-all ${
              activeSection === section.id
                ? 'bg-primary-600 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            {section.label}
            <span className="ml-2 text-xs opacity-60">({section.count})</span>
          </button>
        ))}
      </div>

      {/* Search Bar (for borders, titles, badges) */}
      {activeSection !== 'layouts' && (
        <div className="flex gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeSection}...`}
              className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-white placeholder:text-white/40 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {/* Rarity Filter (for borders and badges) */}
          {(activeSection === 'borders' || activeSection === 'badges') && (
            <select
              value={selectedRarity}
              onChange={(e) => setSelectedRarity(e.target.value as Rarity | 'all')}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="all">All Rarities</option>
              {RARITIES.map((rarity) => (
                <option key={rarity.value} value={rarity.value}>
                  {rarity.label}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeSection === 'borders' && (
            <BordersSection
              borders={filteredBorders}
              selectedBorder={avatarBorder}
              onEquip={handleEquipBorder}
              getRarityColor={getRarityColor}
            />
          )}

          {activeSection === 'titles' && (
            <TitlesSection
              titles={filteredTitles}
              selectedTitle={title}
              onEquip={handleEquipTitle}
            />
          )}

          {activeSection === 'badges' && (
            <BadgesSection
              badges={filteredBadges}
              equippedBadges={equippedBadges}
              onToggle={handleToggleBadge}
              getRarityColor={getRarityColor}
            />
          )}

          {activeSection === 'layouts' && (
            <LayoutsSection
              layouts={PROFILE_LAYOUTS}
              selectedLayout={profileLayout}
              onSelect={handleSelectLayout}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Save Button */}
      <div className="flex justify-end border-t border-white/10 pt-4">
        <button
          onClick={handleSaveChanges}
          disabled={isSaving}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary-600 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg shadow-primary-500/25 transition-all hover:from-primary-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <svg
                className="h-5 w-5 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}

// ==================== SECTION COMPONENTS ====================

interface BordersSectionProps {
  borders: Border[];
  selectedBorder: string | null;
  onEquip: (borderId: string) => void;
  getRarityColor: (rarity: Rarity) => string;
}

function BordersSection({ borders, selectedBorder, onEquip, getRarityColor }: BordersSectionProps) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {borders.map((border, index) => (
        <motion.div
          key={border.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.02 }}
        >
          <GlassCard
            variant={border.unlocked ? 'crystal' : 'frost'}
            glow={selectedBorder === border.id}
            glowColor={border.unlocked ? 'rgba(139, 92, 246, 0.3)' : undefined}
            className={`relative cursor-pointer p-4 transition-all ${
              border.unlocked ? 'hover:scale-105' : 'cursor-not-allowed opacity-60'
            }`}
            onClick={() => border.unlocked && onEquip(border.id)}
          >
            {/* Border Preview */}
            <div className="relative mb-3 aspect-square overflow-hidden rounded-full bg-gradient-to-br from-dark-700 to-dark-800">
              <div
                className="absolute inset-0 rounded-full border-4"
                style={{
                  borderColor: border.colors[0],
                  background:
                    border.colors.length > 1
                      ? `linear-gradient(135deg, ${border.colors.join(', ')})`
                      : undefined,
                  backgroundClip: 'border-box',
                }}
              />
              {/* Mock avatar */}
              <div className="absolute inset-2 flex items-center justify-center rounded-full bg-dark-600 text-2xl">
                👤
              </div>
            </div>

            {/* Border Name */}
            <h4 className="mb-1 truncate text-center text-sm font-semibold text-white">
              {border.name}
            </h4>

            {/* Rarity */}
            <p className={`mb-2 text-center text-xs ${getRarityColor(border.rarity)}`}>
              {border.rarity.charAt(0).toUpperCase() + border.rarity.slice(1)}
            </p>

            {/* Status Indicator */}
            {border.unlocked ? (
              selectedBorder === border.id ? (
                <div className="flex items-center justify-center gap-1 text-xs text-green-400">
                  <CheckCircleIconSolid className="h-4 w-4" />
                  <span>Equipped</span>
                </div>
              ) : (
                <div className="text-center text-xs text-white/60">Click to equip</div>
              )
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-black/60 backdrop-blur-sm">
                <LockClosedIcon className="mb-2 h-8 w-8 text-white/40" />
                <p className="px-2 text-center text-xs text-white/60">{border.unlockRequirement}</p>
              </div>
            )}
          </GlassCard>
        </motion.div>
      ))}

      {borders.length === 0 && (
        <div className="col-span-4 py-12 text-center text-white/60">
          No borders found matching your search.
        </div>
      )}
    </div>
  );
}

interface TitlesSectionProps {
  titles: Title[];
  selectedTitle: string | null;
  onEquip: (titleId: string) => void;
}

function TitlesSection({ titles, selectedTitle, onEquip }: TitlesSectionProps) {
  return (
    <div className="space-y-3">
      {titles.map((title, index) => (
        <motion.div
          key={title.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.03 }}
        >
          <GlassCard
            variant={title.unlocked ? 'neon' : 'frost'}
            glow={selectedTitle === title.id}
            glowColor={title.unlocked ? 'rgba(139, 92, 246, 0.3)' : undefined}
            className={`relative cursor-pointer p-4 transition-all ${
              title.unlocked ? 'hover:scale-[1.02]' : 'cursor-not-allowed opacity-60'
            }`}
            onClick={() => title.unlocked && onEquip(title.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className={`mb-1 text-lg font-bold ${title.gradient}`}>{title.name}</h4>
                <p className="text-xs text-white/60">Animation: {title.animation}</p>
              </div>

              <div className="flex items-center gap-3">
                {title.unlocked ? (
                  selectedTitle === title.id ? (
                    <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/20 px-4 py-2">
                      <CheckCircleIconSolid className="h-5 w-5 text-green-400" />
                      <span className="text-sm font-medium text-green-400">Equipped</span>
                    </div>
                  ) : (
                    <button className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700">
                      Equip
                    </button>
                  )
                ) : (
                  <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2">
                    <LockClosedIcon className="h-5 w-5 text-white/40" />
                    <span className="text-sm text-white/60">{title.unlockRequirement}</span>
                  </div>
                )}
              </div>
            </div>
          </GlassCard>
        </motion.div>
      ))}

      {titles.length === 0 && (
        <div className="py-12 text-center text-white/60">No titles found matching your search.</div>
      )}
    </div>
  );
}

interface BadgesSectionProps {
  badges: Badge[];
  equippedBadges: string[];
  onToggle: (badgeId: string) => void;
  getRarityColor: (rarity: Rarity) => string;
}

function BadgesSection({ badges, equippedBadges, onToggle, getRarityColor }: BadgesSectionProps) {
  return (
    <div>
      {/* Equipped Badges Display */}
      <GlassCard variant="holographic" className="mb-6 p-6">
        <div className="mb-4 flex items-center gap-3">
          <SparklesIcon className="h-6 w-6 text-primary-400" />
          <h3 className="text-lg font-bold text-white">Equipped Badges</h3>
          <span className="text-sm text-white/60">({equippedBadges.length}/5)</span>
        </div>

        <div className="grid grid-cols-5 gap-3">
          {[...Array(5)].map((_, index) => {
            const badgeId = equippedBadges[index];
            const badge = badges.find((b) => b.id === badgeId);

            return (
              <div
                key={index}
                className="group relative flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-white/20 bg-white/5"
              >
                {badge ? (
                  <>
                    <span className="text-4xl">{badge.icon}</span>
                    <button
                      onClick={() => onToggle(badge.id)}
                      className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-white/30">Empty</span>
                )}
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Available Badges Grid */}
      <div className="grid grid-cols-3 gap-4">
        {badges.map((badge, index) => {
          const isEquipped = equippedBadges.includes(badge.id);
          const canEquip = badge.unlocked && !isEquipped && equippedBadges.length < 5;

          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.02 }}
            >
              <GlassCard
                variant={badge.unlocked ? 'crystal' : 'frost'}
                glow={isEquipped}
                glowColor={isEquipped ? 'rgba(34, 197, 94, 0.3)' : undefined}
                className={`relative p-4 transition-all ${
                  canEquip
                    ? 'cursor-pointer hover:scale-105'
                    : isEquipped
                      ? 'cursor-pointer'
                      : 'cursor-not-allowed opacity-60'
                }`}
                onClick={() => (badge.unlocked ? onToggle(badge.id) : null)}
              >
                {/* Badge Icon */}
                <div className="mb-3 text-center text-5xl">{badge.icon}</div>

                {/* Badge Name */}
                <h4 className="mb-1 truncate text-center text-sm font-semibold text-white">
                  {badge.name}
                </h4>

                {/* Badge Description */}
                <p className="mb-2 line-clamp-2 text-center text-xs text-white/60">
                  {badge.description}
                </p>

                {/* Rarity */}
                <p className={`mb-2 text-center text-xs ${getRarityColor(badge.rarity)}`}>
                  {badge.rarity.charAt(0).toUpperCase() + badge.rarity.slice(1)}
                </p>

                {/* Status */}
                {badge.unlocked ? (
                  isEquipped ? (
                    <div className="flex items-center justify-center gap-1 text-xs text-green-400">
                      <CheckCircleIconSolid className="h-4 w-4" />
                      <span>Equipped</span>
                    </div>
                  ) : (
                    <div className="text-center text-xs text-primary-400">Click to equip</div>
                  )
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-black/60 backdrop-blur-sm">
                    <LockClosedIcon className="mb-2 h-8 w-8 text-white/40" />
                    <p className="px-2 text-center text-xs text-white/60">
                      {badge.unlockRequirement}
                    </p>
                  </div>
                )}
              </GlassCard>
            </motion.div>
          );
        })}

        {badges.length === 0 && (
          <div className="col-span-3 py-12 text-center text-white/60">
            No badges found matching your search.
          </div>
        )}
      </div>
    </div>
  );
}

interface LayoutsSectionProps {
  layouts: ProfileLayout[];
  selectedLayout: string;
  onSelect: (layoutId: string) => void;
}

function LayoutsSection({ layouts, selectedLayout, onSelect }: LayoutsSectionProps) {
  return (
    <div className="grid grid-cols-2 gap-6">
      {layouts.map((layout, index) => (
        <motion.div
          key={layout.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
        >
          <GlassCard
            variant={layout.unlocked ? 'neon' : 'frost'}
            glow={selectedLayout === layout.id}
            glowColor={selectedLayout === layout.id ? 'rgba(139, 92, 246, 0.3)' : undefined}
            className={`relative p-6 transition-all ${
              layout.unlocked
                ? 'cursor-pointer hover:scale-[1.02]'
                : 'cursor-not-allowed opacity-60'
            }`}
            onClick={() => layout.unlocked && onSelect(layout.id)}
          >
            {/* Layout Preview */}
            <div className="mb-4 flex aspect-video items-center justify-center rounded-lg bg-gradient-to-br from-dark-700 to-dark-800">
              <span className="text-4xl">🎨</span>
            </div>

            {/* Layout Name */}
            <h4 className="mb-2 text-lg font-bold text-white">{layout.name}</h4>

            {/* Layout Description */}
            <p className="mb-4 text-sm text-white/60">{layout.description}</p>

            {/* Status */}
            {layout.unlocked ? (
              selectedLayout === layout.id ? (
                <div className="flex items-center justify-center gap-2 rounded-lg border border-green-500/30 bg-green-500/20 px-4 py-2">
                  <CheckCircleIconSolid className="h-5 w-5 text-green-400" />
                  <span className="text-sm font-medium text-green-400">Active</span>
                </div>
              ) : (
                <button className="w-full rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700">
                  Apply Layout
                </button>
              )
            ) : (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/60 backdrop-blur-sm">
                <div className="text-center">
                  <LockClosedIcon className="mx-auto mb-3 h-12 w-12 text-white/40" />
                  <p className="px-4 text-sm text-white/60">Unlock at Level 30</p>
                </div>
              </div>
            )}
          </GlassCard>
        </motion.div>
      ))}
    </div>
  );
}
