import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CategoryId, categories } from '../types';

interface CategoryTabsProps {
  selectedCategory: CategoryId;
  onSelect: (categoryId: CategoryId) => void;
}

export function CategoryTabs({ selectedCategory, onSelect }: CategoryTabsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoryTabs}
      style={styles.categoryTabsContainer}
    >
      {categories.map((category) => (
        <TouchableOpacity
          key={category.id}
          style={[styles.categoryTab, selectedCategory === category.id && styles.categoryTabActive]}
          onPress={() => onSelect(category.id)}
          activeOpacity={0.8}
        >
          <Ionicons
            name={category.icon as any}
            size={20}
            color={selectedCategory === category.id ? '#fff' : 'rgba(255,255,255,0.6)'}
          />
          <Text
            style={[
              styles.categoryTabText,
              selectedCategory === category.id && styles.categoryTabTextActive,
            ]}
          >
            {category.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  categoryTabsContainer: {
    maxHeight: 60,
    marginBottom: 12,
  },
  categoryTabs: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(17, 24, 39, 0.5)',
  },
  categoryTabActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  categoryTabTextActive: {
    color: '#fff',
  },
});
