/**
 * Countdown timer component for limited-time shop offers.
 * @module screens/premium/coin-shop-screen/components/countdown-timer
 */
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CountdownTimerProps {
  endsInHours: number;
}

/**
 * Countdown Timer Component
 *
 * Displays a countdown timer for special offers.
 * Features:
 * - Calculates hours/minutes/seconds remaining
 * - Updates every second with setInterval
 * - Formatted time display with leading zeros
 * - Compact design with clock icon
 */
export function CountdownTimer({ endsInHours }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(endsInHours * 3600);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <Ionicons name="time" size={12} color="rgba(255,255,255,0.8)" />
      <Text style={styles.text}>{formatTime(timeLeft)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  text: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
});

export default CountdownTimer;
