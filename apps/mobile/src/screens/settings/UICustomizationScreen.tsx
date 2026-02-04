/**
 * UICustomizationScreen - Comprehensive Theme Customization Interface
 *
 * Features:
 * - 5 tabs: Colors, Typography, Layout, Effects, Animations
 * - Live preview card showing real-time changes
 * - 12 preset themes with one-tap selection
 * - Undo/Redo functionality
 * - Import/Export theme JSON
 * - Validation warnings
 * - Accessibility warnings
 *
 * @version 2.0.0
 * @since v0.10.0
 */

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Share } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCustomization } from '@/contexts/CustomizationContext';
import useCustomizationStore, {
  useIsDirty,
  useCanUndo,
  useCanRedo,
} from '@/stores/customizationStore';
import { PRESET_THEMES } from '@/lib/customization/PresetThemes';
import { SettingsStackParamList } from '@/types';

// Import extracted components
import {
  SettingsSection,
  ToggleRow,
  SliderRow,
  ColorShadePicker,
  PresetSelector,
  haptic,
} from './UICustomizationScreen/components';

// Import extracted styles
import { styles } from './UICustomizationScreen/styles';
import { LivePreviewCard } from './UICustomizationScreen/components';

type Props = {
  navigation: NativeStackNavigationProp<SettingsStackParamList, 'UICustomization'>;
};

type TabId = 'colors' | 'typography' | 'layout' | 'effects' | 'animations' | 'accessibility';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function UICustomizationScreen({ navigation }: Props) {
  const { theme } = useCustomization();
  const isDirty = useIsDirty();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const {
    updateTheme,
    saveTheme,
    undo,
    redo,
    resetTheme,
    exportTheme,
    importTheme,
    validateTheme,
    isAccessible,
  } = useCustomizationStore();

  const [activeTab, setActiveTab] = useState<TabId>('colors');

  const handleSave = useCallback(async () => {
    haptic.success();
    try {
      await saveTheme();
      Alert.alert('Success', 'Theme saved successfully!');
    } catch (_error) {
      Alert.alert('Error', 'Failed to save theme');
    }
  }, [saveTheme]);

  const handleReset = useCallback(() => {
    haptic.medium();
    Alert.alert('Reset Theme', 'Reset to default theme? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          resetTheme();
          haptic.success();
        },
      },
    ]);
  }, [resetTheme]);

  const handleExport = useCallback(async () => {
    haptic.medium();
    try {
      const json = exportTheme();
      await Share.share({
        message: json,
        title: `${theme.name} Theme`,
      });
    } catch (_error) {
      Alert.alert('Error', 'Failed to export theme');
    }
  }, [exportTheme, theme.name]);

  const handleImport = useCallback(() => {
    haptic.medium();
    Alert.prompt(
      'Import Theme',
      'Paste theme JSON below:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import',
          onPress: (json?: string) => {
            if (json) {
              try {
                importTheme(json);
                haptic.success();
                Alert.alert('Success', 'Theme imported successfully!');
              } catch (_error) {
                Alert.alert('Error', 'Invalid theme JSON');
              }
            }
          },
        },
      ],
      'plain-text'
    );
  }, [importTheme]);

  const handleValidate = useCallback(() => {
    const validation = validateTheme();
    const accessibility = isAccessible();

    let message = '';
    if (validation.valid && accessibility.accessible) {
      message = '✅ Theme is valid and accessible!';
    } else {
      if (!validation.valid) {
        message += 'Validation errors:\n' + validation.errors.join('\n') + '\n\n';
      }
      if (!accessibility.accessible) {
        message += 'Accessibility warnings:\n' + accessibility.warnings.join('\n');
      }
    }

    Alert.alert('Theme Validation', message);
  }, [validateTheme, isAccessible]);

  const tabs: Array<{ id: TabId; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
    { id: 'colors', label: 'Colors', icon: 'color-palette' },
    { id: 'typography', label: 'Type', icon: 'text' },
    { id: 'layout', label: 'Layout', icon: 'grid' },
    { id: 'effects', label: 'Effects', icon: 'sparkles' },
    { id: 'animations', label: 'Motion', icon: 'flash' },
    { id: 'accessibility', label: 'A11y', icon: 'accessibility' },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#111827', '#0f172a', '#111827']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            haptic.light();
            navigation.goBack();
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Theme Studio</Text>
          <Text style={styles.headerSubtitle}>
            {theme.name} {isDirty ? '(unsaved)' : ''}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerButton, !canUndo && styles.headerButtonDisabled]}
            onPress={() => canUndo && undo()}
            disabled={!canUndo}
          >
            <Ionicons name="arrow-undo" size={20} color={canUndo ? '#fff' : '#666'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, !canRedo && styles.headerButtonDisabled]}
            onPress={() => canRedo && redo()}
            disabled={!canRedo}
          >
            <Ionicons name="arrow-redo" size={20} color={canRedo ? '#fff' : '#666'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => {
              haptic.light();
              setActiveTab(tab.id);
            }}
          >
            <Ionicons
              name={tab.icon}
              size={18}
              color={activeTab === tab.id ? '#10b981' : '#6b7280'}
            />
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Live Preview */}
        <LivePreviewCard />

        {/* Preset Themes */}
        <PresetSelector
          currentThemeName={theme.name}
          themes={PRESET_THEMES}
          onSelect={(presetTheme) => updateTheme(presetTheme)}
        />

        {/* Colors Tab */}
        {activeTab === 'colors' && (
          <>
            <SettingsSection title="Primary Color" icon="color-filter" iconColor="#10b981">
              <ColorShadePicker
                label="Primary Shades"
                shades={theme.colors.primary}
                onSelect={(shade) => {
                  // Color editing would require a full color picker
                  Alert.alert('Info', `Selected shade: ${shade}`);
                }}
              />
            </SettingsSection>

            <SettingsSection title="Secondary Color" icon="color-filter" iconColor="#8b5cf6">
              <ColorShadePicker
                label="Secondary Shades"
                shades={theme.colors.secondary}
                onSelect={(shade) => {
                  Alert.alert('Info', `Selected shade: ${shade}`);
                }}
              />
            </SettingsSection>
          </>
        )}

        {/* Typography Tab */}
        {activeTab === 'typography' && (
          <>
            <SettingsSection title="Font Settings" icon="text" iconColor="#3b82f6">
              <SliderRow
                label="Base Font Size"
                value={theme.typography.baseSize}
                min={12}
                max={20}
                step={1}
                suffix="px"
                onValueChange={(value) =>
                  updateTheme({
                    typography: { ...theme.typography, baseSize: value },
                  })
                }
              />
              <SliderRow
                label="Scale Ratio"
                value={parseFloat(theme.typography.scaleRatio.toFixed(2))}
                min={1.1}
                max={1.5}
                step={0.05}
                onValueChange={(value) =>
                  updateTheme({
                    typography: { ...theme.typography, scaleRatio: value },
                  })
                }
              />
              <SliderRow
                label="Line Height"
                value={theme.typography.lineHeight}
                min={1.2}
                max={2.0}
                step={0.1}
                onValueChange={(value) =>
                  updateTheme({
                    typography: { ...theme.typography, lineHeight: value },
                  })
                }
              />
            </SettingsSection>
          </>
        )}

        {/* Layout Tab */}
        {activeTab === 'layout' && (
          <>
            {/* Density Mode */}
            <SettingsSection title="Content Density" icon="layers" iconColor="#3b82f6">
              <View style={styles.optionRowVertical}>
                <Text style={styles.optionLabel}>Global Density</Text>
                <Text style={styles.optionDescription}>Controls spacing throughout the app</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginTop: 10 }}
                >
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
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginTop: 10 }}
                >
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
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginTop: 8 }}
                >
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
                          theme.layout.perScreen.forums === density &&
                            styles.segmentedOptionTextSelected,
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
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginTop: 8 }}
                >
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
                          theme.layout.perScreen.chat === density &&
                            styles.segmentedOptionTextSelected,
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
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginTop: 8 }}
                >
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
                          theme.layout.perScreen.groups === density &&
                            styles.segmentedOptionTextSelected,
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
        )}

        {/* Effects Tab */}
        {activeTab === 'effects' && (
          <>
            <SettingsSection title="Blur Effects" icon="water" iconColor="#06b6d4">
              <SliderRow
                label="Blur Intensity"
                value={theme.effects.blur.intensity}
                min={0}
                max={100}
                step={5}
                onValueChange={(value) =>
                  updateTheme({
                    effects: {
                      ...theme.effects,
                      blur: { ...theme.effects.blur, intensity: value },
                    },
                  })
                }
              />
              <ToggleRow
                label="Enable Blur"
                description="Glassmorphism effect on cards"
                value={theme.effects.blur.enabled}
                onToggle={(value) =>
                  updateTheme({
                    effects: {
                      ...theme.effects,
                      blur: { ...theme.effects.blur, enabled: value },
                    },
                  })
                }
              />
            </SettingsSection>

            <SettingsSection title="Particle System" icon="sparkles" iconColor="#f59e0b">
              <ToggleRow
                label="Enable Particles"
                description="Background particle effects"
                value={theme.effects.particles.enabled}
                onToggle={(value) =>
                  updateTheme({
                    effects: {
                      ...theme.effects,
                      particles: { ...theme.effects.particles, enabled: value },
                    },
                  })
                }
              />
              <View style={styles.optionRowVertical}>
                <Text style={styles.optionLabel}>Particle Density</Text>
                <View style={{ marginTop: 10 }}>
                  {(['off', 'low', 'medium', 'high', 'ultra'] as const).map((density) => (
                    <TouchableOpacity
                      key={density}
                      style={[
                        styles.segmentedOption,
                        theme.effects.particles.density === density &&
                          styles.segmentedOptionSelected,
                      ]}
                      onPress={() => {
                        haptic.light();
                        updateTheme({
                          effects: {
                            ...theme.effects,
                            particles: { ...theme.effects.particles, density },
                          },
                        });
                      }}
                    >
                      <Text
                        style={[
                          styles.segmentedOptionText,
                          theme.effects.particles.density === density &&
                            styles.segmentedOptionTextSelected,
                        ]}
                      >
                        {density.charAt(0).toUpperCase() + density.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </SettingsSection>

            <SettingsSection title="Glow Effects" icon="radio-button-on" iconColor="#8b5cf6">
              <ToggleRow
                label="Enable Glow"
                description="Glowing borders and highlights"
                value={theme.effects.glow.enabled}
                onToggle={(value) =>
                  updateTheme({
                    effects: {
                      ...theme.effects,
                      glow: { ...theme.effects.glow, enabled: value },
                    },
                  })
                }
              />
              <View style={styles.optionRowVertical}>
                <Text style={styles.optionLabel}>Glow Intensity</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginTop: 10 }}
                >
                  {(['off', 'subtle', 'moderate', 'intense'] as const).map((intensity) => (
                    <TouchableOpacity
                      key={intensity}
                      style={[
                        styles.segmentedOption,
                        theme.effects.glow.intensity === intensity &&
                          styles.segmentedOptionSelected,
                      ]}
                      onPress={() => {
                        haptic.light();
                        updateTheme({
                          effects: {
                            ...theme.effects,
                            glow: { ...theme.effects.glow, intensity },
                          },
                        });
                      }}
                    >
                      <Text
                        style={[
                          styles.segmentedOptionText,
                          theme.effects.glow.intensity === intensity &&
                            styles.segmentedOptionTextSelected,
                        ]}
                      >
                        {intensity.charAt(0).toUpperCase() + intensity.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </SettingsSection>

            {/* Border Gradients */}
            <SettingsSection title="Border Gradients" icon="color-wand" iconColor="#06b6d4">
              <ToggleRow
                label="Animated Borders"
                description="Rainbow gradient borders on cards"
                value={theme.effects.borderGradients.enabled}
                onToggle={(value) =>
                  updateTheme({
                    effects: {
                      ...theme.effects,
                      borderGradients: { ...theme.effects.borderGradients, enabled: value },
                    },
                  })
                }
              />
              <SliderRow
                label="Animation Speed"
                value={theme.effects.borderGradients.speed}
                min={0.5}
                max={2.0}
                step={0.1}
                suffix="x"
                onValueChange={(value) =>
                  updateTheme({
                    effects: {
                      ...theme.effects,
                      borderGradients: { ...theme.effects.borderGradients, speed: value },
                    },
                  })
                }
              />
            </SettingsSection>

            {/* Scanlines */}
            <SettingsSection title="Scanlines" icon="scan" iconColor="#ef4444">
              <ToggleRow
                label="Enable Scanlines"
                description="Retro CRT monitor effect"
                value={theme.effects.scanlines.enabled}
                onToggle={(value) =>
                  updateTheme({
                    effects: {
                      ...theme.effects,
                      scanlines: { ...theme.effects.scanlines, enabled: value },
                    },
                  })
                }
              />
              <SliderRow
                label="Opacity"
                value={theme.effects.scanlines.opacity}
                min={0}
                max={100}
                step={5}
                suffix="%"
                onValueChange={(value) =>
                  updateTheme({
                    effects: {
                      ...theme.effects,
                      scanlines: { ...theme.effects.scanlines, opacity: value },
                    },
                  })
                }
              />
              <SliderRow
                label="Speed"
                value={theme.effects.scanlines.speed}
                min={1}
                max={20}
                step={1}
                onValueChange={(value) =>
                  updateTheme({
                    effects: {
                      ...theme.effects,
                      scanlines: { ...theme.effects.scanlines, speed: value },
                    },
                  })
                }
              />
            </SettingsSection>

            {/* Glassmorphism Style */}
            <SettingsSection title="Glassmorphism" icon="albums" iconColor="#a855f7">
              <View style={styles.optionRowVertical}>
                <Text style={styles.optionLabel}>Glass Style</Text>
                <Text style={styles.optionDescription}>Visual style for glass cards</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginTop: 10 }}
                >
                  {(['default', 'frosted', 'crystal', 'neon', 'holographic'] as const).map(
                    (variant) => (
                      <TouchableOpacity
                        key={variant}
                        style={[
                          styles.glassOption,
                          theme.effects.glassmorphism === variant && styles.glassOptionSelected,
                        ]}
                        onPress={() => {
                          haptic.medium();
                          updateTheme({
                            effects: { ...theme.effects, glassmorphism: variant },
                          });
                        }}
                      >
                        <Text
                          style={[
                            styles.glassOptionText,
                            theme.effects.glassmorphism === variant &&
                              styles.glassOptionTextSelected,
                          ]}
                        >
                          {variant.charAt(0).toUpperCase() + variant.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </ScrollView>
              </View>
            </SettingsSection>
          </>
        )}

        {/* Animations Tab */}
        {activeTab === 'animations' && (
          <>
            {/* Animation Intensity */}
            <SettingsSection title="Motion Intensity" icon="pulse" iconColor="#f59e0b">
              <View style={styles.optionRowVertical}>
                <Text style={styles.optionLabel}>Overall Intensity</Text>
                <Text style={styles.optionDescription}>How dramatic animations appear</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginTop: 10 }}
                >
                  {(['minimal', 'moderate', 'intense'] as const).map((intensity) => (
                    <TouchableOpacity
                      key={intensity}
                      style={[
                        styles.densityOption,
                        theme.animations.intensity === intensity && styles.intensityOptionSelected,
                      ]}
                      onPress={() => {
                        haptic.medium();
                        updateTheme({
                          animations: { ...theme.animations, intensity },
                        });
                      }}
                    >
                      <Ionicons
                        name={
                          intensity === 'minimal'
                            ? 'remove-circle'
                            : intensity === 'moderate'
                              ? 'ellipse'
                              : 'flame'
                        }
                        size={24}
                        color={theme.animations.intensity === intensity ? '#fff' : '#9ca3af'}
                      />
                      <Text
                        style={[
                          styles.densityOptionText,
                          theme.animations.intensity === intensity &&
                            styles.densityOptionTextSelected,
                        ]}
                      >
                        {intensity.charAt(0).toUpperCase() + intensity.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </SettingsSection>

            {/* Animation Speed */}
            <SettingsSection title="Animation Speed" icon="speedometer" iconColor="#10b981">
              <SliderRow
                label="Speed Multiplier"
                value={theme.animations.speed}
                min={0.5}
                max={2.0}
                step={0.1}
                suffix="x"
                onValueChange={(value) =>
                  updateTheme({
                    animations: { ...theme.animations, speed: value },
                  })
                }
              />
            </SettingsSection>

            {/* Per-Category Toggles */}
            <SettingsSection title="Animation Categories" icon="toggle" iconColor="#8b5cf6">
              <ToggleRow
                label="Screen Transitions"
                description="Page enter/exit animations"
                value={theme.animations.categories.screenTransitions}
                onToggle={(value) =>
                  updateTheme({
                    animations: {
                      ...theme.animations,
                      categories: { ...theme.animations.categories, screenTransitions: value },
                    },
                  })
                }
              />
              <ToggleRow
                label="Component Entrance"
                description="Elements appearing on screen"
                value={theme.animations.categories.componentEntrance}
                onToggle={(value) =>
                  updateTheme({
                    animations: {
                      ...theme.animations,
                      categories: { ...theme.animations.categories, componentEntrance: value },
                    },
                  })
                }
              />
              <ToggleRow
                label="Micro-interactions"
                description="Button presses, toggles, hovers"
                value={theme.animations.categories.microInteractions}
                onToggle={(value) =>
                  updateTheme({
                    animations: {
                      ...theme.animations,
                      categories: { ...theme.animations.categories, microInteractions: value },
                    },
                  })
                }
              />
              <ToggleRow
                label="Particle Effects"
                description="Background particles and sparkles"
                value={theme.animations.categories.particleEffects}
                onToggle={(value) =>
                  updateTheme({
                    animations: {
                      ...theme.animations,
                      categories: { ...theme.animations.categories, particleEffects: value },
                    },
                  })
                }
              />
            </SettingsSection>

            {/* Spring Physics */}
            <SettingsSection title="Spring Physics" icon="leaf" iconColor="#22c55e">
              <SliderRow
                label="Tension"
                value={theme.animations.springPhysics.tension}
                min={50}
                max={300}
                step={10}
                onValueChange={(value) =>
                  updateTheme({
                    animations: {
                      ...theme.animations,
                      springPhysics: { ...theme.animations.springPhysics, tension: value },
                    },
                  })
                }
              />
              <SliderRow
                label="Friction"
                value={theme.animations.springPhysics.friction}
                min={5}
                max={40}
                step={1}
                onValueChange={(value) =>
                  updateTheme({
                    animations: {
                      ...theme.animations,
                      springPhysics: { ...theme.animations.springPhysics, friction: value },
                    },
                  })
                }
              />
            </SettingsSection>

            {/* Haptic Feedback */}
            <SettingsSection title="Haptic Feedback" icon="hand-left" iconColor="#ec4899">
              <ToggleRow
                label="Enable Haptics"
                description="Vibration feedback on interactions"
                value={theme.animations.haptics.enabled}
                onToggle={(value) =>
                  updateTheme({
                    animations: {
                      ...theme.animations,
                      haptics: { ...theme.animations.haptics, enabled: value },
                    },
                  })
                }
              />
              <View style={styles.optionRowVertical}>
                <Text style={styles.optionLabel}>Haptic Strength</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginTop: 10 }}
                >
                  {(['off', 'light', 'medium', 'strong'] as const).map((strength) => (
                    <TouchableOpacity
                      key={strength}
                      style={[
                        styles.segmentedOption,
                        theme.animations.haptics.strength === strength &&
                          styles.segmentedOptionSelected,
                      ]}
                      onPress={() => {
                        haptic.light();
                        updateTheme({
                          animations: {
                            ...theme.animations,
                            haptics: { ...theme.animations.haptics, strength },
                          },
                        });
                      }}
                    >
                      <Text
                        style={[
                          styles.segmentedOptionText,
                          theme.animations.haptics.strength === strength &&
                            styles.segmentedOptionTextSelected,
                        ]}
                      >
                        {strength.charAt(0).toUpperCase() + strength.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </SettingsSection>
          </>
        )}

        {/* Accessibility Tab */}
        {activeTab === 'accessibility' && (
          <>
            {/* Accessibility Options */}
            <SettingsSection title="Accessibility" icon="accessibility" iconColor="#3b82f6">
              <ToggleRow
                label="Reduce Motion"
                description="Minimize animations for sensitive users"
                value={theme.accessibility.reduceMotion}
                onToggle={(value) =>
                  updateTheme({
                    accessibility: { ...theme.accessibility, reduceMotion: value },
                  })
                }
              />
              <ToggleRow
                label="High Contrast"
                description="Increase text and UI contrast"
                value={theme.accessibility.highContrast}
                onToggle={(value) =>
                  updateTheme({
                    accessibility: { ...theme.accessibility, highContrast: value },
                  })
                }
              />
              <ToggleRow
                label="Large Touch Targets"
                description="Minimum 44pt touch areas"
                value={theme.accessibility.increasedTouchTargets}
                onToggle={(value) =>
                  updateTheme({
                    accessibility: { ...theme.accessibility, increasedTouchTargets: value },
                  })
                }
              />
              <ToggleRow
                label="Haptic Alternatives"
                description="Visual feedback when haptics unavailable"
                value={theme.accessibility.hapticAlternatives}
                onToggle={(value) =>
                  updateTheme({
                    accessibility: { ...theme.accessibility, hapticAlternatives: value },
                  })
                }
              />
            </SettingsSection>

            {/* Performance Mode */}
            <SettingsSection title="Performance" icon="speedometer" iconColor="#f59e0b">
              <View style={styles.optionRowVertical}>
                <Text style={styles.optionLabel}>Performance Mode</Text>
                <Text style={styles.optionDescription}>Balance between visuals and speed</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginTop: 10 }}
                >
                  {(['visual-first', 'balanced', 'performance'] as const).map((mode) => (
                    <TouchableOpacity
                      key={mode}
                      style={[
                        styles.densityOption,
                        theme.performance.mode === mode && styles.performanceOptionSelected,
                      ]}
                      onPress={() => {
                        haptic.medium();
                        updateTheme({
                          performance: { ...theme.performance, mode },
                        });
                      }}
                    >
                      <Ionicons
                        name={
                          mode === 'visual-first'
                            ? 'sparkles'
                            : mode === 'balanced'
                              ? 'scale'
                              : 'rocket'
                        }
                        size={24}
                        color={theme.performance.mode === mode ? '#fff' : '#9ca3af'}
                      />
                      <Text
                        style={[
                          styles.densityOptionText,
                          theme.performance.mode === mode && styles.densityOptionTextSelected,
                        ]}
                      >
                        {mode === 'visual-first'
                          ? 'Visual'
                          : mode === 'balanced'
                            ? 'Balanced'
                            : 'Fast'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </SettingsSection>

            {/* Battery Settings */}
            <SettingsSection title="Battery" icon="battery-charging" iconColor="#22c55e">
              <ToggleRow
                label="Battery Saver"
                description="Reduce effects to save battery"
                value={theme.performance.batterySaver}
                onToggle={(value) =>
                  updateTheme({
                    performance: { ...theme.performance, batterySaver: value },
                  })
                }
              />
              <ToggleRow
                label="Auto-Throttle"
                description="Auto-reduce effects below 20% battery"
                value={theme.performance.autoThrottle}
                onToggle={(value) =>
                  updateTheme({
                    performance: { ...theme.performance, autoThrottle: value },
                  })
                }
              />
            </SettingsSection>

            {/* Quick Presets */}
            <SettingsSection title="Quick Presets" icon="flash" iconColor="#ec4899">
              <TouchableOpacity
                style={styles.presetButton}
                onPress={() => {
                  haptic.medium();
                  updateTheme({
                    accessibility: {
                      reduceMotion: true,
                      highContrast: true,
                      increasedTouchTargets: true,
                      hapticAlternatives: true,
                    },
                    performance: {
                      mode: 'performance',
                      batterySaver: true,
                      autoThrottle: true,
                    },
                    animations: {
                      ...theme.animations,
                      speed: 2.0,
                      intensity: 'minimal',
                      categories: {
                        screenTransitions: false,
                        componentEntrance: false,
                        microInteractions: true,
                        particleEffects: false,
                      },
                    },
                    effects: {
                      ...theme.effects,
                      particles: { ...theme.effects.particles, enabled: false },
                      blur: { ...theme.effects.blur, enabled: false },
                      scanlines: { ...theme.effects.scanlines, enabled: false },
                    },
                  });
                }}
              >
                <LinearGradient
                  colors={['#3b82f6', '#2563eb']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.presetButtonGradient}
                >
                  <Ionicons name="accessibility" size={20} color="#fff" />
                  <Text style={styles.presetButtonText}>Maximum Accessibility</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetButton}
                onPress={() => {
                  haptic.medium();
                  updateTheme({
                    accessibility: {
                      reduceMotion: false,
                      highContrast: false,
                      increasedTouchTargets: false,
                      hapticAlternatives: false,
                    },
                    performance: {
                      mode: 'visual-first',
                      batterySaver: false,
                      autoThrottle: false,
                    },
                    animations: {
                      ...theme.animations,
                      speed: 1.0,
                      intensity: 'intense',
                      categories: {
                        screenTransitions: true,
                        componentEntrance: true,
                        microInteractions: true,
                        particleEffects: true,
                      },
                    },
                    effects: {
                      ...theme.effects,
                      particles: { ...theme.effects.particles, enabled: true, density: 'high' },
                      blur: { ...theme.effects.blur, enabled: true, intensity: 80 },
                      glow: { ...theme.effects.glow, enabled: true, intensity: 'intense' },
                    },
                  });
                }}
              >
                <LinearGradient
                  colors={['#8b5cf6', '#7c3aed']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.presetButtonGradient}
                >
                  <Ionicons name="sparkles" size={20} color="#fff" />
                  <Text style={styles.presetButtonText}>Maximum Effects</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetButton}
                onPress={() => {
                  haptic.medium();
                  updateTheme({
                    accessibility: {
                      reduceMotion: false,
                      highContrast: false,
                      increasedTouchTargets: false,
                      hapticAlternatives: false,
                    },
                    performance: {
                      mode: 'balanced',
                      batterySaver: false,
                      autoThrottle: true,
                    },
                    animations: {
                      ...theme.animations,
                      speed: 1.0,
                      intensity: 'moderate',
                      categories: {
                        screenTransitions: true,
                        componentEntrance: true,
                        microInteractions: true,
                        particleEffects: false,
                      },
                    },
                    effects: {
                      ...theme.effects,
                      particles: { ...theme.effects.particles, enabled: false },
                      blur: { ...theme.effects.blur, enabled: true, intensity: 40 },
                      glow: { ...theme.effects.glow, enabled: true, intensity: 'subtle' },
                    },
                  });
                }}
              >
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.presetButtonGradient}
                >
                  <Ionicons name="scale" size={20} color="#fff" />
                  <Text style={styles.presetButtonText}>Balanced Mode</Text>
                </LinearGradient>
              </TouchableOpacity>
            </SettingsSection>
          </>
        )}

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleImport}>
            <Ionicons name="cloud-download" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Import</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleExport}>
            <Ionicons name="cloud-upload" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Export</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleValidate}>
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Validate</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleReset}>
            <Ionicons name="refresh" size={20} color="#ef4444" />
            <Text style={styles.actionButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>

        {isDirty && (
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <LinearGradient
              colors={['#10b981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveButtonGradient}
            >
              <Ionicons name="save" size={22} color="#fff" />
              <Text style={styles.saveButtonText}>Save Theme</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}
