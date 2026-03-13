/**
 * Theme Picker — Horizontal scroll of preset cards with preview thumbnails
 *
 * @module screens/forums/components/theme-picker
 */
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/stores';

interface ThemePickerProps {
  activePreset: string;
  onSelect: (presetKey: string, colors: Record<string, string>) => void;
}

const PRESETS = [
  {
    key: 'dark-elite',
    name: 'Dark Elite',
    colors: {
      primary_color: '#BB86FC',
      secondary_color: '#03DAC6',
      accent_color: '#CF6679',
      background_color: '#121212',
      text_color: '#E0E0E0',
      link_color: '#BB86FC',
    },
  },
  {
    key: 'cyberpunk',
    name: 'Cyberpunk',
    colors: {
      primary_color: '#00F0FF',
      secondary_color: '#FF00FF',
      accent_color: '#FCEE0A',
      background_color: '#0a0a0a',
      text_color: '#e0e0e0',
      link_color: '#00F0FF',
    },
  },
  {
    key: 'classic-mybb',
    name: 'Classic MyBB',
    colors: {
      primary_color: '#0F4C81',
      secondary_color: '#1565C0',
      accent_color: '#FF8F00',
      background_color: '#FFFFFF',
      text_color: '#212121',
      link_color: '#0F4C81',
    },
  },
  {
    key: 'forest',
    name: 'Forest',
    colors: {
      primary_color: '#2D6A4F',
      secondary_color: '#40916C',
      accent_color: '#95D5B2',
      background_color: '#1B4332',
      text_color: '#D8F3DC',
      link_color: '#74C69D',
    },
  },
  {
    key: 'ocean',
    name: 'Ocean',
    colors: {
      primary_color: '#0077B6',
      secondary_color: '#00B4D8',
      accent_color: '#90E0EF',
      background_color: '#03045E',
      text_color: '#CAF0F8',
      link_color: '#48CAE4',
    },
  },
  {
    key: 'sunset',
    name: 'Sunset',
    colors: {
      primary_color: '#E63946',
      secondary_color: '#F4A261',
      accent_color: '#E9C46A',
      background_color: '#264653',
      text_color: '#F1FAEE',
      link_color: '#E76F51',
    },
  },
  {
    key: 'neon',
    name: 'Neon',
    colors: {
      primary_color: '#39FF14',
      secondary_color: '#FF073A',
      accent_color: '#FF6EC7',
      background_color: '#0D0D0D',
      text_color: '#FFFFFF',
      link_color: '#39FF14',
    },
  },
  {
    key: 'monochrome',
    name: 'Monochrome',
    colors: {
      primary_color: '#FFFFFF',
      secondary_color: '#CCCCCC',
      accent_color: '#999999',
      background_color: '#111111',
      text_color: '#E5E5E5',
      link_color: '#FFFFFF',
    },
  },
];

/** Description. */
/** Theme Picker component. */
export function ThemePicker({ activePreset, onSelect }: ThemePickerProps) {
  const appColors = useThemeStore((s) => s.colors);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {PRESETS.map((preset) => {
        const isActive = activePreset === preset.key;
        return (
          <TouchableOpacity
            key={preset.key}
            style={[
              styles.card,
              {
                backgroundColor: preset.colors.background_color,
                borderColor: isActive ? appColors.primary : 'rgba(255,255,255,0.1)',
                borderWidth: isActive ? 2 : 1,
              },
            ]}
            onPress={() => onSelect(preset.key, preset.colors)}
            activeOpacity={0.7}
          >
            {/* Color dots preview */}
            <View style={styles.colorDots}>
              <View style={[styles.dot, { backgroundColor: preset.colors.primary_color }]} />
              <View style={[styles.dot, { backgroundColor: preset.colors.secondary_color }]} />
              <View style={[styles.dot, { backgroundColor: preset.colors.accent_color }]} />
            </View>

            {/* Mini preview */}
            <View
              style={[
                styles.previewHeader,
                { backgroundColor: preset.colors.primary_color + '40' },
              ]}
            >
              <View style={[styles.previewBar, { backgroundColor: preset.colors.primary_color }]} />
            </View>
            <View style={styles.previewBody}>
              <View
                style={[styles.previewLine, { backgroundColor: preset.colors.text_color + '40' }]}
              />
              <View
                style={[
                  styles.previewLine,
                  { backgroundColor: preset.colors.text_color + '20', width: '60%' },
                ]}
              />
            </View>

            {/* Label */}
            <Text
              style={[styles.presetName, { color: preset.colors.text_color }]}
              numberOfLines={1}
            >
              {preset.name}
            </Text>

            {/* Active check */}
            {isActive && (
              <View style={[styles.checkBadge, { backgroundColor: appColors.primary }]}>
                <Ionicons name="checkmark" size={12} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingVertical: 4,
    gap: 12,
  },
  card: {
    width: 120,
    height: 140,
    borderRadius: 12,
    padding: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  colorDots: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  previewHeader: {
    height: 16,
    borderRadius: 4,
    marginBottom: 4,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  previewBar: {
    height: 4,
    width: '50%',
    borderRadius: 2,
  },
  previewBody: {
    flex: 1,
    gap: 3,
    paddingVertical: 2,
  },
  previewLine: {
    height: 4,
    borderRadius: 2,
    width: '80%',
  },
  presetName: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  checkBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ThemePicker;
