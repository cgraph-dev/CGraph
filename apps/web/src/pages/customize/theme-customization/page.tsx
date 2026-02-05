import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  NewspaperIcon,
  Squares2X2Icon,
  SparklesIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
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
import ProfileThemeCard, {
  ProfileThemeGrid,
} from '@/modules/settings/components/customize/ProfileThemeCard';

import type { ThemeCategory, Theme } from './types';
import { MOCK_THEMES } from './constants';
import { ThemeCard } from './ThemeCard';

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
