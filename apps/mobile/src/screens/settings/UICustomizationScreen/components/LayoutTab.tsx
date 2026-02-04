/**
 * LayoutTab Component
 *
 * Tab content for the Layout customization options.
 * Includes density, scaling, view mode, tab bar style, per-screen settings, and border radius.
 */

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SettingsSection, ToggleRow, SliderRow, haptic } from './SettingsComponents';
import { styles } from '../styles';
import type { ThemeConfig } from '@/lib/customization/CustomizationEngine';

interface LayoutTabProps {
  theme: ThemeConfig;
  updateTheme: (update: Partial<ThemeConfig>) => void;
}

export function LayoutTab({ theme, updateTheme }: LayoutTabProps) {
  return (
    <>
      {/* Density Mode */}
      <SettingsSection title="Content Density" icon="layers" iconColor="#3b82f6">
        <View style={styles.optionRowVertical}>
          <Text style={styles.optionLabel}>Global Density</Text>
          <Text style={styles.optionDescription}>Controls spacing throughout the app</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
            {(['compact', 'comfortable', 'spacious'] as const).map((density) => (
              <TouchableOpacity
                key={density}
                style={[
                  styles.densityOption,
                  theme.layout.density === density && styles.densityOptionSelected,
                ]}
                onPress={() => {
                  haptic.medium();
                  updateTheme({
                    layout: { ...theme.layout, density },
                  });
                }}
              >
                <Ionicons
                  name={
                    density === 'compact'
                      ? 'contract'
                      : density === 'comfortable'
                        ? 'expand'
                        : 'resize'
                  }
                  size={24}
                  color={theme.layout.density === density ? '#fff' : '#9ca3af'}
                />
                <Text
                  style={[
                    styles.densityOptionText,
                    theme.layout.density === density && styles.densityOptionTextSelected,
                  ]}
                >
                  {density.charAt(0).toUpperCase() + density.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </SettingsSection>

      {/* Component Scaling */}
      <SettingsSection title="Component Scaling" icon="resize" iconColor="#f59e0b">
        <SliderRow
          label="UI Scale"
          value={theme.layout.componentScaling}
          min={0.8}
          max={1.5}
          step={0.05}
          suffix="x"
          onValueChange={(value) =>
            updateTheme({
              layout: { ...theme.layout, componentScaling: value },
            })
          }
        />
        <SliderRow
          label="Grid Size"
          value={theme.spacing.gridSize}
          min={4}
          max={12}
          step={2}
          suffix="px"
          onValueChange={(value) =>
            updateTheme({
              spacing: { ...theme.spacing, gridSize: value },
            })
          }
        />
      </SettingsSection>

      {/* View Mode */}
      <SettingsSection title="View Mode" icon="grid" iconColor="#22c55e">
        <ToggleRow
          label="Grid Layout"
          description="Show content in grid instead of list"
          value={theme.layout.gridLayout}
          onToggle={(value) =>
            updateTheme({
              layout: { ...theme.layout, gridLayout: value },
            })
          }
        />
      </SettingsSection>

      {/* Tab Bar Style */}
      <SettingsSection title="Tab Bar Style" icon="apps" iconColor="#8b5cf6">
        <View style={styles.optionRowVertical}>
          <Text style={styles.optionLabel}>Navigation Style</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
            {(['icon-only', 'with-labels', 'hidden'] as const).map((style) => (
              <TouchableOpacity
                key={style}
                style={[
                  styles.segmentedOption,
                  theme.layout.tabBarStyle === style && styles.segmentedOptionSelected,
                ]}
                onPress={() => {
                  haptic.light();
                  updateTheme({
                    layout: { ...theme.layout, tabBarStyle: style },
                  });
                }}
              >
                <Text
                  style={[
                    styles.segmentedOptionText,
                    theme.layout.tabBarStyle === style && styles.segmentedOptionTextSelected,
                  ]}
                >
                  {style === 'icon-only'
                    ? 'Icons Only'
                    : style === 'with-labels'
                      ? 'With Labels'
                      : 'Hidden'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </SettingsSection>

      {/* Per-Screen Density */}
      <SettingsSection title="Per-Screen Density" icon="settings" iconColor="#06b6d4">
        <View style={styles.optionRowVertical}>
          <Text style={styles.optionLabel}>Forums</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            {(['compact', 'comfortable', 'spacious'] as const).map((density) => (
              <TouchableOpacity
                key={density}
                style={[
                  styles.miniSegmentedOption,
                  theme.layout.perScreen.forums === density && styles.segmentedOptionSelected,
                ]}
                onPress={() => {
                  haptic.light();
                  updateTheme({
                    layout: {
                      ...theme.layout,
                      perScreen: { ...theme.layout.perScreen, forums: density },
                    },
                  });
                }}
              >
                <Text
                  style={[
                    styles.miniSegmentedText,
                    theme.layout.perScreen.forums === density && styles.segmentedOptionTextSelected,
                  ]}
                >
                  {density.charAt(0).toUpperCase() + density.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        <View style={styles.optionRowVertical}>
          <Text style={styles.optionLabel}>Chat</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            {(['compact', 'comfortable', 'spacious'] as const).map((density) => (
              <TouchableOpacity
                key={density}
                style={[
                  styles.miniSegmentedOption,
                  theme.layout.perScreen.chat === density && styles.segmentedOptionSelected,
                ]}
                onPress={() => {
                  haptic.light();
                  updateTheme({
                    layout: {
                      ...theme.layout,
                      perScreen: { ...theme.layout.perScreen, chat: density },
                    },
                  });
                }}
              >
                <Text
                  style={[
                    styles.miniSegmentedText,
                    theme.layout.perScreen.chat === density && styles.segmentedOptionTextSelected,
                  ]}
                >
                  {density.charAt(0).toUpperCase() + density.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        <View style={styles.optionRowVertical}>
          <Text style={styles.optionLabel}>Groups</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            {(['compact', 'comfortable', 'spacious'] as const).map((density) => (
              <TouchableOpacity
                key={density}
                style={[
                  styles.miniSegmentedOption,
                  theme.layout.perScreen.groups === density && styles.segmentedOptionSelected,
                ]}
                onPress={() => {
                  haptic.light();
                  updateTheme({
                    layout: {
                      ...theme.layout,
                      perScreen: { ...theme.layout.perScreen, groups: density },
                    },
                  });
                }}
              >
                <Text
                  style={[
                    styles.miniSegmentedText,
                    theme.layout.perScreen.groups === density && styles.segmentedOptionTextSelected,
                  ]}
                >
                  {density.charAt(0).toUpperCase() + density.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </SettingsSection>

      {/* Border Radius */}
      <SettingsSection title="Border Radius" icon="square" iconColor="#ec4899">
        <SliderRow
          label="None"
          value={theme.borderRadius.none}
          min={0}
          max={4}
          step={1}
          suffix="px"
          onValueChange={(value) =>
            updateTheme({
              borderRadius: { ...theme.borderRadius, none: value },
            })
          }
        />
        <SliderRow
          label="Small"
          value={theme.borderRadius.sm}
          min={2}
          max={8}
          step={1}
          suffix="px"
          onValueChange={(value) =>
            updateTheme({
              borderRadius: { ...theme.borderRadius, sm: value },
            })
          }
        />
        <SliderRow
          label="Medium"
          value={theme.borderRadius.md}
          min={4}
          max={16}
          step={2}
          suffix="px"
          onValueChange={(value) =>
            updateTheme({
              borderRadius: { ...theme.borderRadius, md: value },
            })
          }
        />
        <SliderRow
          label="Large"
          value={theme.borderRadius.lg}
          min={8}
          max={24}
          step={2}
          suffix="px"
          onValueChange={(value) =>
            updateTheme({
              borderRadius: { ...theme.borderRadius, lg: value },
            })
          }
        />
      </SettingsSection>
    </>
  );
}
