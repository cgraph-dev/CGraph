/**
 * Admin Settings & Keyboard Shortcuts Hooks
 *
 * Hooks for system settings management and keyboard navigation.
 *
 * @module modules/admin/hooks/useAdminSettings
 */

import { useCallback, useEffect, useMemo } from 'react';
import { useAdminStore } from '../store';

/**
 * Hook for system settings management
 */
export function useAdminSettings() {
  const { systemSettings, isLoading, error, fetchSettings, updateSetting } = useAdminStore();

  // Fetch settings on mount
  useEffect(() => {
    if (systemSettings.length === 0) {
      fetchSettings();
    }
  }, [systemSettings.length, fetchSettings]);

  // Group settings by category
  const settingsByCategory = useMemo(() => {
    return systemSettings.reduce(
      (acc, setting) => {
        const category = setting.category ?? 'uncategorized';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(setting);
        return acc;
      },
      {} as Record<string, typeof systemSettings> // type assertion: initial empty record type
    );
  }, [systemSettings]);

  const categories = useMemo(() => Object.keys(settingsByCategory), [settingsByCategory]);

  const getSetting = useCallback(
    (key: string) => {
      return systemSettings.find((s) => s.key === key);
    },
    [systemSettings]
  );

  const update = useCallback(
    async (key: string, value: string | number | boolean) => {
      await updateSetting(key, value);
    },
    [updateSetting]
  );

  return {
    settings: systemSettings,
    settingsByCategory,
    categories,
    isLoading,
    error,
    refresh: fetchSettings,
    getSetting,
    update,
  };
}

/**
 * Hook for keyboard shortcuts in admin panel
 */
export function useAdminKeyboardShortcuts() {
  const { setActiveTab, toggleSidebar } = useAdminStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger with Cmd/Ctrl
      if (!(e.metaKey || e.ctrlKey)) return;

      switch (e.key) {
        case '1':
          e.preventDefault();
          setActiveTab('dashboard');
          break;
        case '2':
          e.preventDefault();
          setActiveTab('events');
          break;
        case '3':
          e.preventDefault();
          setActiveTab('marketplace');
          break;
        case '4':
          e.preventDefault();
          setActiveTab('users');
          break;
        case '5':
          e.preventDefault();
          setActiveTab('analytics');
          break;
        case '6':
          e.preventDefault();
          setActiveTab('settings');
          break;
        case 'b':
          e.preventDefault();
          toggleSidebar();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTab, toggleSidebar]);
}
