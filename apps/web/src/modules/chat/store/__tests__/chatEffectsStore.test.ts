// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useChatEffectsStore } from '../chatEffectsStore';

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn() },
}));

const { api } = await import('@/lib/api');
const mockedApi = vi.mocked(api);

const getInitialState = () => useChatEffectsStore.getState();

beforeEach(() => {
  useChatEffectsStore.setState(useChatEffectsStore.getInitialState());
  vi.clearAllMocks();
});

// =============================================================================
// Initial State
// =============================================================================

describe('chatEffectsStore initial state', () => {
  it('has default message effect', () => {
    const s = getInitialState();
    expect(s.activeMessageEffect.effect).toBe('fade-in');
    expect(s.activeMessageEffect.intensity).toBe('low');
  });

  it('has default bubble style', () => {
    expect(getInitialState().activeBubbleStyle).toBeDefined();
    expect(getInitialState().activeBubbleStyle.backgroundColor).toBe('#1a1a2e');
  });

  it('has default emoji pack', () => {
    expect(getInitialState().activeEmojiPack).toBe('default');
  });

  it('has default typing indicator', () => {
    expect(getInitialState().activeTypingIndicator).toBeDefined();
  });

  it('has default sound settings', () => {
    const s = getInitialState();
    expect(s.masterVolume).toBe(0.7);
    expect(s.soundsEnabled).toBe(true);
  });

  it('has empty unlocked effects', () => {
    expect(getInitialState().unlockedEffects).toEqual([]);
  });

  it('has default settings', () => {
    const s = getInitialState();
    expect(s.reduceMotion).toBe(false);
    expect(s.showEffectsInCompactMode).toBe(false);
    expect(s.autoPlayEffects).toBe(true);
  });

  it('has null preview states', () => {
    const s = getInitialState();
    expect(s.previewEffect).toBeNull();
    expect(s.previewBubble).toBeNull();
  });

  it('is not syncing', () => {
    expect(getInitialState().isSyncing).toBe(false);
  });
});

// =============================================================================
// Message Effects
// =============================================================================

describe('setMessageEffect', () => {
  it('sets effect with preset defaults', () => {
    useChatEffectsStore.getState().setMessageEffect('confetti');
    expect(useChatEffectsStore.getState().activeMessageEffect.effect).toBe('confetti');
    expect(useChatEffectsStore.getState().activeMessageEffect.intensity).toBe('high');
  });

  it('allows overriding config', () => {
    useChatEffectsStore
      .getState()
      .setMessageEffect('confetti', { intensity: 'low', duration: 100 });
    const e = useChatEffectsStore.getState().activeMessageEffect;
    expect(e.intensity).toBe('low');
    expect(e.duration).toBe(100);
  });

  it('activateEffect delegates to setMessageEffect', () => {
    useChatEffectsStore.getState().activateEffect('sparkle');
    expect(useChatEffectsStore.getState().activeMessageEffect.effect).toBe('sparkle');
  });
});

// =============================================================================
// Bubble Style
// =============================================================================

describe('setBubbleStyle', () => {
  it('sets bubble style with preset defaults', () => {
    useChatEffectsStore.getState().setBubbleStyle('neon');
    const s = useChatEffectsStore.getState().activeBubbleStyle;
    expect(s.style).toBe('neon');
    expect(s.textColor).toBe('#00ff00');
  });

  it('activateBubbleStyle delegates to setBubbleStyle', () => {
    useChatEffectsStore.getState().activateBubbleStyle('comic');
    expect(useChatEffectsStore.getState().activeBubbleStyle.style).toBe('comic');
  });

  it('allows overriding config', () => {
    useChatEffectsStore.getState().setBubbleStyle('neon', { textColor: '#ff0000' });
    expect(useChatEffectsStore.getState().activeBubbleStyle.textColor).toBe('#ff0000');
  });
});

// =============================================================================
// Typing Indicator & Emoji Pack
// =============================================================================

describe('setTypingIndicator & setEmojiPack', () => {
  it('sets typing indicator', () => {
    useChatEffectsStore.getState().setTypingIndicator('wave');
    expect(useChatEffectsStore.getState().activeTypingIndicator.style).toBe('wave');
  });

  it('activateTypingIndicator delegates', () => {
    useChatEffectsStore.getState().activateTypingIndicator('bounce');
    expect(useChatEffectsStore.getState().activeTypingIndicator.style).toBe('bounce');
  });

  it('sets emoji pack', () => {
    useChatEffectsStore.getState().setEmojiPack('kawaii');
    expect(useChatEffectsStore.getState().activeEmojiPack).toBe('kawaii');
  });
});

// =============================================================================
// Sound Actions
// =============================================================================

describe('sound actions', () => {
  it('toggleSounds flips soundsEnabled', () => {
    useChatEffectsStore.getState().toggleSounds();
    expect(useChatEffectsStore.getState().soundsEnabled).toBe(false);
    useChatEffectsStore.getState().toggleSounds();
    expect(useChatEffectsStore.getState().soundsEnabled).toBe(true);
  });

  it('setMasterVolume clamps between 0 and 1', () => {
    useChatEffectsStore.getState().setMasterVolume(1.5);
    expect(useChatEffectsStore.getState().masterVolume).toBe(1);
    useChatEffectsStore.getState().setMasterVolume(-0.5);
    expect(useChatEffectsStore.getState().masterVolume).toBe(0);
  });

  it('setReactionConfig merges with current config', () => {
    useChatEffectsStore.getState().setReactionConfig({ scale: 2 });
    const c = useChatEffectsStore.getState().activeReactionConfig;
    expect(c.scale).toBe(2);
    expect(c.animation).toBe('pop'); // preserved
  });
});

// =============================================================================
// Unlock Effects
// =============================================================================

describe('unlock effects', () => {
  it('unlocks an effect', () => {
    useChatEffectsStore.getState().unlockEffect({ id: 'confetti', type: 'message' });
    expect(useChatEffectsStore.getState().unlockedEffects).toHaveLength(1);
  });

  it('does not duplicate unlocks', () => {
    const unlock = { id: 'confetti', type: 'message' as const };
    useChatEffectsStore.getState().unlockEffect(unlock);
    useChatEffectsStore.getState().unlockEffect(unlock);
    expect(useChatEffectsStore.getState().unlockedEffects).toHaveLength(1);
  });

  it('isEffectUnlocked returns true for unlocked', () => {
    useChatEffectsStore.getState().unlockEffect({ id: 'x', type: 'bubble' });
    expect(useChatEffectsStore.getState().isEffectUnlocked('x', 'bubble')).toBe(true);
  });

  it('isEffectUnlocked returns false for expired', () => {
    useChatEffectsStore.getState().unlockEffect({
      id: 'x',
      type: 'bubble',
      expiresAt: '2020-01-01',
    });
    expect(useChatEffectsStore.getState().isEffectUnlocked('x', 'bubble')).toBe(false);
  });

  it('getUnlockedByType filters by type', () => {
    useChatEffectsStore.getState().unlockEffect({ id: 'a', type: 'message' });
    useChatEffectsStore.getState().unlockEffect({ id: 'b', type: 'bubble' });
    expect(useChatEffectsStore.getState().getUnlockedByType('message')).toHaveLength(1);
  });
});

// =============================================================================
// Settings Actions
// =============================================================================

describe('settings actions', () => {
  it('setReduceMotion', () => {
    useChatEffectsStore.getState().setReduceMotion(true);
    expect(useChatEffectsStore.getState().reduceMotion).toBe(true);
  });

  it('toggleCompactModeEffects', () => {
    useChatEffectsStore.getState().toggleCompactModeEffects();
    expect(useChatEffectsStore.getState().showEffectsInCompactMode).toBe(true);
  });

  it('toggleAutoPlay', () => {
    useChatEffectsStore.getState().toggleAutoPlay();
    expect(useChatEffectsStore.getState().autoPlayEffects).toBe(false);
  });

  it('setPreviewEffect', () => {
    useChatEffectsStore.getState().setPreviewEffect('confetti');
    expect(useChatEffectsStore.getState().previewEffect).toBe('confetti');
  });

  it('setPreviewBubble', () => {
    useChatEffectsStore.getState().setPreviewBubble('neon');
    expect(useChatEffectsStore.getState().previewBubble).toBe('neon');
  });
});

// =============================================================================
// Sync Actions
// =============================================================================

describe('syncWithServer', () => {
  it('posts state to server and sets lastSyncedAt', async () => {
    mockedApi.post.mockResolvedValueOnce({ data: {} });
    await useChatEffectsStore.getState().syncWithServer();
    expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/chat-effects/sync', expect.any(Object));
    expect(useChatEffectsStore.getState().lastSyncedAt).toBeTruthy();
    expect(useChatEffectsStore.getState().isSyncing).toBe(false);
  });

  it('handles sync failure gracefully', async () => {
    mockedApi.post.mockRejectedValueOnce(new Error('fail'));
    await useChatEffectsStore.getState().syncWithServer();
    expect(useChatEffectsStore.getState().isSyncing).toBe(false);
  });
});

describe('loadFromServer', () => {
  it('loads state from server', async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: { emojiPack: 'pixel', unlockedEffects: [{ id: 'a', type: 'message' }] },
    });
    await useChatEffectsStore.getState().loadFromServer();
    expect(useChatEffectsStore.getState().activeEmojiPack).toBe('pixel');
    expect(useChatEffectsStore.getState().isSyncing).toBe(false);
  });

  it('handles load failure gracefully', async () => {
    mockedApi.get.mockRejectedValueOnce(new Error('fail'));
    await useChatEffectsStore.getState().loadFromServer();
    expect(useChatEffectsStore.getState().isSyncing).toBe(false);
  });
});
