/**
 * @file Tests for PackTab component (sticker-picker)
 * @module chat/components/sticker-picker/pack-tab
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('framer-motion', () => ({
  motion: {
    button: ({
      children,
      className,
      onClick,
    }: {
      children: React.ReactNode;
      className?: string;
      onClick?: () => void;
    }) => (
      <button className={className} onClick={onClick}>
        {children}
      </button>
    ),
  },
}));

vi.mock('@heroicons/react/24/outline', () => ({
  ClockIcon: ({ className, title }: { className?: string; title?: string }) => (
    <span data-testid="clock-icon" className={className} title={title} />
  ),
  LockClosedIcon: ({ className }: { className?: string }) => (
    <span data-testid="lock-icon" className={className} />
  ),
  GiftIcon: ({ className, title }: { className?: string; title?: string }) => (
    <span data-testid="gift-icon" className={className} title={title} />
  ),
}));

vi.mock('@/data/stickers', () => ({
  STICKER_RARITY_COLORS: {
    common: { bg: 'bg-gray-500/20', text: 'text-gray-300' },
    rare: { bg: 'bg-blue-500/20', text: 'text-blue-300' },
    epic: { bg: 'bg-purple-500/20', text: 'text-purple-300' },
    legendary: { bg: 'bg-amber-500/20', text: 'text-amber-300' },
  },
}));

vi.mock('@/lib/utils', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

import { PackTab } from '../sticker-picker/pack-tab';

function makePack(overrides: Record<string, unknown> = {}) {
  return {
    id: 'pack-1',
    name: 'Cool Stickers',
    description: 'Test description',
    coverEmoji: '😎',
    category: 'emotions' as const,
    rarity: 'rare' as const,
    coinPrice: 100,
    isLimited: false,
    isFree: false,
    stickerCount: 10,
    previewColors: ['#fff'],
    stickers: [],
    ...overrides,
  };
}

describe('PackTab', () => {
  it('renders pack name', () => {
    render(<PackTab pack={makePack()} isActive={false} isOwned={true} onClick={vi.fn()} />);
    expect(screen.getByText('Cool Stickers')).toBeInTheDocument();
  });

  it('renders cover emoji', () => {
    render(<PackTab pack={makePack()} isActive={false} isOwned={true} onClick={vi.fn()} />);
    expect(screen.getByText('😎')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<PackTab pack={makePack()} isActive={false} isOwned={true} onClick={onClick} />);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('shows lock icon for non-free, non-owned packs', () => {
    render(
      <PackTab
        pack={makePack({ isFree: false })}
        isActive={false}
        isOwned={false}
        onClick={vi.fn()}
      />
    );
    expect(screen.getByTestId('lock-icon')).toBeInTheDocument();
  });

  it('shows gift icon for free packs', () => {
    render(
      <PackTab
        pack={makePack({ isFree: true })}
        isActive={false}
        isOwned={true}
        onClick={vi.fn()}
      />
    );
    expect(screen.getByTestId('gift-icon')).toBeInTheDocument();
  });

  it('shows clock icon for limited packs', () => {
    render(
      <PackTab
        pack={makePack({ isLimited: true })}
        isActive={false}
        isOwned={true}
        onClick={vi.fn()}
      />
    );
    expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
  });

  it('does not show lock icon when pack is owned', () => {
    render(<PackTab pack={makePack()} isActive={false} isOwned={true} onClick={vi.fn()} />);
    expect(screen.queryByTestId('lock-icon')).not.toBeInTheDocument();
  });

  it('applies rarity-based styles when active', () => {
    render(<PackTab pack={makePack()} isActive={true} isOwned={true} onClick={vi.fn()} />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-blue-500/20');
  });

  it('applies inactive styles when not active', () => {
    render(<PackTab pack={makePack()} isActive={false} isOwned={true} onClick={vi.fn()} />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('text-gray-400');
  });
});
