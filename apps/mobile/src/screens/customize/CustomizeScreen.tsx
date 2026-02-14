/**
 * Customize Hub Screen
 *
 * Customization hub with tabs for Identity, Effects, and Progression.
 * Acts as a navigation hub to more specific customization screens.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { SettingsStackParamList } from '../../types';

type NavProp = NativeStackNavigationProp<SettingsStackParamList, 'Customize'>;

interface CustomizeCategory {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  screen: keyof SettingsStackParamList;
  color: string;
}

const CATEGORIES: CustomizeCategory[] = [
  {
    id: 'identity',
    title: 'Identity',
    description: 'Titles, badges, and display name',
    icon: 'person-circle-outline',
    screen: 'IdentityCustomization',
    color: '#6366f1',
  },
  {
    id: 'effects',
    title: 'Effects & Themes',
    description: 'Visual effects, colors, and themes',
    icon: 'sparkles-outline',
    screen: 'EffectsCustomization',
    color: '#ec4899',
  },
  {
    id: 'progression',
    title: 'Progression',
    description: 'Levels, XP, achievements, and quests',
    icon: 'trending-up-outline',
    screen: 'ProgressionCustomization',
    color: '#10b981',
  },
];

export default function CustomizeScreen() {
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Customize</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Make it yours
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.card, { backgroundColor: colors.surface }]}
            onPress={() => navigation.navigate(cat.screen as any)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrapper, { backgroundColor: cat.color + '20' }]}>
              <Ionicons name={cat.icon} size={28} color={cat.color} />
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{cat.title}</Text>
              <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
                {cat.description}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        ))}

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: colors.surface }]}
            onPress={() => navigation.navigate('BadgeSelection')}
          >
            <Ionicons name="ribbon-outline" size={24} color="#f59e0b" />
            <Text style={[styles.quickActionText, { color: colors.text }]}>Badges</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: colors.surface }]}
            onPress={() => navigation.navigate('TitleSelection')}
          >
            <Ionicons name="trophy-outline" size={24} color="#8b5cf6" />
            <Text style={[styles.quickActionText, { color: colors.text }]}>Titles</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: colors.surface }]}
            onPress={() => navigation.navigate('Appearance')}
          >
            <Ionicons name="color-palette-outline" size={24} color="#06b6d4" />
            <Text style={[styles.quickActionText, { color: colors.text }]}>Theme</Text>
          </TouchableOpacity>
        </View>
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  iconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: { flex: 1, marginLeft: 14 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardDescription: { fontSize: 13, marginTop: 2 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 12,
  },
  quickActions: { flexDirection: 'row', gap: 10 },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    gap: 8,
  },
  quickActionText: { fontSize: 13, fontWeight: '500' },
});
