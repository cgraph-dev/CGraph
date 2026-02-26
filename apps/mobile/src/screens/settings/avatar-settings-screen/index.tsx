/**
 * AvatarSettingsScreen - Customize user avatar appearance
 *
 * Provides extensive customization options for profile avatar including:
 * - Border styles (gradient, rainbow, fire, electric, neon, etc.)
 * - Border width and glow intensity
 * - Avatar shapes (circle, rounded-square, hexagon, etc.)
 * - Status indicators with positioning
 * - Quick presets for popular styles
 *
 * @version 1.0.0
 */

import React, { useState, useCallback, useEffect } from 'react';
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
import { useAuthStore, useThemeStore } from '@/stores';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { SettingsStackParamList } from '../../../types';

import { AvatarStyle } from './types';
import {
  defaultStyle,
  STORAGE_KEY,
  borderStyles,
  shapes,
  animationSpeeds,
  colorOptions,
  statusColors,
} from './constants';
import { styles } from './styles';
import { SettingsSection, OptionGrid, SliderRow } from './components';

// Re-export types
export type { AvatarStyle } from './types';

type Props = {
  navigation: NativeStackNavigationProp<SettingsStackParamList, 'AvatarSettings'>;
};

/**
 *
 */
export default function AvatarSettingsScreen({ navigation }: Props) {
  const { colors } = useThemeStore();
  const { user } = useAuthStore();
  const [style, setStyle] = useState<AvatarStyle>(defaultStyle);

  // Load style on mount
  useEffect(() => {
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

  const applyPreset = (preset: Partial<AvatarStyle>) => {
    HapticFeedback.medium();
    const newStyle = { ...defaultStyle, ...preset };
    setStyle(newStyle);
    saveStyle(newStyle);
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
              {statusColors.map((opt) => (
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
              onPress={() =>
                applyPreset({
                  borderStyle: 'rainbow',
                  animationSpeed: 'fast',
                  glowIntensity: 80,
                })
              }
            >
              <LinearGradient colors={['#ec4899', '#8b5cf6']} style={styles.presetGradient}>
                <Ionicons name="sparkles" size={24} color="#fff" />
              </LinearGradient>
              <Text style={styles.presetLabel}>Rainbow</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.presetButton}
              onPress={() =>
                applyPreset({
                  borderStyle: 'fire',
                  borderColor: '#ef4444',
                  glowIntensity: 60,
                })
              }
            >
              <LinearGradient colors={['#ef4444', '#f97316']} style={styles.presetGradient}>
                <Ionicons name="flame" size={24} color="#fff" />
              </LinearGradient>
              <Text style={styles.presetLabel}>Fire</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.presetButton}
              onPress={() =>
                applyPreset({
                  borderStyle: 'electric',
                  borderColor: '#3b82f6',
                  glowIntensity: 70,
                })
              }
            >
              <LinearGradient colors={['#3b82f6', '#06b6d4']} style={styles.presetGradient}>
                <Ionicons name="flash" size={24} color="#fff" />
              </LinearGradient>
              <Text style={styles.presetLabel}>Electric</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.presetButton}
              onPress={() =>
                applyPreset({
                  borderStyle: 'none',
                  glowIntensity: 0,
                })
              }
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
