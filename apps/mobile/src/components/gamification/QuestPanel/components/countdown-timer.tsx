/**
 * CountdownTimer - Time remaining display for quests
 */

import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { CountdownTimerProps } from '../types';
import { styles } from '../styles';

export function CountdownTimer({ expiresAt, compact = false }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const expires = new Date(expiresAt).getTime();
      const diff = expires - now;

      if (diff <= 0) {
        setTimeLeft('Expired');
        setIsUrgent(true);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setIsUrgent(hours < 1);

      if (compact) {
        if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m`);
        } else {
          setTimeLeft(`${minutes}m ${seconds}s`);
        }
      } else {
        if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        } else {
          setTimeLeft(`${minutes}m ${seconds}s`);
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, compact]);

  return (
    <View style={[styles.timerContainer, isUrgent && styles.timerUrgent]}>
      <Ionicons name="time-outline" size={12} color={isUrgent ? '#ef4444' : '#9ca3af'} />
      <Text style={[styles.timerText, isUrgent && styles.timerTextUrgent]}>{timeLeft}</Text>
    </View>
  );
}
