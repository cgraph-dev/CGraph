/**
 * FilterModal – bottom-sheet style filter picker for search.
 *
 * @module screens/search/SearchScreen/components/filter-modal
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import type { ThemeColors } from '@/stores';
import { defaultFilters, type SearchFilters } from './search-types';
import { filterStyles } from './filter-modal.styles';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: SearchFilters;
  onApply: (filters: SearchFilters) => void;
  colors: ThemeColors;
  isDark: boolean;
}

/**
 * Filter Modal component.
 *
 */
export function FilterModal({
  visible,
  onClose,
  filters,
  onApply,
  colors,
  isDark,
}: FilterModalProps) {
  const [localFilters, setLocalFilters] = useState(filters);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      setLocalFilters(filters);
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 65,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, filters, slideAnim]);

  const FilterToggle = ({
    label,
    value,
    onToggle,
    icon,
  }: {
    label: string;
    value: boolean;
    onToggle: () => void;
    icon: string;
  }) => (
    <TouchableOpacity
      style={filterStyles.toggleRow}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onToggle();
      }}
      activeOpacity={0.7}
    >
      <View style={filterStyles.toggleLeft}>
        <LinearGradient
          colors={value ? ['#3b82f6', '#8b5cf6'] : [colors.surface, colors.surface]}
          style={filterStyles.toggleIcon}
        >
          <Ionicons
             
            name={icon as keyof typeof Ionicons.glyphMap}
            size={16}
            color={value ? '#fff' : colors.textSecondary}
          />
        </LinearGradient>
        <Text style={[filterStyles.toggleLabel, { color: colors.text }]}>{label}</Text>
      </View>
      <View
        style={[filterStyles.toggleSwitch, { backgroundColor: value ? '#3b82f6' : colors.surface }]}
      >
        <Animated.View
          style={[
            filterStyles.toggleKnob,
            {
              backgroundColor: '#fff',
              transform: [{ translateX: value ? 20 : 2 }],
            },
          ]}
        />
      </View>
    </TouchableOpacity>
  );

  const SortOption = ({ label, value }: { label: string; value: SearchFilters['sortBy'] }) => {
    const isActive = localFilters.sortBy === value;
    return (
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setLocalFilters({ ...localFilters, sortBy: value });
        }}
      >
        {isActive ? (
          <LinearGradient colors={['#3b82f6', '#8b5cf6']} style={filterStyles.sortOption}>
            <Text style={filterStyles.sortTextActive}>{label}</Text>
          </LinearGradient>
        ) : (
          <View style={[filterStyles.sortOption, { backgroundColor: colors.surface }]}>
            <Text style={[filterStyles.sortText, { color: colors.textSecondary }]}>{label}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={filterStyles.overlay}>
        <TouchableOpacity style={filterStyles.backdrop} onPress={onClose} activeOpacity={1} />
        <Animated.View
          style={[
            filterStyles.container,
            {
              backgroundColor: isDark ? 'rgba(17, 24, 39, 0.98)' : 'rgba(255, 255, 255, 0.98)',
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <BlurView
            intensity={80}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
          <View style={filterStyles.content}>
            <View style={filterStyles.header}>
              <Text style={[filterStyles.title, { color: colors.text }]}>Search Filters</Text>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setLocalFilters(defaultFilters);
                }}
              >
                <Text style={filterStyles.resetText}>Reset</Text>
              </TouchableOpacity>
            </View>

            <View style={filterStyles.section}>
              <Text style={[filterStyles.sectionTitle, { color: colors.textSecondary }]}>
                FILTER OPTIONS
              </Text>
              <FilterToggle
                label="Verified Only"
                value={localFilters.verifiedOnly}
                onToggle={() =>
                  setLocalFilters({ ...localFilters, verifiedOnly: !localFilters.verifiedOnly })
                }
                icon="checkmark-circle"
              />
              <FilterToggle
                label="Premium Users Only"
                value={localFilters.premiumOnly}
                onToggle={() =>
                  setLocalFilters({ ...localFilters, premiumOnly: !localFilters.premiumOnly })
                }
                icon="star"
              />
              <FilterToggle
                label="Has Profile Picture"
                value={localFilters.hasAvatar}
                onToggle={() =>
                  setLocalFilters({ ...localFilters, hasAvatar: !localFilters.hasAvatar })
                }
                icon="person-circle"
              />
            </View>

            <View style={filterStyles.section}>
              <Text style={[filterStyles.sectionTitle, { color: colors.textSecondary }]}>
                SORT BY
              </Text>
              <View style={filterStyles.sortRow}>
                <SortOption label="Relevance" value="relevance" />
                <SortOption label="Recent" value="recent" />
                <SortOption label="Popular" value="popular" />
              </View>
            </View>

            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onApply(localFilters);
                onClose();
              }}
            >
              <LinearGradient
                colors={['#3b82f6', '#8b5cf6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={filterStyles.applyButton}
              >
                <Text style={filterStyles.applyText}>Apply Filters</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
