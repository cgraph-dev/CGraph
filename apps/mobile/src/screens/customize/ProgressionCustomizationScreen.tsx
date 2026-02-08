/**
 * Progression Customization Screen
 *
 * Shows the user's gamification progress: level, XP, achievements,
 * quests, and links to deeper gamification features.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { SettingsStackParamList } from '../../types';

type NavProp = NativeStackNavigationProp<SettingsStackParamList, 'ProgressionCustomization'>;

interface ProgressStat {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const STATS: ProgressStat[] = [
  { label: 'Level', value: '12', icon: 'star', color: '#f59e0b' },
  { label: 'XP', value: '3,450', icon: 'flash', color: '#6366f1' },
  { label: 'Achievements', value: '8/24', icon: 'trophy', color: '#10b981' },
  { label: 'Quests', value: '3 Active', icon: 'map', color: '#ec4899' },
];

export default function ProgressionCustomizationScreen() {
  const navigation = useNavigation<NavProp>();
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.surface }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Progression</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Your journey so far
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Level Progress Card */}
        <View style={[styles.levelCard, { backgroundColor: colors.surface }]}>
          <View style={styles.levelHeader}>
            <View style={[styles.levelBadge, { backgroundColor: '#f59e0b20' }]}>
              <Ionicons name="star" size={24} color="#f59e0b" />
            </View>
            <View style={styles.levelInfo}>
              <Text style={[styles.levelLabel, { color: colors.textSecondary }]}>
                Current Level
              </Text>
              <Text style={[styles.levelValue, { color: colors.text }]}>Level 12</Text>
            </View>
          </View>
          <View style={styles.xpBar}>
            <View style={[styles.xpBarBg, { backgroundColor: colors.border }]}>
              <View style={[styles.xpBarFill, { width: '65%' }]} />
            </View>
            <Text style={[styles.xpText, { color: colors.textSecondary }]}>3,450 / 5,000 XP</Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {STATS.map((stat) => (
            <View key={stat.label} style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <Ionicons name={stat.icon} size={20} color={stat.color} />
              <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Navigation Options */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Explore</Text>

        <TouchableOpacity
          style={[styles.navCard, { backgroundColor: colors.surface }]}
          onPress={() => navigation.navigate('GamificationHub')}
        >
          <View style={[styles.navIcon, { backgroundColor: '#6366f120' }]}>
            <Ionicons name="game-controller-outline" size={22} color="#6366f1" />
          </View>
          <View style={styles.navContent}>
            <Text style={[styles.navTitle, { color: colors.text }]}>Gamification Hub</Text>
            <Text style={[styles.navDescription, { color: colors.textSecondary }]}>
              Overview of all gamification features
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navCard, { backgroundColor: colors.surface }]}
          onPress={() => navigation.navigate('Achievements')}
        >
          <View style={[styles.navIcon, { backgroundColor: '#10b98120' }]}>
            <Ionicons name="trophy-outline" size={22} color="#10b981" />
          </View>
          <View style={styles.navContent}>
            <Text style={[styles.navTitle, { color: colors.text }]}>Achievements</Text>
            <Text style={[styles.navDescription, { color: colors.textSecondary }]}>
              View and track all achievements
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navCard, { backgroundColor: colors.surface }]}
          onPress={() => navigation.navigate('Quests')}
        >
          <View style={[styles.navIcon, { backgroundColor: '#ec489920' }]}>
            <Ionicons name="map-outline" size={22} color="#ec4899" />
          </View>
          <View style={styles.navContent}>
            <Text style={[styles.navTitle, { color: colors.text }]}>Active Quests</Text>
            <Text style={[styles.navDescription, { color: colors.textSecondary }]}>
              Complete quests to earn rewards
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navCard, { backgroundColor: colors.surface }]}
          onPress={() => navigation.navigate('Leaderboard')}
        >
          <View style={[styles.navIcon, { backgroundColor: '#f59e0b20' }]}>
            <Ionicons name="podium-outline" size={22} color="#f59e0b" />
          </View>
          <View style={styles.navContent}>
            <Text style={[styles.navTitle, { color: colors.text }]}>Leaderboard</Text>
            <Text style={[styles.navDescription, { color: colors.textSecondary }]}>
              See how you rank among others
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: { flex: 1, marginLeft: 12 },
  headerTitle: { fontSize: 24, fontWeight: '700' },
  headerSubtitle: { fontSize: 14, marginTop: 2 },
  content: { padding: 16, paddingBottom: 40 },
  levelCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  levelHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  levelBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelInfo: { marginLeft: 12 },
  levelLabel: { fontSize: 12, fontWeight: '500' },
  levelValue: { fontSize: 22, fontWeight: '700' },
  xpBar: {},
  xpBarBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  xpBarFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  xpText: { fontSize: 12, marginTop: 6, textAlign: 'right' },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    gap: 4,
    flexGrow: 1,
  },
  statValue: { fontSize: 18, fontWeight: '700' },
  statLabel: { fontSize: 12 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  navCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
  },
  navIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navContent: { flex: 1, marginLeft: 12 },
  navTitle: { fontSize: 15, fontWeight: '600' },
  navDescription: { fontSize: 12, marginTop: 2 },
});
