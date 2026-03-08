/* eslint-disable check-file/filename-naming-convention, @typescript-eslint/consistent-type-assertions */
/**
 * NameStylePicker — modal for customizing display name font, effect, and color.
 *
 * 3 sections in a single scrollable modal:
 *   1. Choose Font — 2-column grid of "Gg" previews
 *   2. Choose Effect — horizontal pill buttons
 *   3. Choose Color — 4×3 color palette grid + custom color input
 * Right panel: live DisplayName preview
 * Bottom: "Surprise Me" + "Apply" buttons
 *
 * @module profile/pickers/NameStylePicker
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
  type TextStyle,
} from 'react-native';
import {
  NAME_FONTS,
  NAME_FONT_KEYS,
  NAME_EFFECTS,
  NAME_EFFECT_KEYS,
  NAME_COLORS,
  type NameFont,
  type NameEffect,
} from '@cgraph/animation-constants/src/registries/displayNameStyles';
import { useThemeStore } from '@/stores';
import { DisplayName } from '../components/DisplayName';

// ─── Props ───────────────────────────────────────────────────────────────────

interface NameStylePickerProps {
  /** The user's display name for live preview */
  displayName: string;
  /** Currently equipped font */
  equippedFont: NameFont;
  /** Currently equipped effect */
  equippedEffect: NameEffect;
  /** Currently equipped color */
  equippedColor: string;
  /** Currently equipped secondary color */
  equippedSecondaryColor?: string;
  /** Called when user taps "Apply" */
  onApply: (font: NameFont, effect: NameEffect, color: string, secondaryColor?: string) => void;
  /** Optional close handler */
  onClose?: () => void;
}

// ─── Main Component ──────────────────────────────────────────────────────────
/** Display name customization modal with font, effect, and color pickers. */ export function NameStylePicker({
  displayName,
  equippedFont,
  equippedEffect,
  equippedColor,
  equippedSecondaryColor,
  onApply,
  onClose,
}: NameStylePickerProps) {
  const { colors } = useThemeStore();
  const { width: screenWidth } = useWindowDimensions();

  const [selectedFont, setSelectedFont] = useState<NameFont>(equippedFont);
  const [selectedEffect, setSelectedEffect] = useState<NameEffect>(equippedEffect);
  const [selectedColor, setSelectedColor] = useState<string>(equippedColor);
  const [selectedSecondary, setSelectedSecondary] = useState<string | undefined>(
    equippedSecondaryColor
  );
  const [customColorInput, setCustomColorInput] = useState<string>('');

  const isWide = screenWidth > 600;

  // Grid cell width for 2-column font grid
  const fontGridPadding = 12;
  const fontGridGap = 10;
  const fontCellWidth = Math.floor(
    ((isWide ? screenWidth * 0.45 : screenWidth) - fontGridPadding * 2 - fontGridGap) / 2
  );

  // Color grid: 4 columns
  const colorCellSize = Math.floor(
    ((isWide ? screenWidth * 0.45 : screenWidth) - fontGridPadding * 2 - 8 * 3) / 4
  );

  // ── Surprise Me ─────────────────────────────────────────────────────────

  const handleSurpriseMe = useCallback(() => {
    const randomFont = NAME_FONT_KEYS[Math.floor(Math.random() * NAME_FONT_KEYS.length)];
    const randomEffect = NAME_EFFECT_KEYS[Math.floor(Math.random() * NAME_EFFECT_KEYS.length)];
    const randomColor = NAME_COLORS[Math.floor(Math.random() * NAME_COLORS.length)];
    setSelectedFont(randomFont);
    setSelectedEffect(randomEffect);
    setSelectedColor(randomColor);
    // Random secondary for gradient
    const randomSecondary = NAME_COLORS[Math.floor(Math.random() * NAME_COLORS.length)];
    setSelectedSecondary(randomSecondary);
  }, []);

  // ── Custom color handler ────────────────────────────────────────────────

  const handleCustomColor = useCallback(() => {
    const hex = customColorInput.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(hex) || /^#[0-9a-fA-F]{3}$/.test(hex)) {
      setSelectedColor(hex);
      setCustomColorInput('');
    }
  }, [customColorInput]);

  // ── Sections ────────────────────────────────────────────────────────────

  const fontSection = (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Choose Font</Text>
      <View style={styles.fontGrid}>
        {NAME_FONT_KEYS.map((key) => {
          const config = NAME_FONTS[key];
          const isSelected = key === selectedFont;
          return (
            <Pressable
              key={key}
              onPress={() => setSelectedFont(key)}
              style={[
                styles.fontCell,
                {
                  width: fontCellWidth,
                  borderColor: isSelected ? colors.primary : colors.border,
                  backgroundColor: isSelected ? `${colors.primary}22` : colors.surfaceHover,
                },
              ]}
            >
              <Text
                style={[
                  styles.fontPreviewText,
                  {
                    color: isSelected ? colors.primary : colors.text,
                    fontFamily: config.fontFamily,
                    fontWeight: (config.fontWeight as TextStyle['fontWeight']) ?? '600',
                    fontStyle: config.fontStyle ?? 'normal',
                    letterSpacing: config.letterSpacing ?? 0,
                  },
                ]}
              >
                Gg
              </Text>
              <Text
                style={[
                  styles.fontLabel,
                  { color: isSelected ? colors.primary : colors.textSecondary },
                ]}
              >
                {config.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  const effectSection = (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Choose Effect</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.effectRow}
      >
        {NAME_EFFECT_KEYS.map((key) => {
          const config = NAME_EFFECTS[key];
          const isSelected = key === selectedEffect;
          return (
            <Pressable
              key={key}
              onPress={() => setSelectedEffect(key)}
              style={[
                styles.effectPill,
                {
                  backgroundColor: isSelected ? colors.primary : colors.surfaceHover,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.effectPillText,
                  { color: isSelected ? '#ffffff' : colors.textSecondary },
                ]}
              >
                {config.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Effect description */}
      <Text style={[styles.effectDescription, { color: colors.textSecondary }]}>
        {NAME_EFFECTS[selectedEffect].description}
      </Text>
    </View>
  );

  const colorSection = (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Choose Color</Text>
      <View style={styles.colorGrid}>
        {NAME_COLORS.map((c) => {
          const isSelected = c === selectedColor;
          return (
            <Pressable
              key={c}
              onPress={() => setSelectedColor(c)}
              style={[
                styles.colorCell,
                {
                  width: colorCellSize,
                  height: colorCellSize,
                  backgroundColor: c,
                  borderColor: isSelected ? '#ffffff' : 'transparent',
                  borderWidth: isSelected ? 3 : 0,
                },
              ]}
            >
              {isSelected && <Text style={styles.colorCheck}>✓</Text>}
            </Pressable>
          );
        })}
      </View>

      {/* Custom color input */}
      <View style={styles.customColorRow}>
        <TextInput
          style={[
            styles.customColorInput,
            {
              color: colors.text,
              borderColor: colors.border,
              backgroundColor: colors.surfaceHover,
            },
          ]}
          placeholder="#ff00ff"
          placeholderTextColor={colors.textSecondary}
          value={customColorInput}
          onChangeText={setCustomColorInput}
          autoCapitalize="none"
          maxLength={7}
        />
        <Pressable
          onPress={handleCustomColor}
          style={[styles.customColorButton, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.customColorButtonText}>Set</Text>
        </Pressable>
      </View>

      {/* Secondary color for gradient */}
      {selectedEffect === 'gradient' && (
        <View style={styles.secondaryColorSection}>
          <Text style={[styles.secondaryLabel, { color: colors.textSecondary }]}>
            Gradient end color:
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.secondaryColorRow}
          >
            {NAME_COLORS.map((c) => {
              const isSelected = c === selectedSecondary;
              return (
                <Pressable
                  key={`sec-${c}`}
                  onPress={() => setSelectedSecondary(c)}
                  style={[
                    styles.secondaryColorDot,
                    {
                      backgroundColor: c,
                      borderColor: isSelected ? '#ffffff' : 'transparent',
                      borderWidth: isSelected ? 2 : 0,
                    },
                  ]}
                />
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );

  // ── Preview panel ───────────────────────────────────────────────────────

  const previewSection = (
    <View style={[styles.previewSection, { width: isWide ? '50%' : '100%' }]}>
      <View style={[styles.previewBox, { backgroundColor: '#111827' }]}>
        <DisplayName
          name={displayName}
          font={selectedFont}
          effect={selectedEffect}
          color={selectedColor}
          secondaryColor={selectedSecondary}
          size={28}
        />
      </View>
      <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>Live Preview</Text>
    </View>
  );

  // ── Action bar ──────────────────────────────────────────────────────────

  const actionBar = (
    <View
      style={[styles.actionBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}
    >
      <View style={styles.actionRow}>
        <Pressable
          style={[styles.surpriseButton, { borderColor: colors.border }]}
          onPress={handleSurpriseMe}
        >
          <Text style={[styles.surpriseButtonText, { color: colors.text }]}>🎲 Surprise Me</Text>
        </Pressable>
        <Pressable
          style={[styles.applyButton, { backgroundColor: colors.primary }]}
          onPress={() => onApply(selectedFont, selectedEffect, selectedColor, selectedSecondary)}
        >
          <Text style={styles.applyButtonText}>Apply</Text>
        </Pressable>
      </View>
    </View>
  );

  // ── Root ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Name Style</Text>
        {onClose && (
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={[styles.closeButtonText, { color: colors.textSecondary }]}>✕</Text>
          </Pressable>
        )}
      </View>

      {/* Body */}
      <View style={[styles.body, isWide && styles.bodyWide]}>
        {/* Controls scroll */}
        <ScrollView
          style={[styles.controlsSection, { width: isWide ? '50%' : '100%' }]}
          contentContainerStyle={styles.controlsContent}
          showsVerticalScrollIndicator={false}
        >
          {fontSection}
          {effectSection}
          {colorSection}
        </ScrollView>

        {/* Preview */}
        {previewSection}
      </View>

      {/* Action bar */}
      {actionBar}
    </SafeAreaView>
  );
}

export default NameStylePicker;

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
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
  },

  // Body
  body: {
    flex: 1,
  },
  bodyWide: {
    flexDirection: 'row',
  },

  // Controls
  controlsSection: {
    flex: 1,
  },
  controlsContent: {
    paddingBottom: 24,
  },

  // Section generic
  section: {
    paddingHorizontal: 12,
    paddingTop: 16,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },

  // Font grid — 2 columns
  fontGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  fontCell: {
    height: 72,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  fontPreviewText: {
    fontSize: 28,
  },
  fontLabel: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Effect pills
  effectRow: {
    gap: 8,
    paddingVertical: 4,
  },
  effectPill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  effectPillText: {
    fontSize: 14,
    fontWeight: '600',
  },
  effectDescription: {
    fontSize: 12,
    marginTop: 2,
  },

  // Color grid — 4 columns
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorCell: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCheck: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    textShadowColor: '#000000',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },

  // Custom color
  customColorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  customColorInput: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  customColorButton: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customColorButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },

  // Secondary color (gradient)
  secondaryColorSection: {
    marginTop: 8,
    gap: 6,
  },
  secondaryLabel: {
    fontSize: 12,
  },
  secondaryColorRow: {
    gap: 6,
    paddingVertical: 2,
  },
  secondaryColorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },

  // Preview
  previewSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  previewBox: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Action bar
  actionBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  surpriseButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  surpriseButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
