/**
 * UICustomizationScreen Components
 *
 * Reusable UI components for the customization screen.
 *
 * @module screens/settings/UICustomizationScreen/components
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { ThemeConfig, ColorShade } from '@/lib/customization/customization-engine';

// ============================================================================
// HAPTIC HELPERS
// ============================================================================

const haptic = {
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
};

// ============================================================================
// SETTINGS SECTION COMPONENT
// ============================================================================

interface SectionProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  children: React.ReactNode;
}

export function SettingsSection({ title, icon, iconColor, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIcon, { backgroundColor: iconColor + '20' }]}>
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <BlurView intensity={40} tint="dark" style={styles.sectionContent}>
        {children}
      </BlurView>
    </View>
  );
}

// ============================================================================
// OPTION ROW COMPONENTS
// ============================================================================

interface ToggleRowProps {
  label: string;
  description?: string;
  value: boolean;
  onToggle: (value: boolean) => void;
}

export function ToggleRow({ label, description, value, onToggle }: ToggleRowProps) {
  return (
    <View style={styles.optionRow}>
      <View style={styles.optionInfo}>
        <Text style={styles.optionLabel}>{label}</Text>
        {description && <Text style={styles.optionDescription}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={(newValue) => {
          haptic.light();
          onToggle(newValue);
        }}
        trackColor={{ false: '#374151', true: '#10b981' }}
        thumbColor={value ? '#fff' : '#9ca3af'}
      />
    </View>
  );
}

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onValueChange: (value: number) => void;
}

export function SliderRow({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = '',
  onValueChange,
}: SliderRowProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <View style={styles.optionRowVertical}>
      <View style={styles.sliderHeader}>
        <Text style={styles.optionLabel}>{label}</Text>
        <Text style={styles.sliderValue}>
          {value}
          {suffix}
        </Text>
      </View>
      <View style={styles.sliderContainer}>
        <View style={styles.sliderTrack}>
          <View style={[styles.sliderFill, { width: `${percentage}%` }]} />
        </View>
        <View style={styles.sliderButtons}>
          <TouchableOpacity
            style={styles.sliderButton}
            onPress={() => {
              haptic.light();
              onValueChange(Math.max(min, value - step));
            }}
          >
            <Ionicons name="remove" size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sliderButton}
            onPress={() => {
              haptic.light();
              onValueChange(Math.min(max, value + step));
            }}
          >
            <Ionicons name="add" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

interface ColorShadePickerProps {
  label: string;
  shades: ColorShade;
  onSelect: (shade: keyof ColorShade) => void;
}

export function ColorShadePicker({ label, shades, onSelect }: ColorShadePickerProps) {
  const shadeKeys = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;

  return (
    <View style={styles.optionRowVertical}>
      <Text style={styles.optionLabel}>{label}</Text>
      <View style={styles.colorShadeGrid}>
        {shadeKeys.map((shade) => (
          <TouchableOpacity
            key={shade}
            style={[styles.colorShadeBox, { backgroundColor: shades[shade] }]}
            onPress={() => {
              haptic.medium();
              onSelect(shade);
            }}
          >
            <Text style={styles.colorShadeLabel}>{shade}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ============================================================================
// PRESET THEME SELECTOR
// ============================================================================

interface PresetSelectorProps {
  currentThemeName: string;
  themes: ThemeConfig[];
  onSelect: (theme: ThemeConfig) => void;
}

export function PresetSelector({ currentThemeName, themes, onSelect }: PresetSelectorProps) {
  return (
    <View style={styles.presetSection}>
      <Text style={styles.presetTitle}>Quick Presets</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
        {themes.map((theme) => {
          const isSelected = theme.name === currentThemeName;
          return (
            <TouchableOpacity
              key={theme.name}
              style={[styles.presetCard, isSelected && styles.presetCardSelected]}
              onPress={() => {
                haptic.medium();
                onSelect(theme);
              }}
            >
              <LinearGradient
                colors={[theme.colors.primary[500], theme.colors.secondary[500]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.presetGradient}
              />
              <Text style={styles.presetName}>{theme.name}</Text>
              {isSelected && (
                <View style={styles.presetCheck}>
                  <Ionicons name="checkmark" size={12} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  sectionContent: {
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  optionRowVertical: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  optionInfo: {
    flex: 1,
    marginRight: 16,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 12,
    color: '#9ca3af',
  },
  sliderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sliderValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sliderTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#374151',
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 3,
  },
  sliderButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sliderButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorShadeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  colorShadeBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorShadeLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  presetSection: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  presetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  presetScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  presetCard: {
    width: 100,
    height: 80,
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetCardSelected: {
    borderColor: '#10b981',
  },
  presetGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  presetName: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  presetCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export { haptic };
