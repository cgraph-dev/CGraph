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
  LivePreviewCard,
  LayoutTab,
  EffectsTab,
  AnimationsTab,
  AccessibilityTab,
} from './UICustomizationScreen/components';

// Import extracted styles
import { styles } from './UICustomizationScreen/styles';

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
        {activeTab === 'layout' && <LayoutTab theme={theme} updateTheme={updateTheme} />}

        {/* Effects Tab */}
        {activeTab === 'effects' && <EffectsTab theme={theme} updateTheme={updateTheme} />}

        {/* Animations Tab */}
        {activeTab === 'animations' && <AnimationsTab theme={theme} updateTheme={updateTheme} />}

        {/* Accessibility Tab */}
        {activeTab === 'accessibility' && (
          <AccessibilityTab theme={theme} updateTheme={updateTheme} />
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
