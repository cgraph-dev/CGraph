/**
 * StickerPicker Component - Animated Sticker System
 * Multiple packs, rarity system, purchase integration, search
 *
 * @updated v0.8.2 - Added all 15 animation types for web parity
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Modal,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import GlassCard from '../../ui/glass-card';

import { Sticker, StickerPickerProps, STICKER_PACKS, getRarityColor } from './types';
import { styles } from './styles';
import { StickerItem } from './components';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 *
 */
export default function StickerPicker({
  visible,
  onClose,
  onSelectSticker,
  userCoins = 0,
  onPurchase,
}: StickerPickerProps) {
  const [selectedPack, setSelectedPack] = useState(STICKER_PACKS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPurchasing, setIsPurchasing] = useState(false);

  const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 65,
        friction: 12,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const handleSelectSticker = async (sticker: Sticker) => {
    if (sticker.isLocked && sticker.price && onPurchase) {
      // Purchase flow
      if (userCoins < sticker.price) {
        HapticFeedback.error();
        return;
      }

      setIsPurchasing(true);
      HapticFeedback.medium();

      const success = await onPurchase(sticker.id, sticker.price);
      setIsPurchasing(false);

      if (success) {
        HapticFeedback.success();
        sticker.isLocked = false;
        onSelectSticker(sticker);
        onClose();
      } else {
        HapticFeedback.error();
      }
    } else if (!sticker.isLocked) {
      HapticFeedback.light();
      onSelectSticker(sticker);
      onClose();
    }
  };

  const filteredStickers = selectedPack.stickers.filter((sticker) =>
    sticker.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal visible={visible} animationType="none" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Backdrop */}
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

        {/* Sticker picker panel */}
        <Animated.View style={[styles.panel, { transform: [{ translateX: slideAnim }] }]}>
          <GlassCard variant="frosted" intensity="strong" style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>Stickers</Text>
                <View style={styles.coinsDisplay}>
                  <Text style={styles.coinIcon}>💰</Text>
                  <Text style={styles.coinsText}>{userCoins}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Search bar */}
            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search stickers..."
                placeholderTextColor="#6b7280"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Pack tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.packTabs}
              contentContainerStyle={styles.packTabsContent}
            >
              {STICKER_PACKS.map((pack) => (
                <TouchableOpacity
                  key={pack.id}
                  onPress={() => {
                    HapticFeedback.light();
                    setSelectedPack(pack);
                  }}
                  style={[styles.packTab, selectedPack.id === pack.id && styles.packTabActive]}
                >
                  <Text style={styles.packIcon}>{pack.icon}</Text>
                  <Text
                    style={[styles.packName, selectedPack.id === pack.id && styles.packNameActive]}
                  >
                    {pack.name}
                  </Text>
                  {pack.isLimitedTime && (
                    <View style={styles.limitedBadge}>
                      <Text style={styles.limitedText}>⏰</Text>
                    </View>
                  )}
                  {pack.isPremium && (
                    <View style={styles.premiumBadge}>
                      <Text style={styles.premiumText}>⭐</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Stickers grid */}
            <ScrollView style={styles.stickersScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.stickersGrid}>
                {filteredStickers.map((sticker) => (
                  <StickerItem
                    key={sticker.id}
                    sticker={sticker}
                    onPress={() => handleSelectSticker(sticker)}
                    rarityColor={getRarityColor(sticker.rarity)}
                    isPurchasing={isPurchasing}
                  />
                ))}
              </View>

              {filteredStickers.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No stickers found</Text>
                </View>
              )}
            </ScrollView>
          </GlassCard>
        </Animated.View>
      </View>
    </Modal>
  );
}

// Re-export types
export type { Sticker, StickerPack, StickerPickerProps } from './types';
