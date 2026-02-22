import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../../../../components/ui/glass-card';
import { RARITY_COLORS, ShopItem } from './constants';

interface ItemsGridProps {
  items: ShopItem[];
  onPurchase: (item: ShopItem) => void;
}

// Map categories to icons
const categoryIcons: Record<string, string> = {
  theme: 'color-palette',
  badge: 'shield',
  effect: 'sparkles',
  boost: 'flash',
};

export function ItemsGrid({ items, onPurchase }: ItemsGridProps) {
  return (
    <View style={styles.itemsGrid}>
      {items.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.itemCard}
          onPress={() => onPurchase(item)}
          activeOpacity={0.9}
        >
          <GlassCard variant="crystal" intensity="medium" style={styles.itemCardInner}>
            <LinearGradient colors={RARITY_COLORS[item.rarity]} style={styles.itemIcon}>
              <Ionicons
                name={(categoryIcons[item.category] as any) || 'diamond'}
                size={28}
                color="#fff"
              />
            </LinearGradient>

            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.itemDescription} numberOfLines={2}>
                {item.description}
              </Text>

              <View style={styles.itemFooter}>
                <View style={styles.itemRarityBadge}>
                  <LinearGradient
                    colors={RARITY_COLORS[item.rarity]}
                    style={styles.itemRarityGradient}
                  >
                    <Text style={styles.itemRarityText}>{item.rarity.toUpperCase()}</Text>
                  </LinearGradient>
                </View>

                <View style={styles.itemPriceContainer}>
                  <Ionicons name="diamond" size={14} color="#f59e0b" />
                  <Text style={styles.itemPrice}>{item.price}</Text>
                </View>
              </View>
            </View>
          </GlassCard>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  itemsGrid: {
    gap: 12,
  },
  itemCard: {
    width: '100%',
  },
  itemCardInner: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  itemIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 16,
    marginBottom: 8,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemRarityBadge: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  itemRarityGradient: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  itemRarityText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
  itemPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
