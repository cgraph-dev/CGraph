/**
 * Search hooks for search screen.
 * @module screens/search/search-screen/use-search
 */
import { durations } from '@cgraph/animation-constants';
import { useState, useCallback, useEffect, useRef } from 'react';
import { TextInput, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../../lib/api';
import debounce from 'lodash.debounce';
import { createLogger } from '../../../lib/logger';
import {
  type SearchUser,
  type SearchGroup,
  type SearchForum,
  type SearchFilters,
  defaultFilters,
} from './components';
import { type SearchCategory, RECENT_SEARCHES_KEY, MAX_RECENT_SEARCHES } from './constants';

const logger = createLogger('Search');

/** Description. */
/** Hook for search. */
export function useSearch() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<SearchCategory>('all');
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [_refreshing, _setRefreshing] = useState(false);

  const [users, setUsers] = useState<SearchUser[]>([]);
  const [groups, setGroups] = useState<SearchGroup[]>([]);
  const [forums, setForums] = useState<SearchForum[]>([]);

  const [showIdSearch, setShowIdSearch] = useState(false);
  const [idSearchType, setIdSearchType] = useState<'user' | 'group' | 'forum'>('user');
  const [idSearchValue, setIdSearchValue] = useState('');

  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [_showSuggestions, setShowSuggestions] = useState(false);

  const searchGlow = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-20)).current;
  const _pulseAnim = useRef(new Animated.Value(1)).current;
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    try {
      const saved = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (saved) setRecentSearches(JSON.parse(saved));
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
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: durations.smooth.ms,
        useNativeDriver: true,
      }),
      Animated.spring(headerTranslateY, { toValue: 0, friction: 8, useNativeDriver: true }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    Animated.timing(searchGlow, {
      toValue: isFocused ? 1 : 0,
      duration: durations.slow.ms,
      useNativeDriver: false,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
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
            api
              .get('/api/v1/search/users', { params: { q: searchQuery } })
              .then((res) => setUsers(res.data.users || res.data || []))
              .catch(() => setUsers([]))
          );
        }
        if (searchCategory === 'all' || searchCategory === 'groups') {
          promises.push(
            api
              .get('/api/v1/groups', { params: { search: searchQuery } })
              .then((res) => setGroups(res.data.groups || res.data || []))
              .catch(() => setGroups([]))
          );
        }
        if (searchCategory === 'all' || searchCategory === 'forums') {
          promises.push(
            api
              .get('/api/v1/forums', { params: { search: searchQuery } })
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
  const glowBorderColor = searchGlow.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', 'rgba(59, 130, 246, 0.5)'],
  });

  return {
    query,
    setQuery,
    category,
    setCategory,
    loading,
    hasSearched,
    users,
    groups,
    forums,
    showIdSearch,
    setShowIdSearch,
    idSearchType,
    setIdSearchType,
    idSearchValue,
    setIdSearchValue,
    recentSearches,
    showFilters,
    setShowFilters,
    filters,
    setFilters,
    isVoiceListening,
    setIsVoiceListening,
    setShowSuggestions,
    searchGlow,
    headerOpacity,
    headerTranslateY,
    isFocused,
    setIsFocused,
    inputRef,
    saveRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
    handleIdSearch,
    totalResults,
    glowBorderColor,
  };
}
