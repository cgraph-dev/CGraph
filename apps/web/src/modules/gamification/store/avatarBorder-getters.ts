/**
 * Computed getter factories for the avatar border store.
 * @module modules/gamification/store/avatarBorder-getters
 */
import type { BorderTheme } from '@/types/avatar-borders';
import type { AvatarBorderState } from './avatarBorder-types';

/**
 * Avatar Border Store — Computed Getter Factories
 *
 * Each function receives `get` (Zustand getter) and returns the getter implementation.
 */

type GetState = () => AvatarBorderState;

/**
 * unknown for the gamification module.
 */
/**
 * Creates a new get equipped border.
 *
 * @param get - The get.
 * @returns The newly created instance.
 */
export function createGetEquippedBorder(get: GetState) {
  return () => {
    const { allBorders, preferences } = get();
    return allBorders.find((b) => b.id === preferences.equippedBorderId);
  };
}

/**
 * unknown for the gamification module.
 */
/**
 * Creates a new get display border.
 *
 * @param get - The get.
 * @returns The newly created instance.
 */
export function createGetDisplayBorder(get: GetState) {
  return () => {
    const { allBorders, previewBorderId, preferences } = get();
    const displayId = previewBorderId ?? preferences.equippedBorderId;
    return allBorders.find((b) => b.id === displayId);
  };
}

/**
 * unknown for the gamification module.
 */
/**
 * Creates a new is border unlocked.
 *
 * @param get - The get.
 * @returns The newly created instance.
 */
export function createIsBorderUnlocked(get: GetState) {
  return (borderId: string) => {
    const { unlockedBorders, allBorders } = get();
    const border = allBorders.find((b) => b.id === borderId);
    if (!border) return false;
    // Default borders are always unlocked (free tier)
    if (border.unlockType === 'default' || border.rarity === 'free') return true;
    return unlockedBorders.some((u) => u.borderId === borderId);
  };
}

/**
 * unknown for the gamification module.
 */
/**
 * Creates a new get filtered borders.
 *
 * @param get - The get.
 * @returns The newly created instance.
 */
export function createGetFilteredBorders(get: GetState) {
  return () => {
    const { allBorders, filters, isBorderUnlocked } = get();
    return allBorders.filter((border) => {
      // Theme filter
      if (filters.theme !== 'all' && border.theme !== filters.theme) return false;
      // Rarity filter
      if (filters.rarity !== 'all' && border.rarity !== filters.rarity) return false;
      // Locked filter
      if (!filters.showLocked && !isBorderUnlocked(border.id)) return false;
      // Search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        return (
          border.name.toLowerCase().includes(query) ||
          border.description.toLowerCase().includes(query) ||
          border.theme.toLowerCase().includes(query)
        );
      }
      return true;
    });
  };
}

/**
 * unknown for the gamification module.
 */
/**
 * Creates a new get borders by theme.
 *
 * @param get - The get.
 * @returns The newly created instance.
 */
export function createGetBordersByTheme(get: GetState) {
  return (theme: BorderTheme) => {
    const { allBorders } = get();
    return allBorders.filter((b) => b.theme === theme);
  };
}

/**
 * unknown for the gamification module.
 */
/**
 * Creates a new get free borders.
 *
 * @param get - The get.
 * @returns The newly created instance.
 */
export function createGetFreeBorders(get: GetState) {
  return () => {
    const { allBorders } = get();
    return allBorders.filter((b) => b.unlockType === 'default' || b.rarity === 'free');
  };
}

/**
 * unknown for the gamification module.
 */
/**
 * Creates a new get theme unlock counts.
 *
 * @param get - The get.
 * @returns The newly created instance.
 */
export function createGetThemeUnlockCounts(get: GetState) {
  return () => {
    const { allBorders, isBorderUnlocked } = get();
    const counts: Record<string, { unlocked: number; total: number }> = {};

    allBorders.forEach((border) => {
      if (!counts[border.theme]) {
        counts[border.theme] = { unlocked: 0, total: 0 };
      }
      const themeCount = counts[border.theme];
      if (themeCount) {
        themeCount.total++;
        if (isBorderUnlocked(border.id)) {
          themeCount.unlocked++;
        }
      }
    });

    return counts as Record<BorderTheme, { unlocked: number; total: number }>; // type assertion: reduce accumulator type
  };
}
