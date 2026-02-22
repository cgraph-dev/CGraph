/**
 * AnimationsTab Component
 *
 * Tab content for the Animations customization options.
 * Includes motion intensity, speed, categories, spring physics, and haptic feedback.
 */

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SettingsSection, ToggleRow, SliderRow, haptic } from './settings-components';
import { styles } from '../styles';
import type { ThemeConfig } from '@/lib/customization/customization-engine';

interface AnimationsTabProps {
  theme: ThemeConfig;
  updateTheme: (update: Partial<ThemeConfig>) => void;
}

export function AnimationsTab({ theme, updateTheme }: AnimationsTabProps) {
  return (
    <>
      {/* Animation Intensity */}
      <SettingsSection title="Motion Intensity" icon="pulse" iconColor="#f59e0b">
        <View style={styles.optionRowVertical}>
          <Text style={styles.optionLabel}>Overall Intensity</Text>
          <Text style={styles.optionDescription}>How dramatic animations appear</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
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
                    theme.animations.intensity === intensity && styles.densityOptionTextSelected,
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
  );
}
