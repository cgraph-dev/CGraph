/**
 * TitleCard - Individual title display card with actions
 *
 * @version 1.0.0
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { TitleBadge } from '@/components/gamification';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import type { RARITY_COLORS, UserTitle } from './types';
import { styles } from './styles';

interface TitleCardProps {
  title: UserTitle;
  onEquip: (titleId: string) => void;
  onUnequip: () => void;
  onPurchase: (titleId: string) => void;
  currentCoins: number;
}

/**
 *
 */
export function TitleCard({ title, onEquip, onUnequip, onPurchase, currentCoins }: TitleCardProps) {
  const colors = RARITY_COLORS[title.rarity];
  const canAfford = title.price ? currentCoins >= title.price : true;

  const handleAction = () => {
    HapticFeedback.medium();
    if (title.equipped) {
      onUnequip();
    } else if (title.owned) {
      onEquip(title.id);
    } else if (title.price && canAfford) {
      onPurchase(title.id);
    }
  };

  return (
    <View style={[styles.titleCard, { borderColor: title.owned ? colors.border : '#37415180' }]}>
      <LinearGradient
        colors={title.owned ? colors.gradient : ['#1f2937', '#111827']}
        style={styles.titleGradient}
      >
        {/* Header with rarity badge */}
        <View style={styles.titleHeader}>
          <View
            style={[styles.rarityBadge, { backgroundColor: colors.bg, borderColor: colors.border }]}
          >
            <Text style={[styles.rarityText, { color: colors.text }]}>
              {title.rarity.charAt(0).toUpperCase() + title.rarity.slice(1)}
            </Text>
          </View>

          {title.equipped && (
            <View style={styles.equippedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text style={styles.equippedText}>Equipped</Text>
            </View>
          )}

          {title.isPremium && !title.owned && (
            <View style={styles.premiumBadge}>
              <Ionicons name="diamond" size={14} color="#f59e0b" />
            </View>
          )}
        </View>

        {/* Title Name with TitleBadge */}
        <View style={styles.titleNameRow}>
          <TitleBadge title={title.name} rarity={title.rarity} size="md" />
        </View>

        {/* Description */}
        <Text style={styles.titleDescription}>{title.description}</Text>

        {/* Requirement or Price */}
        {!title.owned && (
          <View style={styles.requirementContainer}>
            {title.requirement && (
              <View style={styles.requirementRow}>
                <Ionicons name="lock-closed" size={14} color="#6b7280" />
                <Text style={styles.requirementText}>{title.requirement}</Text>
              </View>
            )}
            {title.price && (
              <View style={styles.priceRow}>
                <Text style={styles.coinEmoji}>🪙</Text>
                <Text style={[styles.priceText, !canAfford && styles.priceTextDisabled]}>
                  {(title.price ?? 0).toLocaleString()}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Action Button */}
        {title.owned ? (
          <TouchableOpacity
            style={[
              styles.actionButton,
              title.equipped ? styles.unequipButton : { backgroundColor: colors.border },
            ]}
            onPress={handleAction}
          >
            <Ionicons name={title.equipped ? 'close-circle' : 'ribbon'} size={16} color="#fff" />
            <Text style={styles.actionButtonText}>
              {title.equipped ? 'Unequip' : 'Equip Title'}
            </Text>
          </TouchableOpacity>
        ) : title.price ? (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: canAfford ? '#f59e0b' : '#374151' }]}
            onPress={handleAction}
            disabled={!canAfford}
          >
            <Ionicons name="cart" size={16} color={canAfford ? '#fff' : '#6b7280'} />
            <Text style={[styles.actionButtonText, !canAfford && { color: '#6b7280' }]}>
              {canAfford ? 'Purchase' : 'Not enough coins'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.lockedBadge}>
            <Ionicons name="lock-closed" size={16} color="#6b7280" />
            <Text style={styles.lockedText}>Locked</Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}
