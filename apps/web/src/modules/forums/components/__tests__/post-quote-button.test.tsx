/** @module post-quote-button tests */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('framer-motion', () => ({
  motion: {
    button: ({
      children,
      onClick,
      className,
      title,
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <button
        onClick={onClick as React.MouseEventHandler}
        className={className as string}
        title={title as string}
      >
        {children}
      </button>
    ),
  },
}));

vi.mock('@heroicons/react/24/outline', () => ({
  ChatBubbleLeftIcon: (props: Record<string, unknown>) => (
    <svg data-testid="chat-outline" {...props} />
  ),
}));

vi.mock('@heroicons/react/24/solid', () => ({
  ChatBubbleLeftIcon: (props: Record<string, unknown>) => (
    <svg data-testid="chat-solid" {...props} />
  ),
}));

const mockAddToMultiQuote = vi.fn();
const mockRemoveFromMultiQuote = vi.fn();

vi.mock('@/modules/forums/store', () => ({
  useForumStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) => {
    const state = {
      multiQuoteBuffer: [] as string[],
      addToMultiQuote: mockAddToMultiQuote,
      removeFromMultiQuote: mockRemoveFromMultiQuote,
    };
    return selector(state);
  }),
}));

import { PostQuoteButton } from '../post-quote-button';
import { useForumStore } from '@/modules/forums/store';

describe('PostQuoteButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useForumStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (s: Record<string, unknown>) => unknown) => {
        const state = {
          multiQuoteBuffer: [] as string[],
          addToMultiQuote: mockAddToMultiQuote,
          removeFromMultiQuote: mockRemoveFromMultiQuote,
        };
        return selector(state);
      }
    );
  });

  it('renders with outline icon when not selected', () => {
    render(<PostQuoteButton postId="post-1" />);
    expect(screen.getByTestId('chat-outline')).toBeInTheDocument();
  });

  it('shows "Add to multi-quote" title when not selected', () => {
    render(<PostQuoteButton postId="post-1" />);
    expect(screen.getByTitle('Add to multi-quote')).toBeInTheDocument();
  });

  it('renders solid icon when post is in buffer', () => {
    (useForumStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (s: Record<string, unknown>) => unknown) => {
        const state = {
          multiQuoteBuffer: ['post-1'],
          addToMultiQuote: mockAddToMultiQuote,
          removeFromMultiQuote: mockRemoveFromMultiQuote,
        };
        return selector(state);
      }
    );
    render(<PostQuoteButton postId="post-1" />);
    expect(screen.getByTestId('chat-solid')).toBeInTheDocument();
  });

  it('shows "Remove from multi-quote" title when selected', () => {
    (useForumStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (s: Record<string, unknown>) => unknown) => {
        const state = {
          multiQuoteBuffer: ['post-1'],
          addToMultiQuote: mockAddToMultiQuote,
          removeFromMultiQuote: mockRemoveFromMultiQuote,
        };
        return selector(state);
      }
    );
    render(<PostQuoteButton postId="post-1" />);
    expect(screen.getByTitle('Remove from multi-quote')).toBeInTheDocument();
  });

  it('calls addToMultiQuote when unselected post clicked', () => {
    render(<PostQuoteButton postId="post-1" />);
    fireEvent.click(screen.getByTitle('Add to multi-quote'));
    expect(mockAddToMultiQuote).toHaveBeenCalledWith('post-1');
  });

  it('calls removeFromMultiQuote when selected post clicked', () => {
    (useForumStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (s: Record<string, unknown>) => unknown) => {
        const state = {
          multiQuoteBuffer: ['post-1'],
          addToMultiQuote: mockAddToMultiQuote,
          removeFromMultiQuote: mockRemoveFromMultiQuote,
        };
        return selector(state);
      }
    );
    render(<PostQuoteButton postId="post-1" />);
    fireEvent.click(screen.getByTitle('Remove from multi-quote'));
    expect(mockRemoveFromMultiQuote).toHaveBeenCalledWith('post-1');
  });

  it('shows checkmark when selected', () => {
    (useForumStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (s: Record<string, unknown>) => unknown) => {
        const state = {
          multiQuoteBuffer: ['post-1'],
          addToMultiQuote: mockAddToMultiQuote,
          removeFromMultiQuote: mockRemoveFromMultiQuote,
        };
        return selector(state);
      }
    );
    render(<PostQuoteButton postId="post-1" />);
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('shows label when showLabel is true and selected', () => {
    (useForumStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (s: Record<string, unknown>) => unknown) => {
        const state = {
          multiQuoteBuffer: ['post-1'],
          addToMultiQuote: mockAddToMultiQuote,
          removeFromMultiQuote: mockRemoveFromMultiQuote,
        };
        return selector(state);
      }
    );
    render(<PostQuoteButton postId="post-1" showLabel />);
    expect(screen.getByText('Quoted')).toBeInTheDocument();
  });

  it('shows "Quote" label when showLabel is true and not selected', () => {
    render(<PostQuoteButton postId="post-1" showLabel />);
    expect(screen.getByText('Quote')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<PostQuoteButton postId="post-1" className="custom-cls" />);
    const btn = screen.getByTitle('Add to multi-quote');
    expect(btn.className).toContain('custom-cls');
  });
});
