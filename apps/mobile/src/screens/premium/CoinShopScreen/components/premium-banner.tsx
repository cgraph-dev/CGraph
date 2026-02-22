import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export function PremiumBanner() {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
      style={styles.premiumBannerWrapper}
    >
      <LinearGradient
        colors={['#8b5cf6', '#6366f1', '#3b82f6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.premiumBanner}
      >
        <Ionicons name="sparkles" size={32} color="#fff" style={styles.premiumEmoji} />
        <View style={styles.premiumTextContainer}>
          <Ionicons name="flash" size={18} color="#fff" />
        </View>
        <Ionicons name="chevron-forward" size={24} color="#fff" />
      </LinearGradient>
    </TouchableOpacity>
  );
}

import { View, Text } from 'react-native';

export function PremiumBannerFull() {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
      style={styles.premiumBannerWrapper}
    >
      <LinearGradient
        colors={['#8b5cf6', '#6366f1', '#3b82f6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.premiumBanner}
      >
        <Text style={styles.premiumEmoji}>✨</Text>
        <View style={styles.premiumTextContainer}>
          <Text style={styles.premiumTitle}>Go Premium</Text>
          <Text style={styles.premiumDescription}>Get 500 coins monthly + exclusive perks</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#fff" />
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  premiumBannerWrapper: {
    marginTop: 16,
  },
  premiumBanner: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  premiumTextContainer: {
    flex: 1,
  },
  premiumTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  premiumDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    marginTop: 2,
  },
});
