/**
 * Effects Customization Screen
 *
 * Lets users customize visual effects: theme colors, chat bubbles,
 * profile effects, and animations.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { SettingsStackParamList } from '../../types';

type NavProp = NativeStackNavigationProp<SettingsStackParamList, 'EffectsCustomization'>;

const THEME_COLORS = [
  '#6366f1',
  '#ec4899',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#06b6d4',
  '#8b5cf6',
  '#f97316',
];

interface EffectOption {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  screen?: keyof SettingsStackParamList;
  color: string;
}

const EFFECT_OPTIONS: EffectOption[] = [
  {
    id: 'theme',
    title: 'App Theme',
    description: 'Choose your color theme and dark mode style',
    icon: 'color-palette-outline',
    screen: 'Appearance',
    color: '#6366f1',
  },
  {
    id: 'chat-bubbles',
    title: 'Chat Bubbles',
    description: 'Customize message bubble colors and shapes',
    icon: 'chatbubble-ellipses-outline',
    screen: 'ChatBubbles',
    color: '#ec4899',
  },
  {
    id: 'ui-custom',
    title: 'UI Customization',
    description: 'Layout, animations, and visual preferences',
    icon: 'grid-outline',
    screen: 'UICustomization',
    color: '#06b6d4',
  },
  {
    id: 'holographic',
    title: 'Holographic Effects',
    description: 'Explore futuristic holographic UI effects',
    icon: 'prism-outline',
    screen: 'HolographicDemo',
    color: '#8b5cf6',
  },
];

export default function EffectsCustomizationScreen() {
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Effects & Themes</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Visual customization
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Accent Color Picker */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Accent Color</Text>
          <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
            Choose your primary accent color
          </Text>
          <View style={styles.colorRow}>
            {THEME_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: color },
                  color === colors.primary && styles.colorSwatchSelected,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Effect Options */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Customization</Text>
        {EFFECT_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[styles.optionCard, { backgroundColor: colors.surface }]}
            onPress={() => option.screen && navigation.navigate(option.screen as any)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrapper, { backgroundColor: option.color + '20' }]}>
              <Ionicons name={option.icon} size={22} color={option.color} />
            </View>
            <View style={styles.optionContent}>
              <Text style={[styles.optionTitle, { color: colors.text }]}>{option.title}</Text>
              <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                {option.description}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        ))}
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
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardDescription: { fontSize: 13, marginTop: 4, marginBottom: 14 },
  colorRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  colorSwatchSelected: {
    borderWidth: 3,
    borderColor: '#fff',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionContent: { flex: 1, marginLeft: 12 },
  optionTitle: { fontSize: 15, fontWeight: '600' },
  optionDescription: { fontSize: 12, marginTop: 2 },
});
