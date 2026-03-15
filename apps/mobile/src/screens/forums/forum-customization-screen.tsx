/**
 * Forum Customization Screen (Mobile)
 *
 * Simplified customization interface for mobile — theme presets, colors,
 * font size slider, layout toggles, and karma name fields.
 *
 * @module screens/forums/forum-customization-screen
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '@/stores';
import api from '../../lib/api';
import { ForumsStackParamList } from '../../types';
import { ThemePicker } from './components/theme-picker';

type Props = {
  navigation: NativeStackNavigationProp<ForumsStackParamList, 'ForumCustomization'>;
  route: RouteProp<ForumsStackParamList, 'ForumCustomization'>;
};

interface CustomizationOptions {
  appearance: Record<string, unknown>;
  layout: Record<string, unknown>;
  reputation_and_ranks: Record<string, unknown>;
  [key: string]: Record<string, unknown>;
}

const COLOR_FIELDS = [
  { key: 'primary_color', label: 'Primary' },
  { key: 'secondary_color', label: 'Secondary' },
  { key: 'accent_color', label: 'Accent' },
  { key: 'background_color', label: 'Background' },
];

const FONT_SIZE_OPTIONS = [
  { value: '14px', label: 'Small' },
  { value: '16px', label: 'Medium' },
  { value: '18px', label: 'Large' },
];

/** Forum Customization Screen component. */
export default function ForumCustomizationScreen({ navigation, route }: Props) {
  const colors = useThemeStore((s) => s.colors);
  const forumId = route.params?.forumId;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [options, setOptions] = useState<CustomizationOptions | null>(null);
  const [activePreset, setActivePreset] = useState<string>('dark-elite');

  const fetchOptions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/v1/forums/${forumId}/customization`);
      setOptions(res.data.data);
    } catch {
      Alert.alert('Error', 'Failed to load customization options');
    } finally {
      setLoading(false);
    }
  }, [forumId]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  const handleSave = useCallback(
    async (category: string, changes: Record<string, unknown>) => {
      try {
        setSaving(true);
        const res = await api.put(`/api/v1/forums/${forumId}/customization/${category}`, changes);
        setOptions(res.data.data);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        Alert.alert('Error', 'Failed to save changes');
      } finally {
        setSaving(false);
      }
    },
    [forumId]
  );

  const handlePresetSelect = useCallback(
    (presetKey: string, colors: Record<string, string>) => {
      setActivePreset(presetKey);
      handleSave('appearance', colors);
    },
    [handleSave]
  );

  const updateAppearance = useCallback(
    (key: string, value: unknown) => {
      if (!options) return;
      setOptions({
        ...options,
        appearance: { ...options.appearance, [key]: value },
      });
    },
    [options]
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const appearance = options?.appearance ?? {};
  const reputation = options?.reputation_and_ranks ?? {};
  const layout = options?.layout ?? {};

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Customize Forum</Text>
        <TouchableOpacity onPress={() => handleSave('appearance', appearance)} disabled={saving}>
          <Text style={[styles.saveButton, { color: colors.primary }]}>
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Theme Presets */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Theme Presets</Text>
        <ThemePicker activePreset={activePreset} onSelect={handlePresetSelect} />
      </View>

      {/* Colors */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Colors</Text>
        {COLOR_FIELDS.map(({ key, label }) => (
          <View key={key} style={styles.colorRow}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
            <View style={styles.colorPreview}>
              <View
                style={[
                  styles.colorSwatch,
                   
                  { backgroundColor: (appearance[key] as string) ?? '#3B82F6' },
                ]}
              />
              <TextInput
                 
                value={(appearance[key] as string) ?? ''}
                onChangeText={(v) => updateAppearance(key, v)}
                style={[styles.colorInput, { color: colors.text, borderColor: colors.border }]}
                placeholder="#000000"
                placeholderTextColor={colors.textSecondary}
                maxLength={7}
              />
            </View>
          </View>
        ))}
      </View>

      {/* Font Size */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Font Size</Text>
        <View style={styles.fontSizeRow}>
          {FONT_SIZE_OPTIONS.map(({ value, label }) => (
            <TouchableOpacity
              key={value}
              style={[
                styles.fontSizeButton,
                {
                  backgroundColor:
                    appearance.font_size_base === value ? colors.primary : colors.card,
                },
              ]}
              onPress={() => updateAppearance('font_size_base', value)}
            >
              <Text
                style={[
                  styles.fontSizeLabel,
                  {
                    color: appearance.font_size_base === value ? '#fff' : colors.text,
                  },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Layout Toggles */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Layout</Text>
        {[
          { key: 'sticky_header', label: 'Sticky Header' },
          { key: 'show_breadcrumbs', label: 'Show Breadcrumbs' },
          { key: 'dark_mode', label: 'Dark Mode Default', from: 'appearance' },
        ].map(({ key, label, from }) => {
          const source = from === 'appearance' ? appearance : layout;
          return (
            <View key={key} style={styles.toggleRow}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
              <Switch
                value={!!source[key]}
                onValueChange={(v) => {
                  if (from === 'appearance') {
                    updateAppearance(key, v);
                  } else {
                    handleSave('layout', { [key]: v });
                  }
                }}
                trackColor={{ false: '#444', true: colors.primary }}
              />
            </View>
          );
        })}
      </View>

      {/* Karma Name */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Reputation</Text>
        <View style={styles.inputRow}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Karma Name</Text>
          <TextInput
             
            value={(reputation.karma_name as string) ?? 'Karma'}
            onChangeText={(v) =>
              setOptions(
                options
                  ? { ...options, reputation_and_ranks: { ...reputation, karma_name: v } }
                  : null
              )
            }
            style={[styles.textInput, { color: colors.text, borderColor: colors.border }]}
            placeholder="Karma"
            placeholderTextColor={colors.textSecondary}
          />
        </View>
        <View style={styles.inputRow}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Upvote Label</Text>
          <TextInput
             
            value={(reputation.upvote_label as string) ?? 'Upvote'}
            onChangeText={(v) =>
              setOptions(
                options
                  ? { ...options, reputation_and_ranks: { ...reputation, upvote_label: v } }
                  : null
              )
            }
            style={[styles.textInput, { color: colors.text, borderColor: colors.border }]}
            placeholder="Upvote"
            placeholderTextColor={colors.textSecondary}
          />
        </View>
        <TouchableOpacity
          style={[styles.saveSection, { backgroundColor: colors.primary }]}
          onPress={() => handleSave('reputation_and_ranks', reputation)}
          disabled={saving}
        >
          <Text style={styles.saveSectionText}>Save Reputation</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  colorPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorSwatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  colorInput: {
    width: 90,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 14,
    fontFamily: 'monospace',
  },
  label: {
    fontSize: 14,
  },
  fontSizeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  fontSizeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  fontSizeLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputRow: {
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    marginTop: 4,
  },
  saveSection: {
    marginTop: 8,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveSectionText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
