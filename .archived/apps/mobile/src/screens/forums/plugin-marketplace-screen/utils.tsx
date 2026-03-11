/**
 * PluginMarketplaceScreen Utils
 */

import React from 'react';
import { Ionicons } from '@expo/vector-icons';

/**
 *
 */
export function renderStars(rating: number): React.ReactNode[] {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <Ionicons
        key={i}
        name={i <= rating ? 'star' : i - 0.5 <= rating ? 'star-half' : 'star-outline'}
        size={14}
        color="#FFD700"
      />
    );
  }
  return stars;
}
