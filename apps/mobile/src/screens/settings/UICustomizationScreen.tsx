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
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCustomization } from '@/contexts/CustomizationContext';
import useCustomizationStore, { useIsDirty, useCanUndo, useCanRedo } from '@/stores/customizationStore';
import { PRESET_THEMES } from '@/lib/customization/PresetThemes';
import type { ThemeConfig, ColorShade } from '@/lib/customization/CustomizationEngine';
import { SettingsStackParamList } from '@/types';

type Props = {
  navigation: NativeStackNavigationProp<SettingsStackParamList, 'UICustomization'>;
};

type TabId = 'colors' | 'typography' | 'layout' | 'effects' | 'animations';

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

function SettingsSection({ title, icon, iconColor, children }: SectionProps) {
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

function ToggleRow({ label, description, value, onToggle }: ToggleRowProps) {
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

function SliderRow({ label, value, min, max, step = 1, suffix = '', onValueChange }: SliderRowProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <View style={styles.optionRowVertical}>
      <View style={styles.sliderHeader}>
        <Text style={styles.optionLabel}>{label}</Text>
        <Text style={styles.sliderValue}>{value}{suffix}</Text>
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

function ColorShadePicker({ label, shades, onSelect }: ColorShadePickerProps) {
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
  onSelect: (theme: ThemeConfig) => void;
}

function PresetSelector({ currentThemeName, onSelect }: PresetSelectorProps) {
  return (
    <View style={styles.presetSection}>
      <Text style={styles.presetTitle}>Quick Presets</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
        {PRESET_THEMES.map((theme) => {
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
// LIVE PREVIEW CARD
// ============================================================================

function LivePreviewCard() {
  const { theme, getColor, getSpacing, getBorderRadius } = useCustomization();

  return (
    <View style={styles.previewSection}>
      <Text style={styles.previewTitle}>Live Preview</Text>
      <BlurView
        intensity={theme.effects.blur.intensity}
        tint="dark"
        style={[
          styles.previewCard,
          {
            borderRadius: getBorderRadius('lg'),
            padding: getSpacing('md'),
          },
        ]}
      >
        <View style={styles.previewHeader}>
          <View style={[styles.previewAvatar, { backgroundColor: getColor('primary.500') }]}>
            <Ionicons name="person" size={24} color="#fff" />
          </View>
          <View style={styles.previewInfo}>
            <Text style={[styles.previewName, { color: getColor('text.primary') }]}>
              Sample User
            </Text>
            <Text style={[styles.previewSubtext, { color: getColor('text.secondary') }]}>
              This is how your theme looks
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.previewButton,
            {
              backgroundColor: getColor('primary.500'),
              borderRadius: getBorderRadius('md'),
            },
          ]}
        >
          <Text style={styles.previewButtonText}>Primary Button</Text>
        </View>
        <View
          style={[
            styles.previewButton,
            {
              backgroundColor: getColor('secondary.500'),
              borderRadius: getBorderRadius('md'),
            },
          ]}
        >
          <Text style={styles.previewButtonText}>Secondary Button</Text>
        </View>
      </BlurView>
    </View>
  );
}

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
    } catch (error) {
      Alert.alert('Error', 'Failed to save theme');
    }
  }, [saveTheme]);

  const handleReset = useCallback(() => {
    haptic.medium();
    Alert.alert(
      'Reset Theme',
      'Reset to default theme? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            resetTheme();
            haptic.success();
          },
        },
      ]
    );
  }, [resetTheme]);

  const handleExport = useCallback(async () => {
    haptic.medium();
    try {
      const json = exportTheme();
      await Share.share({
        message: json,
        title: `${theme.name} Theme`,
      });
    } catch (error) {
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
              } catch (error) {
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
            <SettingsSection title="Spacing" icon="resize" iconColor="#f59e0b">
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

            <SettingsSection title="Border Radius" icon="apps" iconColor="#ec4899">
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
                        theme.effects.particles.density === density && styles.segmentedOptionSelected,
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
                          theme.effects.particles.density === density && styles.segmentedOptionTextSelected,
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
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                  {(['off', 'subtle', 'moderate', 'intense'] as const).map((intensity) => (
                    <TouchableOpacity
                      key={intensity}
                      style={[
                        styles.segmentedOption,
                        theme.effects.glow.intensity === intensity && styles.segmentedOptionSelected,
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
                          theme.effects.glow.intensity === intensity && styles.segmentedOptionTextSelected,
                        ]}
                      >
                        {intensity.charAt(0).toUpperCase() + intensity.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </SettingsSection>
          </>
        )}

        {/* Animations Tab */}
        {activeTab === 'animations' && (
          <>
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
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                  {(['off', 'light', 'medium', 'strong'] as const).map((strength) => (
                    <TouchableOpacity
                      key={strength}
                      style={[
                        styles.segmentedOption,
                        theme.animations.haptics.strength === strength && styles.segmentedOptionSelected,
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
                          theme.animations.haptics.strength === strength && styles.segmentedOptionTextSelected,
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

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonDisabled: {
    opacity: 0.4,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    gap: 4,
  },
  tabActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
  },
  tabLabelActive: {
    color: '#10b981',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  previewSection: {
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  previewCard: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewInfo: {
    marginLeft: 12,
    flex: 1,
  },
  previewName: {
    fontSize: 16,
    fontWeight: '600',
  },
  previewSubtext: {
    fontSize: 13,
    marginTop: 2,
  },
  previewButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  previewButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  presetSection: {
    marginBottom: 20,
  },
  presetTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  presetScroll: {
    flexGrow: 0,
  },
  presetCard: {
    width: 100,
    height: 100,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetCardSelected: {
    borderColor: '#10b981',
  },
  presetGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 8,
  },
  presetName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  presetCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 10,
  },
  sectionContent: {
    borderRadius: 14,
    overflow: 'hidden',
    padding: 14,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  optionRowVertical: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  optionInfo: {
    flex: 1,
    marginRight: 12,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  optionDescription: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10b981',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 10,
  },
  sliderTrack: {
    flex: 1,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 2.5,
  },
  sliderButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  sliderButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorShadeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 8,
  },
  colorShadeBox: {
    width: '18%',
    aspectRatio: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  colorShadeLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  segmentedOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginRight: 8,
  },
  segmentedOptionSelected: {
    backgroundColor: '#10b981',
  },
  segmentedOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9ca3af',
  },
  segmentedOptionTextSelected: {
    color: '#fff',
  },
  bottomActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  saveButton: {
    marginTop: 10,
    borderRadius: 14,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  bottomPadding: {
    height: 40,
  },
});
