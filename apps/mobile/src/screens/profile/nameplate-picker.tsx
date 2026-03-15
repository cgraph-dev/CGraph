/**
 * NameplatePicker — horizontal scroll of nameplate style previews.
 *
 * Each option shows "CGraph Dev" rendered in the nameplate style.
 * Tap to select. Current selection gets a highlight ring.
 *
 * @module profile/screens/NameplatePicker
 */

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useThemeStore } from '@/stores';
import { NAMEPLATE_STYLES } from '../../modules/profile/components/profile-card/nameplate';

interface NameplatePickerProps {
  /** Currently selected nameplate ID */
  currentNameplateId?: string;
  /** Callback when a nameplate is selected */
  onSelect: (nameplateId: string) => void;
}

const PREVIEW_TEXT = 'CGraph Dev';

/**
 * Horizontal scrollable nameplate style picker.
 */
export function NameplatePicker({ currentNameplateId, onSelect }: NameplatePickerProps) {
  const { colors } = useThemeStore();
  const nameplateIds = Object.keys(NAMEPLATE_STYLES);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>Nameplate Style</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {nameplateIds.map((id) => {
          const style = NAMEPLATE_STYLES[id];
          const isSelected = id === (currentNameplateId ?? 'default');

          return (
            <TouchableOpacity
              key={id}
              style={[
                styles.option,
                { backgroundColor: colors.surface },
                isSelected && { borderColor: colors.primary, borderWidth: 2 },
              ]}
              onPress={() => onSelect(id)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.previewText,
                  {
                    color: style.color,
                    fontStyle: style.fontStyle ?? 'normal',
                    ...(style.shadowColor && {
                      textShadowColor: style.shadowColor,
                      textShadowOffset: { width: 0, height: 0 },
                      textShadowRadius: style.shadowRadius ?? 0,
                    }),
                  },
                ]}
              >
                {PREVIEW_TEXT}
              </Text>
              <Text style={[styles.nameLabel, { color: colors.textSecondary }]}>
                {id.replace(/_/g, ' ')}
              </Text>
              {isSelected && (
                <View style={[styles.selectedDot, { backgroundColor: colors.primary }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    minWidth: 120,
    alignItems: 'center',
    gap: 4,
  },
  previewText: {
    fontSize: 16,
    fontWeight: '700',
  },
  nameLabel: {
    fontSize: 10,
    textTransform: 'capitalize',
  },
  selectedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
});
