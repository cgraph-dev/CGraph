/**
 * ThreadRatingDisplay Component (React Native)
 * 5-star rating system with interactive input and display
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';

interface ThreadRatingDisplayProps {
  threadId?: string;
  rating?: number; // Average rating (0-5)
  ratingCount?: number; // Number of ratings
  myRating?: number | null; // Current user's rating (1-5)
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean; // Allow user to rate
  showCount?: boolean; // Show number of ratings
  onRate?: (rating: number) => Promise<void>;
}

export default function ThreadRatingDisplay({
  rating = 0,
  ratingCount = 0,
  myRating = null,
  size = 'md',
  interactive = true,
  showCount = true,
  onRate,
}: ThreadRatingDisplayProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sizeMap = {
    sm: 14,
    md: 18,
    lg: 22,
  };

  const starSize = sizeMap[size];

  const handleRate = async (starValue: number) => {
    if (!interactive || isSubmitting || !onRate) return;

    setIsSubmitting(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await onRate(starValue);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Failed to rate thread:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayRating = myRating || rating;

  return (
    <View style={styles.container}>
      {/* Star Rating */}
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((starValue) => {
          const isFilled = starValue <= displayRating;
          const isMyRating = myRating !== null && starValue <= myRating;

          const StarComponent = interactive ? TouchableOpacity : View;

          return (
            <StarComponent
              key={starValue}
              onPress={() => handleRate(starValue)}
              disabled={!interactive || isSubmitting}
              style={styles.starButton}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.star,
                  { fontSize: starSize },
                  isMyRating && styles.myRatingStar,
                ]}
              >
                {isFilled ? '★' : '☆'}
              </Text>
            </StarComponent>
          );
        })}
      </View>

      {/* Rating Stats */}
      {showCount && ratingCount > 0 && (
        <View style={styles.stats}>
          <Text style={styles.ratingValue}>{rating.toFixed(1)}</Text>
          <Text style={styles.ratingCount}>
            ({ratingCount} {ratingCount === 1 ? 'rating' : 'ratings'})
          </Text>
        </View>
      )}

      {/* My Rating Indicator */}
      {myRating !== null && interactive && (
        <Text style={styles.myRatingText}>
          Your rating: {myRating}★
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  starButton: {
    padding: 2,
  },
  star: {
    color: '#eab308', // yellow-500
  },
  myRatingStar: {
    color: '#10b981', // primary-400
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  ratingCount: {
    fontSize: 12,
    color: '#9ca3af', // gray-400
  },
  myRatingText: {
    fontSize: 11,
    color: '#10b981', // primary-400
  },
});
