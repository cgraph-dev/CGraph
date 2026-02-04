/**
 * SearchScreen Components
 *
 * Reusable UI components for the search screen including loaders,
 * trending items, voice search, and filter modals.
 *
 * @module screens/search/SearchScreen/components
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
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import type { ThemeColors } from '../../../../contexts/ThemeContext';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// SKELETON LOADER
// ============================================================================

interface SkeletonLoaderProps {
  isDark: boolean;
}

export function SkeletonLoader({ isDark }: SkeletonLoaderProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.ease,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.ease,
        }),
      ])
    ).start();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={skeletonStyles.container}>
      {[1, 2, 3].map((i) => (
        <Animated.View
          key={i}
          style={[
            skeletonStyles.item,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
              opacity,
            },
          ]}
        >
          <View
            style={[
              skeletonStyles.avatar,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' },
            ]}
          />
          <View style={skeletonStyles.content}>
            <View
              style={[
                skeletonStyles.line,
                {
                  width: '60%',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
                },
              ]}
            />
            <View
              style={[
                skeletonStyles.line,
                {
                  width: '40%',
                  marginTop: 8,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                },
              ]}
            />
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  container: { gap: 12 },
  item: { flexDirection: 'row', padding: 12, borderRadius: 14, alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 14 },
  content: { flex: 1, marginLeft: 12 },
  line: { height: 12, borderRadius: 6 },
});

// ============================================================================
// TRENDING ITEM
// ============================================================================

interface TrendingItemData {
  text: string;
  icon: string;
  color: string;
  searches: number;
}

interface TrendingItemProps {
  item: TrendingItemData;
  onPress: () => void;
  isDark: boolean;
}

export function TrendingItem({ item, onPress, isDark }: TrendingItemProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [pulseAnim, glowAnim]);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  return (
    <TouchableOpacity
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      activeOpacity={0.7}
    >
      <Animated.View
        style={[
          trendingStyles.item,
          {
            transform: [{ scale: pulseAnim }],
            shadowColor: item.color,
            shadowOpacity: 0.3,
          },
        ]}
      >
        <Animated.View
          style={[
            trendingStyles.glowOverlay,
            { backgroundColor: item.color, opacity: glowOpacity },
          ]}
        />
        <LinearGradient
          colors={[item.color, `${item.color}99`]}
          style={trendingStyles.iconContainer}
        >
          <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={16} color="#fff" />
        </LinearGradient>
        <View style={trendingStyles.textContainer}>
          <Text
            style={[trendingStyles.text, { color: isDark ? '#fff' : '#1f2937' }]}
            numberOfLines={1}
          >
            {item.text}
          </Text>
          <Text style={trendingStyles.searchCount}>{item.searches.toLocaleString()} searches</Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={14}
          color={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.3)'}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

const trendingStyles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    marginRight: 12,
    minWidth: 180,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  glowOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 14,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginLeft: 10,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
  searchCount: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
});

// ============================================================================
// VOICE SEARCH BUTTON
// ============================================================================

interface VoiceSearchButtonProps {
  onPress: () => void;
  isListening: boolean;
  colors: ThemeColors;
}

export function VoiceSearchButton({ onPress, isListening, colors }: VoiceSearchButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const waveAnim1 = useRef(new Animated.Value(0)).current;
  const waveAnim2 = useRef(new Animated.Value(0)).current;
  const waveAnim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.1, duration: 300, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        ])
      ).start();

      const createWave = (anim: Animated.Value, delay: number) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(anim, { toValue: 0.3, duration: 400, useNativeDriver: true }),
          ])
        );

      createWave(waveAnim1, 0).start();
      createWave(waveAnim2, 100).start();
      createWave(waveAnim3, 200).start();
    } else {
      scaleAnim.setValue(1);
      waveAnim1.setValue(0);
      waveAnim2.setValue(0);
      waveAnim3.setValue(0);
    }
  }, [isListening, scaleAnim, waveAnim1, waveAnim2, waveAnim3]);

  return (
    <TouchableOpacity
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      activeOpacity={0.7}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <LinearGradient
          colors={isListening ? ['#ef4444', '#f97316'] : [colors.surface, colors.surface]}
          style={voiceStyles.button}
        >
          {isListening ? (
            <View style={voiceStyles.waveContainer}>
              <Animated.View style={[voiceStyles.wave, { transform: [{ scaleY: waveAnim1 }] }]} />
              <Animated.View style={[voiceStyles.wave, { transform: [{ scaleY: waveAnim2 }] }]} />
              <Animated.View style={[voiceStyles.wave, { transform: [{ scaleY: waveAnim3 }] }]} />
            </View>
          ) : (
            <Ionicons name="mic" size={20} color={colors.textSecondary} />
          )}
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

const voiceStyles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  wave: {
    width: 4,
    height: 16,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
});

// ============================================================================
// ANIMATED RESULT ITEM
// ============================================================================

interface AnimatedResultItemProps {
  children: React.ReactNode;
  index: number;
  onPress: () => void;
}

export function AnimatedResultItem({ children, index, onPress }: AnimatedResultItemProps) {
  const translateX = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    const delay = index * 80;
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: 400,
        delay,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.2)),
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.1)),
      }),
    ]).start();
  }, [index, translateX, opacity, scale]);

  return (
    <Animated.View
      style={{
        transform: [{ translateX }, { scale }],
        opacity,
      }}
    >
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        activeOpacity={0.8}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ============================================================================
// FILTER MODAL (Exported separately due to size)
// ============================================================================

export interface SearchFilters {
  verifiedOnly: boolean;
  premiumOnly: boolean;
  hasAvatar: boolean;
  dateRange: 'all' | 'today' | 'week' | 'month';
  sortBy: 'relevance' | 'recent' | 'popular';
}

export const defaultFilters: SearchFilters = {
  verifiedOnly: false,
  premiumOnly: false,
  hasAvatar: false,
  dateRange: 'all',
  sortBy: 'relevance',
};

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: SearchFilters;
  onApply: (filters: SearchFilters) => void;
  colors: ThemeColors;
  isDark: boolean;
}

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

const filterStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  resetText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  toggleSwitch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 2,
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  sortRow: {
    flexDirection: 'row',
    gap: 10,
  },
  sortOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  sortText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sortTextActive: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  applyButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  applyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
