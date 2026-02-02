import { useState, useCallback } from 'react';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import type { UIPreferences } from '@/modules/chat/components/MessageBubble';

// ============================================================================
// Hook for managing conversation UI preferences and panel states
// ============================================================================

interface PanelStates {
  showSettings: boolean;
  showE2EETester: boolean;
  showInfoPanel: boolean;
  showMessageSearch: boolean;
  showScheduledList: boolean;
}

interface UseConversationUIReturn {
  // UI Preferences
  uiPreferences: UIPreferences;
  setUiPreferences: React.Dispatch<React.SetStateAction<UIPreferences>>;
  updatePreference: <K extends keyof UIPreferences>(key: K, value: UIPreferences[K]) => void;

  // Panel States
  panels: PanelStates;
  togglePanel: (panel: keyof PanelStates, forceValue?: boolean) => void;
  closeAllPanels: () => void;

  // Haptic Feedback Helper
  triggerHaptic: (intensity?: 'light' | 'medium' | 'heavy') => void;
}

const DEFAULT_UI_PREFERENCES: UIPreferences = {
  glassEffect: 'holographic',
  animationIntensity: 'high',
  showParticles: true,
  enableGlow: true,
  enable3D: true,
  enableHaptic: true,
  voiceVisualizerTheme: 'matrix-green',
  messageEntranceAnimation: 'slide',
};

export function useConversationUI(): UseConversationUIReturn {
  // UI preferences state
  const [uiPreferences, setUiPreferences] = useState<UIPreferences>(DEFAULT_UI_PREFERENCES);

  // Panel states
  const [panels, setPanels] = useState<PanelStates>({
    showSettings: false,
    showE2EETester: false,
    showInfoPanel: false,
    showMessageSearch: false,
    showScheduledList: false,
  });

  // Type-safe preference updater
  const updatePreference = useCallback(
    <K extends keyof UIPreferences>(key: K, value: UIPreferences[K]) => {
      setUiPreferences((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // Toggle a specific panel
  const togglePanel = useCallback((panel: keyof PanelStates, forceValue?: boolean) => {
    setPanels((prev) => ({
      ...prev,
      [panel]: forceValue !== undefined ? forceValue : !prev[panel],
    }));
  }, []);

  // Close all panels
  const closeAllPanels = useCallback(() => {
    setPanels({
      showSettings: false,
      showE2EETester: false,
      showInfoPanel: false,
      showMessageSearch: false,
      showScheduledList: false,
    });
  }, []);

  // Haptic feedback helper
  const triggerHaptic = useCallback(
    (intensity: 'light' | 'medium' | 'heavy' = 'medium') => {
      if (uiPreferences.enableHaptic) {
        HapticFeedback[intensity]();
      }
    },
    [uiPreferences.enableHaptic]
  );

  return {
    uiPreferences,
    setUiPreferences,
    updatePreference,
    panels,
    togglePanel,
    closeAllPanels,
    triggerHaptic,
  };
}
