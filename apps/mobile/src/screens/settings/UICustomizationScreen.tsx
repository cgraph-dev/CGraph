import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Animated,
  Share,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../contexts/ThemeContext';
import GlassCard from '../../components/ui/GlassCard';
import { HapticFeedback, AnimationColors } from '@/lib/animations/AnimationEngine';
import { SettingsStackParamList } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<SettingsStackParamList, 'UICustomization'>;
};

// ============================================================================
// TYPES
// ============================================================================

export interface UIPreferences {
  // Theme & Colors
  theme: 'dark' | 'darker' | 'midnight' | 'amoled';
  primaryColor: string;
  accentColor: string;
  backgroundStyle: 'solid' | 'gradient' | 'animated';

  // Glass Effects
  glassEffect: 'none' | 'default' | 'frosted' | 'crystal' | 'holographic';
  glassBlur: number;
  glassOpacity: number;
  glowIntensity: number;

  // Animations
  animationSpeed: 'instant' | 'fast' | 'normal' | 'slow';
  animationIntensity: 'minimal' | 'low' | 'medium' | 'high';
  enableTransitions: boolean;
  enableHoverEffects: boolean;
  enableParallax: boolean;

  // Particles & Effects
  particleSystem: 'none' | 'minimal' | 'medium' | 'heavy';
  showAmbientEffects: boolean;
  showGlowEffects: boolean;
  showShadows: boolean;

  // Typography
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  fontWeight: 'light' | 'normal' | 'medium' | 'bold';

  // Spacing & Layout
  spacing: 'compact' | 'normal' | 'comfortable' | 'spacious';
  borderRadius: number;

  // Performance
  reducedMotion: boolean;
  hardwareAcceleration: boolean;
  lazyLoadImages: boolean;

  // Accessibility
  highContrast: boolean;
  largeClickTargets: boolean;
  enableHapticFeedback: boolean;
  enableSoundEffects: boolean;
}

const defaultPreferences: UIPreferences = {
  theme: 'dark',
  primaryColor: '#10b981',
  accentColor: '#8b5cf6',
  backgroundStyle: 'gradient',

  glassEffect: 'holographic',
  glassBlur: 20,
  glassOpacity: 15,
  glowIntensity: 50,

  animationSpeed: 'normal',
  animationIntensity: 'high',
  enableTransitions: true,
  enableHoverEffects: true,
  enableParallax: true,

  particleSystem: 'medium',
  showAmbientEffects: true,
  showGlowEffects: true,
  showShadows: true,

  fontSize: 'medium',
  fontWeight: 'normal',

  spacing: 'normal',
  borderRadius: 12,

  reducedMotion: false,
  hardwareAcceleration: true,
  lazyLoadImages: true,

  highContrast: false,
  largeClickTargets: false,
  enableHapticFeedback: true,
  enableSoundEffects: false,
};

const STORAGE_KEY = 'cgraph-ui-preferences';

// ============================================================================
// COLOR PRESETS
// ============================================================================

const colorPresets = [
  { name: 'Emerald', primary: '#10b981', accent: '#8b5cf6' },
  { name: 'Ocean', primary: '#3b82f6', accent: '#06b6d4' },
  { name: 'Sunset', primary: '#f59e0b', accent: '#ef4444' },
  { name: 'Berry', primary: '#ec4899', accent: '#8b5cf6' },
  { name: 'Forest', primary: '#22c55e', accent: '#84cc16' },
  { name: 'Royal', primary: '#6366f1', accent: '#a855f7' },
  { name: 'Fire', primary: '#ef4444', accent: '#f97316' },
  { name: 'Mint', primary: '#2dd4bf', accent: '#22d3ee' },
];

// ============================================================================
// SETTINGS SECTION COMPONENT
// ============================================================================

interface SectionProps {
  title: string;
  icon: string;
  iconColor: string;
  children: React.ReactNode;
}

function SettingsSection({ title, icon, iconColor, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIcon, { backgroundColor: iconColor + '20' }]}>
          <Ionicons name={icon as any} size={18} color={iconColor} />
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
          HapticFeedback.light();
          onToggle(newValue);
        }}
        trackColor={{ false: '#374151', true: '#10b981' }}
        thumbColor={value ? '#fff' : '#9ca3af'}
      />
    </View>
  );
}

interface SegmentedRowProps {
  label: string;
  description?: string;
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
}

function SegmentedRow({ label, description, options, selected, onSelect }: SegmentedRowProps) {
  return (
    <View style={styles.optionRowVertical}>
      <View style={styles.optionInfo}>
        <Text style={styles.optionLabel}>{label}</Text>
        {description && <Text style={styles.optionDescription}>{description}</Text>}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.segmentedControl}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.segmentedOption,
              selected === option.value && styles.segmentedOptionSelected,
            ]}
            onPress={() => {
              HapticFeedback.light();
              onSelect(option.value);
            }}
          >
            <Text
              style={[
                styles.segmentedOptionText,
                selected === option.value && styles.segmentedOptionTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onValueChange: (value: number) => void;
}

function SliderRow({ label, value, min, max, step = 1, onValueChange }: SliderRowProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <View style={styles.optionRowVertical}>
      <View style={styles.sliderHeader}>
        <Text style={styles.optionLabel}>{label}</Text>
        <Text style={styles.sliderValue}>{value}</Text>
      </View>
      <View style={styles.sliderContainer}>
        <View style={styles.sliderTrack}>
          <View style={[styles.sliderFill, { width: `${percentage}%` }]} />
        </View>
        <View style={styles.sliderButtons}>
          <TouchableOpacity
            style={styles.sliderButton}
            onPress={() => {
              HapticFeedback.light();
              onValueChange(Math.max(min, value - step));
            }}
          >
            <Ionicons name="remove" size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sliderButton}
            onPress={() => {
              HapticFeedback.light();
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

// ============================================================================
// COLOR PICKER COMPONENT
// ============================================================================

interface ColorPickerProps {
  label: string;
  presets: typeof colorPresets;
  selectedPrimary: string;
  selectedAccent: string;
  onSelect: (primary: string, accent: string) => void;
}

function ColorPicker({ label, presets, selectedPrimary, selectedAccent, onSelect }: ColorPickerProps) {
  return (
    <View style={styles.optionRowVertical}>
      <Text style={styles.optionLabel}>{label}</Text>
      <View style={styles.colorGrid}>
        {presets.map((preset) => {
          const isSelected = preset.primary === selectedPrimary && preset.accent === selectedAccent;
          return (
            <TouchableOpacity
              key={preset.name}
              style={[styles.colorPreset, isSelected && styles.colorPresetSelected]}
              onPress={() => {
                HapticFeedback.medium();
                onSelect(preset.primary, preset.accent);
              }}
            >
              <LinearGradient
                colors={[preset.primary, preset.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.colorPresetGradient}
              />
              <Text style={styles.colorPresetName}>{preset.name}</Text>
              {isSelected && (
                <View style={styles.colorPresetCheck}>
                  <Ionicons name="checkmark" size={12} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function UICustomizationScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [preferences, setPreferences] = useState<UIPreferences>(defaultPreferences);
  const [activeTab, setActiveTab] = useState<'theme' | 'effects' | 'animations' | 'accessibility'>('theme');

  // Load preferences on mount
  React.useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPreferences({ ...defaultPreferences, ...JSON.parse(stored) });
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  };

  const savePreferences = async (newPrefs: UIPreferences) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPrefs));
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  };

  const updatePreference = useCallback(<K extends keyof UIPreferences>(
    key: K,
    value: UIPreferences[K]
  ) => {
    setPreferences((prev) => {
      const newPrefs = { ...prev, [key]: value };
      savePreferences(newPrefs);
      return newPrefs;
    });
  }, []);

  const resetToDefaults = () => {
    HapticFeedback.medium();
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all UI customization settings to their defaults?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setPreferences(defaultPreferences);
            savePreferences(defaultPreferences);
            HapticFeedback.success();
          },
        },
      ]
    );
  };

  const exportPreferences = async () => {
    HapticFeedback.medium();
    try {
      await Share.share({
        message: JSON.stringify(preferences, null, 2),
        title: 'CGraph UI Preferences',
      });
    } catch (error) {
      console.error('Failed to export:', error);
    }
  };

  const tabs = [
    { id: 'theme' as const, label: 'Theme', icon: 'color-palette' },
    { id: 'effects' as const, label: 'Effects', icon: 'sparkles' },
    { id: 'animations' as const, label: 'Motion', icon: 'flash' },
    { id: 'accessibility' as const, label: 'Access', icon: 'accessibility' },
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
            HapticFeedback.light();
            navigation.goBack();
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>UI Customization</Text>
          <Text style={styles.headerSubtitle}>Personalize your experience</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={exportPreferences}>
            <Ionicons name="share-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={resetToDefaults}>
            <Ionicons name="refresh" size={22} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => {
              HapticFeedback.light();
              setActiveTab(tab.id);
            }}
          >
            <Ionicons
              name={tab.icon as any}
              size={20}
              color={activeTab === tab.id ? '#10b981' : '#6b7280'}
            />
            <Text
              style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}
            >
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
        {/* Theme Tab */}
        {activeTab === 'theme' && (
          <>
            <SettingsSection title="Color Scheme" icon="color-palette" iconColor="#ec4899">
              <ColorPicker
                label="Choose a Color Theme"
                presets={colorPresets}
                selectedPrimary={preferences.primaryColor}
                selectedAccent={preferences.accentColor}
                onSelect={(primary, accent) => {
                  updatePreference('primaryColor', primary);
                  updatePreference('accentColor', accent);
                }}
              />
            </SettingsSection>

            <SettingsSection title="Theme Style" icon="moon" iconColor="#8b5cf6">
              <SegmentedRow
                label="Dark Mode Intensity"
                options={[
                  { value: 'dark', label: 'Dark' },
                  { value: 'darker', label: 'Darker' },
                  { value: 'midnight', label: 'Midnight' },
                  { value: 'amoled', label: 'AMOLED' },
                ]}
                selected={preferences.theme}
                onSelect={(value) => updatePreference('theme', value as UIPreferences['theme'])}
              />
              <SegmentedRow
                label="Background Style"
                options={[
                  { value: 'solid', label: 'Solid' },
                  { value: 'gradient', label: 'Gradient' },
                  { value: 'animated', label: 'Animated' },
                ]}
                selected={preferences.backgroundStyle}
                onSelect={(value) => updatePreference('backgroundStyle', value as UIPreferences['backgroundStyle'])}
              />
            </SettingsSection>

            <SettingsSection title="Typography" icon="text" iconColor="#3b82f6">
              <SegmentedRow
                label="Font Size"
                options={[
                  { value: 'small', label: 'S' },
                  { value: 'medium', label: 'M' },
                  { value: 'large', label: 'L' },
                  { value: 'xlarge', label: 'XL' },
                ]}
                selected={preferences.fontSize}
                onSelect={(value) => updatePreference('fontSize', value as UIPreferences['fontSize'])}
              />
              <SegmentedRow
                label="Font Weight"
                options={[
                  { value: 'light', label: 'Light' },
                  { value: 'normal', label: 'Normal' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'bold', label: 'Bold' },
                ]}
                selected={preferences.fontWeight}
                onSelect={(value) => updatePreference('fontWeight', value as UIPreferences['fontWeight'])}
              />
            </SettingsSection>
          </>
        )}

        {/* Effects Tab */}
        {activeTab === 'effects' && (
          <>
            <SettingsSection title="Glass Effects" icon="sparkles" iconColor="#06b6d4">
              <SegmentedRow
                label="Glass Style"
                options={[
                  { value: 'none', label: 'None' },
                  { value: 'default', label: 'Default' },
                  { value: 'frosted', label: 'Frosted' },
                  { value: 'crystal', label: 'Crystal' },
                  { value: 'holographic', label: 'Holo' },
                ]}
                selected={preferences.glassEffect}
                onSelect={(value) => updatePreference('glassEffect', value as UIPreferences['glassEffect'])}
              />
              <SliderRow
                label="Glass Blur"
                value={preferences.glassBlur}
                min={0}
                max={50}
                step={5}
                onValueChange={(value) => updatePreference('glassBlur', value)}
              />
              <SliderRow
                label="Glass Opacity"
                value={preferences.glassOpacity}
                min={0}
                max={100}
                step={5}
                onValueChange={(value) => updatePreference('glassOpacity', value)}
              />
              <SliderRow
                label="Glow Intensity"
                value={preferences.glowIntensity}
                min={0}
                max={100}
                step={10}
                onValueChange={(value) => updatePreference('glowIntensity', value)}
              />
            </SettingsSection>

            <SettingsSection title="Particles & Ambient" icon="planet" iconColor="#f59e0b">
              <SegmentedRow
                label="Particle System"
                options={[
                  { value: 'none', label: 'Off' },
                  { value: 'minimal', label: 'Min' },
                  { value: 'medium', label: 'Med' },
                  { value: 'heavy', label: 'Heavy' },
                ]}
                selected={preferences.particleSystem}
                onSelect={(value) => updatePreference('particleSystem', value as UIPreferences['particleSystem'])}
              />
              <ToggleRow
                label="Ambient Effects"
                description="Subtle background animations"
                value={preferences.showAmbientEffects}
                onToggle={(value) => updatePreference('showAmbientEffects', value)}
              />
              <ToggleRow
                label="Glow Effects"
                description="Light glow around interactive elements"
                value={preferences.showGlowEffects}
                onToggle={(value) => updatePreference('showGlowEffects', value)}
              />
              <ToggleRow
                label="Shadows"
                description="Drop shadows on cards and buttons"
                value={preferences.showShadows}
                onToggle={(value) => updatePreference('showShadows', value)}
              />
            </SettingsSection>

            <SettingsSection title="Layout" icon="grid" iconColor="#22c55e">
              <SegmentedRow
                label="Content Spacing"
                options={[
                  { value: 'compact', label: 'Compact' },
                  { value: 'normal', label: 'Normal' },
                  { value: 'comfortable', label: 'Comfy' },
                  { value: 'spacious', label: 'Spacious' },
                ]}
                selected={preferences.spacing}
                onSelect={(value) => updatePreference('spacing', value as UIPreferences['spacing'])}
              />
              <SliderRow
                label="Border Radius"
                value={preferences.borderRadius}
                min={0}
                max={24}
                step={2}
                onValueChange={(value) => updatePreference('borderRadius', value)}
              />
            </SettingsSection>
          </>
        )}

        {/* Animations Tab */}
        {activeTab === 'animations' && (
          <>
            <SettingsSection title="Animation Settings" icon="flash" iconColor="#f59e0b">
              <SegmentedRow
                label="Animation Speed"
                options={[
                  { value: 'instant', label: 'Instant' },
                  { value: 'fast', label: 'Fast' },
                  { value: 'normal', label: 'Normal' },
                  { value: 'slow', label: 'Slow' },
                ]}
                selected={preferences.animationSpeed}
                onSelect={(value) => updatePreference('animationSpeed', value as UIPreferences['animationSpeed'])}
              />
              <SegmentedRow
                label="Animation Intensity"
                options={[
                  { value: 'minimal', label: 'Min' },
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Med' },
                  { value: 'high', label: 'High' },
                ]}
                selected={preferences.animationIntensity}
                onSelect={(value) => updatePreference('animationIntensity', value as UIPreferences['animationIntensity'])}
              />
            </SettingsSection>

            <SettingsSection title="Animation Toggles" icon="toggle" iconColor="#8b5cf6">
              <ToggleRow
                label="Transitions"
                description="Smooth transitions between screens"
                value={preferences.enableTransitions}
                onToggle={(value) => updatePreference('enableTransitions', value)}
              />
              <ToggleRow
                label="Hover Effects"
                description="Interactive feedback on touch"
                value={preferences.enableHoverEffects}
                onToggle={(value) => updatePreference('enableHoverEffects', value)}
              />
              <ToggleRow
                label="Parallax Effects"
                description="Depth effect on scroll"
                value={preferences.enableParallax}
                onToggle={(value) => updatePreference('enableParallax', value)}
              />
            </SettingsSection>

            <SettingsSection title="Performance" icon="speedometer" iconColor="#10b981">
              <ToggleRow
                label="Reduced Motion"
                description="Minimize animations for accessibility"
                value={preferences.reducedMotion}
                onToggle={(value) => updatePreference('reducedMotion', value)}
              />
              <ToggleRow
                label="Hardware Acceleration"
                description="Use GPU for smoother animations"
                value={preferences.hardwareAcceleration}
                onToggle={(value) => updatePreference('hardwareAcceleration', value)}
              />
              <ToggleRow
                label="Lazy Load Images"
                description="Load images as they appear on screen"
                value={preferences.lazyLoadImages}
                onToggle={(value) => updatePreference('lazyLoadImages', value)}
              />
            </SettingsSection>
          </>
        )}

        {/* Accessibility Tab */}
        {activeTab === 'accessibility' && (
          <>
            <SettingsSection title="Visual Accessibility" icon="eye" iconColor="#3b82f6">
              <ToggleRow
                label="High Contrast"
                description="Increase text and border contrast"
                value={preferences.highContrast}
                onToggle={(value) => updatePreference('highContrast', value)}
              />
              <ToggleRow
                label="Large Touch Targets"
                description="Bigger buttons for easier tapping"
                value={preferences.largeClickTargets}
                onToggle={(value) => updatePreference('largeClickTargets', value)}
              />
            </SettingsSection>

            <SettingsSection title="Feedback" icon="hand-left" iconColor="#ec4899">
              <ToggleRow
                label="Haptic Feedback"
                description="Vibration feedback on interactions"
                value={preferences.enableHapticFeedback}
                onToggle={(value) => updatePreference('enableHapticFeedback', value)}
              />
              <ToggleRow
                label="Sound Effects"
                description="Audio feedback on actions"
                value={preferences.enableSoundEffects}
                onToggle={(value) => updatePreference('enableSoundEffects', value)}
              />
            </SettingsSection>

            <SettingsSection title="Quick Actions" icon="flash" iconColor="#f59e0b">
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  HapticFeedback.medium();
                  updatePreference('reducedMotion', true);
                  updatePreference('animationIntensity', 'minimal');
                  updatePreference('particleSystem', 'none');
                  updatePreference('showAmbientEffects', false);
                }}
              >
                <LinearGradient
                  colors={['#3b82f6', '#2563eb']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.actionButtonGradient}
                >
                  <Ionicons name="accessibility" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Enable Accessibility Mode</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  HapticFeedback.medium();
                  updatePreference('animationIntensity', 'high');
                  updatePreference('glassEffect', 'holographic');
                  updatePreference('particleSystem', 'medium');
                  updatePreference('showAmbientEffects', true);
                  updatePreference('showGlowEffects', true);
                }}
              >
                <LinearGradient
                  colors={['#8b5cf6', '#7c3aed']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.actionButtonGradient}
                >
                  <Ionicons name="sparkles" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Enable Premium Effects</Text>
                </LinearGradient>
              </TouchableOpacity>
            </SettingsSection>
          </>
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
    paddingTop: 56,
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
    fontSize: 14,
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
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    gap: 6,
  },
  tabActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  tabLabel: {
    fontSize: 12,
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
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 10,
  },
  sectionContent: {
    borderRadius: 16,
    overflow: 'hidden',
    padding: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  optionRowVertical: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  optionInfo: {
    flex: 1,
    marginRight: 12,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#fff',
  },
  optionDescription: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 2,
  },
  segmentedControl: {
    marginTop: 10,
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
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 12,
  },
  sliderTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
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
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 10,
  },
  colorPreset: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorPresetSelected: {
    borderColor: '#fff',
  },
  colorPresetGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 6,
  },
  colorPresetName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  colorPresetCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButton: {
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 10,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  bottomPadding: {
    height: 40,
  },
});
