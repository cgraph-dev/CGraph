/**
 * Hook managing chat bubble style state, persistence, and preset application.
 * @module screens/settings/chat-bubble-settings-screen/hooks/useChatBubbleStyle
 */
import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { ChatBubbleStyle, defaultStyle, presets, STORAGE_KEY } from '../types';
import { invalidateBubbleCache } from '@/hooks/useBubbleCustomization';

/**
 *
 */
export function useChatBubbleStyle() {
  const [style, setStyle] = useState<ChatBubbleStyle>(defaultStyle);

  useEffect(() => {
    loadStyle();
  }, []);

  const loadStyle = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setStyle({ ...defaultStyle, ...JSON.parse(stored) });
      }
    } catch (error) {
      console.error('Failed to load style:', error);
    }
  };

  const saveStyle = async (newStyle: ChatBubbleStyle) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newStyle));
      invalidateBubbleCache(); // Force MessageBubble to re-read on next render
    } catch (error) {
      console.error('Failed to save style:', error);
    }
  };

  const updateStyle = useCallback(
    <K extends keyof ChatBubbleStyle>(key: K, value: ChatBubbleStyle[K]) => {
      setStyle((prev) => {
        const newStyle = { ...prev, [key]: value };
        saveStyle(newStyle);
        return newStyle;
      });
    },
    []
  );

  const applyPreset = useCallback((presetId: string) => {
    HapticFeedback.medium();
    const preset = presets.find((p) => p.id === presetId);
    if (preset) {
      setStyle(preset.style);
      saveStyle(preset.style);
    }
  }, []);

  const resetToDefaults = useCallback(() => {
    HapticFeedback.medium();
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset chat bubble settings to defaults?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setStyle(defaultStyle);
            saveStyle(defaultStyle);
            HapticFeedback.success();
          },
        },
      ]
    );
  }, []);

  return {
    style,
    updateStyle,
    applyPreset,
    resetToDefaults,
  };
}
