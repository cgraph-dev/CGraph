/**
 * Search bar, sort buttons, and filter chips for member list.
 * @module screens/community/member-list-screen/components/filter-bar
 */
import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import type { SortField, SortOrder } from '../types';
import { styles } from '../styles';

const SORT_OPTIONS: { field: SortField; label: string }[] = [
  { field: 'username', label: 'Name' },
  { field: 'joined_at', label: 'Joined' },
  { field: 'post_count', label: 'Posts' },
  { field: 'reputation', label: 'Rep' },
];

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function SearchBar({ searchQuery, onSearchChange }: SearchBarProps) {
  return (
    <View style={styles.searchContainer}>
      <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
      <TextInput
        style={styles.searchInput}
        placeholder="Search members..."
        placeholderTextColor="#6b7280"
        value={searchQuery}
        onChangeText={onSearchChange}
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={() => onSearchChange('')}>
          <Ionicons name="close-circle" size={20} color="#6b7280" />
        </TouchableOpacity>
      )}
    </View>
  );
}

interface FilterPanelProps {
  visible: boolean;
  sortField: SortField;
  sortOrder: SortOrder;
  filterOnlineOnly: boolean;
  onSort: (field: SortField) => void;
  onToggleOnline: () => void;
}

export function FilterPanel({
  visible,
  sortField,
  sortOrder,
  filterOnlineOnly,
  onSort,
  onToggleOnline,
}: FilterPanelProps) {
  if (!visible) return null;

  return (
    <BlurView intensity={40} tint="dark" style={styles.filtersContainer}>
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Sort by:</Text>
        <View style={styles.sortButtons}>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.field}
              style={[styles.sortButton, sortField === opt.field && styles.sortButtonActive]}
              onPress={() => onSort(opt.field)}
            >
              <Text
                style={[styles.sortButtonText, sortField === opt.field && styles.sortButtonTextActive]}
              >
                {opt.label}
              </Text>
              {sortField === opt.field && (
                <Ionicons
                  name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'}
                  size={12}
                  color="#10b981"
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <TouchableOpacity
        style={[styles.filterChip, filterOnlineOnly && styles.filterChipActive]}
        onPress={() => {
          HapticFeedback.light();
          onToggleOnline();
        }}
      >
        <Ionicons
          name="radio-button-on"
          size={14}
          color={filterOnlineOnly ? '#22c55e' : '#6b7280'}
        />
        <Text style={[styles.filterChipText, filterOnlineOnly && styles.filterChipTextActive]}>
          Online Only
        </Text>
      </TouchableOpacity>
    </BlurView>
  );
}
