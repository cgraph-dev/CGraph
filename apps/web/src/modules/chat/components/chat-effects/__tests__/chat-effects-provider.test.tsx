/** @module ChatEffectsProvider tests */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { renderHook } from '@testing-library/react';

vi.mock('@/stores/theme', () => ({
  useThemeStore: () => ({ theme: { colorPreset: 'blue' } }),
  THEME_COLORS: { blue: { primary: '#3b82f6' } },
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({ debug: vi.fn(), error: vi.fn(), warn: vi.fn() }),
  chatLogger: { debug: vi.fn() },
}));

const mockSettings = {
  effect: 'fade' as const,
  config: { effect: 'fade' as const, intensity: 'medium' as const, duration: 1000 },
  enabled: true,
};

vi.mock('@/modules/chat/store', () => ({
  useChatEffectSettings: () => mockSettings,
}));

import { ChatEffectsProvider, useChatEffects } from '../chat-effects-provider';

describe('ChatEffectsProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children correctly', () => {
    render(
      <ChatEffectsProvider>
        <div data-testid="child">Hello</div>
      </ChatEffectsProvider>
    );
    expect(screen.getByTestId('child')).toHaveTextContent('Hello');
  });

  it('provides effect value from store', () => {
    function Consumer() {
      const ctx = useChatEffects();
      return <div data-testid="effect">{ctx.effect}</div>;
    }
    render(
      <ChatEffectsProvider>
        <Consumer />
      </ChatEffectsProvider>
    );
    expect(screen.getByTestId('effect')).toHaveTextContent('fade');
  });

  it('provides enabled value from store', () => {
    function Consumer() {
      const ctx = useChatEffects();
      return <div data-testid="enabled">{String(ctx.enabled)}</div>;
    }
    render(
      <ChatEffectsProvider>
        <Consumer />
      </ChatEffectsProvider>
    );
    expect(screen.getByTestId('enabled')).toHaveTextContent('true');
  });

  it('uses effectOverride when provided', () => {
    function Consumer() {
      const ctx = useChatEffects();
      return <div data-testid="effect">{ctx.effect}</div>;
    }
    render(
      <ChatEffectsProvider effectOverride={'bounce' as 'fade'}>
        <Consumer />
      </ChatEffectsProvider>
    );
    expect(screen.getByTestId('effect')).toHaveTextContent('bounce');
  });

  it('uses configOverride when provided', () => {
    const override = { effect: 'slide' as const, intensity: 'high' as const, duration: 2000 };
    function Consumer() {
      const ctx = useChatEffects();
      return <div data-testid="duration">{ctx.config.duration}</div>;
    }
    render(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <ChatEffectsProvider configOverride={override as any}>
        <Consumer />
      </ChatEffectsProvider>
    );
    expect(screen.getByTestId('duration')).toHaveTextContent('2000');
  });

  it('throws error when useChatEffects is used outside provider', () => {
    expect(() => {
      renderHook(() => useChatEffects());
    }).toThrow('useChatEffects must be used within ChatEffectsProvider');
  });

  it('provides config from store by default', () => {
    function Consumer() {
      const ctx = useChatEffects();
      return <div data-testid="intensity">{ctx.config.intensity}</div>;
    }
    render(
      <ChatEffectsProvider>
        <Consumer />
      </ChatEffectsProvider>
    );
    expect(screen.getByTestId('intensity')).toHaveTextContent('medium');
  });

  it('renders multiple children', () => {
    render(
      <ChatEffectsProvider>
        <div data-testid="c1">A</div>
        <div data-testid="c2">B</div>
      </ChatEffectsProvider>
    );
    expect(screen.getByTestId('c1')).toBeInTheDocument();
    expect(screen.getByTestId('c2')).toBeInTheDocument();
  });
});
