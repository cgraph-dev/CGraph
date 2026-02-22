/**
 * Coin Balance Component
 * 
 * Displays user's coin balance with animated effects.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface CoinBalanceProps {
  balance: number;
  onPress?: () => void;
  showAddButton?: boolean;
}

export default function CoinBalance({ 
  balance, 
  onPress,
  showAddButton = true 
}: CoinBalanceProps) {
  const scale = useSharedValue(1);
  const prevBalance = React.useRef(balance);
  
  React.useEffect(() => {
    if (balance !== prevBalance.current) {
      // Animate on balance change
      scale.value = withSequence(
        withTiming(1.2, { duration: 150 }),
        withSpring(1)
      );
      
      if (balance > prevBalance.current) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      prevBalance.current = balance;
    }
  }, [balance]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };
  
  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
      <LinearGradient
        colors={['#F59E0B', '#D97706']}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.coinIcon}>
          <Ionicons name="logo-bitcoin" size={20} color="#FEF3C7" />
        </View>
        
        <Animated.Text style={[styles.balance, animatedStyle]}>
          {balance.toLocaleString()}
        </Animated.Text>
        
        {showAddButton && (
          <View style={styles.addButton}>
            <Ionicons name="add" size={16} color="#F59E0B" />
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  coinIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  balance: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  addButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
});
