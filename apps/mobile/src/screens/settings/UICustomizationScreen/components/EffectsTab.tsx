/**
 * EffectsTab Component
 *
 * Tab content for the Effects customization options.
 * Includes blur, particles, glow, border gradients, scanlines, and glassmorphism.
 */

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SettingsSection, ToggleRow, SliderRow, haptic } from './SettingsComponents';
import { styles } from '../styles';
import type { ThemeConfig } from '@/lib/customization/CustomizationEngine';

interface EffectsTabProps {
  theme: ThemeConfig;
  updateTheme: (update: Partial<ThemeConfig>) => void;
}

export function EffectsTab({ theme, updateTheme }: EffectsTabProps) {
  return (
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
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
            {(['default', 'frosted', 'crystal', 'neon', 'holographic'] as const).map((variant) => (
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
                    theme.effects.glassmorphism === variant && styles.glassOptionTextSelected,
                  ]}
                >
                  {variant.charAt(0).toUpperCase() + variant.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </SettingsSection>
    </>
  );
}
