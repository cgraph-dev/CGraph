/** @module StickerPicker tests */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StickerPicker } from '../sticker-picker';

const mockSelectPack = vi.fn();
const mockTogglePackStore = vi.fn();

vi.mock('../useStickerPicker', () => ({
  useStickerPicker: () => ({
    pickerRef: { current: null },
    searchQuery: '',
    setSearchQuery: vi.fn(),
    showPackStore: false,
    togglePackStore: mockTogglePackStore,
    isPurchasing: false,
    userCoins: 500,
    ownedPackIds: new Set(['free-pack']),
    sortedPacks: [
      { id: 'free-pack', name: 'Free Pack', coverEmoji: '😀', coinPrice: 0, isFree: true, isLimited: false, stickerCount: 5 },
      { id: 'premium-pack', name: 'Premium', coverEmoji: '✨', coinPrice: 100, isFree: false, isLimited: false, stickerCount: 10 },
    ],
    activePack: { id: 'free-pack', name: 'Free Pack', coverEmoji: '😀', coinPrice: 0, isFree: true },
    displayStickers: [],
    handlePurchasePack: vi.fn(),
    handleStickerSelect: vi.fn(),
    selectPack: mockSelectPack,
  }),
}));

vi.mock('../pack-tab', () => ({
  PackTab: ({ pack, onClick }: { pack: { name: string }; onClick: () => void }) => (
    <button data-testid={`pack-tab-${pack.name}`} onClick={onClick}>{pack.name}</button>
  ),
}));

vi.mock('../sticker-search-bar', () => ({
  StickerSearchBar: () => <div data-testid="sticker-search-bar" />,
}));

vi.mock('../sticker-grid', () => ({
  StickerGrid: () => <div data-testid="sticker-grid" />,
}));

vi.mock('../pack-info-banner', () => ({
  PackInfoBanner: () => <div data-testid="pack-info-banner" />,
}));

vi.mock('@/lib/utils', () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(' '),
}));

vi.mock('@/data/stickers', () => ({
  STICKER_RARITY_COLORS: {},
}));

describe('StickerPicker', () => {
  const defaultProps = {
    onSelect: vi.fn(),
    onClose: vi.fn(),
    isOpen: true,
    ownedPacks: ['free-pack'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<StickerPicker {...defaultProps} isOpen={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders the picker when isOpen is true', () => {
    render(<StickerPicker {...defaultProps} />);
    expect(screen.getByText('Stickers')).toBeInTheDocument();
  });

  it('displays user coin count', () => {
    render(<StickerPicker {...defaultProps} />);
    expect(screen.getByText('500')).toBeInTheDocument();
  });

  it('renders the search bar', () => {
    render(<StickerPicker {...defaultProps} />);
    expect(screen.getByTestId('sticker-search-bar')).toBeInTheDocument();
  });

  it('renders pack tabs', () => {
    render(<StickerPicker {...defaultProps} />);
    expect(screen.getByTestId('pack-tab-Free Pack')).toBeInTheDocument();
    expect(screen.getByTestId('pack-tab-Premium')).toBeInTheDocument();
  });

  it('calls togglePackStore when "Get More" is clicked', () => {
    render(<StickerPicker {...defaultProps} />);
    fireEvent.click(screen.getByText('Get More'));
    expect(mockTogglePackStore).toHaveBeenCalledOnce();
  });

  it('calls onClose when close button is clicked', () => {
    render(<StickerPicker {...defaultProps} />);
    const closeBtn = screen.getByTestId('x-icon').closest('button');
    expect(closeBtn).toBeInTheDocument();
    fireEvent.click(closeBtn!);
    expect(defaultProps.onClose).toHaveBeenCalledOnce();
  });

  it('applies custom className', () => {
    const { container } = render(<StickerPicker {...defaultProps} className="custom-class" />);
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });
});
