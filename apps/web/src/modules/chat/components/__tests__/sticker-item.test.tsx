/** @module StickerItem tests */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/data/stickers', () => ({
  STICKER_RARITY_COLORS: {
    common: { bg: 'bg-gray-500/20', border: 'border-gray-500/50', text: 'text-gray-400' },
    rare: { bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-400' },
    epic: { bg: 'bg-purple-500/20', border: 'border-purple-500/50', text: 'text-purple-400' },
    legendary: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', text: 'text-yellow-400' },
  },
}));

vi.mock('@/lib/utils', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

vi.mock('../sticker-picker/constants', () => ({
  ANIMATION_CONFIGS: { bounce: { y: [0, -10, 0] }, none: {} },
  RARITY_ICONS: { rare: '💎', epic: '🌟', legendary: '👑' },
}));

import { StickerItem } from '../sticker-picker/sticker-item';

function makeSticker(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sticker-1',
    name: 'Happy Cat',
    emoji: '😺',
    category: 'emotions' as const,
    rarity: 'common' as const,
    animation: 'bounce' as const,
    animationDuration: 1000,
    colors: ['#ff0000', '#00ff00'],
    description: 'A happy cat sticker',
    packId: 'pack-1',
    ...overrides,
  };
}

describe('StickerItem', () => {
  let onSelect: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onSelect = vi.fn();
  });

  it('renders the sticker emoji', () => {
    render(<StickerItem sticker={makeSticker()} onSelect={onSelect} isLocked={false} />);
    expect(screen.getByText('😺')).toBeInTheDocument();
  });

  it('calls onSelect with sticker when clicked and not locked', () => {
    const sticker = makeSticker();
    render(<StickerItem sticker={sticker} onSelect={onSelect} isLocked={false} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith(sticker);
  });

  it('does not call onSelect when locked', () => {
    render(<StickerItem sticker={makeSticker()} onSelect={onSelect} isLocked={true} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('shows lock overlay when locked', () => {
    render(<StickerItem sticker={makeSticker()} onSelect={onSelect} isLocked={true} />);
    expect(screen.getByTestId('lock-icon')).toBeInTheDocument();
  });

  it('does not show lock overlay when unlocked', () => {
    render(<StickerItem sticker={makeSticker()} onSelect={onSelect} isLocked={false} />);
    expect(screen.queryByTestId('lock-icon')).not.toBeInTheDocument();
  });

  it('shows unlock price in title when locked', () => {
    render(<StickerItem sticker={makeSticker()} onSelect={onSelect} isLocked={true} packPrice={500} />);
    expect(screen.getByTitle('Unlock for 500 coins')).toBeInTheDocument();
  });

  it('shows sticker name in title when not locked', () => {
    render(<StickerItem sticker={makeSticker()} onSelect={onSelect} isLocked={false} />);
    expect(screen.getByTitle('Happy Cat')).toBeInTheDocument();
  });

  it('applies locked styling classes', () => {
    render(<StickerItem sticker={makeSticker()} onSelect={onSelect} isLocked={true} />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('cursor-not-allowed');
    expect(button.className).toContain('opacity-50');
  });

  it('renders rarity indicator for non-common stickers', () => {
    render(<StickerItem sticker={makeSticker({ rarity: 'rare' })} onSelect={onSelect} isLocked={false} />);
    expect(screen.getByText('💎')).toBeInTheDocument();
  });

  it('does not render rarity indicator for common stickers', () => {
    render(<StickerItem sticker={makeSticker({ rarity: 'common' })} onSelect={onSelect} isLocked={false} />);
    expect(screen.queryByText('💎')).not.toBeInTheDocument();
    expect(screen.queryByText('🌟')).not.toBeInTheDocument();
  });
});
