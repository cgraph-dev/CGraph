/**
 * GhostModeIndicator
 *
 * Displays a countdown timer when ghost mode is active.
 * Messages will auto-delete when the timer reaches zero.
 *
 * @module components/secret-chat/ghost-mode-indicator
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { SecretThemeColors } from '@/screens/secret-chat/theme-colors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GhostModeIndicatorProps {
  readonly seconds: number;
  readonly themeColors: SecretThemeColors;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCountdown(totalSeconds: number): string {
  if (totalSeconds <= 0) return '0s';

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GhostModeIndicator({ seconds, themeColors }: GhostModeIndicatorProps) {
  const timeStr = useMemo(() => formatCountdown(seconds), [seconds]);
  const isUrgent = seconds <= 10;

  return (
    <View style={[styles.container, { backgroundColor: `${themeColors.accent}18` }]}>
      <Ionicons
        name="timer-outline"
        size={14}
        color={isUrgent ? '#dc2626' : themeColors.accent}
      />
      <Text
        style={[
          styles.label,
          { color: isUrgent ? '#dc2626' : themeColors.accent },
        ]}
      >
        Ghost Mode
      </Text>
      <Text
        style={[
          styles.timer,
          { color: isUrgent ? '#dc2626' : themeColors.text },
          isUrgent && styles.timerUrgent,
        ]}
      >
        {timeStr}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  timer: {
    fontSize: 12,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  timerUrgent: {
    fontWeight: '700',
  },
});
