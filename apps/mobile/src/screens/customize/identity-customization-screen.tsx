/**
 * Identity Customization Screen
 *
 * Allows users to customize their identity: display name, title, badge,
 * profile banner, and about me section.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useThemeStore } from '@/stores';
import { SettingsStackParamList } from '../../types';

type NavProp = NativeStackNavigationProp<SettingsStackParamList, 'IdentityCustomization'>;

interface IdentitySection {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  action: () => void;
  value?: string;
}

/**
 *
 */
export default function IdentityCustomizationScreen() {
  const navigation = useNavigation<NavProp>();
  const { colors } = useThemeStore();
  const [aboutMe, setAboutMe] = useState('');

  const sections: IdentitySection[] = [
    {
      id: 'title',
      title: 'Title',
      description: 'Choose a title to display under your name',
      icon: 'trophy-outline',
      action: () => navigation.navigate('TitleSelection'),
      value: 'None selected',
    },
    {
      id: 'badge',
      title: 'Badge',
      description: 'Select a badge to showcase on your profile',
      icon: 'ribbon-outline',
      action: () => navigation.navigate('BadgeSelection'),
      value: 'None selected',
    },
    {
      id: 'avatar',
      title: 'Avatar',
      description: 'Change your profile picture and avatar decorations',
      icon: 'image-outline',
      action: () => navigation.navigate('AvatarSettings'),
    },
    {
      id: 'visibility',
      title: 'Profile Visibility',
      description: 'Control who can see your profile information',
      icon: 'eye-outline',
      action: () => navigation.navigate('ProfileVisibility'),
    },
  ];

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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Identity</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Customize how others see you
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Preview Card */}
        <View style={[styles.previewCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.previewAvatar, { backgroundColor: colors.primary + '30' }]}>
            <Ionicons name="person" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.previewName, { color: colors.text }]}>Your Name</Text>
          <Text style={[styles.previewTitle, { color: colors.textSecondary }]}>
            No title selected
          </Text>
        </View>

        {/* About Me */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>About Me</Text>
        <View style={[styles.inputCard, { backgroundColor: colors.surface }]}>
          <TextInput
            style={[styles.textInput, { color: colors.text }]}
            placeholder="Tell others about yourself..."
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={190}
            value={aboutMe}
            onChangeText={setAboutMe}
          />
          <Text style={[styles.charCount, { color: colors.textSecondary }]}>
            {aboutMe.length}/190
          </Text>
        </View>

        {/* Sections */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Customize</Text>
        {sections.map((section) => (
          <TouchableOpacity
            key={section.id}
            style={[styles.sectionCard, { backgroundColor: colors.surface }]}
            onPress={section.action}
            activeOpacity={0.7}
          >
            <Ionicons name={section.icon} size={22} color={colors.primary} />
            <View style={styles.sectionContent}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
              <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                {section.description}
              </Text>
            </View>
            <View style={styles.sectionRight}>
              {section.value && (
                <Text style={[styles.sectionValue, { color: colors.textSecondary }]}>
                  {section.value}
                </Text>
              )}
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </View>
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
  previewCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
  },
  previewAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  previewName: { fontSize: 20, fontWeight: '700' },
  previewTitle: { fontSize: 14, marginTop: 4 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 8,
  },
  inputCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  textInput: {
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 6,
  },
  sectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
    gap: 12,
  },
  sectionContent: { flex: 1 },
  sectionTitle: { fontSize: 15, fontWeight: '600' },
  sectionDescription: { fontSize: 12, marginTop: 2 },
  sectionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionValue: { fontSize: 12 },
});
