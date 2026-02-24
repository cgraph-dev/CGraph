/**
 * @file multi-quote-indicator.test.tsx
 * @description Tests for MultiQuoteIndicator component — floating indicator
 *   showing selected posts for multi-quote reply.
 * @module forums/components/__tests__/MultiQuoteIndicator
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// ── framer-motion mock ───────────────────────────────────────────────

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <div data-testid="glass-card" className={className}>{children}</div>
  ),
}));

const mockRemoveFromMultiQuote = vi.fn();
const mockClearMultiQuote = vi.fn();

vi.mock('@/modules/forums/store', () => ({
  useForumStore: () => ({
    multiQuoteBuffer: ['post-abc12345', 'post-def67890'],
    removeFromMultiQuote: mockRemoveFromMultiQuote,
    clearMultiQuote: mockClearMultiQuote,
  }),
}));

import MultiQuoteIndicator from '../multi-quote-indicator';

// ── Tests ──────────────────────────────────────────────────────────────
describe('MultiQuoteIndicator', () => {
  const onQuoteClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when multiQuoteBuffer has items', () => {
    render(<MultiQuoteIndicator onQuoteClick={onQuoteClick} />);
    expect(screen.getByText(/2 posts selected/)).toBeInTheDocument();
  });

  it('returns null when multiQuoteBuffer is empty', async () => {
    const { useForumStore } = await import('@/modules/forums/store');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useForumStore as any).mockReturnValueOnce({
      multiQuoteBuffer: [],
      removeFromMultiQuote: vi.fn(),
      clearMultiQuote: vi.fn(),
    });
    const { container } = render(<MultiQuoteIndicator onQuoteClick={onQuoteClick} />);
    expect(container.innerHTML).toBe('');
  });

  it('shows singular "post" for single item', async () => {
    const { useForumStore } = await import('@/modules/forums/store');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useForumStore as any).mockReturnValueOnce({
      multiQuoteBuffer: ['post-abc12345'],
      removeFromMultiQuote: vi.fn(),
      clearMultiQuote: vi.fn(),
    });
    render(<MultiQuoteIndicator onQuoteClick={onQuoteClick} />);
    expect(screen.getByText(/1 post selected/)).toBeInTheDocument();
  });

  it('renders count badge', () => {
    render(<MultiQuoteIndicator onQuoteClick={onQuoteClick} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders "Quote & Reply" button', () => {
    render(<MultiQuoteIndicator onQuoteClick={onQuoteClick} />);
    expect(screen.getByText('Quote & Reply')).toBeInTheDocument();
  });

  it('calls onQuoteClick when Quote & Reply is pressed', () => {
    render(<MultiQuoteIndicator onQuoteClick={onQuoteClick} />);
    fireEvent.click(screen.getByText('Quote & Reply'));
    expect(onQuoteClick).toHaveBeenCalledOnce();
  });

  it('calls clearMultiQuote when clear button is pressed', () => {
    render(<MultiQuoteIndicator onQuoteClick={onQuoteClick} />);
    const clearBtn = screen.getByTitle('Clear selection');
    fireEvent.click(clearBtn);
    expect(mockClearMultiQuote).toHaveBeenCalledOnce();
  });

  it('renders post ID previews', () => {
    render(<MultiQuoteIndicator onQuoteClick={onQuoteClick} />);
    expect(screen.getByText(/post-abc/)).toBeInTheDocument();
    expect(screen.getByText(/post-def6/)).toBeInTheDocument();
  });

  it('shows click-to-reply guidance text', () => {
    render(<MultiQuoteIndicator onQuoteClick={onQuoteClick} />);
    expect(screen.getByText('Click to reply with quotes')).toBeInTheDocument();
  });
});
