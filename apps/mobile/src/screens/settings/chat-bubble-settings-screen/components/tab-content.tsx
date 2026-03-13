/**
 * Tab content component rendering settings controls for each tab.
 * @module screens/settings/chat-bubble-settings-screen/components/tab-content
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { SettingsSection } from './settings-section';
import { ToggleRow } from './toggle-row';
import { SegmentedRow } from './segmented-row';
import { SliderRow } from './slider-row';
import { ChatBubbleStyle, presets, colorOptions } from '../types';

interface PresetsTabProps {
  onApplyPreset: (presetId: string) => void;
}

/**
 * Presets Tab component.
 *
 */
export function PresetsTab({ onApplyPreset }: PresetsTabProps) {
  return (
    <SettingsSection title="Quick Presets" icon="sparkles" iconColor="#f59e0b">
      <View style={styles.presetGrid}>
        {presets.map((preset) => (
          <TouchableOpacity
            key={preset.id}
            style={styles.presetItem}
            onPress={() => onApplyPreset(preset.id)}
          >
            <LinearGradient
              // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
              colors={preset.colors as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.presetPreview}
            />
            <Text style={styles.presetLabel}>{preset.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SettingsSection>
  );
}

interface ColorsTabProps {
  style: ChatBubbleStyle;
  updateStyle: <K extends keyof ChatBubbleStyle>(key: K, value: ChatBubbleStyle[K]) => void;
}

/**
 * Colors Tab component.
 *
 */
export function ColorsTab({ style, updateStyle }: ColorsTabProps) {
  return (
    <>
      <SettingsSection title="Your Messages" icon="chatbubble" iconColor="#10b981">
        <View style={styles.optionRowVertical}>
          <Text style={styles.optionLabel}>Background Color</Text>
          <View style={styles.colorGrid}>
            {colorOptions.map((opt) => (
              <TouchableOpacity
                key={opt.color}
                style={[
                  styles.colorOption,
                  { backgroundColor: opt.color },
                  style.ownMessageBg === opt.color && styles.colorOptionSelected,
                ]}
                onPress={() => {
                  HapticFeedback.light();
                  updateStyle('ownMessageBg', opt.color);
                }}
              >
                {style.ownMessageBg === opt.color && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </SettingsSection>

      <SettingsSection title="Other Messages" icon="chatbubbles" iconColor="#8b5cf6">
        <View style={styles.optionRowVertical}>
          <Text style={styles.optionLabel}>Background Color</Text>
          <View style={styles.colorGrid}>
            {[...colorOptions, { name: 'Gray', color: '#374151' }].map((opt) => (
              <TouchableOpacity
                key={opt.color}
                style={[
                  styles.colorOption,
                  { backgroundColor: opt.color },
                  style.otherMessageBg === opt.color && styles.colorOptionSelected,
                ]}
                onPress={() => {
                  HapticFeedback.light();
                  updateStyle('otherMessageBg', opt.color);
                }}
              >
                {style.otherMessageBg === opt.color && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </SettingsSection>

      <SettingsSection title="Effects" icon="sparkles" iconColor="#ec4899">
        <ToggleRow
          label="Use Gradient"
          description="Add gradient to your messages"
          value={style.useGradient}
          onToggle={(value) => updateStyle('useGradient', value)}
        />
        <ToggleRow
          label="Glass Effect"
          description="Translucent blur effect"
          value={style.glassEffect}
          onToggle={(value) => updateStyle('glassEffect', value)}
        />
        <SliderRow
          label="Shadow Intensity"
          value={style.shadowIntensity}
          min={0}
          max={100}
          step={10}
          onValueChange={(value) => updateStyle('shadowIntensity', value)}
        />
      </SettingsSection>
    </>
  );
}

interface ShapeTabProps {
  style: ChatBubbleStyle;
  updateStyle: <K extends keyof ChatBubbleStyle>(key: K, value: ChatBubbleStyle[K]) => void;
}

/**
 * Shape Tab component.
 *
 */
export function ShapeTab({ style, updateStyle }: ShapeTabProps) {
  return (
    <>
      <SettingsSection title="Bubble Shape" icon="shapes" iconColor="#3b82f6">
        <SliderRow
          label="Border Radius"
          value={style.borderRadius}
          min={0}
          max={32}
          step={2}
          onValueChange={(value) => updateStyle('borderRadius', value)}
        />
        <SegmentedRow
          label="Tail Style"
          options={[
            { value: 'none', label: 'None' },
            { value: 'arrow', label: 'Arrow' },
            { value: 'bubble', label: 'Bubble' },
            { value: 'subtle', label: 'Subtle' },
          ]}
          selected={style.tailStyle}
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          onSelect={(value) => updateStyle('tailStyle', value as ChatBubbleStyle['tailStyle'])}
        />
        <SliderRow
          label="Border Width"
          value={style.borderWidth}
          min={0}
          max={4}
          step={1}
          onValueChange={(value) => updateStyle('borderWidth', value)}
        />
      </SettingsSection>

      <SettingsSection title="Size" icon="resize" iconColor="#22c55e">
        <SliderRow
          label="Max Width (%)"
          value={style.maxWidth}
          min={50}
          max={95}
          step={5}
          onValueChange={(value) => updateStyle('maxWidth', value)}
        />
      </SettingsSection>
    </>
  );
}

interface LayoutTabProps {
  style: ChatBubbleStyle;
  updateStyle: <K extends keyof ChatBubbleStyle>(key: K, value: ChatBubbleStyle[K]) => void;
}

/**
 * Layout Tab component.
 *
 */
export function LayoutTab({ style, updateStyle }: LayoutTabProps) {
  return (
    <>
      <SettingsSection title="Avatar" icon="person-circle" iconColor="#8b5cf6">
        <ToggleRow
          label="Show Avatar"
          description="Display user avatars in chat"
          value={style.showAvatar}
          onToggle={(value) => updateStyle('showAvatar', value)}
        />
        <SegmentedRow
          label="Avatar Size"
          options={[
            { value: 'small', label: 'Small' },
            { value: 'medium', label: 'Medium' },
            { value: 'large', label: 'Large' },
          ]}
          selected={style.avatarSize}
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          onSelect={(value) => updateStyle('avatarSize', value as ChatBubbleStyle['avatarSize'])}
        />
      </SettingsSection>

      <SettingsSection title="Timestamp" icon="time" iconColor="#f59e0b">
        <ToggleRow
          label="Show Timestamp"
          description="Display message timestamps"
          value={style.showTimestamp}
          onToggle={(value) => updateStyle('showTimestamp', value)}
        />
        <SegmentedRow
          label="Timestamp Position"
          options={[
            { value: 'inside', label: 'Inside Bubble' },
            { value: 'outside', label: 'Outside' },
          ]}
          selected={style.timestampPosition}
          onSelect={(value) =>
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            updateStyle('timestampPosition', value as ChatBubbleStyle['timestampPosition'])
          }
        />
      </SettingsSection>

      <SettingsSection title="Alignment" icon="swap-horizontal" iconColor="#06b6d4">
        <SegmentedRow
          label="Your Messages"
          options={[
            { value: 'left', label: 'Left' },
            { value: 'right', label: 'Right' },
          ]}
          selected={style.alignSent}
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          onSelect={(value) => updateStyle('alignSent', value as ChatBubbleStyle['alignSent'])}
        />
        <SegmentedRow
          label="Other Messages"
          options={[
            { value: 'left', label: 'Left' },
            { value: 'right', label: 'Right' },
          ]}
          selected={style.alignReceived}
          onSelect={(value) =>
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            updateStyle('alignReceived', value as ChatBubbleStyle['alignReceived'])
          }
        />
        <SegmentedRow
          label="Message Spacing"
          options={[
            { value: 'compact', label: 'Compact' },
            { value: 'normal', label: 'Normal' },
            { value: 'spacious', label: 'Spacious' },
          ]}
          selected={style.spacing}
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          onSelect={(value) => updateStyle('spacing', value as ChatBubbleStyle['spacing'])}
        />
      </SettingsSection>
    </>
  );
}

const styles = StyleSheet.create({
  optionRowVertical: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#fff',
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  presetItem: {
    width: '30%',
    alignItems: 'center',
  },
  presetPreview: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    marginBottom: 6,
  },
  presetLabel: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
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
});
