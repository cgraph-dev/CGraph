/**
 * AchievementNotification Component - Mobile
 *
 * A toast-style notification that celebrates achievement unlocks on mobile.
 * Implements rarity-based styling, particle effects, progress bars,
 * haptic feedback, auto-dismiss, and swipe-to-dismiss gestures.
 *
 * @version 1.0.0
 * @since v0.8.1
 */

import React from 'react';
import { View } from 'react-native';

import type { AchievementNotificationData, Achievement } from './achievement-notification/types';
import { styles } from './achievement-notification/styles';
import { AchievementToast } from './achievement-notification/components/achievement-toast';

export type { AchievementRarity, Achievement, AchievementNotificationData } from './achievement-notification/types';

interface AchievementNotificationProps {
  notifications: AchievementNotificationData[];
  onDismiss: (index: number) => void;
  onViewDetails?: (achievement: Achievement) => void;
}

/**
 *
 */
export default function AchievementNotification({
  notifications,
  onDismiss,
  onViewDetails,
}: AchievementNotificationProps) {
  return (
    <View style={styles.container} pointerEvents="box-none">
      {notifications.map((notification, index) => (
        <AchievementToast
          key={`${notification.achievement.id}-${index}`}
          data={notification}
          index={index}
          onDismiss={() => onDismiss(index)}
          onViewDetails={onViewDetails}
        />
      ))}
    </View>
  );
}
