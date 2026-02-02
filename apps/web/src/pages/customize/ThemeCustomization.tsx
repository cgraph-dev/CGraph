import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  NewspaperIcon,
  Squares2X2Icon,
  EyeIcon,
  SparklesIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import { GlassCard } from '@/shared/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { useCustomizationStore, getThemePreset } from '@/stores/customization';
import toast from 'react-hot-toast';

// Import profile themes data
import {
  ALL_PROFILE_THEMES,
  PROFILE_THEME_CATEGORIES,
  getThemesByCategory,
  type ProfileThemeConfig,
  type ProfileThemeCategory,
} from '@/data/profileThemes';

// Import reusable components
import ProfileThemeCard, { ProfileThemeGrid } from '@/components/customize/ProfileThemeCard';

/**
 * ThemeCustomization Component
 *
 * Comprehensive theme customization with 4 categories:
 * 1. Profile Themes - 20+ profile color schemes
 * 2. Chat Themes - 15+ chat bubble/background themes
 * 3. Forum Themes - 12+ forum layout themes
 * 4. App Themes - 8+ global app color schemes
 *
 * Features:
 * - Live preview cards for each theme
 * - Search/filter functionality
 * - Category tabs for organization
 * - Lock system for premium themes
 * - One-click apply with visual feedback
 */

// ==================== TYPE DEFINITIONS ====================

type ThemeCategory = 'profile' | 'chat' | 'forum' | 'app';

interface Theme {
  id: string;
  name: string;
  description: string;
  category: ThemeCategory;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  preview: string; // CSS gradient or solid color for preview
  unlocked: boolean;
  unlockRequirement?: string;
  isPremium?: boolean;
}

// ==================== MOCK DATA ====================

const MOCK_THEMES: Theme[] = [
  // Profile Themes
  {
    id: 'profile-default',
    name: 'Classic Purple',
    description: 'Default CGraph purple theme',
    category: 'profile',
    colors: {
      primary: '#8B5CF6',
      secondary: '#A78BFA',
      accent: '#C084FC',
      background: '#1F1F23',
      text: '#FFFFFF',
    },
    preview: 'linear-gradient(135deg, #8B5CF6, #A78BFA)',
    unlocked: true,
  },
  {
    id: 'profile-ocean',
    name: 'Ocean Blue',
    description: 'Calming blue ocean theme',
    category: 'profile',
    colors: {
      primary: '#0EA5E9',
      secondary: '#38BDF8',
      accent: '#7DD3FC',
      background: '#0C1E2E',
      text: '#FFFFFF',
    },
    preview: 'linear-gradient(135deg, #0EA5E9, #38BDF8)',
    unlocked: true,
  },
  {
    id: 'profile-forest',
    name: 'Forest Green',
    description: 'Natural green forest theme',
    category: 'profile',
    colors: {
      primary: '#10B981',
      secondary: '#34D399',
      accent: '#6EE7B7',
      background: '#0F2419',
      text: '#FFFFFF',
    },
    preview: 'linear-gradient(135deg, #10B981, #34D399)',
    unlocked: true,
  },
  {
    id: 'profile-sunset',
    name: 'Sunset Orange',
    description: 'Warm sunset gradient',
    category: 'profile',
    colors: {
      primary: '#F97316',
      secondary: '#FB923C',
      accent: '#FDBA74',
      background: '#2C1810',
      text: '#FFFFFF',
    },
    preview: 'linear-gradient(135deg, #F97316, #FB923C)',
    unlocked: false,
    unlockRequirement: 'Reach Level 15',
  },
  {
    id: 'profile-midnight',
    name: 'Midnight Purple',
    description: 'Deep purple night theme',
    category: 'profile',
    colors: {
      primary: '#7C3AED',
      secondary: '#9333EA',
      accent: '#A855F7',
      background: '#1E1034',
      text: '#FFFFFF',
    },
    preview: 'linear-gradient(135deg, #7C3AED, #9333EA)',
    unlocked: false,
    unlockRequirement: 'Complete 25 Quests',
  },
  {
    id: 'profile-cherry',
    name: 'Cherry Blossom',
    description: 'Soft pink cherry theme',
    category: 'profile',
    colors: {
      primary: '#EC4899',
      secondary: '#F472B6',
      accent: '#F9A8D4',
      background: '#2E1020',
      text: '#FFFFFF',
    },
    preview: 'linear-gradient(135deg, #EC4899, #F472B6)',
    unlocked: true,
  },

  // Chat Themes
  {
    id: 'chat-default',
    name: 'Default Bubbles',
    description: 'Classic chat bubble style',
    category: 'chat',
    colors: {
      primary: '#8B5CF6',
      secondary: '#374151',
      accent: '#A78BFA',
      background: '#111111',
      text: '#FFFFFF',
    },
    preview: 'linear-gradient(135deg, #8B5CF6, #374151)',
    unlocked: true,
  },
  {
    id: 'chat-discord',
    name: 'Discord Style',
    description: 'Discord-inspired dark theme',
    category: 'chat',
    colors: {
      primary: '#5865F2',
      secondary: '#2C2F33',
      accent: '#7289DA',
      background: '#23272A',
      text: '#DCDDDE',
    },
    preview: 'linear-gradient(135deg, #5865F2, #2C2F33)',
    unlocked: true,
  },
  {
    id: 'chat-telegram',
    name: 'Telegram Blue',
    description: 'Telegram-inspired theme',
    category: 'chat',
    colors: {
      primary: '#0088CC',
      secondary: '#FFFFFF',
      accent: '#54A9EB',
      background: '#FFFFFF',
      text: '#000000',
    },
    preview: 'linear-gradient(135deg, #0088CC, #54A9EB)',
    unlocked: true,
  },
  {
    id: 'chat-neon',
    name: 'Neon Glow',
    description: 'Cyberpunk neon theme',
    category: 'chat',
    colors: {
      primary: '#FF006E',
      secondary: '#8338EC',
      accent: '#3A86FF',
      background: '#0A0014',
      text: '#FFFFFF',
    },
    preview: 'linear-gradient(135deg, #FF006E, #8338EC, #3A86FF)',
    unlocked: false,
    unlockRequirement: 'Reach Level 20',
    isPremium: true,
  },
  {
    id: 'chat-minimal',
    name: 'Minimal White',
    description: 'Clean minimalist theme',
    category: 'chat',
    colors: {
      primary: '#000000',
      secondary: '#F3F4F6',
      accent: '#6B7280',
      background: '#FFFFFF',
      text: '#111827',
    },
    preview: 'linear-gradient(135deg, #F3F4F6, #E5E7EB)',
    unlocked: true,
  },

  // Forum Themes
  {
    id: 'forum-default',
    name: 'Classic Forum',
    description: 'Traditional forum layout',
    category: 'forum',
    colors: {
      primary: '#8B5CF6',
      secondary: '#1F2937',
      accent: '#A78BFA',
      background: '#111111',
      text: '#FFFFFF',
    },
    preview: 'linear-gradient(135deg, #8B5CF6, #1F2937)',
    unlocked: true,
  },
  {
    id: 'forum-reddit',
    name: 'Reddit Style',
    description: 'Reddit-inspired layout',
    category: 'forum',
    colors: {
      primary: '#FF4500',
      secondary: '#1A1A1B',
      accent: '#FF5700',
      background: '#0B0B0C',
      text: '#D7DADC',
    },
    preview: 'linear-gradient(135deg, #FF4500, #1A1A1B)',
    unlocked: true,
  },
  {
    id: 'forum-hacker',
    name: 'Hacker News',
    description: 'HN minimalist style',
    category: 'forum',
    colors: {
      primary: '#FF6600',
      secondary: '#F6F6EF',
      accent: '#828282',
      background: '#F6F6EF',
      text: '#000000',
    },
    preview: 'linear-gradient(135deg, #FF6600, #F6F6EF)',
    unlocked: false,
    unlockRequirement: 'Create 50 Posts',
  },
  {
    id: 'forum-gaming',
    name: 'Gaming RGB',
    description: 'RGB gaming aesthetic',
    category: 'forum',
    colors: {
      primary: '#FF0080',
      secondary: '#7928CA',
      accent: '#00DFD8',
      background: '#0A0A0F',
      text: '#FFFFFF',
    },
    preview: 'linear-gradient(135deg, #FF0080, #7928CA, #00DFD8)',
    unlocked: false,
    unlockRequirement: 'Join 10 Forums',
    isPremium: true,
  },

  // App Themes
  {
    id: 'app-dark',
    name: 'Dark Mode',
    description: 'Default dark theme',
    category: 'app',
    colors: {
      primary: '#8B5CF6',
      secondary: '#1F1F23',
      accent: '#A78BFA',
      background: '#0F0F11',
      text: '#FFFFFF',
    },
    preview: 'linear-gradient(135deg, #0F0F11, #1F1F23)',
    unlocked: true,
  },
  {
    id: 'app-light',
    name: 'Light Mode',
    description: 'Clean light theme',
    category: 'app',
    colors: {
      primary: '#8B5CF6',
      secondary: '#F9FAFB',
      accent: '#A78BFA',
      background: '#FFFFFF',
      text: '#111827',
    },
    preview: 'linear-gradient(135deg, #FFFFFF, #F9FAFB)',
    unlocked: true,
  },
  {
    id: 'app-amoled',
    name: 'AMOLED Black',
    description: 'True black for OLED',
    category: 'app',
    colors: {
      primary: '#8B5CF6',
      secondary: '#000000',
      accent: '#A78BFA',
      background: '#000000',
      text: '#FFFFFF',
    },
    preview: 'linear-gradient(135deg, #000000, #1a1a1a)',
    unlocked: false,
    unlockRequirement: 'Premium Tier',
    isPremium: true,
  },
  {
    id: 'app-nord',
    name: 'Nord Theme',
    description: 'Arctic-inspired colors',
    category: 'app',
    colors: {
      primary: '#88C0D0',
      secondary: '#2E3440',
      accent: '#8FBCBB',
      background: '#2E3440',
      text: '#ECEFF4',
    },
    preview: 'linear-gradient(135deg, #88C0D0, #2E3440)',
    unlocked: false,
    unlockRequirement: 'Reach Level 30',
  },
];

// ==================== MAIN COMPONENT ====================

export default function ThemeCustomization() {
  const { user } = useAuthStore();
  const store = useCustomizationStore();
  const {
    profileTheme,
    chatTheme,
    forumTheme,
    appTheme,
    isSaving,
    error,
    fetchCustomizations,
    saveCustomizations,
    updateTheme,
    setTheme,
    setAvatarBorderColor,
    setChatBubbleColor,
    setProfileTheme,
  } = store;

  const [activeCategory, setActiveCategory] = useState<ThemeCategory>('profile');
  const [searchQuery, setSearchQuery] = useState('');

  // Track if user is previewing a locked/premium item
  const [previewingTheme, setPreviewingTheme] = useState<string | null>(null);

  // Profile theme subcategory (using new themed system)
  const [profileThemeCategory, setProfileThemeCategory] = useState<ProfileThemeCategory | 'all'>(
    'all'
  );
  const [useNewProfileThemes, setUseNewProfileThemes] = useState(true);

  // Get profile themes from new data file
  const newProfileThemes = useMemo(() => {
    if (profileThemeCategory === 'all') {
      return ALL_PROFILE_THEMES;
    }
    return getThemesByCategory(profileThemeCategory as ProfileThemeCategory);
  }, [profileThemeCategory]);

  // Fetch customizations on mount
  useEffect(() => {
    if (user?.id) {
      fetchCustomizations(user.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Create selectedThemes object from store state
  const selectedThemes: Record<ThemeCategory, string> = {
    profile: profileTheme ?? 'default',
    chat: chatTheme,
    forum: forumTheme ?? 'forum-default',
    app: appTheme,
  };

  const categories = [
    {
      id: 'profile' as ThemeCategory,
      label: 'Profile Themes',
      icon: UserCircleIcon,
      count: ALL_PROFILE_THEMES.length,
    },
    { id: 'chat' as ThemeCategory, label: 'Chat Themes', icon: ChatBubbleLeftRightIcon, count: 5 },
    { id: 'forum' as ThemeCategory, label: 'Forum Themes', icon: NewspaperIcon, count: 4 },
    { id: 'app' as ThemeCategory, label: 'App Themes', icon: Squares2X2Icon, count: 4 },
  ];

  // Filter themes by category and search (for legacy themes)
  const filteredThemes = MOCK_THEMES.filter((theme) => {
    const matchesCategory = theme.category === activeCategory;
    const matchesSearch =
      theme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      theme.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Filter new profile themes by search
  const filteredNewProfileThemes = useMemo(() => {
    if (!searchQuery) return newProfileThemes;
    return newProfileThemes.filter(
      (theme) =>
        theme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        theme.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [newProfileThemes, searchQuery]);

  // Apply theme to store for live preview - uses centralized mapping
  const applyThemeToStore = useCallback(
    (themeId: string, category: ThemeCategory) => {
      const preset = getThemePreset(themeId);
      if (preset) {
        if (category === 'profile') {
          setTheme(preset);
          setAvatarBorderColor(preset);
        } else if (category === 'chat') {
          setChatBubbleColor(preset);
        }
      }
      setProfileTheme(themeId);
    },
    [setTheme, setAvatarBorderColor, setChatBubbleColor, setProfileTheme]
  );

  const handleApplyTheme = (themeId: string, category: ThemeCategory, theme: Theme) => {
    // Check if theme is locked - allow preview but mark it
    if (!theme.unlocked) {
      setPreviewingTheme(themeId);
      applyThemeToStore(themeId, category);
      toast('👁️ Previewing theme - Purchase premium to save', {
        icon: '✨',
        duration: 3000,
      });
      return;
    }

    // Clear any previous preview
    setPreviewingTheme(null);

    // Update store
    switch (category) {
      case 'profile':
        updateTheme('profileTheme', themeId);
        break;
      case 'chat':
        updateTheme('chatTheme', themeId);
        break;
      case 'forum':
        updateTheme('forumTheme', themeId);
        break;
      case 'app':
        updateTheme('appTheme', themeId);
        break;
    }

    // Apply to store for live preview
    applyThemeToStore(themeId, category);
  };

  const handleSaveThemes = async () => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    // Check if user is trying to save a previewing premium theme
    if (previewingTheme) {
      toast.error('🔒 Premium theme selected! Purchase premium to save these customizations.', {
        duration: 4000,
        icon: '💎',
      });
      return;
    }

    try {
      await saveCustomizations(user.id);
      toast.success('Theme settings saved successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save themes');
    }
  };

  const isThemeActive = (themeId: string, category: ThemeCategory) => {
    return selectedThemes[category] === themeId;
  };

  const isThemePreviewing = (themeId: string) => {
    return previewingTheme === themeId;
  };

  // Handler for new profile themes
  const handleApplyNewProfileTheme = useCallback(
    (theme: ProfileThemeConfig) => {
      const isLocked = theme.tier !== 'free' && !theme.unlocked;

      if (isLocked) {
        setPreviewingTheme(theme.id);
        // Sync to store for live preview
        store.setProfileTheme(theme.id);
        toast('👁️ Previewing theme - Unlock to save', {
          icon: '✨',
          duration: 3000,
        });
        return;
      }

      // Clear preview
      setPreviewingTheme(null);

      // Update stores
      updateTheme('profileTheme', theme.id);
      store.setProfileTheme(theme.id);

      toast.success(`Applied "${theme.name}" theme!`);
    },
    [updateTheme, store]
  );

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-4">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-all ${
                activeCategory === category.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5" />
              {category.label}
              <span className="text-xs opacity-60">({category.count})</span>
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search themes..."
          className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-white placeholder:text-white/40 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>

      {/* Theme Description */}
      <GlassCard variant="frosted" className="p-4">
        <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-white">
          <SparklesIcon className="h-5 w-5 text-primary-400" />
          {categories.find((c) => c.id === activeCategory)?.label}
        </h3>
        <p className="text-sm text-white/60">
          {activeCategory === 'profile' &&
            'Customize your profile with animated themes featuring particles, gradients, and stunning visual effects. These themes affect how your profile appears to others.'}
          {activeCategory === 'chat' &&
            'Change chat bubble colors, backgrounds, and message styling. These themes affect all your conversations.'}
          {activeCategory === 'forum' &&
            'Modify forum post layouts, colors, and card styles. These themes affect how forums appear to you.'}
          {activeCategory === 'app' &&
            'Change the global app color scheme, navigation, and backgrounds. These themes affect the entire application.'}
        </p>
      </GlassCard>

      {/* Profile Theme Category Picker (only show for profile category) */}
      {activeCategory === 'profile' && useNewProfileThemes && (
        <div className="space-y-3">
          {/* Toggle between new and classic themes */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white/80">Enhanced Themes</span>
            <button
              onClick={() => setUseNewProfileThemes(!useNewProfileThemes)}
              className="text-xs text-primary-400 hover:text-primary-300"
            >
              {useNewProfileThemes ? 'View Classic Themes' : 'View Enhanced Themes'}
            </button>
          </div>

          {/* Profile Theme Categories */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setProfileThemeCategory('all')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                profileThemeCategory === 'all'
                  ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-lg shadow-primary-500/25'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              All ({ALL_PROFILE_THEMES.length})
            </button>
            {PROFILE_THEME_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setProfileThemeCategory(cat.id)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  profileThemeCategory === cat.id
                    ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-lg shadow-primary-500/25'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                <span>{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Themes Grid */}
      <AnimatePresence mode="wait">
        {/* New Profile Themes with ProfileThemeCard */}
        {activeCategory === 'profile' && useNewProfileThemes ? (
          <motion.div
            key="profile-new"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <ProfileThemeGrid>
              {filteredNewProfileThemes.map((theme) => (
                <ProfileThemeCard
                  key={theme.id}
                  theme={theme}
                  isSelected={selectedThemes.profile === theme.id}
                  onSelect={() => handleApplyNewProfileTheme(theme)}
                />
              ))}
            </ProfileThemeGrid>

            {filteredNewProfileThemes.length === 0 && (
              <div className="py-12 text-center text-white/60">
                No themes found matching your search.
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-2 gap-4"
          >
            {filteredThemes.map((theme, index) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                isActive={isThemeActive(theme.id, activeCategory)}
                isPreviewing={isThemePreviewing(theme.id)}
                onApply={() => handleApplyTheme(theme.id, activeCategory, theme)}
                delay={index * 0.05}
              />
            ))}

            {filteredThemes.length === 0 && (
              <div className="col-span-2 py-12 text-center text-white/60">
                No themes found matching your search.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Button */}
      <div className="flex justify-end border-t border-white/10 pt-4">
        <button
          onClick={handleSaveThemes}
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
            'Save Theme Settings'
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

// ==================== THEME CARD COMPONENT ====================

interface ThemeCardProps {
  theme: Theme;
  isActive: boolean;
  isPreviewing: boolean;
  onApply: () => void;
  delay: number;
}

function ThemeCard({ theme, isActive, isPreviewing, onApply, delay }: ThemeCardProps) {
  const isHighlighted = isActive || isPreviewing;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
    >
      <GlassCard
        variant={isHighlighted ? 'neon' : 'crystal'}
        glow={isHighlighted}
        glowColor={
          isPreviewing ? 'rgba(234, 179, 8, 0.3)' : isActive ? 'rgba(139, 92, 246, 0.3)' : undefined
        }
        className="relative cursor-pointer p-4 transition-all hover:scale-[1.02]"
        onClick={onApply}
      >
        {/* Preview indicator for locked items */}
        {isPreviewing && (
          <div className="absolute -right-1 -top-1 z-20 flex items-center gap-1 rounded-full bg-yellow-500 px-2 py-0.5 text-[10px] font-bold text-black">
            <EyeIcon className="h-3 w-3" />
            Preview
          </div>
        )}

        {/* Theme Preview */}
        <div
          className="relative mb-3 aspect-video overflow-hidden rounded-lg"
          style={{
            background: theme.preview,
          }}
        >
          {/* Mock UI elements in preview */}
          <div className="absolute inset-0 flex items-center justify-center p-3">
            {theme.category === 'profile' && (
              <div className="w-full max-w-[120px] space-y-1">
                <div
                  className="mx-auto h-16 w-16 rounded-full"
                  style={{ backgroundColor: theme.colors.accent }}
                />
                <div
                  className="h-2 rounded"
                  style={{ backgroundColor: theme.colors.text, opacity: 0.8 }}
                />
                <div
                  className="mx-auto h-2 w-2/3 rounded"
                  style={{ backgroundColor: theme.colors.text, opacity: 0.6 }}
                />
              </div>
            )}
            {theme.category === 'chat' && (
              <div className="w-full space-y-2">
                <div
                  className="ml-auto h-6 w-3/4 rounded-lg"
                  style={{ backgroundColor: theme.colors.primary }}
                />
                <div
                  className="h-6 w-2/3 rounded-lg"
                  style={{ backgroundColor: theme.colors.secondary }}
                />
                <div
                  className="ml-auto h-6 w-3/4 rounded-lg"
                  style={{ backgroundColor: theme.colors.primary }}
                />
              </div>
            )}
            {theme.category === 'forum' && (
              <div className="w-full space-y-1">
                <div
                  className="h-3 w-full rounded"
                  style={{ backgroundColor: theme.colors.primary }}
                />
                <div
                  className="h-2 w-full rounded"
                  style={{ backgroundColor: theme.colors.text, opacity: 0.6 }}
                />
                <div
                  className="h-2 w-2/3 rounded"
                  style={{ backgroundColor: theme.colors.text, opacity: 0.4 }}
                />
              </div>
            )}
            {theme.category === 'app' && (
              <div className="h-full w-full" style={{ backgroundColor: theme.colors.background }}>
                <div className="h-6 w-full" style={{ backgroundColor: theme.colors.secondary }} />
              </div>
            )}
          </div>

          {/* Premium Badge */}
          {theme.isPremium && (
            <div className="absolute right-2 top-2 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 px-2 py-0.5 text-xs font-bold text-white">
              PREMIUM
            </div>
          )}
        </div>

        {/* Theme Name */}
        <h4 className="mb-1 text-sm font-semibold text-white">{theme.name}</h4>

        {/* Theme Description */}
        <p className="mb-3 line-clamp-2 text-xs text-white/60">{theme.description}</p>

        {/* Color Palette */}
        <div className="mb-3 flex gap-1">
          {Object.values(theme.colors)
            .slice(0, 5)
            .map((color, i) => (
              <div
                key={i}
                className="h-4 w-4 rounded-full ring-1 ring-white/20"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
        </div>

        {/* Status / Action */}
        {theme.unlocked ? (
          isActive ? (
            <div className="flex items-center justify-center gap-2 rounded-lg border border-green-500/30 bg-green-500/20 px-4 py-2">
              <CheckCircleIconSolid className="h-5 w-5 text-green-400" />
              <span className="text-sm font-medium text-green-400">Active</span>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onApply();
              }}
              className="w-full rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
            >
              Apply Theme
            </button>
          )
        ) : isPreviewing ? (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/20 px-4 py-2">
            <EyeIcon className="h-5 w-5 text-yellow-400" />
            <span className="text-sm font-medium text-yellow-400">Previewing</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2">
            <EyeIcon className="h-5 w-5 text-white/40" />
            <span className="text-sm text-white/60">Click to preview</span>
          </div>
        )}

        {/* Unlock requirement hint for locked items */}
        {!theme.unlocked && !isPreviewing && (
          <div className="mt-2 text-center text-xs text-white/40">🔒 {theme.unlockRequirement}</div>
        )}
      </GlassCard>
    </motion.div>
  );
}
