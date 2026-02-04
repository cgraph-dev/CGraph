import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import AnimatedAvatar from '../../components/ui/AnimatedAvatar';
import { SettingsStackParamList } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<SettingsStackParamList, 'AvatarSettings'>;
};

// ============================================================================
// TYPES
// ============================================================================

export interface AvatarStyle {
  borderStyle:
    | 'none'
    | 'solid'
    | 'gradient'
    | 'rainbow'
    | 'pulse'
    | 'spin'
    | 'glow'
    | 'neon'
    | 'fire'
    | 'electric';
  borderWidth: number;
  borderColor: string;
  glowIntensity: number;
  animationSpeed: 'none' | 'slow' | 'normal' | 'fast';
  shape: 'circle' | 'rounded-square' | 'hexagon' | 'octagon' | 'shield' | 'diamond';
  statusIndicator: 'dot' | 'ring' | 'none';
  statusColor: string;
  showBadge: boolean;
  badgePosition: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
}

const defaultStyle: AvatarStyle = {
  borderStyle: 'gradient',
  borderWidth: 3,
  borderColor: '#10b981',
  glowIntensity: 50,
  animationSpeed: 'normal',
  shape: 'circle',
  statusIndicator: 'dot',
  statusColor: '#22c55e',
  showBadge: true,
  badgePosition: 'bottom-right',
};

const STORAGE_KEY = 'cgraph-avatar-style';

// ============================================================================
// CONSTANTS
// ============================================================================

const borderStyles: AvatarStyle['borderStyle'][] = [
  'none',
  'solid',
  'gradient',
  'rainbow',
  'pulse',
  'spin',
  'glow',
  'neon',
  'fire',
  'electric',
];

const shapes: AvatarStyle['shape'][] = [
  'circle',
  'rounded-square',
  'hexagon',
  'octagon',
  'shield',
  'diamond',
];

const animationSpeeds: AvatarStyle['animationSpeed'][] = ['none', 'slow', 'normal', 'fast'];

const colorOptions = [
  { name: 'Emerald', color: '#10b981' },
  { name: 'Blue', color: '#3b82f6' },
  { name: 'Purple', color: '#8b5cf6' },
  { name: 'Pink', color: '#ec4899' },
  { name: 'Orange', color: '#f59e0b' },
  { name: 'Red', color: '#ef4444' },
  { name: 'Teal', color: '#14b8a6' },
  { name: 'Yellow', color: '#eab308' },
];

// ============================================================================
// COMPONENTS
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
          <Ionicons name={icon as unknown} size={18} color={iconColor} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <BlurView intensity={40} tint="dark" style={styles.sectionContent}>
        {children}
      </BlurView>
    </View>
  );
}

interface OptionGridProps {
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
  columns?: number;
}

function OptionGrid({ options, selected, onSelect, columns = 4 }: OptionGridProps) {
  return (
    <View style={[styles.optionGrid, { flexWrap: 'wrap' }]}>
      {options.map((option) => (
        <TouchableOpacity
          key={option}
          style={[
            styles.optionButton,
            { width: `${100 / columns - 2}%` },
            selected === option && styles.optionButtonSelected,
          ]}
          onPress={() => {
            HapticFeedback.light();
            onSelect(option);
          }}
        >
          <Text
            style={[
              styles.optionButtonText,
              selected === option && styles.optionButtonTextSelected,
            ]}
          >
            {option.replace('-', '\n')}
          </Text>
        </TouchableOpacity>
      ))}
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
    <View style={styles.sliderRow}>
      <View style={styles.sliderHeader}>
        <Text style={styles.sliderLabel}>{label}</Text>
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
// MAIN COMPONENT
// ============================================================================

export default function AvatarSettingsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [style, setStyle] = useState<AvatarStyle>(defaultStyle);

  // Load style on mount
  React.useEffect(() => {
    loadStyle();
  }, []);

  const loadStyle = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setStyle({ ...defaultStyle, ...JSON.parse(stored) });
      }
    } catch (error) {
      console.error('Failed to load style:', error);
    }
  };

  const saveStyle = async (newStyle: AvatarStyle) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newStyle));
    } catch (error) {
      console.error('Failed to save style:', error);
    }
  };

  const updateStyle = useCallback(<K extends keyof AvatarStyle>(key: K, value: AvatarStyle[K]) => {
    setStyle((prev) => {
      const newStyle = { ...prev, [key]: value };
      saveStyle(newStyle);
      return newStyle;
    });
  }, []);

  const resetToDefaults = () => {
    HapticFeedback.medium();
    Alert.alert('Reset Settings', 'Are you sure you want to reset avatar settings to defaults?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          setStyle(defaultStyle);
          saveStyle(defaultStyle);
          HapticFeedback.success();
        },
      },
    ]);
  };

  const exportStyle = async () => {
    HapticFeedback.medium();
    try {
      await Share.share({
        message: JSON.stringify(style, null, 2),
        title: 'CGraph Avatar Style',
      });
    } catch (error) {
      console.error('Failed to export:', error);
    }
  };

  // Get border gradient based on style
  const getBorderGradient = (): [string, string] => {
    switch (style.borderStyle) {
      case 'rainbow':
        return ['#ec4899', '#8b5cf6'];
      case 'fire':
        return ['#ef4444', '#f97316'];
      case 'electric':
        return ['#3b82f6', '#06b6d4'];
      case 'neon':
        return ['#22c55e', '#10b981'];
      default:
        return [style.borderColor, '#8b5cf6'];
    }
  };

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
          <Text style={styles.headerTitle}>Avatar Settings</Text>
          <Text style={styles.headerSubtitle}>Customize your profile picture</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={exportStyle}>
            <Ionicons name="share-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={resetToDefaults}>
            <Ionicons name="refresh" size={22} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Preview */}
      <View style={styles.previewContainer}>
        <BlurView intensity={40} tint="dark" style={styles.previewContent}>
          <Text style={styles.previewTitle}>Live Preview</Text>
          <View style={styles.avatarPreview}>
            <LinearGradient
              colors={
                style.borderStyle !== 'none' ? getBorderGradient() : ['transparent', 'transparent']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.avatarBorder,
                {
                  borderRadius:
                    style.shape === 'circle' ? 60 : style.shape === 'rounded-square' ? 20 : 60,
                  padding: style.borderWidth,
                },
                style.glowIntensity > 0 && {
                  shadowColor: style.borderColor,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: style.glowIntensity / 100,
                  shadowRadius: style.glowIntensity / 5,
                },
              ]}
            >
              <View
                style={[
                  styles.avatarInner,
                  {
                    borderRadius:
                      style.shape === 'circle' ? 54 : style.shape === 'rounded-square' ? 16 : 54,
                  },
                ]}
              >
                {user?.avatar_url ? (
                  <Image
                    source={{ uri: user.avatar_url }}
                    style={[
                      styles.avatarImage,
                      {
                        borderRadius:
                          style.shape === 'circle'
                            ? 54
                            : style.shape === 'rounded-square'
                              ? 16
                              : 54,
                      },
                    ]}
                  />
                ) : (
                  <LinearGradient
                    colors={['#10b981', '#059669']}
                    style={[
                      styles.avatarPlaceholder,
                      {
                        borderRadius:
                          style.shape === 'circle'
                            ? 54
                            : style.shape === 'rounded-square'
                              ? 16
                              : 54,
                      },
                    ]}
                  >
                    <Text style={styles.avatarInitial}>
                      {user?.display_name?.[0]?.toUpperCase() || 'U'}
                    </Text>
                  </LinearGradient>
                )}
              </View>
            </LinearGradient>
            {style.statusIndicator !== 'none' && (
              <View
                style={[
                  styles.statusIndicator,
                  style.statusIndicator === 'ring' && styles.statusRing,
                  { backgroundColor: style.statusColor },
                  style.badgePosition === 'top-right' && { top: 4, right: 4 },
                  style.badgePosition === 'top-left' && { top: 4, left: 4 },
                  style.badgePosition === 'bottom-right' && { bottom: 4, right: 4 },
                  style.badgePosition === 'bottom-left' && { bottom: 4, left: 4 },
                ]}
              />
            )}
          </View>
          <Text style={styles.previewSubtitle}>{user?.display_name || 'Username'}</Text>
        </BlurView>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Border Style */}
        <SettingsSection title="Border Style" icon="ellipse-outline" iconColor="#8b5cf6">
          <OptionGrid
            options={borderStyles}
            selected={style.borderStyle}
            onSelect={(value) => updateStyle('borderStyle', value as AvatarStyle['borderStyle'])}
            columns={5}
          />
        </SettingsSection>

        {/* Border Settings */}
        <SettingsSection title="Border Settings" icon="color-wand" iconColor="#ec4899">
          <SliderRow
            label="Border Width"
            value={style.borderWidth}
            min={0}
            max={10}
            step={1}
            onValueChange={(value) => updateStyle('borderWidth', value)}
          />
          <View style={styles.colorSection}>
            <Text style={styles.colorLabel}>Border Color</Text>
            <View style={styles.colorGrid}>
              {colorOptions.map((opt) => (
                <TouchableOpacity
                  key={opt.color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: opt.color },
                    style.borderColor === opt.color && styles.colorOptionSelected,
                  ]}
                  onPress={() => {
                    HapticFeedback.light();
                    updateStyle('borderColor', opt.color);
                  }}
                >
                  {style.borderColor === opt.color && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <SliderRow
            label="Glow Intensity"
            value={style.glowIntensity}
            min={0}
            max={100}
            step={10}
            onValueChange={(value) => updateStyle('glowIntensity', value)}
          />
        </SettingsSection>

        {/* Animation */}
        <SettingsSection title="Animation" icon="flash" iconColor="#f59e0b">
          <Text style={styles.optionSubtitle}>Animation Speed</Text>
          <OptionGrid
            options={animationSpeeds}
            selected={style.animationSpeed}
            onSelect={(value) =>
              updateStyle('animationSpeed', value as AvatarStyle['animationSpeed'])
            }
          />
        </SettingsSection>

        {/* Shape */}
        <SettingsSection title="Avatar Shape" icon="shapes" iconColor="#3b82f6">
          <OptionGrid
            options={shapes}
            selected={style.shape}
            onSelect={(value) => updateStyle('shape', value as AvatarStyle['shape'])}
            columns={3}
          />
        </SettingsSection>

        {/* Status Indicator */}
        <SettingsSection title="Status Indicator" icon="radio-button-on" iconColor="#22c55e">
          <Text style={styles.optionSubtitle}>Indicator Style</Text>
          <OptionGrid
            options={['none', 'dot', 'ring'] as AvatarStyle['statusIndicator'][]}
            selected={style.statusIndicator}
            onSelect={(value) =>
              updateStyle('statusIndicator', value as AvatarStyle['statusIndicator'])
            }
            columns={3}
          />
          <View style={styles.colorSection}>
            <Text style={styles.colorLabel}>Status Color</Text>
            <View style={styles.colorGrid}>
              {[
                { name: 'Online', color: '#22c55e' },
                { name: 'Away', color: '#f59e0b' },
                { name: 'Busy', color: '#ef4444' },
                { name: 'Purple', color: '#8b5cf6' },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: opt.color },
                    style.statusColor === opt.color && styles.colorOptionSelected,
                  ]}
                  onPress={() => {
                    HapticFeedback.light();
                    updateStyle('statusColor', opt.color);
                  }}
                >
                  {style.statusColor === opt.color && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <Text style={styles.optionSubtitle}>Badge Position</Text>
          <OptionGrid
            options={
              [
                'top-right',
                'bottom-right',
                'top-left',
                'bottom-left',
              ] as AvatarStyle['badgePosition'][]
            }
            selected={style.badgePosition}
            onSelect={(value) =>
              updateStyle('badgePosition', value as AvatarStyle['badgePosition'])
            }
          />
        </SettingsSection>

        {/* Quick Presets */}
        <SettingsSection title="Quick Presets" icon="sparkles" iconColor="#06b6d4">
          <View style={styles.presetGrid}>
            <TouchableOpacity
              style={styles.presetButton}
              onPress={() => {
                HapticFeedback.medium();
                setStyle({
                  ...defaultStyle,
                  borderStyle: 'rainbow',
                  animationSpeed: 'fast',
                  glowIntensity: 80,
                });
                saveStyle({
                  ...defaultStyle,
                  borderStyle: 'rainbow',
                  animationSpeed: 'fast',
                  glowIntensity: 80,
                });
              }}
            >
              <LinearGradient colors={['#ec4899', '#8b5cf6']} style={styles.presetGradient}>
                <Ionicons name="sparkles" size={24} color="#fff" />
              </LinearGradient>
              <Text style={styles.presetLabel}>Rainbow</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.presetButton}
              onPress={() => {
                HapticFeedback.medium();
                setStyle({
                  ...defaultStyle,
                  borderStyle: 'fire',
                  borderColor: '#ef4444',
                  glowIntensity: 60,
                });
                saveStyle({
                  ...defaultStyle,
                  borderStyle: 'fire',
                  borderColor: '#ef4444',
                  glowIntensity: 60,
                });
              }}
            >
              <LinearGradient colors={['#ef4444', '#f97316']} style={styles.presetGradient}>
                <Ionicons name="flame" size={24} color="#fff" />
              </LinearGradient>
              <Text style={styles.presetLabel}>Fire</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.presetButton}
              onPress={() => {
                HapticFeedback.medium();
                setStyle({
                  ...defaultStyle,
                  borderStyle: 'electric',
                  borderColor: '#3b82f6',
                  glowIntensity: 70,
                });
                saveStyle({
                  ...defaultStyle,
                  borderStyle: 'electric',
                  borderColor: '#3b82f6',
                  glowIntensity: 70,
                });
              }}
            >
              <LinearGradient colors={['#3b82f6', '#06b6d4']} style={styles.presetGradient}>
                <Ionicons name="flash" size={24} color="#fff" />
              </LinearGradient>
              <Text style={styles.presetLabel}>Electric</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.presetButton}
              onPress={() => {
                HapticFeedback.medium();
                setStyle({
                  ...defaultStyle,
                  borderStyle: 'none',
                  glowIntensity: 0,
                });
                saveStyle({
                  ...defaultStyle,
                  borderStyle: 'none',
                  glowIntensity: 0,
                });
              }}
            >
              <View style={[styles.presetGradient, { backgroundColor: '#374151' }]}>
                <Ionicons name="remove-circle" size={24} color="#9ca3af" />
              </View>
              <Text style={styles.presetLabel}>Minimal</Text>
            </TouchableOpacity>
          </View>
        </SettingsSection>

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
  previewContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  previewContent: {
    padding: 24,
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 16,
  },
  avatarPreview: {
    position: 'relative',
  },
  avatarBorder: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: 108,
    height: 108,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 40,
    fontWeight: '700',
    color: '#fff',
  },
  statusIndicator: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#111827',
  },
  statusRing: {
    borderWidth: 2,
    backgroundColor: 'transparent',
    borderColor: undefined,
  },
  previewSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginTop: 12,
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
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionButtonSelected: {
    backgroundColor: '#10b981',
  },
  optionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9ca3af',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  optionButtonTextSelected: {
    color: '#fff',
  },
  optionSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9ca3af',
    marginBottom: 10,
    marginTop: 12,
  },
  sliderRow: {
    paddingVertical: 12,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#fff',
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
  colorSection: {
    paddingVertical: 12,
  },
  colorLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9ca3af',
    marginBottom: 10,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#fff',
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  presetButton: {
    width: '22%',
    alignItems: 'center',
  },
  presetGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  presetLabel: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '500',
  },
  bottomPadding: {
    height: 40,
  },
});
