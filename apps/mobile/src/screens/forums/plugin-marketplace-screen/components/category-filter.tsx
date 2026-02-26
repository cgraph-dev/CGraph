/**
 * CategoryFilter - Horizontal scrollable category chips
 */

import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { PluginCategory } from '../types';
import { CATEGORIES, ALL_CATEGORY } from '../constants';
import { styles } from '../styles';

interface CategoryFilterProps {
  selectedCategory: PluginCategory | null;
  onSelect: (category: PluginCategory | null) => void;
  colors: {
    primary: string;
    surface: string;
    text: string;
    border: string;
  };
}

/**
 *
 */
export function CategoryFilter({ selectedCategory, onSelect, colors }: CategoryFilterProps) {
  return (
    <View style={styles.categoryContainer}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={[ALL_CATEGORY, ...CATEGORIES]}
        keyExtractor={(item) => item.key || 'all'}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryChip,
              {
                backgroundColor: selectedCategory === item.key ? colors.primary : colors.surface,
                borderColor: colors.border,
              },
            ]}
             
            onPress={() => onSelect(item.key as PluginCategory | null)}
          >
            <Ionicons
               
              name={item.icon as keyof typeof Ionicons.glyphMap}
              size={16}
              color={selectedCategory === item.key ? '#fff' : colors.text}
            />
            <Text
              style={[
                styles.categoryLabel,
                { color: selectedCategory === item.key ? '#fff' : colors.text },
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.categoryList}
      />
    </View>
  );
}
