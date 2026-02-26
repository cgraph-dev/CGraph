/**
 * StreakDisplay Component (Mobile)
 *
 * Mobile-optimized streak tracking display matching web StreakTracker.
 * Features:
 * - Compact design for mobile
 * - Animated fire icon
 * - Weekly progress dots
 * - Milestone celebrations
 */

import { durations } from '@cgraph/animation-constants';
import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import GlassCard from '../ui/glass-card';

export interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  todayCompleted: boolean;
  weekProgress: boolean[];
  nextMilestone?: number;
  variant?: 'default' | 'compact' | 'widget';
  onClaim?: () => void;
}

const MILESTONE_REWARDS = [
  { days: 7, label: '1 Week', coins: 100 },
  { days: 30, label: '1 Month', coins: 500 },
  { days: 100, label: '100 Days', coins: 2000 },
  { days: 365, label: '1 Year', coins: 10000 },
];

/**
 *
 */
export function StreakDisplay({
  currentStreak,
  longestStreak,
  todayCompleted,
  weekProgress = [],
  nextMilestone,
  variant = 'default',
  onClaim,
}: StreakDisplayProps): React.ReactElement {
  const fireAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Fire animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(fireAnim, {
          toValue: 1.2,
          duration: durations.slower.ms,
          useNativeDriver: true,
        }),
        Animated.timing(fireAnim, {
          toValue: 1,
          duration: durations.slower.ms,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Pulse animation for claim button
    if (!todayCompleted) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: durations.verySlow.ms,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: durations.verySlow.ms,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [todayCompleted]);

  const handleClaim = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClaim?.();
  };

  const getNextMilestone = () => {
    return MILESTONE_REWARDS.find((m) => m.days > currentStreak);
  };

  const milestone = getNextMilestone();
  const progressToMilestone = milestone 
    ? (currentStreak / milestone.days) * 100 
    : 100;

  if (variant === 'compact') {
    return (
      <GlassCard style={styles.compactContainer}>
        <View style={styles.compactContent}>
          <Animated.View style={{ transform: [{ scale: fireAnim }] }}>
            <MaterialCommunityIcons 
              name="fire" 
              size={24} 
              color={currentStreak > 0 ? '#F97316' : '#6B7280'} 
            />
          </Animated.View>
          <Text style={styles.compactStreak}>{currentStreak}</Text>
          <Text style={styles.compactLabel}>day streak</Text>
        </View>
      </GlassCard>
    );
  }

  if (variant === 'widget') {
    return (
      <LinearGradient
        colors={['#1F2937', '#111827']}
        style={styles.widgetContainer}
      >
        <View style={styles.widgetHeader}>
          <Animated.View style={{ transform: [{ scale: fireAnim }] }}>
            <MaterialCommunityIcons name="fire" size={32} color="#F97316" />
          </Animated.View>
          <View>
            <Text style={styles.widgetStreak}>{currentStreak}</Text>
            <Text style={styles.widgetLabel}>Day Streak</Text>
          </View>
        </View>
        
        {/* Week dots */}
        <View style={styles.weekDots}>
          {weekProgress.map((completed, index) => (
            <View
              key={index}
              style={[
                styles.dayDot,
                completed ? styles.dayDotCompleted : styles.dayDotPending,
              ]}
            />
          ))}
        </View>
      </LinearGradient>
    );
  }

  // Default variant
  return (
    <GlassCard style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.streakInfo}>
          <Animated.View style={{ transform: [{ scale: fireAnim }] }}>
            <MaterialCommunityIcons 
              name="fire" 
              size={48} 
              color={currentStreak > 0 ? '#F97316' : '#6B7280'} 
            />
          </Animated.View>
          <View>
            <Text style={styles.streakNumber}>{currentStreak}</Text>
            <Text style={styles.streakLabel}>Day Streak</Text>
          </View>
        </View>
        
        <View style={styles.longestStreak}>
          <Text style={styles.longestLabel}>Best</Text>
          <Text style={styles.longestNumber}>{longestStreak}</Text>
        </View>
      </View>

      {/* Weekly Progress */}
      <View style={styles.weekSection}>
        <Text style={styles.weekTitle}>This Week</Text>
        <View style={styles.weekDays}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
            <View key={index} style={styles.dayColumn}>
              <Text style={styles.dayLabel}>{day}</Text>
              <View
                style={[
                  styles.dayIndicator,
                  weekProgress[index] 
                    ? styles.dayIndicatorCompleted 
                    : index === weekProgress.length 
                      ? styles.dayIndicatorCurrent
                      : styles.dayIndicatorPending,
                ]}
              >
                {weekProgress[index] && (
                  <MaterialCommunityIcons name="check" size={12} color="#10B981" />
                )}
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Milestone Progress */}
      {milestone && (
        <View style={styles.milestoneSection}>
          <View style={styles.milestoneHeader}>
            <Text style={styles.milestoneLabel}>
              Next: {milestone.label}
            </Text>
            <Text style={styles.milestoneReward}>
              🪙 {milestone.coins}
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { width: `${progressToMilestone}%` },
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {currentStreak} / {milestone.days} days
          </Text>
        </View>
      )}

      {/* Claim Button */}
      {!todayCompleted && onClaim && (
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Pressable onPress={handleClaim} style={styles.claimButton}>
            <LinearGradient
              colors={['#F97316', '#EA580C']}
              style={styles.claimGradient}
            >
              <Text style={styles.claimText}>Claim Today's Reward</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      )}

      {todayCompleted && (
        <View style={styles.completedBadge}>
          <MaterialCommunityIcons name="check-circle" size={20} color="#10B981" />
          <Text style={styles.completedText}>Today's streak claimed!</Text>
        </View>
      )}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  compactContainer: {
    padding: 12,
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactStreak: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  compactLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  widgetContainer: {
    padding: 16,
    borderRadius: 16,
  },
  widgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  widgetStreak: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  widgetLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  weekDots: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  dayDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dayDotCompleted: {
    backgroundColor: '#F97316',
  },
  dayDotPending: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  streakInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streakNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  streakLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  longestStreak: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  longestLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  longestNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F97316',
  },
  weekSection: {
    marginBottom: 20,
  },
  weekTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 12,
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  dayColumn: {
    alignItems: 'center',
    gap: 8,
  },
  dayLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  dayIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayIndicatorCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  dayIndicatorCurrent: {
    backgroundColor: 'rgba(249, 115, 22, 0.2)',
    borderWidth: 2,
    borderColor: '#F97316',
  },
  dayIndicatorPending: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  milestoneSection: {
    marginBottom: 16,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  milestoneLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  milestoneReward: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F97316',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'right',
  },
  claimButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  claimGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  claimText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
  },
  completedText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
});

export default StreakDisplay;
