/**
 * ProfileThemePicker — modal for choosing a primary + accent
 * color pair that tints the profile card.
 *
 * Layout:
 *   Top     – 2×5 swatch grid of preset themes
 *   Middle  – "Primary" and "Accent" inline color pickers
 *             (12-color palette + hex text input each)
 *   Right   – live ProfileCard preview with theme applied
 *   Bottom  – "Apply" button
 *
 * Selecting a preset fills both pickers automatically.
 * Editing either picker switches the active preset to "Custom".
 *
 * @module profile/pickers/ProfileThemePicker
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  SafeAreaView,
  ScrollView,
  TextInput,
} from 'react-native';
import {
  PROFILE_THEME_PRESETS,
  DEFAULT_PROFILE_THEME,
  type ProfileTheme,
} from '@cgraph/animation-constants/src/registries/profileThemes';
import { NAME_COLORS } from '@cgraph/animation-constants/src/registries/displayNameStyles';
import { useThemeStore } from '@/stores';

// ─── Props ───────────────────────────────────────────────────────────────────

interface ProfileThemePickerProps {
  /** Currently applied theme */
  current?: ProfileTheme;
  /** Called with the chosen theme when user taps "Apply" */
  onApply: (theme: ProfileTheme) => void;
  /** Optional close handler */
  onClose?: () => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SWATCH_SIZE = 48;
const COLOR_DOT_SIZE = 32;
const HEX_REGEX = /^#[0-9a-fA-F]{6}$/;

// ─── Component ───────────────────────────────────────────────────────────────
/** Profile theme color picker with presets and custom hex inputs. */ export function ProfileThemePicker({
  current,
  onApply,
  onClose,
}: ProfileThemePickerProps) {
  const { colors } = useThemeStore();
  const { width: screenWidth } = useWindowDimensions();
  const isWide = screenWidth > 600;

  // ── State ────────────────────────────────────────────────────────────────
  const [primary, setPrimary] = useState(current?.primary ?? DEFAULT_PROFILE_THEME.primary);
  const [accent, setAccent] = useState(current?.accent ?? DEFAULT_PROFILE_THEME.accent);
  const [activePresetId, setActivePresetId] = useState<string>(() => {
    const match = PROFILE_THEME_PRESETS.find((p) => p.primary === primary && p.accent === accent);
    return match?.id ?? 'theme_custom';
  });
  const [primaryHexInput, setPrimaryHexInput] = useState(primary);
  const [accentHexInput, setAccentHexInput] = useState(accent);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const selectPreset = useCallback((id: string) => {
    const preset = PROFILE_THEME_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    setActivePresetId(id);
    if (preset.primary !== null && preset.accent !== null) {
      setPrimary(preset.primary);
      setAccent(preset.accent);
      setPrimaryHexInput(preset.primary);
      setAccentHexInput(preset.accent);
    }
  }, []);

  const updatePrimary = useCallback((hex: string) => {
    setPrimary(hex);
    setPrimaryHexInput(hex);
    setActivePresetId('theme_custom');
  }, []);

  const updateAccent = useCallback((hex: string) => {
    setAccent(hex);
    setAccentHexInput(hex);
    setActivePresetId('theme_custom');
  }, []);

  const commitPrimaryHex = useCallback(() => {
    if (HEX_REGEX.test(primaryHexInput)) {
      setPrimary(primaryHexInput);
      setActivePresetId('theme_custom');
    } else {
      setPrimaryHexInput(primary);
    }
  }, [primaryHexInput, primary]);

  const commitAccentHex = useCallback(() => {
    if (HEX_REGEX.test(accentHexInput)) {
      setAccent(accentHexInput);
      setActivePresetId('theme_custom');
    } else {
      setAccentHexInput(accent);
    }
  }, [accentHexInput, accent]);

  const handleApply = useCallback(() => {
    onApply({ primary, accent });
  }, [onApply, primary, accent]);

  // ── Preset swatch grid ───────────────────────────────────────────────────

  const presetGrid = (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Preset Themes</Text>
      <View style={styles.presetGrid}>
        {PROFILE_THEME_PRESETS.map((preset) => {
          const isActive = preset.id === activePresetId;
          const showPrimary = preset.primary ?? primary;
          const showAccent = preset.accent ?? accent;
          return (
            <Pressable
              key={preset.id}
              onPress={() => selectPreset(preset.id)}
              style={[
                styles.presetSwatch,
                isActive && { borderColor: colors.primary, borderWidth: 2 },
              ]}
              accessibilityLabel={preset.name}
              accessibilityRole="button"
            >
              {/* Two-circle swatch: primary left, accent right */}
              <View style={styles.swatchCircles}>
                <View
                  style={[styles.swatchHalf, styles.swatchLeft, { backgroundColor: showPrimary }]}
                />
                <View
                  style={[styles.swatchHalf, styles.swatchRight, { backgroundColor: showAccent }]}
                />
              </View>
              <Text style={[styles.presetLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                {preset.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  // ── Inline color picker (reused for both channels) ───────────────────────

  const renderColorPicker = (
    label: string,
    value: string,
    hexInput: string,
    onSelect: (hex: string) => void,
    onHexChange: (text: string) => void,
    onHexCommit: () => void
  ) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{label}</Text>

      {/* 4×3 color palette */}
      <View style={styles.colorGrid}>
        {NAME_COLORS.map((hex) => (
          <Pressable
            key={hex}
            onPress={() => onSelect(hex)}
            style={[
              styles.colorDot,
              { backgroundColor: hex },
              value === hex && {
                borderColor: colors.primary,
                borderWidth: 2,
              },
            ]}
            accessibilityLabel={hex}
            accessibilityRole="button"
          />
        ))}
      </View>

      {/* Hex text input */}
      <View style={styles.hexRow}>
        <Text style={[styles.hexLabel, { color: colors.textSecondary }]}>Hex</Text>
        <TextInput
          style={[
            styles.hexInput,
            {
              color: colors.text,
              borderColor: colors.border,
              backgroundColor: colors.surface,
            },
          ]}
          value={hexInput}
          onChangeText={onHexChange}
          onBlur={onHexCommit}
          onSubmitEditing={onHexCommit}
          maxLength={7}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel={`${label} hex value`}
        />
        <View style={[styles.hexPreview, { backgroundColor: value }]} />
      </View>
    </View>
  );

  // ── Live preview panel ───────────────────────────────────────────────────

  const previewPanel = (
    <View
      style={[
        styles.previewPanel,
        { backgroundColor: colors.background, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>Preview</Text>
      {/* Mini profile card preview */}
      <View style={[styles.miniCard, { backgroundColor: primary }]}>
        {/* Simulated banner area */}
        <View style={[styles.miniBanner, { backgroundColor: primary }]} />

        {/* Avatar placeholder */}
        <View style={styles.miniAvatarWrap}>
          <View style={[styles.miniAvatar, { borderColor: primary }]} />
        </View>

        {/* Name + handle placeholders */}
        <View style={styles.miniTextArea}>
          <View style={[styles.miniNameBar, { backgroundColor: accent }]} />
          <View style={[styles.miniHandleBar, { backgroundColor: `${accent}66` }]} />
        </View>

        {/* Simulated action button */}
        <View style={[styles.miniButton, { backgroundColor: accent }]}>
          <Text style={styles.miniButtonText}>Edit Profile</Text>
        </View>
      </View>
    </View>
  );

  // ── Layout ───────────────────────────────────────────────────────────────

  const controls = (
    <ScrollView
      style={styles.scrollArea}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {presetGrid}

      {renderColorPicker(
        'Primary (Background)',
        primary,
        primaryHexInput,
        updatePrimary,
        setPrimaryHexInput,
        commitPrimaryHex
      )}

      {renderColorPicker(
        'Accent (Buttons & Highlights)',
        accent,
        accentHexInput,
        updateAccent,
        setAccentHexInput,
        commitAccentHex
      )}
    </ScrollView>
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        {onClose ? (
          <Pressable onPress={onClose} accessibilityRole="button">
            <Text style={[styles.headerAction, { color: colors.primary }]}>Cancel</Text>
          </Pressable>
        ) : (
          <View style={styles.headerSpacer} />
        )}
        <Text style={[styles.headerTitle, { color: colors.text }]}>Profile Theme</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Body */}
      {isWide ? (
        <View style={styles.wideBody}>
          <View style={styles.wideLeft}>{controls}</View>
          <View style={styles.wideRight}>{previewPanel}</View>
        </View>
      ) : (
        <View style={styles.narrowBody}>
          {previewPanel}
          {controls}
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Pressable
          style={[styles.applyButton, { backgroundColor: accent }]}
          onPress={handleApply}
          accessibilityRole="button"
          accessibilityLabel="Apply theme"
        >
          <Text style={styles.applyButtonText}>Apply</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export default ProfileThemePicker;

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerAction: {
    fontSize: 15,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 60,
  },

  // Body layouts
  wideBody: {
    flex: 1,
    flexDirection: 'row',
  },
  wideLeft: {
    flex: 1,
  },
  wideRight: {
    width: 260,
    padding: 16,
  },
  narrowBody: {
    flex: 1,
  },

  // Scroll
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 20,
  },

  // Section
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // Preset grid (2×5)
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  presetSwatch: {
    width: SWATCH_SIZE + 16,
    alignItems: 'center',
    gap: 4,
    padding: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  swatchCircles: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE / 2,
    flexDirection: 'row',
    borderRadius: SWATCH_SIZE / 4,
    overflow: 'hidden',
  },
  swatchHalf: {
    flex: 1,
  },
  swatchLeft: {
    borderTopLeftRadius: SWATCH_SIZE / 4,
    borderBottomLeftRadius: SWATCH_SIZE / 4,
  },
  swatchRight: {
    borderTopRightRadius: SWATCH_SIZE / 4,
    borderBottomRightRadius: SWATCH_SIZE / 4,
  },
  presetLabel: {
    fontSize: 10,
    fontWeight: '600',
  },

  // Color grid (4×3)
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorDot: {
    width: COLOR_DOT_SIZE,
    height: COLOR_DOT_SIZE,
    borderRadius: COLOR_DOT_SIZE / 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },

  // Hex input row
  hexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hexLabel: {
    fontSize: 13,
    fontWeight: '600',
    width: 30,
  },
  hexInput: {
    flex: 1,
    height: 36,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    fontSize: 14,
    fontFamily: 'monospace',
  },
  hexPreview: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },

  // Preview panel
  previewPanel: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },

  // Mini card preview
  miniCard: {
    borderRadius: 10,
    overflow: 'hidden',
    gap: 8,
  },
  miniBanner: {
    height: 48,
    opacity: 0.7,
  },
  miniAvatarWrap: {
    marginTop: -20,
    paddingLeft: 12,
  },
  miniAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    backgroundColor: '#6b7280',
  },
  miniTextArea: {
    paddingHorizontal: 12,
    gap: 4,
  },
  miniNameBar: {
    height: 12,
    width: 80,
    borderRadius: 3,
  },
  miniHandleBar: {
    height: 8,
    width: 56,
    borderRadius: 3,
  },
  miniButton: {
    marginHorizontal: 12,
    marginBottom: 10,
    marginTop: 4,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },

  // Footer
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  applyButton: {
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
