/**
 * useBubbleCustomization — reads chat bubble style from AsyncStorage.
 *
 * Lightweight hook for rendering contexts (MessageBubble).
 * Avoids pulling in the full ChatBubbleSettingsScreen dependency chain.
 *
 * @module hooks/useBubbleCustomization
 */

import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'cgraph-chat-bubble-style';

export interface BubbleStyle {
  ownMessageBg: string;
  ownMessageText: string;
  otherMessageBg: string;
  otherMessageText: string;
  borderRadius: number;
  useGradient: boolean;
  glassEffect: boolean;
  shadowIntensity: number;
}

const defaults: BubbleStyle = {
  ownMessageBg: '#10b981',
  ownMessageText: '#ffffff',
  otherMessageBg: '#374151',
  otherMessageText: '#ffffff',
  borderRadius: 16,
  useGradient: false,
  glassEffect: false,
  shadowIntensity: 20,
};

let cachedStyle: BubbleStyle | null = null;

/**
 * Returns the user's chat bubble customization.
 * Reads from AsyncStorage once, then caches in-memory.
 */
export function useBubbleCustomization(): BubbleStyle {
  const [style, setStyle] = useState<BubbleStyle>(cachedStyle ?? defaults);

  useEffect(() => {
    if (cachedStyle) return; // Already loaded

    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored) {
          const parsed = { ...defaults, ...JSON.parse(stored) };
          cachedStyle = parsed;
          setStyle(parsed);
        } else {
          cachedStyle = defaults;
        }
      })
      .catch(() => {
        cachedStyle = defaults;
      });
  }, []);

  return style;
}

/**
 * Invalidate the cached style (call after settings change).
 */
export function invalidateBubbleCache(): void {
  cachedStyle = null;
}
