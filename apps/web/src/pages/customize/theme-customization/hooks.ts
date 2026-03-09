/**
 * Custom hooks for ThemeCustomization
 * @module pages/customize/theme-customization
 */

import { durations } from '@cgraph/animation-constants';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuthStore } from '@/modules/auth/store';
import { useCustomizationStore, getThemePreset } from '@/modules/settings/store/customization';
import toast from 'react-hot-toast';
import {
  ALL_PROFILE_THEMES,
  getThemesByCategory,
  type ProfileThemeConfig,
  type ProfileThemeCategory,
} from '@/data/profileThemes';
// TODO(phase-26): Rewire — gamification stores deleted
const fetchThemes = async (): Promise<unknown[]> => [];

import type { ThemeCategory, Theme } from './types';

/**
 * unknown for the customize module.
 */
/**
 * Hook for managing theme customization.
 */
export function useThemeCustomization() {
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
  const [previewingTheme, setPreviewingTheme] = useState<string | null>(null);
  const [profileThemeCategory, setProfileThemeCategory] = useState<ProfileThemeCategory | 'all'>(
    'all'
  );
  const [useNewProfileThemes, setUseNewProfileThemes] = useState(true);

  // Themes fetched from API
  const [themes, setThemes] = useState<Theme[]>([]);
  const [isLoadingThemes, setIsLoadingThemes] = useState(true);

  // Fetch themes from API
  useEffect(() => {
    let cancelled = false;
    setIsLoadingThemes(true);
    fetchThemes()
      .then((data) => {
        if (!cancelled) setThemes(data);
      })
      .catch(() => {
        // Error logged in fetch function
      })
      .finally(() => {
        if (!cancelled) setIsLoadingThemes(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Get profile themes from new data file
  const newProfileThemes = useMemo(() => {
    if (profileThemeCategory === 'all') {
      return ALL_PROFILE_THEMES;
    }
    // Narrowed: 'all' case handled above, so profileThemeCategory is ProfileThemeCategory
    return getThemesByCategory(profileThemeCategory);
  }, [profileThemeCategory]);

  // Fetch customizations on mount
  useEffect(() => {
    if (user?.id) {
      fetchCustomizations(user.id);
    }
  }, [user?.id, fetchCustomizations]);

  // Create selectedThemes object from store state
  const selectedThemes: Record<ThemeCategory, string> = {
    profile: profileTheme ?? 'default',
    chat: chatTheme,
    forum: forumTheme ?? 'forum-default',
    app: appTheme,
  };

  // Filter themes by category and search (from API data)
  const filteredThemes = themes.filter((theme) => {
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

  const handleApplyTheme = useCallback(
    (themeId: string, category: ThemeCategory, theme: Theme) => {
      if (!theme.unlocked) {
        setPreviewingTheme(themeId);
        applyThemeToStore(themeId, category);
        toast('👁️ Previewing theme - Purchase premium to save', {
          icon: '✨',
          duration: durations.cinematic.ms,
        });
        return;
      }

      setPreviewingTheme(null);

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

      applyThemeToStore(themeId, category);
    },
    [applyThemeToStore, updateTheme]
  );

  const handleSaveThemes = useCallback(async () => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

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
  }, [user?.id, previewingTheme, saveCustomizations]);

  const isThemeActive = useCallback(
    (themeId: string, category: ThemeCategory) => {
      return selectedThemes[category] === themeId;
    },
    // selectedThemes is derived from store values that change on each render,
    // so we depend on the individual values instead
    [profileTheme, chatTheme, forumTheme, appTheme]
  );

  const isThemePreviewing = useCallback(
    (themeId: string) => {
      return previewingTheme === themeId;
    },
    [previewingTheme]
  );

  const handleApplyNewProfileTheme = useCallback(
    (theme: ProfileThemeConfig) => {
      const isLocked = theme.tier !== 'free' && !theme.unlocked;

      if (isLocked) {
        setPreviewingTheme(theme.id);
        store.setProfileTheme(theme.id);
        toast('👁️ Previewing theme - Unlock to save', {
          icon: '✨',
          duration: durations.cinematic.ms,
        });
        return;
      }

      setPreviewingTheme(null);
      updateTheme('profileTheme', theme.id);
      store.setProfileTheme(theme.id);
      toast.success(`Applied "${theme.name}" theme!`);
    },
    [updateTheme, store]
  );

  return {
    // State
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    useNewProfileThemes,
    setUseNewProfileThemes,
    profileThemeCategory,
    setProfileThemeCategory,
    selectedThemes,
    isSaving,
    error,

    // Derived data
    filteredThemes,
    filteredNewProfileThemes,

    // Handlers
    handleApplyTheme,
    handleSaveThemes,
    isThemeActive,
    isThemePreviewing,
    handleApplyNewProfileTheme,
    isLoadingThemes,
  };
}
