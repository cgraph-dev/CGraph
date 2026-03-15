/**
 * PlatformAdapter - Cross-Platform Parity Layer
 *
 * Features:
 * - Unified haptics API
 * - Platform-agnostic icons
 * - Unified bottom sheets
 * - Cross-platform navigation
 * - Consistent styling helpers
 */

import { Platform, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

import { iosFeatures, IOSCapabilities } from './ios/ios-features';
import { androidFeatures, AndroidCapabilities } from './android/android-features';

// ============================================================================
// Types
// ============================================================================

export type PlatformType = 'ios' | 'android' | 'web' | 'unknown';

export interface UnifiedCapabilities {
  platform: PlatformType;
  version: number;

  // Feature support
  supportsBlur: boolean;
  supportsHaptics: boolean;
  supportsHighRefreshRate: boolean;
  supportsContextMenus: boolean;
  supportsDynamicColors: boolean;

  // Platform-specific
  ios?: IOSCapabilities;
  android?: AndroidCapabilities;
}

export type HapticType =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'soft'
  | 'rigid'
  | 'success'
  | 'warning'
  | 'error'
  | 'selection';

export interface UnifiedIconConfig {
  ios: string; // SF Symbol name
  android: string; // Material icon name
  fallback: string; // Ionicons name
}

export interface BottomSheetConfig {
  height: number | string;
  snapPoints?: (number | string)[];
  dismissible?: boolean;
  handleVisible?: boolean;
}

// ============================================================================
// Platform Detection
// ============================================================================

/**
 * Gets platform.
 *
 */
export function getPlatform(): PlatformType {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  if (Platform.OS === 'web') return 'web';
  return 'unknown';
}

/**
 * Checks if i o s.
 *
 */
export function isIOS(): boolean {
  return Platform.OS === 'ios';
}

/**
 * Checks if android.
 *
 */
export function isAndroid(): boolean {
  return Platform.OS === 'android';
}

/**
 * Checks if web.
 *
 */
export function isWeb(): boolean {
  return Platform.OS === 'web';
}

/**
 * Gets platform version.
 *
 */
export function getPlatformVersion(): number {
  if (typeof Platform.Version === 'number') {
    return Platform.Version;
  }
  return parseFloat(String(Platform.Version)) || 0;
}

// ============================================================================
// Unified Capabilities
// ============================================================================

class PlatformAdapterManager {
  private capabilities: UnifiedCapabilities | null = null;

  /**
   * Initialize platform adapter
   */
  initialize(): UnifiedCapabilities {
    if (this.capabilities) {
      return this.capabilities;
    }

    const platform = getPlatform();
    const version = getPlatformVersion();

    let supportsBlur = false;
    let supportsHaptics = false;
    let supportsHighRefreshRate = false;
    let supportsContextMenus = false;
    let supportsDynamicColors = false;

    let ios: IOSCapabilities | undefined;
    let android: AndroidCapabilities | undefined;

    if (platform === 'ios') {
      ios = iosFeatures.initialize();
      supportsBlur = version >= 13;
      supportsHaptics = true;
      supportsHighRefreshRate = ios.supportsDynamicIsland; // ProMotion devices
      supportsContextMenus = ios.supportsContextMenus;
      supportsDynamicColors = false; // iOS doesn't have Material You
    } else if (platform === 'android') {
      android = androidFeatures.initialize();
      supportsBlur = android.supportsNativeBlur;
      supportsHaptics = true;
      supportsHighRefreshRate = version >= 11; // Android 11+
      supportsContextMenus = true;
      supportsDynamicColors = android.supportsMaterialYou;
    }

    this.capabilities = {
      platform,
      version,
      supportsBlur,
      supportsHaptics,
      supportsHighRefreshRate,
      supportsContextMenus,
      supportsDynamicColors,
      ios,
      android,
    };

    return this.capabilities;
  }

  /**
   * Get unified capabilities
   */
  getCapabilities(): UnifiedCapabilities {
    if (!this.capabilities) {
      return this.initialize();
    }
    return this.capabilities;
  }

  // ============================================================================
  // Unified Haptics
  // ============================================================================

  /**
   * Trigger unified haptic feedback
   */
  async haptic(type: HapticType): Promise<void> {
    const caps = this.getCapabilities();
    if (!caps.supportsHaptics) return;

    try {
      switch (type) {
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'soft':
          if (isIOS()) {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
          } else {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          break;
        case 'rigid':
          if (isIOS()) {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
          } else {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          }
          break;
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'error':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        case 'selection':
          await Haptics.selectionAsync();
          break;
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.debug('[Platform] Haptic error:', error);
    }
  }

  // ============================================================================
  // Unified Icons
  // ============================================================================

  /**
   * Get platform-appropriate icon name
   */
  getIconName(config: UnifiedIconConfig): string {
    const platform = getPlatform();

    if (platform === 'ios' && iosFeatures.hasSFSymbols()) {
      return config.ios;
    }

    if (platform === 'android') {
      return config.android;
    }

    return config.fallback;
  }

  /**
   * Get icon library to use
   */
  getIconLibrary(): 'sf-symbols' | 'material' | 'ionicons' {
    const platform = getPlatform();

    if (platform === 'ios' && iosFeatures.hasSFSymbols()) {
      return 'sf-symbols';
    }

    if (platform === 'android') {
      return 'material';
    }

    return 'ionicons';
  }

  // ============================================================================
  // Platform-Specific Styles
  // ============================================================================

  /**
   * Get platform-specific shadow style
   */
  getShadowStyle(elevation: number = 4): ViewStyle {
    if (isIOS()) {
      return {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: elevation / 2 },
        shadowOpacity: 0.1 + elevation * 0.02,
        shadowRadius: elevation,
      };
    }

    return {
      elevation,
    };
  }

  /**
   * Get platform-specific border radius
   */
  getBorderRadius(size: 'sm' | 'md' | 'lg' | 'xl' | 'full'): number {
    const radiusMap = {
      sm: isIOS() ? 8 : 4,
      md: isIOS() ? 12 : 8,
      lg: isIOS() ? 16 : 12,
      xl: isIOS() ? 24 : 16,
      full: 9999,
    };

    return radiusMap[size];
  }

  /**
   * Get platform-specific font
   */
  getFontFamily(weight: 'regular' | 'medium' | 'semibold' | 'bold' = 'regular'): string {
    if (isIOS()) {
      switch (weight) {
        case 'medium':
          return 'System';
        case 'semibold':
          return 'System';
        case 'bold':
          return 'System';
        default:
          return 'System';
      }
    }

    // Android uses Roboto by default
    return 'Roboto';
  }

  /**
   * Get system colors
   */
  getSystemColors(): {
    primary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
  } {
    const caps = this.getCapabilities();

    if (caps.android?.supportsMaterialYou) {
      const colors = androidFeatures.getMaterialYouColors();
      return {
        primary: colors.primary,
        background: colors.background,
        surface: colors.surface,
        text: colors.onBackground,
        textSecondary: colors.onSurfaceVariant,
      };
    }

    // Default dark theme colors
    return {
      primary: '#10b981',
      background: '#111827',
      surface: '#1f2937',
      text: '#f9fafb',
      textSecondary: '#9ca3af',
    };
  }

  // ============================================================================
  // Safe Area
  // ============================================================================

  /**
   * Get safe area insets for Dynamic Island or notch
   */
  getTopSafeAreaInset(): number {
    if (isIOS() && iosFeatures.hasDynamicIsland()) {
      return iosFeatures.getDynamicIslandInset();
    }

    // Default notch handling is done via SafeAreaView
    return 0;
  }

  // ============================================================================
  // Navigation Helpers
  // ============================================================================

  /**
   * Get back gesture configuration
   */
  getBackGestureConfig(): { enabled: boolean; fullWidth: boolean } {
    if (isIOS()) {
      return { enabled: true, fullWidth: false }; // iOS edge swipe
    }

    if (isAndroid() && androidFeatures.supportsPredictiveBack()) {
      return { enabled: true, fullWidth: true }; // Android predictive back
    }

    return { enabled: true, fullWidth: false };
  }

  /**
   * Check if should use native header
   */
  shouldUseNativeHeader(): boolean {
    // Use native headers on iOS for better integration
    return isIOS();
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const platformAdapter = new PlatformAdapterManager();

// ============================================================================
// React Hooks
// ============================================================================

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for platform capabilities.
 *
 */
export function usePlatformCapabilities(): UnifiedCapabilities {
  const [capabilities, setCapabilities] = useState<UnifiedCapabilities>(() =>
    platformAdapter.getCapabilities()
  );

  useEffect(() => {
    setCapabilities(platformAdapter.initialize());
  }, []);

  return capabilities;
}

/**
 * Hook for unified haptic.
 *
 */
export function useUnifiedHaptic(): (type: HapticType) => Promise<void> {
  return useCallback((type: HapticType) => platformAdapter.haptic(type), []);
}

/**
 * Hook for system colors.
 *
 */
export function useSystemColors(): ReturnType<typeof platformAdapter.getSystemColors> {
  const [colors, setColors] = useState(() => platformAdapter.getSystemColors());

  useEffect(() => {
    // Refresh colors when theme changes

     
    const { Appearance } = require('react-native');
    const listener = Appearance.addChangeListener(() => {
      setColors(platformAdapter.getSystemColors());
    });

    return () => listener.remove();
  }, []);

  return colors;
}

/**
 * Hook for platform styles.
 *
 */
export function usePlatformStyles(): {
  shadow: (elevation?: number) => ViewStyle;
  borderRadius: (size: 'sm' | 'md' | 'lg' | 'xl' | 'full') => number;
  fontFamily: (weight?: 'regular' | 'medium' | 'semibold' | 'bold') => string;
} {
  return {
    shadow: (elevation = 4) => platformAdapter.getShadowStyle(elevation),
    borderRadius: (size) => platformAdapter.getBorderRadius(size),
    fontFamily: (weight = 'regular') => platformAdapter.getFontFamily(weight),
  };
}

// ============================================================================
// Platform-Specific Components Wrapper
// ============================================================================

/**
 * Select platform.
 *
 */
export function selectPlatform<T>(options: { ios?: T; android?: T; default: T }): T {
  if (isIOS() && options.ios !== undefined) {
    return options.ios;
  }

  if (isAndroid() && options.android !== undefined) {
    return options.android;
  }

  return options.default;
}

// ============================================================================
// Exports
// ============================================================================

export { iosFeatures } from './ios/ios-features';
export { androidFeatures } from './android/android-features';

export default platformAdapter;
