/**
 * AccessibilityTab Component
 *
 * Tab content for the Accessibility customization options.
 * Includes accessibility settings, performance mode, battery settings, and quick presets.
 */

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SettingsSection, ToggleRow, haptic } from './settings-components';
import { styles } from '../styles';
import type { ThemeConfig } from '@/lib/customization/customization-engine';

interface AccessibilityTabProps {
  theme: ThemeConfig;
  updateTheme: (update: Partial<ThemeConfig>) => void;
}

export function AccessibilityTab({ theme, updateTheme }: AccessibilityTabProps) {
  return (
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
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
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
                    mode === 'visual-first' ? 'sparkles' : mode === 'balanced' ? 'scale' : 'rocket'
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
                  {mode === 'visual-first' ? 'Visual' : mode === 'balanced' ? 'Balanced' : 'Fast'}
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
  );
}
