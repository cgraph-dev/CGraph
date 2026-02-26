/**
 * ChatEffectsProvider - Context provider for chat effects settings
 */

import { durations } from '@cgraph/animation-constants';
import { memo, createContext, use, useMemo } from 'react';
import { useChatEffectSettings } from '@/modules/chat/store';
import type { MessageEffect, MessageEffectConfig } from '@/modules/chat/store';
import type { ChatEffectsProviderProps } from './types';

interface ChatEffectsContextValue {
  effect: MessageEffect;
  config: MessageEffectConfig;
  enabled: boolean;
}

const ChatEffectsContext = createContext<ChatEffectsContextValue | null>(null);

export const useChatEffects = () => {
  const context = use(ChatEffectsContext);
  if (!context) {
    throw new Error('useChatEffects must be used within ChatEffectsProvider');
  }
  return context;
};

export const ChatEffectsProvider = memo(function ChatEffectsProvider({
  children,
  effectOverride,
  configOverride,
}: ChatEffectsProviderProps) {
  const settings = useChatEffectSettings();

  const value = useMemo(
    (): ChatEffectsContextValue => ({
      effect: effectOverride ?? settings.effect ?? 'none',
      config: configOverride ??
        settings.config ?? { effect: 'none', intensity: 'medium', duration: durations.verySlow.ms },
      enabled: settings.enabled ?? false,
    }),
    [effectOverride, configOverride, settings]
  );

  return <ChatEffectsContext.Provider value={value}>{children}</ChatEffectsContext.Provider>;
});
