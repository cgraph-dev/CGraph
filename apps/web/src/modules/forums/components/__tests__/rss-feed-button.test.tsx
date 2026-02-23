/** @module rss-feed-button tests */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('framer-motion', () => ({
  motion: {
    button: ({
      children,
      onClick,
      className,
      title,
      ...rest
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
  RssIcon: (props: Record<string, unknown>) => <svg data-testid="icon-RssIcon" {...props} />,
}));

// Mock forums store to prevent barrel hang
vi.mock('@/modules/forums/store', () => ({}));

// Mock DOMPurify (loaded transitively by feed-subscribe-modal)
vi.mock('dompurify', () => ({ default: { sanitize: (s: string) => s } }));

vi.mock('../rss-feed/feed-subscribe-modal', () => ({
  FeedSubscribeModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="feed-modal">Modal Open</div> : null,
}));

import { RSSFeedButton } from '../rss-feed/rss-feed-button';

describe('RSSFeedButton', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders RSS icon', () => {
    render(<RSSFeedButton feedType="forum" />);
    expect(screen.getByTestId('icon-RssIcon')).toBeInTheDocument();
  });

  it('renders RSS label in default variant', () => {
    render(<RSSFeedButton feedType="forum" />);
    expect(screen.getByText('RSS')).toBeInTheDocument();
  });

  it('hides RSS label in minimal variant', () => {
    render(<RSSFeedButton feedType="forum" variant="minimal" />);
    expect(screen.queryByText('RSS')).not.toBeInTheDocument();
  });

  it('hides RSS label when showLabel is false', () => {
    render(<RSSFeedButton feedType="forum" showLabel={false} />);
    expect(screen.queryByText('RSS')).not.toBeInTheDocument();
  });

  it('renders RSS label in compact variant', () => {
    render(<RSSFeedButton feedType="forum" variant="compact" />);
    expect(screen.getByText('RSS')).toBeInTheDocument();
  });

  it('has "Subscribe via RSS" title', () => {
    render(<RSSFeedButton feedType="forum" />);
    expect(screen.getByTitle('Subscribe via RSS')).toBeInTheDocument();
  });

  it('opens modal on click', () => {
    render(<RSSFeedButton feedType="forum" />);
    expect(screen.queryByTestId('feed-modal')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Subscribe via RSS'));
    expect(screen.getByTestId('feed-modal')).toBeInTheDocument();
  });

  it('applies default variant styles', () => {
    render(<RSSFeedButton feedType="forum" />);
    const btn = screen.getByTitle('Subscribe via RSS');
    expect(btn.className).toContain('orange');
  });

  it('applies compact variant styles', () => {
    render(<RSSFeedButton feedType="forum" variant="compact" />);
    const btn = screen.getByTitle('Subscribe via RSS');
    expect(btn.className).toContain('text-xs');
  });
});
