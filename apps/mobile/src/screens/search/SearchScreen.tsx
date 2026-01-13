/**
 * SearchScreen - Premium Mobile Version
 * 
 * A stunning search interface with animated results, glassmorphism effects,
 * and smooth transitions for finding users, groups, and forums.
 * 
 * Features:
 * - Animated search bar with glow effects
 * - GlassCard result items with slide-in animations
 * - Category tabs with gradient selection
 * - Animated avatars for users
 * - Recent searches with quick access
 * - ID search with premium styling
 * - Haptic feedback throughout
 * 
 * @version 2.0.0
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import GlassCard from '../../components/ui/GlassCard';
import AnimatedAvatar from '../../components/ui/AnimatedAvatar';
import { EmptyState } from '../../components';
import api from '../../lib/api';
import debounce from 'lodash.debounce';
import { createLogger } from '../../lib/logger';

const logger = createLogger('Search');
const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  
  // Results
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [groups, setGroups] = useState<SearchGroup[]>([]);
  const [forums, setForums] = useState<SearchForum[]>([]);

  // ID Search
  const [showIdSearch, setShowIdSearch] = useState(false);
  const [idSearchType, setIdSearchType] = useState<'user' | 'group' | 'forum'>('user');
  const [idSearchValue, setIdSearchValue] = useState('');
  
  // Animation refs
  const searchGlow = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-20)).current;
  const [isFocused, setIsFocused] = useState(false);

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
                  {item.member_count.toLocaleString()} members
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
                  {item.post_count.toLocaleString()} posts
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
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Search users, groups, forums..."
                    placeholderTextColor={colors.textSecondary}
                    value={query}
                    onChangeText={setQuery}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {query.length > 0 && (
                    <TouchableOpacity 
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setQuery('');
                      }}
                    >
                      <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>
              </GlassCard>
            </Animated.View>

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
          <View style={styles.emptyContainer}>
            <LinearGradient
              colors={['#3b82f6', '#8b5cf6', '#ec4899']}
              style={styles.emptyIconContainer}
            >
              <Ionicons name="search" size={40} color="#fff" />
            </LinearGradient>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Search CGraph</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Find users, groups, and forums.{'\n'}You can also search by ID.
            </Text>
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
});
