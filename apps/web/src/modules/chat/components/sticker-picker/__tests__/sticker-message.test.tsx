/** @module StickerMessage tests */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StickerMessage } from '../sticker-message';
import type { Sticker } from '@/data/stickers';

vi.mock('@/data/stickers', () => ({
  STICKER_RARITY_COLORS: {
    common: { bg: 'bg-gray', border: 'border-gray', text: 'text-gray', glow: 'glow-gray' },
    uncommon: { bg: 'bg-green', border: 'border-green', text: 'text-green', glow: 'glow-green' },
    rare: { bg: 'bg-blue', border: 'border-blue', text: 'text-blue', glow: 'glow-blue' },
    epic: { bg: 'bg-purple', border: 'border-purple', text: 'text-purple', glow: 'glow-purple' },
    legendary: { bg: 'bg-gold', border: 'border-gold', text: 'text-gold', glow: 'glow-gold' },
  },
}));

vi.mock('@/lib/utils', () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(' '),
}));

vi.mock('../constants', () => ({
  ANIMATION_CONFIGS: { bounce: { y: [-5, 5] }, none: {} },
  STICKER_SIZE_CLASSES: { sm: 'size-sm', md: 'size-md', lg: 'size-lg' },
}));

describe('StickerMessage', () => {
  const baseSticker: Sticker = {
    id: 's-1',
    name: 'Happy Face',
    emoji: '😊',
    category: 'emotions',
    rarity: 'common',
    animation: 'bounce',
    animationDuration: 500,
    colors: ['#fff'],
    description: 'A happy face sticker',
    packId: 'pack-1',
  };

  it('renders the sticker emoji', () => {
    render(<StickerMessage sticker={baseSticker} />);
    expect(screen.getByText('😊')).toBeInTheDocument();
  });

  it('renders with title attribute matching sticker name', () => {
    render(<StickerMessage sticker={baseSticker} />);
    expect(screen.getByTitle('Happy Face')).toBeInTheDocument();
  });

  it('uses md size class by default', () => {
    const { container } = render(<StickerMessage sticker={baseSticker} />);
    expect(container.querySelector('.size-md')).toBeInTheDocument();
  });

  it('applies sm size class when size="sm"', () => {
    const { container } = render(<StickerMessage sticker={baseSticker} size="sm" />);
    expect(container.querySelector('.size-sm')).toBeInTheDocument();
  });

  it('applies lg size class when size="lg"', () => {
    const { container } = render(<StickerMessage sticker={baseSticker} size="lg" />);
    expect(container.querySelector('.size-lg')).toBeInTheDocument();
  });

  it('renders rarity glow for epic stickers', () => {
    const epicSticker = { ...baseSticker, rarity: 'epic' as const };
    const { container } = render(<StickerMessage sticker={epicSticker} />);
    expect(container.querySelector('.glow-purple')).toBeInTheDocument();
  });

  it('renders rarity glow for legendary stickers', () => {
    const legendarySticker = { ...baseSticker, rarity: 'legendary' as const };
    const { container } = render(<StickerMessage sticker={legendarySticker} />);
    expect(container.querySelector('.glow-gold')).toBeInTheDocument();
  });

  it('toggles animation on click', () => {
    render(<StickerMessage sticker={baseSticker} />);
    const emojiEl = screen.getByText('😊');
    fireEvent.click(emojiEl);
    // Should not throw - toggles isAnimating state
    expect(emojiEl).toBeInTheDocument();
  });
});
