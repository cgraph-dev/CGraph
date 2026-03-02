/** @module PackInfoBanner tests */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PackInfoBanner } from '../pack-info-banner';
import type { StickerPack } from '@/data/stickers';

vi.mock('@/lib/utils', () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(' '),
}));

describe('PackInfoBanner', () => {
  const basePack: StickerPack = {
    id: 'pack-1',
    name: 'Cool Pack',
    description: 'A really cool sticker pack',
    coverEmoji: '🎉',
    category: 'reactions',
    rarity: 'rare',
    coinPrice: 200,
    isFree: false,
    isLimited: false,
    stickerCount: 10,
    previewColors: [],
  };

  const defaultProps = {
    pack: basePack,
    userCoins: 500,
    isPurchasing: false,
    onPurchase: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders pack name and description', () => {
    render(<PackInfoBanner {...defaultProps} />);
    expect(screen.getByText('Cool Pack')).toBeInTheDocument();
    expect(screen.getByText('A really cool sticker pack')).toBeInTheDocument();
  });

  it('renders cover emoji', () => {
    render(<PackInfoBanner {...defaultProps} />);
    expect(screen.getByText('🎉')).toBeInTheDocument();
  });

  it('shows "Limited" badge when pack.isLimited is true', () => {
    render(<PackInfoBanner {...defaultProps} pack={{ ...basePack, isLimited: true }} />);
    expect(screen.getByText('Limited')).toBeInTheDocument();
  });

  it('does not show "Limited" badge when pack.isLimited is false', () => {
    render(<PackInfoBanner {...defaultProps} />);
    expect(screen.queryByText('Limited')).not.toBeInTheDocument();
  });

  it('renders the coin price on the purchase button', () => {
    render(<PackInfoBanner {...defaultProps} />);
    expect(screen.getByText('200')).toBeInTheDocument();
  });

  it('disables button when user cannot afford the pack', () => {
    render(<PackInfoBanner {...defaultProps} userCoins={50} />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('calls onPurchase when button is clicked', () => {
    render(<PackInfoBanner {...defaultProps} />);
    fireEvent.click(screen.getByRole('button'));
    expect(defaultProps.onPurchase).toHaveBeenCalledWith(basePack);
  });

  it('disables button while purchasing', () => {
    render(<PackInfoBanner {...defaultProps} isPurchasing={true} />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });
});
