/**
 * Custom hooks for ThemeCustomization
 * @module pages/customize/theme-customization
 */

import { durations } from '@cgraph/animation-constants';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuthStore } from '@/modules/auth/store';
import { useCustomizationStore } from '@/modules/settings/store/customization';
import toast from 'react-hot-toast';
import {
  ALL_PROFILE_THEMES,
  getThemesByCategory,
  type ProfileThemeConfig,
  type ProfileThemeCategory,
} from '@/data/profileThemes';

import type { ThemeCategory } from './types';

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
  } = store;

  const [activeCategory, setActiveCategory] = useState<ThemeCategory>('profile');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewingTheme, setPreviewingTheme] = useState<string | null>(null);
  const [profileThemeCategory, setProfileThemeCategory] = useState<ProfileThemeCategory | 'all'>(
    'all'
  );

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

  // Filter profile themes by search
  const filteredNewProfileThemes = useMemo(() => {
    if (!searchQuery) return newProfileThemes;
    return newProfileThemes.filter(
      (theme) =>
        theme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        theme.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [newProfileThemes, searchQuery]);

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
    (themeId: string) => {
      return selectedThemes.profile === themeId;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- selectedThemes is derived from store values
    [profileTheme]
  );

  const isThemePreviewing = useCallback(
    (themeId: string) => {
      return previewingTheme === themeId;
    },
    [previewingTheme]
  );

  const handleApplyProfileTheme = useCallback(
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
    profileThemeCategory,
    setProfileThemeCategory,
    selectedThemes,
    isSaving,
    error,

    // Derived data
    filteredNewProfileThemes,

    // Handlers
    handleSaveThemes,
    isThemeActive,
    isThemePreviewing,
    handleApplyProfileTheme,
  };
}
