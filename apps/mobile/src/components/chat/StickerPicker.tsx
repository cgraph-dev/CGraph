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
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Modal,
  Dimensions,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AnimationColors, HapticFeedback } from '@/lib/animations/AnimationEngine';
import GlassCard from '../ui/GlassCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type StickerRarity = 'common' | 'rare' | 'epic' | 'legendary';

// All 15 animation types matching web parity
type StickerAnimationType = 
  | 'bounce' 
  | 'pulse' 
  | 'shake' 
  | 'wiggle' 
  | 'float' 
  | 'pop' 
  | 'wave' 
  | 'spin'
  | 'zoom'
  | 'flip'
  | 'swing'
  | 'jello'
  | 'heartbeat'
  | 'flash'
  | 'rubberband'
  | 'none';

interface Sticker {
  id: string;
  emoji: string;
  name: string;
  pack: string;
  rarity: StickerRarity;
  animation: StickerAnimationType;
  isLocked: boolean;
  price?: number;
}

interface StickerPack {
  id: string;
  name: string;
  icon: string;
  stickers: Sticker[];
  isLimitedTime?: boolean;
  isPremium?: boolean;
}

interface StickerPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectSticker: (sticker: Sticker) => void;
  userCoins?: number;
  onPurchase?: (stickerId: string, price: number) => Promise<boolean>;
}

// Sample sticker packs (in real app, fetch from backend)
const STICKER_PACKS: StickerPack[] = [
  {
    id: 'emotions',
    name: 'Emotions',
    icon: '😊',
    stickers: [
      { id: 'happy', emoji: '😊', name: 'Happy', pack: 'emotions', rarity: 'common', animation: 'bounce', isLocked: false },
      { id: 'love', emoji: '😍', name: 'Love', pack: 'emotions', rarity: 'common', animation: 'pulse', isLocked: false },
      { id: 'laugh', emoji: '😂', name: 'Laugh', pack: 'emotions', rarity: 'common', animation: 'shake', isLocked: false },
      { id: 'cool', emoji: '😎', name: 'Cool', pack: 'emotions', rarity: 'rare', animation: 'wiggle', isLocked: false },
      { id: 'mindblown', emoji: '🤯', name: 'Mind Blown', pack: 'emotions', rarity: 'epic', animation: 'pop', isLocked: false },
    ],
  },
  {
    id: 'reactions',
    name: 'Reactions',
    icon: '👍',
    stickers: [
      { id: 'thumbsup', emoji: '👍', name: 'Thumbs Up', pack: 'reactions', rarity: 'common', animation: 'bounce', isLocked: false },
      { id: 'fire', emoji: '🔥', name: 'Fire', pack: 'reactions', rarity: 'rare', animation: 'wave', isLocked: false },
      { id: 'rocket', emoji: '🚀', name: 'Rocket', pack: 'reactions', rarity: 'epic', animation: 'float', isLocked: false },
      { id: 'star', emoji: '⭐', name: 'Star', pack: 'reactions', rarity: 'legendary', animation: 'spin', isLocked: false, price: 100 },
    ],
  },
  {
    id: 'gaming',
    name: 'Gaming',
    icon: '🎮',
    isPremium: true,
    stickers: [
      { id: 'controller', emoji: '🎮', name: 'Controller', pack: 'gaming', rarity: 'rare', animation: 'wiggle', isLocked: true, price: 50 },
      { id: 'trophy', emoji: '🏆', name: 'Trophy', pack: 'gaming', rarity: 'epic', animation: 'bounce', isLocked: true, price: 150 },
      { id: 'crown', emoji: '👑', name: 'Crown', pack: 'gaming', rarity: 'legendary', animation: 'spin', isLocked: true, price: 300 },
    ],
  },
  {
    id: 'seasonal',
    name: 'Seasonal',
    icon: '🎄',
    isLimitedTime: true,
    stickers: [
      { id: 'christmas', emoji: '🎄', name: 'Christmas', pack: 'seasonal', rarity: 'rare', animation: 'bounce', isLocked: true, price: 200 },
      { id: 'gift', emoji: '🎁', name: 'Gift', pack: 'seasonal', rarity: 'epic', animation: 'shake', isLocked: true, price: 250 },
    ],
  },
];

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
  }, [visible]);

  const handleSelectSticker = async (sticker: Sticker) => {
    if (sticker.isLocked && sticker.price && onPurchase) {
      // Purchase flow
      if (userCoins < sticker.price) {
        HapticFeedback.error();
        // Show "not enough coins" message
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

  const getRarityColor = (rarity: StickerRarity): string => {
    const colorMap: Record<StickerRarity, string> = {
      common: AnimationColors.gray500,
      rare: '#3b82f6',
      epic: '#8b5cf6',
      legendary: '#f59e0b',
    };
    return colorMap[rarity];
  };

  const filteredStickers = selectedPack.stickers.filter((sticker) =>
    sticker.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Sticker picker panel */}
        <Animated.View
          style={[
            styles.panel,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
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
                placeholderTextColor={AnimationColors.gray500}
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
                  style={[
                    styles.packTab,
                    selectedPack.id === pack.id && styles.packTabActive,
                  ]}
                >
                  <Text style={styles.packIcon}>{pack.icon}</Text>
                  <Text
                    style={[
                      styles.packName,
                      selectedPack.id === pack.id && styles.packNameActive,
                    ]}
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

// Separate component for animated sticker item with all 15 animation types
function StickerItem({
  sticker,
  onPress,
  rarityColor,
  isPurchasing,
}: {
  sticker: Sticker;
  onPress: () => void;
  rarityColor: string;
  isPurchasing: boolean;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const scaleXAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const rotateYAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;
  const translateXAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Stop any existing animations
    scaleAnim.stopAnimation();
    scaleXAnim.stopAnimation();
    rotateAnim.stopAnimation();
    rotateYAnim.stopAnimation();
    translateYAnim.stopAnimation();
    translateXAnim.stopAnimation();
    opacityAnim.stopAnimation();

    // Reset values
    scaleAnim.setValue(1);
    scaleXAnim.setValue(1);
    rotateAnim.setValue(0);
    rotateYAnim.setValue(0);
    translateYAnim.setValue(0);
    translateXAnim.setValue(0);
    opacityAnim.setValue(1);

    // Animation based on sticker type - all 15 animations matching web
    switch (sticker.animation) {
      case 'bounce':
        Animated.loop(
          Animated.sequence([
            Animated.timing(translateYAnim, {
              toValue: -10,
              duration: 250,
              useNativeDriver: true,
              easing: Easing.out(Easing.quad),
            }),
            Animated.timing(translateYAnim, {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
              easing: Easing.in(Easing.quad),
            }),
          ])
        ).start();
        break;

      case 'pulse':
        Animated.loop(
          Animated.sequence([
            Animated.timing(scaleAnim, {
              toValue: 1.1,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
          ])
        ).start();
        break;

      case 'shake':
        Animated.loop(
          Animated.sequence([
            Animated.timing(translateXAnim, {
              toValue: -5,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.timing(translateXAnim, {
              toValue: 5,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.timing(translateXAnim, {
              toValue: -5,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.timing(translateXAnim, {
              toValue: 5,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.timing(translateXAnim, {
              toValue: 0,
              duration: 100,
              useNativeDriver: true,
            }),
          ])
        ).start();
        break;

      case 'wiggle':
        Animated.loop(
          Animated.sequence([
            Animated.timing(rotateAnim, {
              toValue: -0.05, // -3 degrees in radians
              duration: 166,
              useNativeDriver: true,
            }),
            Animated.timing(rotateAnim, {
              toValue: 0.05, // 3 degrees
              duration: 166,
              useNativeDriver: true,
            }),
            Animated.timing(rotateAnim, {
              toValue: -0.05,
              duration: 166,
              useNativeDriver: true,
            }),
          ])
        ).start();
        break;

      case 'float':
        Animated.loop(
          Animated.sequence([
            Animated.timing(translateYAnim, {
              toValue: -10,
              duration: 1000,
              useNativeDriver: true,
              easing: Easing.inOut(Easing.ease),
            }),
            Animated.timing(translateYAnim, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
              easing: Easing.inOut(Easing.ease),
            }),
          ])
        ).start();
        break;

      case 'pop':
        // One-time animation
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1.2,
            duration: 150,
            useNativeDriver: true,
            easing: Easing.out(Easing.back(2)),
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();
        break;

      case 'wave':
        Animated.loop(
          Animated.sequence([
            Animated.timing(rotateAnim, {
              toValue: 0.35, // 20 degrees
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.timing(rotateAnim, {
              toValue: -0.35, // -20 degrees
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(rotateAnim, {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
            }),
          ])
        ).start();
        break;

      case 'zoom':
        Animated.loop(
          Animated.sequence([
            Animated.timing(scaleAnim, {
              toValue: 1.1,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
          ])
        ).start();
        break;

      case 'flip':
        Animated.loop(
          Animated.timing(rotateYAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
            easing: Easing.linear,
          })
        ).start();
        break;

      case 'swing':
        Animated.sequence([
          Animated.timing(rotateAnim, {
            toValue: 0.26, // 15 degrees
            duration: 166,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: -0.175, // -10 degrees
            duration: 166,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0.087, // 5 degrees
            duration: 166,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: -0.087, // -5 degrees
            duration: 166,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 166,
            useNativeDriver: true,
          }),
        ]).start();
        break;

      case 'jello':
        Animated.sequence([
          Animated.timing(scaleXAnim, {
            toValue: 1.25,
            duration: 142,
            useNativeDriver: true,
          }),
          Animated.timing(scaleXAnim, {
            toValue: 0.75,
            duration: 142,
            useNativeDriver: true,
          }),
          Animated.timing(scaleXAnim, {
            toValue: 1.15,
            duration: 142,
            useNativeDriver: true,
          }),
          Animated.timing(scaleXAnim, {
            toValue: 0.95,
            duration: 142,
            useNativeDriver: true,
          }),
          Animated.timing(scaleXAnim, {
            toValue: 1.05,
            duration: 142,
            useNativeDriver: true,
          }),
          Animated.timing(scaleXAnim, {
            toValue: 1,
            duration: 142,
            useNativeDriver: true,
          }),
        ]).start();
        break;

      case 'heartbeat':
        Animated.loop(
          Animated.sequence([
            Animated.timing(scaleAnim, {
              toValue: 1.3,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1.3,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 1050, // Rest of the 1.5s cycle
              useNativeDriver: true,
            }),
          ])
        ).start();
        break;

      case 'flash':
        Animated.loop(
          Animated.sequence([
            Animated.timing(opacityAnim, {
              toValue: 0.5,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 1,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0.5,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 1,
              duration: 250,
              useNativeDriver: true,
            }),
          ])
        ).start();
        break;

      case 'rubberband':
        Animated.sequence([
          Animated.timing(scaleXAnim, {
            toValue: 1.25,
            duration: 142,
            useNativeDriver: true,
          }),
          Animated.timing(scaleXAnim, {
            toValue: 0.75,
            duration: 142,
            useNativeDriver: true,
          }),
          Animated.timing(scaleXAnim, {
            toValue: 1.15,
            duration: 142,
            useNativeDriver: true,
          }),
          Animated.timing(scaleXAnim, {
            toValue: 0.95,
            duration: 142,
            useNativeDriver: true,
          }),
          Animated.timing(scaleXAnim, {
            toValue: 1.05,
            duration: 142,
            useNativeDriver: true,
          }),
          Animated.timing(scaleXAnim, {
            toValue: 1,
            duration: 142,
            useNativeDriver: true,
          }),
        ]).start();
        break;

      case 'spin':
        Animated.loop(
          Animated.timing(rotateAnim, {
            toValue: 1, // Full rotation
            duration: 1000,
            useNativeDriver: true,
            easing: Easing.linear,
          })
        ).start();
        break;

      case 'none':
      default:
        break;
    }

    return () => {
      scaleAnim.stopAnimation();
      scaleXAnim.stopAnimation();
      rotateAnim.stopAnimation();
      rotateYAnim.stopAnimation();
      translateYAnim.stopAnimation();
      translateXAnim.stopAnimation();
      opacityAnim.stopAnimation();
    };
  }, [sticker.animation]);

  // Interpolations
  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const rotationY = rotateYAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isPurchasing}
      style={[styles.stickerItem, { borderColor: rarityColor }]}
    >
      <LinearGradient
        colors={[`${rarityColor}20`, `${rarityColor}10`]}
        style={StyleSheet.absoluteFill}
      />

      <Animated.Text
        style={[
          styles.stickerEmoji,
          {
            transform: [
              { scale: scaleAnim },
              { scaleX: scaleXAnim },
              { rotate: rotation },
              { rotateY: rotationY },
              { translateX: translateXAnim },
              { translateY: translateYAnim },
            ],
            opacity: opacityAnim,
          },
          sticker.isLocked && styles.stickerLocked,
        ]}
      >
        {sticker.emoji}
      </Animated.Text>

      {sticker.isLocked && (
        <View style={styles.lockOverlay}>
          <Text style={styles.lockIcon}>🔒</Text>
          {sticker.price && (
            <View style={styles.priceTag}>
              <Text style={styles.priceText}>{sticker.price}</Text>
              <Text style={styles.priceCoin}>💰</Text>
            </View>
          )}
        </View>
      )}

      {/* Rarity indicator */}
      {sticker.rarity !== 'common' && (
        <View style={[styles.rarityIndicator, { backgroundColor: rarityColor }]} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  panel: {
    height: '75%',
    width: '100%',
  },
  content: {
    flex: 1,
    padding: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: AnimationColors.dark600,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: AnimationColors.white,
  },
  coinsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: AnimationColors.dark700,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  coinIcon: {
    fontSize: 16,
  },
  coinsText: {
    fontSize: 16,
    fontWeight: '700',
    color: AnimationColors.amber,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AnimationColors.dark700,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: AnimationColors.gray400,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: AnimationColors.dark700,
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  searchIcon: {
    fontSize: 18,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: AnimationColors.white,
  },
  packTabs: {
    marginTop: 16,
    maxHeight: 100,
  },
  packTabsContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  packTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: AnimationColors.dark700,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  packTabActive: {
    backgroundColor: AnimationColors.dark600,
    borderColor: AnimationColors.primary,
  },
  packIcon: {
    fontSize: 20,
  },
  packName: {
    fontSize: 14,
    fontWeight: '600',
    color: AnimationColors.gray400,
  },
  packNameActive: {
    color: AnimationColors.white,
  },
  limitedBadge: {
    marginLeft: 4,
  },
  limitedText: {
    fontSize: 14,
  },
  premiumBadge: {
    marginLeft: 4,
  },
  premiumText: {
    fontSize: 14,
  },
  stickersScroll: {
    flex: 1,
    marginTop: 16,
  },
  stickersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 12,
  },
  stickerItem: {
    width: (SCREEN_WIDTH - 64) / 4,
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  stickerEmoji: {
    fontSize: 36,
  },
  stickerLocked: {
    opacity: 0.4,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  lockIcon: {
    fontSize: 20,
  },
  priceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: AnimationColors.dark800,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priceText: {
    fontSize: 12,
    fontWeight: '700',
    color: AnimationColors.white,
  },
  priceCoin: {
    fontSize: 12,
  },
  rarityIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: AnimationColors.gray500,
  },
});
