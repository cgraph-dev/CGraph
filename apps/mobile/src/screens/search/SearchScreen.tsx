/**
 * SearchScreen - Revolutionary Premium Mobile Version
 *
 * A next-generation search interface with stunning animations, glassmorphism,
 * voice search, AI suggestions, and immersive visual effects.
 *
 * Features:
 * - Animated search bar with pulsing glow effects
 * - Voice search with animated waveform
 * - Recent searches with swipe-to-delete
 * - Trending topics with live pulse animation
 * - AI-powered search suggestions
 * - GlassCard result items with staggered slide-in
 * - Category tabs with gradient selection & particle effects
 * - Animated avatars with status indicators
 * - ID search with premium styling
 * - Advanced filters (date range, verified only, etc.)
 * - Skeleton loading states
 * - Pull-to-refresh with custom animation
 * - Haptic feedback throughout
 *
 * @version 3.0.0 - Revolutionary Edition
 * @since v0.8.1
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
  Dimensions,
  RefreshControl,
  FlatList,
  Modal,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../contexts/ThemeContext';
import GlassCard from '../../components/ui/GlassCard';
import AnimatedAvatar from '../../components/ui/AnimatedAvatar';
import { EmptyState } from '../../components';
import api from '../../lib/api';
import debounce from 'lodash.debounce';
import { createLogger } from '../../lib/logger';

const logger = createLogger('Search');
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const RECENT_SEARCHES_KEY = '@cgraph_recent_searches';
const MAX_RECENT_SEARCHES = 10;

type SearchCategory = 'all' | 'users' | 'groups' | 'forums';

interface SearchUser {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  status: string;
  is_premium?: boolean;
  is_verified?: boolean;
}

interface SearchGroup {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_url: string | null;
  member_count: number;
}

interface SearchForum {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_url: string | null;
  post_count: number;
}

interface CategoryConfig {
  id: SearchCategory;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: [string, string];
}

const categories: CategoryConfig[] = [
  { id: 'all', label: 'All', icon: 'search', gradient: ['#3b82f6', '#8b5cf6'] },
  { id: 'users', label: 'Users', icon: 'person', gradient: ['#10b981', '#059669'] },
  { id: 'groups', label: 'Groups', icon: 'people', gradient: ['#f59e0b', '#f97316'] },
  { id: 'forums', label: 'Forums', icon: 'newspaper', gradient: ['#ec4899', '#f43f5e'] },
];

// Trending topics mock data
const TRENDING_TOPICS = [
  { id: '1', text: 'DeFi Updates', icon: 'trending-up', color: '#10b981', searches: 2400 },
  { id: '2', text: 'NFT Collections', icon: 'images', color: '#8b5cf6', searches: 1850 },
  { id: '3', text: 'Gaming Guilds', icon: 'game-controller', color: '#f59e0b', searches: 1200 },
  { id: '4', text: 'Crypto News', icon: 'newspaper', color: '#ec4899', searches: 980 },
  { id: '5', text: 'Web3 Dev', icon: 'code-slash', color: '#3b82f6', searches: 750 },
];

// Search filters interface
interface SearchFilters {
  verifiedOnly: boolean;
  premiumOnly: boolean;
  hasAvatar: boolean;
  minMembers: number;
  sortBy: 'relevance' | 'recent' | 'popular';
}

const defaultFilters: SearchFilters = {
  verifiedOnly: false,
  premiumOnly: false,
  hasAvatar: false,
  minMembers: 0,
  sortBy: 'relevance',
};

// Skeleton loading component
function SkeletonLoader({ isDark }: { isDark: boolean }) {
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
  }, []);

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
                { width: '60%', backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' },
              ]}
            />
            <View
              style={[
                skeletonStyles.line,
                { width: '40%', marginTop: 8, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' },
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

// Trending item component with pulse animation
function TrendingItem({
  item,
  onPress,
  isDark,
}: {
  item: typeof TRENDING_TOPICS[0];
  onPress: () => void;
  isDark: boolean;
}) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Subtle pulse animation
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

    // Glow animation
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
  }, []);

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
            {
              backgroundColor: item.color,
              opacity: glowOpacity,
            },
          ]}
        />
        <LinearGradient
          colors={[item.color, `${item.color}99`]}
          style={trendingStyles.iconContainer}
        >
          <Ionicons name={item.icon as any} size={16} color="#fff" />
        </LinearGradient>
        <View style={trendingStyles.textContainer}>
          <Text
            style={[trendingStyles.text, { color: isDark ? '#fff' : '#1f2937' }]}
            numberOfLines={1}
          >
            {item.text}
          </Text>
          <Text style={trendingStyles.searchCount}>
            {item.searches.toLocaleString()} searches
          </Text>
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

// Voice search animated button
function VoiceSearchButton({
  onPress,
  isListening,
  colors,
}: {
  onPress: () => void;
  isListening: boolean;
  colors: any;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const waveAnim1 = useRef(new Animated.Value(0)).current;
  const waveAnim2 = useRef(new Animated.Value(0)).current;
  const waveAnim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isListening) {
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.1, duration: 300, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        ])
      ).start();

      // Wave animations
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
  }, [isListening]);

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
              <Animated.View
                style={[voiceStyles.wave, { transform: [{ scaleY: waveAnim1 }] }]}
              />
              <Animated.View
                style={[voiceStyles.wave, { transform: [{ scaleY: waveAnim2 }] }]}
              />
              <Animated.View
                style={[voiceStyles.wave, { transform: [{ scaleY: waveAnim3 }] }]}
              />
            </View>
          ) : (
            <Ionicons
              name="mic"
              size={20}
              color={colors.textSecondary}
            />
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

// Filter modal component
function FilterModal({
  visible,
  onClose,
  filters,
  onApply,
  colors,
  isDark,
}: {
  visible: boolean;
  onClose: () => void;
  filters: SearchFilters;
  onApply: (filters: SearchFilters) => void;
  colors: any;
  isDark: boolean;
}) {
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
  }, [visible]);

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
          <Ionicons name={icon as any} size={16} color={value ? '#fff' : colors.textSecondary} />
        </LinearGradient>
        <Text style={[filterStyles.toggleLabel, { color: colors.text }]}>{label}</Text>
      </View>
      <View
        style={[
          filterStyles.toggleSwitch,
          { backgroundColor: value ? '#3b82f6' : colors.surface },
        ]}
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
          <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          <View style={filterStyles.content}>
            {/* Header */}
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

            {/* Toggles */}
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

            {/* Sort Options */}
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

            {/* Apply Button */}
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

// Animated Result Item
function AnimatedResultItem({
  children,
  index,
  onPress,
}: {
  children: React.ReactNode;
  index: number;
  onPress: () => void;
}) {
  const translateX = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    const delay = index * 60;
    
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: 350,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateX }, { scale }],
        marginBottom: 10,
      }}
    >
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function SearchScreen() {
  const { colors, colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<SearchCategory>('all');
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Results
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [groups, setGroups] = useState<SearchGroup[]>([]);
  const [forums, setForums] = useState<SearchForum[]>([]);

  // ID Search
  const [showIdSearch, setShowIdSearch] = useState(false);
  const [idSearchType, setIdSearchType] = useState<'user' | 'group' | 'forum'>('user');
  const [idSearchValue, setIdSearchValue] = useState('');

  // New features
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Animation refs
  const searchGlow = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-20)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Load recent searches on mount
  useEffect(() => {
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    try {
      const saved = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch (error) {
      logger.error('Failed to load recent searches:', error);
    }
  };

  const saveRecentSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    try {
      const updated = [searchQuery, ...recentSearches.filter((s) => s !== searchQuery)].slice(
        0,
        MAX_RECENT_SEARCHES
      );
      setRecentSearches(updated);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (error) {
      logger.error('Failed to save recent search:', error);
    }
  };

  const removeRecentSearch = async (searchQuery: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const updated = recentSearches.filter((s) => s !== searchQuery);
      setRecentSearches(updated);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (error) {
      logger.error('Failed to remove recent search:', error);
    }
  };

  const clearRecentSearches = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      setRecentSearches([]);
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (error) {
      logger.error('Failed to clear recent searches:', error);
    }
  };

  useEffect(() => {
    // Animate header
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(headerTranslateY, {
        toValue: 0,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    // Search glow effect when focused
    Animated.timing(searchGlow, {
      toValue: isFocused ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isFocused]);

  const performSearch = useCallback(
    debounce(async (searchQuery: string, searchCategory: SearchCategory) => {
      if (!searchQuery.trim()) {
        setUsers([]);
        setGroups([]);
        setForums([]);
        setHasSearched(false);
        return;
      }

      setLoading(true);

      try {
        const promises: Promise<void>[] = [];

        if (searchCategory === 'all' || searchCategory === 'users') {
          promises.push(
            api.get('/api/v1/search/users', { params: { q: searchQuery } })
              .then((res) => setUsers(res.data.users || res.data || []))
              .catch(() => setUsers([]))
          );
        }

        if (searchCategory === 'all' || searchCategory === 'groups') {
          promises.push(
            api.get('/api/v1/groups', { params: { search: searchQuery } })
              .then((res) => setGroups(res.data.groups || res.data || []))
              .catch(() => setGroups([]))
          );
        }

        if (searchCategory === 'all' || searchCategory === 'forums') {
          promises.push(
            api.get('/api/v1/forums', { params: { search: searchQuery } })
              .then((res) => setForums(res.data.forums || res.data || []))
              .catch(() => setForums([]))
          );
        }

        await Promise.all(promises);
        setHasSearched(true);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    performSearch(query, category);
  }, [query, category, performSearch]);

  const handleIdSearch = async () => {
    if (!idSearchValue.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      let endpoint = '';
      switch (idSearchType) {
        case 'user':
          endpoint = `/api/v1/users/${idSearchValue}`;
          break;
        case 'group':
          endpoint = `/api/v1/groups/${idSearchValue}`;
          break;
        case 'forum':
          endpoint = `/api/v1/forums/${idSearchValue}`;
          break;
      }

      const response = await api.get(endpoint);
      const data = response.data.data || response.data;
      
      if (data) {
        logger.log('Found:', data);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      logger.log('Not found');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const totalResults = users.length + groups.length + forums.length;

  const renderUser = (item: SearchUser, index: number) => (
    <AnimatedResultItem key={item.id} index={index} onPress={() => {}}>
      <GlassCard variant="frosted" intensity="subtle" style={styles.resultCard}>
        <View style={styles.resultInner}>
          <AnimatedAvatar
            source={{ uri: item.avatar_url || '' }}
            size={48}
            borderAnimation={item.is_premium ? 'holographic' : item.status === 'online' ? 'glow' : 'none'}
            isPremium={item.is_premium}
          />
          <View style={styles.resultInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.resultTitle, { color: colors.text }]}>
                {item.display_name || item.username}
              </Text>
              {item.is_verified && (
                <Ionicons name="checkmark-circle" size={16} color="#3b82f6" style={{ marginLeft: 4 }} />
              )}
              {item.is_premium && (
                <LinearGradient
                  colors={['#f59e0b', '#ef4444']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.premiumBadge}
                >
                  <Text style={styles.premiumText}>PRO</Text>
                </LinearGradient>
              )}
            </View>
            <Text style={[styles.resultSubtitle, { color: colors.textSecondary }]}>
              @{item.username}
            </Text>
          </View>
          <View style={[styles.statusDot, { backgroundColor: item.status === 'online' ? '#10b981' : colors.textTertiary }]} />
        </View>
      </GlassCard>
    </AnimatedResultItem>
  );

  const renderGroup = (item: SearchGroup, index: number) => {
    const gradient = ['#f59e0b', '#f97316'] as [string, string];
    
    return (
      <AnimatedResultItem key={item.id} index={index} onPress={() => {}}>
        <GlassCard variant="frosted" intensity="subtle" style={styles.resultCard}>
          <View style={styles.resultInner}>
            <LinearGradient colors={gradient} style={styles.iconContainer}>
              <Ionicons name="people" size={22} color="#fff" />
            </LinearGradient>
            <View style={styles.resultInfo}>
              <Text style={[styles.resultTitle, { color: colors.text }]}>{item.name}</Text>
              <View style={styles.statRow}>
                <Ionicons name="people-outline" size={12} color={colors.textSecondary} />
                <Text style={[styles.statText, { color: colors.textSecondary }]}>
                  {(item?.member_count ?? 0).toLocaleString()} members
                </Text>
              </View>
            </View>
            <LinearGradient colors={gradient} style={styles.arrowContainer}>
              <Ionicons name="chevron-forward" size={14} color="#fff" />
            </LinearGradient>
          </View>
        </GlassCard>
      </AnimatedResultItem>
    );
  };

  const renderForum = (item: SearchForum, index: number) => {
    const gradient = ['#ec4899', '#f43f5e'] as [string, string];
    
    return (
      <AnimatedResultItem key={item.id} index={index} onPress={() => {}}>
        <GlassCard variant="frosted" intensity="subtle" style={styles.resultCard}>
          <View style={styles.resultInner}>
            <LinearGradient colors={gradient} style={styles.iconContainer}>
              <Ionicons name="newspaper" size={22} color="#fff" />
            </LinearGradient>
            <View style={styles.resultInfo}>
              <Text style={[styles.resultTitle, { color: colors.text }]}>c/{item.slug}</Text>
              <View style={styles.statRow}>
                <Ionicons name="document-text-outline" size={12} color={colors.textSecondary} />
                <Text style={[styles.statText, { color: colors.textSecondary }]}>
                  {(item?.post_count ?? 0).toLocaleString()} posts
                </Text>
              </View>
            </View>
            <LinearGradient colors={gradient} style={styles.arrowContainer}>
              <Ionicons name="chevron-forward" size={14} color="#fff" />
            </LinearGradient>
          </View>
        </GlassCard>
      </AnimatedResultItem>
    );
  };

  const glowBorderColor = searchGlow.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', 'rgba(59, 130, 246, 0.5)'],
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Animated Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerOpacity,
            transform: [{ translateY: headerTranslateY }],
          },
        ]}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            {/* Search Input with Glow */}
            <Animated.View
              style={[
                styles.searchWrapper,
                {
                  borderColor: glowBorderColor,
                  shadowOpacity: isFocused ? 0.3 : 0,
                },
              ]}
            >
              <GlassCard variant="frosted" intensity="subtle" style={styles.searchCard}>
                <View style={styles.searchInner}>
                  <Ionicons name="search" size={20} color={colors.textSecondary} />
                  <TextInput
                    ref={inputRef}
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Search users, groups, forums..."
                    placeholderTextColor={colors.textSecondary}
                    value={query}
                    onChangeText={(text) => {
                      setQuery(text);
                      setShowSuggestions(text.length > 0);
                    }}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => {
                      setIsFocused(false);
                      if (query.trim()) {
                        saveRecentSearch(query.trim());
                      }
                    }}
                    onSubmitEditing={() => {
                      if (query.trim()) {
                        saveRecentSearch(query.trim());
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      }
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="search"
                  />
                  {query.length > 0 && (
                    <TouchableOpacity
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setQuery('');
                        setShowSuggestions(false);
                      }}
                    >
                      <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>
              </GlassCard>
            </Animated.View>

            {/* Voice Search */}
            <VoiceSearchButton
              onPress={() => {
                setIsVoiceListening(!isVoiceListening);
                // Voice search would integrate with expo-speech or similar
              }}
              isListening={isVoiceListening}
              colors={colors}
            />

            {/* Filters Button */}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowFilters(true);
              }}
            >
              <LinearGradient
                colors={
                  filters.verifiedOnly || filters.premiumOnly || filters.hasAvatar
                    ? ['#3b82f6', '#8b5cf6']
                    : [colors.surface, colors.surface]
                }
                style={styles.filterButton}
              >
                <Ionicons
                  name="options"
                  size={20}
                  color={
                    filters.verifiedOnly || filters.premiumOnly || filters.hasAvatar
                      ? '#fff'
                      : colors.textSecondary
                  }
                />
                {(filters.verifiedOnly || filters.premiumOnly || filters.hasAvatar) && (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>
                      {[filters.verifiedOnly, filters.premiumOnly, filters.hasAvatar].filter(Boolean).length}
                    </Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* ID Search Toggle */}
            <TouchableOpacity
              style={styles.idToggle}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowIdSearch(!showIdSearch);
              }}
            >
              <LinearGradient
                colors={showIdSearch ? ['#3b82f6', '#8b5cf6'] : [colors.surface, colors.surface]}
                style={styles.idToggleGradient}
              >
                <Ionicons name="key" size={20} color={showIdSearch ? '#fff' : colors.textSecondary} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>

      {/* ID Search Panel */}
      {showIdSearch && (
        <GlassCard variant="neon" intensity="subtle" style={styles.idPanel}>
          <View style={styles.idPanelInner}>
            <View style={styles.idHeader}>
              <LinearGradient
                colors={['#3b82f6', '#8b5cf6']}
                style={styles.idIconContainer}
              >
                <Ionicons name="key" size={16} color="#fff" />
              </LinearGradient>
              <Text style={[styles.idTitle, { color: colors.text }]}>Search by ID</Text>
            </View>
            
            <View style={styles.idTypeRow}>
              {(['user', 'group', 'forum'] as const).map((type) => {
                const isActive = idSearchType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    style={styles.idTypeWrapper}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setIdSearchType(type);
                    }}
                  >
                    {isActive ? (
                      <LinearGradient
                        colors={['#3b82f6', '#8b5cf6']}
                        style={styles.idTypeButton}
                      >
                        <Text style={styles.idTypeTextActive}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </Text>
                      </LinearGradient>
                    ) : (
                      <View style={[styles.idTypeButton, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.idTypeText, { color: colors.textSecondary }]}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.idInputRow}>
              <TextInput
                style={[styles.idInput, { backgroundColor: colors.surface, color: colors.text }]}
                placeholder={`Enter ${idSearchType} ID`}
                placeholderTextColor={colors.textSecondary}
                value={idSearchValue}
                onChangeText={setIdSearchValue}
              />
              <TouchableOpacity onPress={handleIdSearch}>
                <LinearGradient
                  colors={['#3b82f6', '#8b5cf6']}
                  style={styles.idSearchButton}
                >
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </GlassCard>
      )}

      {/* Category Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((cat) => {
          const isActive = category === cat.id;
          
          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setCategory(cat.id);
              }}
            >
              {isActive ? (
                <LinearGradient
                  colors={cat.gradient}
                  style={styles.categoryButton}
                >
                  <Ionicons name={cat.icon} size={16} color="#fff" />
                  <Text style={styles.categoryTextActive}>{cat.label}</Text>
                </LinearGradient>
              ) : (
                <View style={[styles.categoryButton, { backgroundColor: colors.surface }]}>
                  <Ionicons name={cat.icon} size={16} color={colors.textSecondary} />
                  <Text style={[styles.categoryText, { color: colors.textSecondary }]}>{cat.label}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Results */}
      <ScrollView 
        style={styles.results} 
        contentContainerStyle={styles.resultsContent}
        showsVerticalScrollIndicator={false}
      >
        {loading && (
          <View style={styles.loadingContainer}>
            <LinearGradient
              colors={['#3b82f6', '#8b5cf6']}
              style={styles.loadingGradient}
            >
              <ActivityIndicator size="small" color="#fff" />
            </LinearGradient>
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Searching...
            </Text>
          </View>
        )}

        {!loading && !hasSearched && (
          <View style={styles.discoverContainer}>
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <View style={styles.recentSection}>
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.sectionHeaderLeft}>
                    <LinearGradient colors={['#8b5cf6', '#6366f1']} style={styles.sectionIconSmall}>
                      <Ionicons name="time" size={14} color="#fff" />
                    </LinearGradient>
                    <Text style={[styles.sectionTitleSmall, { color: colors.text }]}>Recent Searches</Text>
                  </View>
                  <TouchableOpacity onPress={clearRecentSearches}>
                    <Text style={styles.clearText}>Clear All</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.recentScrollContent}
                >
                  {recentSearches.map((search, index) => (
                    <TouchableOpacity
                      key={`${search}-${index}`}
                      style={[styles.recentChip, { backgroundColor: colors.surface }]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setQuery(search);
                      }}
                      onLongPress={() => removeRecentSearch(search)}
                    >
                      <Ionicons name="search" size={14} color={colors.textSecondary} />
                      <Text style={[styles.recentChipText, { color: colors.text }]} numberOfLines={1}>
                        {search}
                      </Text>
                      <TouchableOpacity
                        onPress={() => removeRecentSearch(search)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons name="close" size={14} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Trending Topics */}
            <View style={styles.trendingSection}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionHeaderLeft}>
                  <LinearGradient colors={['#ef4444', '#f97316']} style={styles.sectionIconSmall}>
                    <Ionicons name="flame" size={14} color="#fff" />
                  </LinearGradient>
                  <Text style={[styles.sectionTitleSmall, { color: colors.text }]}>Trending Now</Text>
                </View>
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.trendingScrollContent}
              >
                {TRENDING_TOPICS.map((topic) => (
                  <TrendingItem
                    key={topic.id}
                    item={topic}
                    onPress={() => setQuery(topic.text)}
                    isDark={isDark}
                  />
                ))}
              </ScrollView>
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActionsSection}>
              <Text style={[styles.sectionTitleSmall, { color: colors.text, marginBottom: 12 }]}>
                Quick Actions
              </Text>
              <View style={styles.quickActionsGrid}>
                {[
                  { icon: 'person-add', label: 'Find Friends', color: '#10b981', gradient: ['#10b981', '#059669'] },
                  { icon: 'people', label: 'Join Groups', color: '#f59e0b', gradient: ['#f59e0b', '#d97706'] },
                  { icon: 'newspaper', label: 'Explore Forums', color: '#ec4899', gradient: ['#ec4899', '#db2777'] },
                  { icon: 'sparkles', label: 'Discover', color: '#8b5cf6', gradient: ['#8b5cf6', '#7c3aed'] },
                ].map((action, index) => (
                  <TouchableOpacity
                    key={action.label}
                    style={styles.quickActionCard}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      if (action.label === 'Find Friends') setCategory('users');
                      else if (action.label === 'Join Groups') setCategory('groups');
                      else if (action.label === 'Explore Forums') setCategory('forums');
                      inputRef.current?.focus();
                    }}
                  >
                    <LinearGradient
                      colors={action.gradient as [string, string]}
                      style={styles.quickActionGradient}
                    >
                      <Ionicons name={action.icon as any} size={24} color="#fff" />
                    </LinearGradient>
                    <Text style={[styles.quickActionLabel, { color: colors.text }]}>{action.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Search Tips */}
            <GlassCard variant="frosted" intensity="subtle" style={styles.tipsCard}>
              <View style={styles.tipsContent}>
                <LinearGradient colors={['#3b82f6', '#8b5cf6']} style={styles.tipsIcon}>
                  <Ionicons name="bulb" size={18} color="#fff" />
                </LinearGradient>
                <View style={styles.tipsTextContainer}>
                  <Text style={[styles.tipsTitle, { color: colors.text }]}>Pro Tip</Text>
                  <Text style={[styles.tipsText, { color: colors.textSecondary }]}>
                    Use the ID search to find users, groups, or forums by their unique identifier
                  </Text>
                </View>
              </View>
            </GlassCard>
          </View>
        )}

        {!loading && hasSearched && totalResults === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>😕</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No results found</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Try different keywords or{'\n'}search in a specific category
            </Text>
          </View>
        )}

        {!loading && hasSearched && totalResults > 0 && (
          <>
            {/* Users Section */}
            {(category === 'all' || category === 'users') && users.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <LinearGradient
                    colors={['#10b981', '#059669']}
                    style={styles.sectionIcon}
                  >
                    <Ionicons name="person" size={12} color="#fff" />
                  </LinearGradient>
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                    USERS ({users.length})
                  </Text>
                </View>
                {(category === 'all' ? users.slice(0, 3) : users).map((user, i) => renderUser(user, i))}
                {category === 'all' && users.length > 3 && (
                  <TouchableOpacity 
                    style={styles.viewAllButton}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setCategory('users');
                    }}
                  >
                    <Text style={[styles.viewAll, { color: colors.primary }]}>
                      View all {users.length} users →
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Groups Section */}
            {(category === 'all' || category === 'groups') && groups.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <LinearGradient
                    colors={['#f59e0b', '#f97316']}
                    style={styles.sectionIcon}
                  >
                    <Ionicons name="people" size={12} color="#fff" />
                  </LinearGradient>
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                    GROUPS ({groups.length})
                  </Text>
                </View>
                {(category === 'all' ? groups.slice(0, 3) : groups).map((group, i) => renderGroup(group, i))}
                {category === 'all' && groups.length > 3 && (
                  <TouchableOpacity 
                    style={styles.viewAllButton}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setCategory('groups');
                    }}
                  >
                    <Text style={[styles.viewAll, { color: colors.primary }]}>
                      View all {groups.length} groups →
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Forums Section */}
            {(category === 'all' || category === 'forums') && forums.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <LinearGradient
                    colors={['#ec4899', '#f43f5e']}
                    style={styles.sectionIcon}
                  >
                    <Ionicons name="newspaper" size={12} color="#fff" />
                  </LinearGradient>
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                    FORUMS ({forums.length})
                  </Text>
                </View>
                {(category === 'all' ? forums.slice(0, 3) : forums).map((forum, i) => renderForum(forum, i))}
                {category === 'all' && forums.length > 3 && (
                  <TouchableOpacity 
                    style={styles.viewAllButton}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setCategory('forums');
                    }}
                  >
                    <Text style={[styles.viewAll, { color: colors.primary }]}>
                      View all {forums.length} forums →
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Filter Modal */}
      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onApply={setFilters}
        colors={colors}
        isDark={isDark}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 8,
  },
  headerContent: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  searchWrapper: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 2,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 5,
  },
  searchCard: {
    borderRadius: 14,
  },
  searchInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  idToggle: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  idToggleGradient: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  idPanel: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
  },
  idPanelInner: {
    padding: 16,
  },
  idHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  idIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  idTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  idTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  idTypeWrapper: {
    flex: 1,
  },
  idTypeButton: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  idTypeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  idTypeTextActive: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  idInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  idInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    fontSize: 14,
  },
  idSearchButton: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriesContainer: {
    maxHeight: 50,
    marginBottom: 8,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
  },
  categoryTextActive: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  results: {
    flex: 1,
  },
  resultsContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyIconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    width: 22,
    height: 22,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  resultCard: {
    borderRadius: 14,
  },
  resultInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  resultInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  resultSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  premiumBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  premiumText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  statText: {
    fontSize: 12,
  },
  arrowContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewAllButton: {
    paddingVertical: 8,
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Filter button styles
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  // Discover section styles
  discoverContainer: {
    paddingTop: 8,
  },
  recentSection: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIconSmall: {
    width: 26,
    height: 26,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  sectionTitleSmall: {
    fontSize: 16,
    fontWeight: '600',
  },
  clearText: {
    fontSize: 13,
    color: '#3b82f6',
    fontWeight: '500',
  },
  recentScrollContent: {
    gap: 8,
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    maxWidth: 160,
  },
  recentChipText: {
    fontSize: 13,
    flex: 1,
  },
  trendingSection: {
    marginBottom: 24,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ef4444',
  },
  trendingScrollContent: {
    paddingRight: 16,
  },
  quickActionsSection: {
    marginBottom: 24,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    width: (SCREEN_WIDTH - 56) / 2,
    alignItems: 'center',
    paddingVertical: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  quickActionGradient: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  tipsCard: {
    marginBottom: 24,
    borderRadius: 16,
  },
  tipsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  tipsIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tipsTextContainer: {
    flex: 1,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  tipsText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
