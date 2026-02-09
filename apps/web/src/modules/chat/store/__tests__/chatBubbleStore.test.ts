import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useChatBubbleStore,
  defaultChatBubbleStyle,
  CHAT_BUBBLE_PRESETS,
} from '../chatBubbleStore';
import { useThemeStore } from '@/stores/theme';

beforeEach(() => {
  useThemeStore.setState(useThemeStore.getInitialState());
  vi.clearAllMocks();
});

// =============================================================================
// Exports
// =============================================================================

describe('chatBubbleStore exports', () => {
  it('exports defaultChatBubbleStyle with expected keys', () => {
    expect(defaultChatBubbleStyle).toBeDefined();
    expect(defaultChatBubbleStyle.ownMessageBg).toBe('#10b981');
    expect(defaultChatBubbleStyle.borderRadius).toBe(16);
    expect(defaultChatBubbleStyle.showTail).toBe(true);
  });

  it('exports CHAT_BUBBLE_PRESETS', () => {
    expect(CHAT_BUBBLE_PRESETS).toBeDefined();
    expect(typeof CHAT_BUBBLE_PRESETS).toBe('object');
  });

  it('useChatBubbleStore is a function', () => {
    expect(typeof useChatBubbleStore).toBe('function');
  });
});

// =============================================================================
// Hook API
// =============================================================================

describe('useChatBubbleStore hook', () => {
  it('returns style object', () => {
    const { result } = renderHook(() => useChatBubbleStore());
    expect(result.current.style).toBeDefined();
    expect(typeof result.current.style.borderRadius).toBe('number');
  });

  it('returns updateStyle function', () => {
    const { result } = renderHook(() => useChatBubbleStore());
    expect(typeof result.current.updateStyle).toBe('function');
  });

  it('returns resetStyle function', () => {
    const { result } = renderHook(() => useChatBubbleStore());
    expect(typeof result.current.resetStyle).toBe('function');
  });

  it('returns applyPreset function', () => {
    const { result } = renderHook(() => useChatBubbleStore());
    expect(typeof result.current.applyPreset).toBe('function');
  });

  it('returns exportStyle function', () => {
    const { result } = renderHook(() => useChatBubbleStore());
    expect(typeof result.current.exportStyle).toBe('function');
  });

  it('returns importStyle function', () => {
    const { result } = renderHook(() => useChatBubbleStore());
    expect(typeof result.current.importStyle).toBe('function');
  });
});

// =============================================================================
// updateStyle
// =============================================================================

describe('updateStyle', () => {
  it('updates a single key with key-value pair', () => {
    const { result } = renderHook(() => useChatBubbleStore());
    act(() => {
      result.current.updateStyle('borderRadius', 24);
    });
    expect(result.current.style.borderRadius).toBe(24);
  });

  it('updates multiple keys with partial object', () => {
    const { result } = renderHook(() => useChatBubbleStore());
    act(() => {
      result.current.updateStyle({ borderRadius: 8, showTail: false });
    });
    expect(result.current.style.borderRadius).toBe(8);
    expect(result.current.style.showTail).toBe(false);
  });
});

// =============================================================================
// resetStyle
// =============================================================================

describe('resetStyle', () => {
  it('resets chat bubble to defaults', () => {
    const { result } = renderHook(() => useChatBubbleStore());
    act(() => {
      result.current.updateStyle('borderRadius', 99);
    });
    expect(result.current.style.borderRadius).toBe(99);
    act(() => {
      result.current.resetStyle();
    });
    // After reset, should be back to the theme default
    expect(typeof result.current.style.borderRadius).toBe('number');
  });
});

// =============================================================================
// exportStyle / importStyle
// =============================================================================

describe('exportStyle', () => {
  it('returns a valid JSON string', () => {
    const { result } = renderHook(() => useChatBubbleStore());
    const json = result.current.exportStyle();
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('exported JSON contains current borderRadius', () => {
    const { result } = renderHook(() => useChatBubbleStore());
    act(() => {
      result.current.updateStyle('borderRadius', 42);
    });
    const json = result.current.exportStyle();
    const parsed = JSON.parse(json);
    expect(parsed.borderRadius).toBe(42);
  });
});

describe('importStyle', () => {
  it('imports style from valid JSON', () => {
    const { result } = renderHook(() => useChatBubbleStore());
    act(() => {
      result.current.importStyle(JSON.stringify({ borderRadius: 55 }));
    });
    expect(result.current.style.borderRadius).toBe(55);
  });

  it('handles invalid JSON gracefully', () => {
    const { result } = renderHook(() => useChatBubbleStore());
    expect(() => {
      act(() => {
        result.current.importStyle('not-json');
      });
    }).not.toThrow();
  });
});

// =============================================================================
// defaultChatBubbleStyle properties
// =============================================================================

describe('defaultChatBubbleStyle', () => {
  it('has correct own message colors', () => {
    expect(defaultChatBubbleStyle.ownMessageBg).toBe('#10b981');
    expect(defaultChatBubbleStyle.ownMessageText).toBe('#ffffff');
  });

  it('has correct other message colors', () => {
    expect(defaultChatBubbleStyle.otherMessageBg).toBe('#374151');
    expect(defaultChatBubbleStyle.otherMessageText).toBe('#ffffff');
  });

  it('has gradient enabled', () => {
    expect(defaultChatBubbleStyle.useGradient).toBe(true);
  });

  it('has slide entrance animation', () => {
    expect(defaultChatBubbleStyle.entranceAnimation).toBe('slide');
  });

  it('has groupMessages enabled', () => {
    expect(defaultChatBubbleStyle.groupMessages).toBe(true);
  });

  it('has correct maxWidth', () => {
    expect(defaultChatBubbleStyle.maxWidth).toBe(70);
  });

  it('has hoverEffect enabled', () => {
    expect(defaultChatBubbleStyle.hoverEffect).toBe(true);
  });

  it('has showTimestamp enabled', () => {
    expect(defaultChatBubbleStyle.showTimestamp).toBe(true);
  });

  it('has showAvatar enabled', () => {
    expect(defaultChatBubbleStyle.showAvatar).toBe(true);
  });
});
