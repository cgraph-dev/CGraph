/**
 * SearchScreen - Premium Mobile Version
 *
 * @version 3.0.0
 * @since v0.8.1
 */
import React from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/stores';
import GlassCard from '../../../components/ui/glass-card';
import { styles } from './styles';
import {
  VoiceSearchButton,
  FilterModal,
} from './components';
import { categories } from './constants';
import { useSearch } from './use-search';
import { IdSearchPanel } from './id-search-panel';
import { SearchResults } from './search-results';

/**
 * Main search screen.
 */
export default function SearchScreen() {
  const { colors, colorScheme } = useThemeStore();
  const isDark = colorScheme === 'dark';

  const search = useSearch();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Animated Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: search.headerOpacity,
            transform: [{ translateY: search.headerTranslateY }],
          },
        ]}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <Animated.View
              style={[
                styles.searchWrapper,
                {
                  borderColor: search.glowBorderColor,
                  shadowOpacity: search.isFocused ? 0.3 : 0,
                },
              ]}
            >
              <GlassCard variant="frosted" intensity="subtle" style={styles.searchCard}>
                <View style={styles.searchInner}>
                  <Ionicons name="search" size={20} color={colors.textSecondary} />
                  <TextInput
                    ref={search.inputRef}
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Search users, groups, forums..."
                    placeholderTextColor={colors.textSecondary}
                    value={search.query}
                    onChangeText={(text) => {
                      search.setQuery(text);
                      search.setShowSuggestions(text.length > 0);
                    }}
                    onFocus={() => search.setIsFocused(true)}
                    onBlur={() => {
                      search.setIsFocused(false);
                      if (search.query.trim()) search.saveRecentSearch(search.query.trim());
                    }}
                    onSubmitEditing={() => {
                      if (search.query.trim()) {
                        search.saveRecentSearch(search.query.trim());
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      }
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="search"
                  />
                  {search.query.length > 0 && (
                    <TouchableOpacity
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        search.setQuery('');
                        search.setShowSuggestions(false);
                      }}
                    >
                      <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>
              </GlassCard>
            </Animated.View>

            <VoiceSearchButton
              onPress={() => search.setIsVoiceListening(!search.isVoiceListening)}
              isListening={search.isVoiceListening}
              colors={colors}
            />

            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                search.setShowFilters(true);
              }}
            >
              <LinearGradient
                colors={
                  search.filters.verifiedOnly || search.filters.premiumOnly || search.filters.hasAvatar
                    ? ['#3b82f6', '#8b5cf6']
                    : [colors.surface, colors.surface]
                }
                style={styles.filterButton}
              >
                <Ionicons
                  name="options"
                  size={20}
                  color={
                    search.filters.verifiedOnly || search.filters.premiumOnly || search.filters.hasAvatar
                      ? '#fff'
                      : colors.textSecondary
                  }
                />
                {(search.filters.verifiedOnly || search.filters.premiumOnly || search.filters.hasAvatar) && (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>
                      {[search.filters.verifiedOnly, search.filters.premiumOnly, search.filters.hasAvatar].filter(Boolean).length}
                    </Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.idToggle}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                search.setShowIdSearch(!search.showIdSearch);
              }}
            >
              <LinearGradient
                colors={search.showIdSearch ? ['#3b82f6', '#8b5cf6'] : [colors.surface, colors.surface]}
                style={styles.idToggleGradient}
              >
                <Ionicons name="key" size={20} color={search.showIdSearch ? '#fff' : colors.textSecondary} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>

      {search.showIdSearch && (
        <IdSearchPanel
          idSearchType={search.idSearchType}
          setIdSearchType={search.setIdSearchType}
          idSearchValue={search.idSearchValue}
          setIdSearchValue={search.setIdSearchValue}
          onSearch={search.handleIdSearch}
          colors={colors}
        />
      )}

      {/* Category Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((cat) => {
          const isActive = search.category === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                search.setCategory(cat.id);
              }}
            >
              {isActive ? (
                <LinearGradient colors={cat.gradient} style={styles.categoryButton}>
                  <Ionicons name={cat.icon} size={16} color="#fff" />
                  <Text style={styles.categoryTextActive}>{cat.label}</Text>
                </LinearGradient>
              ) : (
                <View style={[styles.categoryButton, { backgroundColor: colors.surface }]}>
                  <Ionicons name={cat.icon} size={16} color={colors.textSecondary} />
                  <Text style={[styles.categoryText, { color: colors.textSecondary }]}>
                    {cat.label}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <SearchResults
        loading={search.loading}
        hasSearched={search.hasSearched}
        totalResults={search.totalResults}
        users={search.users}
        groups={search.groups}
        forums={search.forums}
        category={search.category}
        setCategory={search.setCategory}
        recentSearches={search.recentSearches}
        onSearchSelect={search.setQuery}
        onRemoveSearch={search.removeRecentSearch}
        onClearRecentSearches={search.clearRecentSearches}
        onFocusInput={() => search.inputRef.current?.focus()}
        colors={colors}
        isDark={isDark}
      />

      <FilterModal
        visible={search.showFilters}
        onClose={() => search.setShowFilters(false)}
        filters={search.filters}
        onApply={search.setFilters}
        colors={colors}
        isDark={isDark}
      />
    </View>
  );
}
