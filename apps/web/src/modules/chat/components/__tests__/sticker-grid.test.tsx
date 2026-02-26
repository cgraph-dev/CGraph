/** @module StickerGrid tests */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/lib/animation-presets', () => ({
  tweens: { standard: {} },
  springs: { snappy: {}, bouncy: {} },
  loop: () => ({}),
  staggerConfigs: { fast: {} },
}));

vi.mock('@heroicons/react/24/outline', () => ({
  SparklesIcon: ({ className }: { className?: string }) => (
    <span data-testid="sparkles-icon" className={className} />
  ),
  LockClosedIcon: ({ className }: { className?: string }) => (
    <span data-testid="lock-icon" className={className} />
  ),
}));

vi.mock('@/data/stickers', () => ({
  getStickerPackById: (id: string) => ({ id, name: 'Test Pack', coinPrice: 100 }),
  STICKER_RARITY_COLORS: {
    common: { bg: 'bg-gray-500/20', border: '', text: '' },
    rare: { bg: 'bg-blue-500/20', border: '', text: '' },
  },
}));

vi.mock('@/lib/utils', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

vi.mock('../sticker-picker/constants', () => ({
  ANIMATION_CONFIGS: {},
  RARITY_ICONS: {},
}));

import { StickerGrid } from '../sticker-picker/sticker-grid';
import type { Sticker } from '@/data/stickers';

function makeSticker(id: string, name: string, packId = 'pack-1'): Sticker {
  return {
    id,
    name,
    emoji: '😀',
    category: 'emotions',
    rarity: 'common',
    animation: 'none',
    animationDuration: 1000,
    colors: ['#fff'],
    description: `desc-${id}`,
    packId,
  };
}

describe('StickerGrid', () => {
  let onSelect: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onSelect = vi.fn();
  });

  it('renders a grid of stickers', () => {
    const stickers = [makeSticker('s1', 'Cat'), makeSticker('s2', 'Dog')];
    render(
      <StickerGrid
        stickers={stickers}
        ownedPackIds={new Set(['pack-1'])}
        searchQuery=""
        onSelect={onSelect}
      />
    );
    const emojiElements = screen.getAllByText('😀');
    expect(emojiElements).toHaveLength(2);
  });

  it('renders empty state when no stickers and no search query', () => {
    render(
      <StickerGrid stickers={[]} ownedPackIds={new Set()} searchQuery="" onSelect={onSelect} />
    );
    expect(screen.getByText('No stickers in this pack')).toBeInTheDocument();
  });

  it('renders search-specific empty state when no results match query', () => {
    render(
      <StickerGrid
        stickers={[]}
        ownedPackIds={new Set()}
        searchQuery="unicorn"
        onSelect={onSelect}
      />
    );
    expect(screen.getByText('No stickers found for "unicorn"')).toBeInTheDocument();
  });

  it('renders the sparkles icon in empty state', () => {
    render(
      <StickerGrid stickers={[]} ownedPackIds={new Set()} searchQuery="" onSelect={onSelect} />
    );
    expect(screen.getByTestId('sparkles-icon')).toBeInTheDocument();
  });

  it('marks stickers from unowned packs as locked', () => {
    const stickers = [makeSticker('s1', 'Cat', 'pack-unowned')];
    render(
      <StickerGrid
        stickers={stickers}
        ownedPackIds={new Set(['pack-1'])}
        searchQuery=""
        onSelect={onSelect}
      />
    );
    expect(screen.getByTestId('lock-icon')).toBeInTheDocument();
  });

  it('marks stickers from owned packs as unlocked', () => {
    const stickers = [makeSticker('s1', 'Cat', 'pack-1')];
    render(
      <StickerGrid
        stickers={stickers}
        ownedPackIds={new Set(['pack-1'])}
        searchQuery=""
        onSelect={onSelect}
      />
    );
    expect(screen.queryByTestId('lock-icon')).not.toBeInTheDocument();
  });

  it('renders the correct number of sticker items', () => {
    const stickers = [makeSticker('s1', 'A'), makeSticker('s2', 'B'), makeSticker('s3', 'C')];
    render(
      <StickerGrid
        stickers={stickers}
        ownedPackIds={new Set(['pack-1'])}
        searchQuery=""
        onSelect={onSelect}
      />
    );
    const emojiElements = screen.getAllByText('😀');
    expect(emojiElements).toHaveLength(3);
  });
});
