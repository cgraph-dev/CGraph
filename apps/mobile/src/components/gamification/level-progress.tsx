/**
 * Gamification level-progress widget - Orchestrator.
 * Delegates visual sub-components to ./level-progress/
 * @module components/gamification/level-progress
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { DURATIONS } from '@cgraph/animation-constants';
import { useAuthStore } from '@/stores';
import { AnimationColors, SpringPresets, HapticFeedback } from '@/lib/animations/animation-engine';
import {
  LevelProgressProps,
  XPGainNotification,
  calculateXPForLevel,
  getStreakMultiplier,
  getStreakColor,
} from './level-progress/level-progress-types';
import { FloatingXPBadge } from './level-progress/floating-xp-badge';
import { LevelBadge } from './level-progress/level-badge';
import { StreakIndicator } from './level-progress/streak-indicator';

/**
 *
 */
export default function LevelProgress({
  compact = false,
  showStreak = true,
  showXPGain = true,
  onLevelUp,
  onPress,
}: LevelProgressProps) {
  const { user } = useAuthStore();
  const [expanded, setExpanded] = useState(false);
  const [xpNotifications, setXpNotifications] = useState<XPGainNotification[]>([]);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const expandAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const prevXP = useRef(user?.xp || 0);

  const level = user?.level || 1;
  const currentXP = user?.xp || 0;
  const streak = user?.streak || 0;
  const xpForCurrent = calculateXPForLevel(level);
  const xpForNext = calculateXPForLevel(level + 1);
  const xpInLevel = currentXP - xpForCurrent;
  const xpNeeded = xpForNext - xpForCurrent;
  const progress = Math.min(Math.max(xpInLevel / xpNeeded, 0), 1);
  const streakMultiplier = getStreakMultiplier(streak);

  // Animate progress bar
  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: progress,
      ...SpringPresets.gentle,
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  // Detect XP gain
  useEffect(() => {
    if (showXPGain && currentXP > prevXP.current) {
      const gained = currentXP - prevXP.current;
      const id = Date.now().toString();
      setXpNotifications((prev) => [...prev, { id, amount: gained, timestamp: Date.now() }]);
      HapticFeedback.light();
      // Pulse animation
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: DURATIONS.fast, useNativeDriver: true }),
        Animated.spring(pulseAnim, { toValue: 1, ...SpringPresets.bouncy, useNativeDriver: true }),
      ]).start();
      // Auto-remove notification
      setTimeout(() => {
        setXpNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 2500);
    }
    prevXP.current = currentXP;
  }, [currentXP, showXPGain, pulseAnim]);

  // Detect level up
  useEffect(() => {
    if (level > 1 && progress < 0.1 && currentXP > 0) {
      onLevelUp?.(level);
      HapticFeedback.success();
    }
  }, [level, progress, currentXP, onLevelUp]);

  const toggleExpand = useCallback(() => {
    HapticFeedback.light();
    const next = !expanded;
    setExpanded(next);
    Animated.spring(expandAnim, {
      toValue: next ? 1 : 0,
      ...SpringPresets.gentle,
      useNativeDriver: false,
    }).start();
  }, [expanded, expandAnim]);

  const handlePress = useCallback(() => {
    if (onPress) { onPress(); return; }
    if (!compact) toggleExpand();
  }, [onPress, compact, toggleExpand]);

  const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const expandHeight = expandAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 120] });

  const levelColor = useMemo(() => {
    if (level >= 50) return AnimationColors.legendary;
    if (level >= 30) return AnimationColors.epic;
    if (level >= 15) return AnimationColors.rare;
    return AnimationColors.primary;
  }, [level]);

  if (compact) {
    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <View style={styles.compactContainer}>
          <LevelBadge level={level} color={levelColor} size="small" />
          <View style={styles.compactProgress}>
            <View style={styles.compactTrack}>
              <Animated.View
                style={[styles.compactFill, { width: progressWidth, backgroundColor: levelColor }]}
              />
            </View>
          </View>
          <Text style={styles.compactXP}>{xpInLevel}/{xpNeeded}</Text>
          {showXPGain && xpNotifications.map((n) => (
            <FloatingXPBadge key={n.id} amount={n.amount} />
          ))}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
      <Animated.View style={[styles.container, { transform: [{ scale: pulseAnim }] }]}>
        <BlurView intensity={40} tint="dark" style={styles.blurWrap}>
          <View style={styles.mainRow}>
            <LevelBadge level={level} color={levelColor} size="medium" />
            <View style={styles.progressSection}>
              <View style={styles.labelRow}>
                <Text style={styles.levelLabel}>Level {level}</Text>
                <Text style={styles.xpLabel}>
                  {xpInLevel.toLocaleString()} / {xpNeeded.toLocaleString()} XP
                </Text>
              </View>
              <View style={styles.track}>
                <Animated.View style={[styles.fill, { width: progressWidth }]}>
                  <LinearGradient
                    colors={[levelColor, `${levelColor}99`]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                </Animated.View>
              </View>
            </View>
            {showStreak && streak > 0 && (
              <StreakIndicator streak={streak} color={getStreakColor(streak)} multiplier={streakMultiplier} />
            )}
          </View>

          {/* Expandable details */}
          <Animated.View style={[styles.expandable, { height: expandHeight, opacity: expandAnim }]}>          
            <View style={styles.statsRow}>
              <StatItem label="Total XP" value={currentXP.toLocaleString()} icon="flash" color="#fbbf24" />
              <StatItem label="Next Level" value={`${(xpNeeded - xpInLevel).toLocaleString()} XP`} icon="arrow-up" color="#34d399" />
              {streak > 0 && (
                <StatItem label="Multiplier" value={`${streakMultiplier}x`} icon="flame" color={getStreakColor(streak)} />
              )}
            </View>
          </Animated.View>
        </BlurView>

        {/* Floating XP badges */}
        {showXPGain && xpNotifications.map((n) => (
          <FloatingXPBadge key={n.id} amount={n.amount} />
        ))}
      </Animated.View>
    </TouchableOpacity>
  );
}

/* Small stat card used in expanded view */
function StatItem({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) {
  return (
    <View style={styles.statItem}>
      <Ionicons name={icon as never} size={16} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  /* Compact variant */
  compactContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  compactProgress: { flex: 1 },
  compactTrack: {
    height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden',
  },
  compactFill: { height: '100%', borderRadius: 2 },
  compactXP: { fontSize: 11, color: '#9ca3af', fontVariant: ['tabular-nums'] },

  /* Full variant */
  container: { marginHorizontal: 16, marginVertical: 8, borderRadius: 16, overflow: 'hidden' },
  blurWrap: {
    padding: 16, borderRadius: 16, overflow: 'hidden',
    backgroundColor: 'rgba(17,24,39,0.6)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  mainRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  progressSection: { flex: 1 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  levelLabel: { fontSize: 14, fontWeight: '600', color: '#fff' },
  xpLabel: { fontSize: 12, color: '#9ca3af', fontVariant: ['tabular-nums'] },
  track: {
    height: 6, backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3, overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 3 },

  /* Expandable */
  expandable: { overflow: 'hidden', marginTop: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 12 },
  statItem: { alignItems: 'center', gap: 4 },
  statValue: { fontSize: 14, fontWeight: '700', color: '#fff' },
  statLabel: { fontSize: 11, color: '#9ca3af' },
});
