/**
 * Header component for the coin shop with balance display and navigation.
 * @module screens/premium/coin-shop-screen/components/shop-header
 */
import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, interpolate, type SharedValue } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

interface ShopHeaderProps {
  title: string;
  textColor: string;
  canClaimDaily: boolean;
  onGoBack: () => void;
  onClaimDaily: () => void;
  animValue: SharedValue<number>;
}

/**
 *
 */
export function ShopHeader({
  title,
  textColor,
  canClaimDaily,
  onGoBack,
  onClaimDaily,
  animValue,
}: ShopHeaderProps) {
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: animValue.value,
    transform: [
      {
        translateY: interpolate(animValue.value, [0, 1], [-20, 0]),
      },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.header,
        headerAnimatedStyle,
      ]}
    >
      <TouchableOpacity style={styles.backButton} onPress={onGoBack} activeOpacity={0.7}>
        <Ionicons name="arrow-back" size={24} color={textColor} />
      </TouchableOpacity>

      <Text style={[styles.headerTitle, { color: textColor }]}>{title}</Text>

      <TouchableOpacity
        style={[styles.dailyButton, !canClaimDaily && styles.dailyButtonDisabled]}
        onPress={onClaimDaily}
        disabled={!canClaimDaily}
        activeOpacity={0.8}
      >
        <Ionicons name="gift" size={20} color={canClaimDaily ? '#10b981' : '#6b7280'} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
  },
  dailyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dailyButtonDisabled: {
    backgroundColor: 'rgba(107, 114, 128, 0.2)',
  },
});
