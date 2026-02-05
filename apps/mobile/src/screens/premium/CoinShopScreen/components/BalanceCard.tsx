import React from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Animated3DCoin } from './Animated3DCoin';
import { AnimatedCounter } from './AnimatedCounter';

interface BalanceCardProps {
  userCoins: number;
  canClaimDaily: boolean;
  onClaimDaily: () => void;
  scaleAnim: Animated.Value;
}

export function BalanceCard({
  userCoins,
  canClaimDaily,
  onClaimDaily,
  scaleAnim,
}: BalanceCardProps) {
  return (
    <Animated.View style={[styles.balanceCardWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <LinearGradient
        colors={['#1e1e2e', '#2d2d44']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.balanceCard}
      >
        <View style={styles.balanceContent}>
          <View style={styles.balanceLeft}>
            <Text style={styles.balanceLabel}>Your Balance</Text>
            <View style={styles.balanceRow}>
              <AnimatedCounter value={userCoins} style={styles.balanceValue} />
              <Text style={styles.coinLabelText}>coins</Text>
            </View>
          </View>
          <Animated3DCoin size={65} />
        </View>

        <TouchableOpacity
          style={[styles.dailyBonusCard, !canClaimDaily && styles.dailyBonusDisabled]}
          onPress={onClaimDaily}
          disabled={!canClaimDaily}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={canClaimDaily ? ['#10b981', '#059669'] : ['#4b5563', '#374151']}
            style={styles.dailyBonusGradient}
          >
            <Ionicons name="gift" size={18} color="#fff" />
            <Text style={styles.dailyBonusText}>
              {canClaimDaily ? 'Claim Daily Bonus' : 'Already Claimed'}
            </Text>
            {canClaimDaily && (
              <View style={styles.dailyBonusAmount}>
                <Text style={styles.dailyBonusAmountText}>+50</Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  balanceCardWrapper: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  balanceCard: {
    padding: 20,
    borderRadius: 24,
  },
  balanceContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLeft: {},
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 4,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#f59e0b',
  },
  coinLabelText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '500',
  },
  dailyBonusCard: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  dailyBonusDisabled: {
    opacity: 0.7,
  },
  dailyBonusGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  dailyBonusText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  dailyBonusAmount: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dailyBonusAmountText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
