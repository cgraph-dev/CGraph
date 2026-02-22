/**
 * LegalScreen - Reusable base component for legal/policy pages
 * ScrollView with styled sections, FadeIn entrance animation
 */
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';

export interface LegalSection {
  title: string;
  content: string[];
}

interface LegalScreenProps {
  title: string;
  lastUpdated: string;
  icon: keyof typeof Ionicons.glyphMap;
  sections: LegalSection[];
}

export default function LegalScreen({
  title,
  lastUpdated,
  icon,
  sections,
}: LegalScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Animated.View
        style={styles.header}
        entering={FadeIn.duration(300)}
      >
        <View style={[styles.iconCircle, { backgroundColor: colors.primary + '20' }]}>
          <Ionicons name={icon} size={32} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.updated, { color: colors.textSecondary }]}>
          Last updated: {lastUpdated}
        </Text>
      </Animated.View>

      {/* Sections */}
      {sections.map((section, index) => (
        <Animated.View
          key={section.title}
          style={[styles.section, { backgroundColor: colors.surface }]}
          entering={FadeIn.delay(100 + index * 50).duration(250)}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {section.title}
          </Text>
          {section.content.map((paragraph, pIdx) => (
            <Text
              key={pIdx}
              style={[styles.paragraph, { color: colors.textSecondary }]}
            >
              {paragraph}
            </Text>
          ))}
        </Animated.View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  updated: {
    fontSize: 13,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
  },
});
