import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import ThreadRating from '../thread-rating';

// ── Mocks ──────────────────────────────────────────────────────────────

const mockRateThread = vi.fn();

vi.mock('@/modules/forums/store', () => ({
  useForumStore: vi.fn(() => ({ rateThread: mockRateThread })),
}));

vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, ...props }: any) => {
      const clean: Record<string, any> = {};
      for (const [k, v] of Object.entries(props)) {
        if (
          !k.startsWith('while') &&
          !k.startsWith('initial') &&
          !k.startsWith('animate') &&
          !k.startsWith('exit')
        ) {
          clean[k] = v;
        }
      }
      return <button {...clean}>{children}</button>;
    },
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
}));

vi.mock('@heroicons/react/24/solid', () => ({
  StarIcon: (props: any) => <svg data-testid="star-filled" {...props} />,
}));

vi.mock('@heroicons/react/24/outline', () => ({
  StarIcon: (props: any) => <svg data-testid="star-outline" {...props} />,
}));

vi.mock('@/lib/animations/AnimationEngine', () => ({
  HapticFeedback: { light: vi.fn(), success: vi.fn(), error: vi.fn() },
}));

// ── Tests ──────────────────────────────────────────────────────────────

describe('ThreadRating', () => {
  const baseProps = {
    threadId: 'thread-1',
    rating: 3.5,
    ratingCount: 42,
    myRating: null as number | null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRateThread.mockResolvedValue(undefined);
  });

  // ── Rendering ──────────────────────────────────────────────────────

  it('renders 5 star buttons', () => {
    render(<ThreadRating {...baseProps} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(5);
  });

  it('displays the average rating text', () => {
    render(<ThreadRating {...baseProps} />);
    expect(screen.getByText('3.5')).toBeInTheDocument();
  });

  it('displays rating count', () => {
    render(<ThreadRating {...baseProps} />);
    expect(screen.getByText('(42 ratings)')).toBeInTheDocument();
  });

  it('uses singular "rating" when count is 1', () => {
    render(<ThreadRating {...baseProps} ratingCount={1} />);
    expect(screen.getByText('(1 rating)')).toBeInTheDocument();
  });

  it('hides count when showCount is false', () => {
    render(<ThreadRating {...baseProps} showCount={false} />);
    expect(screen.queryByText('(42 ratings)')).not.toBeInTheDocument();
  });

  it('hides count section when ratingCount is 0', () => {
    render(<ThreadRating {...baseProps} ratingCount={0} />);
    expect(screen.queryByText('(0 ratings)')).not.toBeInTheDocument();
  });

  it('renders filled stars up to the rating value', () => {
    render(<ThreadRating {...baseProps} rating={3} />);
    const filled = screen.getAllByTestId('star-filled');
    expect(filled).toHaveLength(3);
    const outline = screen.getAllByTestId('star-outline');
    expect(outline).toHaveLength(2);
  });

  it('renders all outline stars when rating is 0', () => {
    render(<ThreadRating {...baseProps} rating={0} myRating={null} />);
    const outline = screen.getAllByTestId('star-outline');
    expect(outline).toHaveLength(5);
  });

  it('applies correct aria-labels', () => {
    render(<ThreadRating {...baseProps} />);
    expect(screen.getByLabelText('Rate 1 star')).toBeInTheDocument();
    expect(screen.getByLabelText('Rate 2 stars')).toBeInTheDocument();
    expect(screen.getByLabelText('Rate 5 stars')).toBeInTheDocument();
  });

  // ── Size variants ──────────────────────────────────────────────────

  it('applies "sm" size classes', () => {
    render(<ThreadRating {...baseProps} size="sm" />);
    const star = screen.getAllByTestId('star-filled')[0]!;
    expect(star.getAttribute('class')).toContain('h-4 w-4');
  });

  it('applies "lg" size classes', () => {
    render(<ThreadRating {...baseProps} size="lg" />);
    const star = screen.getAllByTestId('star-filled')[0]!;
    expect(star.getAttribute('class')).toContain('h-6 w-6');
  });

  // ── My Rating ──────────────────────────────────────────────────────

  it('shows "Your rating" indicator when myRating is set', () => {
    render(<ThreadRating {...baseProps} myRating={4} />);
    expect(screen.getByText('Your rating: 4★')).toBeInTheDocument();
  });

  it('does not show "Your rating" when myRating is null', () => {
    render(<ThreadRating {...baseProps} myRating={null} />);
    expect(screen.queryByText(/Your rating/)).not.toBeInTheDocument();
  });

  it('fills stars based on myRating when provided', () => {
    render(<ThreadRating {...baseProps} myRating={2} rating={0} />);
    const filled = screen.getAllByTestId('star-filled');
    expect(filled).toHaveLength(2);
  });

  // ── Interaction ────────────────────────────────────────────────────

  it('calls rateThread when a star is clicked', async () => {
    render(<ThreadRating {...baseProps} />);
    fireEvent.click(screen.getByLabelText('Rate 4 stars'));
    await waitFor(() => {
      expect(mockRateThread).toHaveBeenCalledWith('thread-1', 4);
    });
  });

  it('disables buttons when interactive is false', () => {
    render(<ThreadRating {...baseProps} interactive={false} />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => expect(btn).toBeDisabled());
  });

  it('does not call rateThread when interactive is false', () => {
    render(<ThreadRating {...baseProps} interactive={false} />);
    fireEvent.click(screen.getByLabelText('Rate 3 stars'));
    expect(mockRateThread).not.toHaveBeenCalled();
  });

  it('handles rateThread failure gracefully', async () => {
    mockRateThread.mockRejectedValueOnce(new Error('fail'));
    render(<ThreadRating {...baseProps} />);
    fireEvent.click(screen.getByLabelText('Rate 5 stars'));
    // Should not throw; error is caught internally
    await waitFor(() => {
      expect(mockRateThread).toHaveBeenCalledWith('thread-1', 5);
    });
  });

  it('shows submitting state (opacity) while rating', async () => {
    mockRateThread.mockReturnValue(new Promise(() => {})); // never resolves
    render(<ThreadRating {...baseProps} />);
    fireEvent.click(screen.getByLabelText('Rate 3 stars'));
    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      const hasOpacity = buttons.some((b) => b.className.includes('opacity-50'));
      expect(hasOpacity).toBe(true);
    });
  });

  // ── className passthrough ──────────────────────────────────────────

  it('applies custom className', () => {
    const { container } = render(<ThreadRating {...baseProps} className="my-custom" />);
    expect(container.firstChild).toHaveClass('my-custom');
  });

  // ── Hover ──────────────────────────────────────────────────────────

  it('updates display on mouse enter / leave', () => {
    render(<ThreadRating {...baseProps} rating={1} myRating={null} />);
    const star4 = screen.getByLabelText('Rate 4 stars');
    fireEvent.mouseEnter(star4);
    // After hovering star 4, stars 1–4 should be filled
    const filled = screen.getAllByTestId('star-filled');
    expect(filled).toHaveLength(4);

    // Mouse leave resets
    const container = star4.closest('[class*="flex items-center gap-0.5"]')!;
    fireEvent.mouseLeave(container);
    const filledAfter = screen.getAllByTestId('star-filled');
    expect(filledAfter).toHaveLength(1);
  });

  it('does not react to hover when interactive is false', () => {
    render(<ThreadRating {...baseProps} rating={1} interactive={false} />);
    fireEvent.mouseEnter(screen.getByLabelText('Rate 4 stars'));
    const filled = screen.getAllByTestId('star-filled');
    expect(filled).toHaveLength(1);
  });
});
