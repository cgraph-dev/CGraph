/** @module ChatEffects barrel export tests */
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/stores/theme', () => ({
  useThemeStore: () => ({ theme: { colorPreset: 'blue' } }),
  THEME_COLORS: { blue: { primary: '#3b82f6' } },
}));

describe('ChatEffects barrel exports', () => {
  it('exports MessageBubble component', async () => {
    const mod = await import('../chat-effects');
    expect(mod.MessageBubble).toBeDefined();
  });

  it('exports MessageWithEffect component', async () => {
    const mod = await import('../chat-effects');
    expect(mod.MessageWithEffect).toBeDefined();
  });

  it('exports MessageParticles component', async () => {
    const mod = await import('../chat-effects');
    expect(mod.MessageParticles).toBeDefined();
  });

  it('exports TypingIndicator component', async () => {
    const mod = await import('../chat-effects');
    expect(mod.TypingIndicator).toBeDefined();
  });

  it('exports ReactionAnimation component', async () => {
    const mod = await import('../chat-effects');
    expect(mod.ReactionAnimation).toBeDefined();
  });

  it('exports ChatEffectsProvider component', async () => {
    const mod = await import('../chat-effects');
    expect(mod.ChatEffectsProvider).toBeDefined();
  });

  it('exports useChatEffects hook', async () => {
    const mod = await import('../chat-effects');
    expect(mod.useChatEffects).toBeDefined();
  });

  it('exports PARTICLE_EFFECTS constant', async () => {
    const mod = await import('../chat-effects');
    expect(mod.PARTICLE_EFFECTS).toBeDefined();
  });

  it('exports TYPING_SPEED_MAP constant', async () => {
    const mod = await import('../chat-effects');
    expect(mod.TYPING_SPEED_MAP).toBeDefined();
  });

  it('has a default export matching ChatEffectsProvider', async () => {
    const mod = await import('../chat-effects');
    expect(mod.default).toBe(mod.ChatEffectsProvider);
  });
});
