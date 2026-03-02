/**
 * LevelGate Component — Mobile Progressive Disclosure
 *
 * React Native wrapper that renders children when the feature is unlocked,
 * or a locked overlay with level requirement and progress bar when the
 * user hasn't reached the required level.
 *
 * Uses Animated API for smooth transitions and expo-haptics for
 * tactile feedback on unlock.
 *
 * @module components/gamification/level-gate
 * @since v0.9.31
 */

import React, { useEffect, useRef, useMemo, type ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/stores';
import { useGamificationStore } from '@/stores';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import {
  FEATURE_REQUIREMENTS,
  FEATURE_DISPLAY_NAMES,
  type FeatureGateKey,
} from '@cgraph/shared-types';

// ── Types ──────────────────────────────────────────────────────────────

export interface LevelGateResult {
  /** Whether the feature is unlocked for the current user */
  unlocked: boolean;
  /** The level required to unlock this feature */
  requiredLevel: number;
  /** The user's current level */
  currentLevel: number;
  /** Progress toward unlocking (0–100) */
  progressPercent: number;
  /** Human-readable feature display name */
  featureName: string;
}

export interface LevelGateProps {
  /** The feature to gate */
  feature: FeatureGateKey;
  /** Content to render when unlocked */
  children: ReactNode;
  /** Custom locked state (replaces default) */
  fallback?: ReactNode;
  /** Show blurred preview of locked content */
  showPreview?: boolean;
  /** Compact mode for inline usage */
  compact?: boolean;
}

// ── Hook ───────────────────────────────────────────────────────────────

/**
 * Mobile hook that checks if a feature is unlocked based on user level.
 * Mirrors the web useLevelGate hook using the mobile gamification store.
 */
export function useLevelGate(feature: FeatureGateKey): LevelGateResult {
  const level = useGamificationStore((s) => s.level);

  return useMemo(() => {
    const requiredLevel = FEATURE_REQUIREMENTS[feature] ?? 1;
    const unlocked = level >= requiredLevel;
    const progressPercent = unlocked
      ? 100
      : Math.min(Math.round((level / requiredLevel) * 100), 99);
    const featureName = FEATURE_DISPLAY_NAMES[feature] ?? feature;

    return {
      unlocked,
      requiredLevel,
      currentLevel: level,
      progressPercent,
      featureName,
    };
  }, [feature, level]);
}

// ── Component ──────────────────────────────────────────────────────────

/**
 * Progressive disclosure gate component for React Native.
 *
 * Renders children if the user's level meets the feature requirement.
 * Otherwise shows a locked overlay with level info and animated progress bar.
 *
 * @example
 * ```tsx
 * <LevelGate feature="marketplace">
 *   <MarketplaceScreen />
 * </LevelGate>
 * ```
 */
export default function LevelGate({
  feature,
  children,
  fallback,
  showPreview = false,
  compact = false,
}: LevelGateProps) {
  const { colors } = useThemeStore();
  const {
    unlocked,
    requiredLevel,
    currentLevel,
    progressPercent,
    featureName,
  } = useLevelGate(feature);

  // ── Animations ─────────────────────────────────────────────────────

  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const prevUnlocked = useRef(unlocked);

  useEffect(() => {
    // Entrance animation for locked overlay
    if (!unlocked) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(progressAnim, {
          toValue: progressPercent,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [unlocked, progressPercent, scaleAnim, opacityAnim, progressAnim]);

  // Unlock animation: scale bounce + haptic
  useEffect(() => {
    if (unlocked && !prevUnlocked.current) {
      HapticFeedback.success();
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.15,
          friction: 4,
          tension: 120,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();
    }
    prevUnlocked.current = unlocked;
  }, [unlocked, scaleAnim]);

  // ── Render ─────────────────────────────────────────────────────────

  if (unlocked) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {/* Blurred preview of locked content */}
      {showPreview && (
        <View style={styles.previewContainer}>
          {children}
          <BlurView
            intensity={25}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
        </View>
      )}

      {/* Locked overlay */}
      <Animated.View
        style={[
          styles.overlay,
          {
            backgroundColor: colors.surface,
            opacity: showPreview ? opacityAnim : 1,
            transform: [{ scale: scaleAnim }],
          },
          showPreview && styles.overlayTransparent,
        ]}
        accessibilityRole="alert"
        accessibilityLabel={`Feature locked: ${featureName}. Reach Level ${requiredLevel} to unlock.`}
      >
        {/* Lock Icon */}
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: `${colors.primary}20` },
          ]}
        >
          <Ionicons
            name="lock-closed"
            size={compact ? 24 : 36}
            color={colors.primary}
          />
        </View>

        {/* Title */}
        <Text
          style={[
            styles.title,
            compact && styles.titleCompact,
            { color: colors.text },
          ]}
        >
          Reach Level {requiredLevel} to unlock
        </Text>

        {/* Feature Name */}
        <Text
          style={[
            styles.featureName,
            { color: colors.textSecondary },
          ]}
        >
          {featureName}
        </Text>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressTrack,
              { backgroundColor: `${colors.primary}20` },
            ]}
          >
            <Animated.View
              style={[
                styles.progressFill,
                {
                  backgroundColor: colors.primary,
                  width: progressWidth,
                },
              ]}
            />
          </View>
          <Text
            style={[
              styles.progressText,
              { color: colors.textSecondary },
            ]}
          >
            Level {currentLevel} / {requiredLevel}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  containerCompact: {
    minHeight: 120,
  },
  previewContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  overlay: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    borderRadius: 16,
    marginHorizontal: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  overlayTransparent: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  titleCompact: {
    fontSize: 14,
  },
  featureName: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 20,
  },
  progressContainer: {
    width: '100%',
    maxWidth: 240,
    alignItems: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
