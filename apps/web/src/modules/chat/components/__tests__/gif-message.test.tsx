/** @module gif-message tests */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('framer-motion', () => {
  const cache = new Map<
    string | symbol,
    (p: React.PropsWithChildren<Record<string, unknown>>) => React.ReactElement
  >();
  return {
    motion: new Proxy(
      {} as Record<
        string,
        (p: React.PropsWithChildren<Record<string, unknown>>) => React.ReactElement
      >,
      {
        get: (_target, prop) => {
          if (!cache.has(prop)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const Tag = (typeof prop === 'string' ? prop : 'div') as any;
            cache.set(prop, function MotionMock({ children, className, onClick }) {
              return (
                <Tag className={className as string} onClick={onClick as React.MouseEventHandler}>
                  {children}
                </Tag>
              );
            });
          }
          return cache.get(prop);
        },
      },
    ),
    AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  };
});

vi.mock('@/lib/animation-presets', () => ({
  tweens: { standard: {} },
  loop: () => ({}),
}));

vi.mock('@heroicons/react/24/outline', () => ({
  XMarkIcon: () => <span data-testid="x-icon" />,
  ArrowsPointingOutIcon: () => <span data-testid="expand-icon" />,
}));

import { GifMessage } from '../gif-message';

describe('GifMessage', () => {
  const baseMessage = {
    id: 'msg-1',
    type: 'gif' as const,
    content: '',
    senderId: 'user-1',
    createdAt: '2026-02-24T12:00:00Z',
    conversationId: 'conv-1',
    metadata: {
      gifUrl: 'https://example.com/gif.gif',
      gifTitle: 'Funny GIF',
    },
  };

  it('renders GIF image when gifUrl exists', () => {
    render(<GifMessage message={baseMessage} isOwnMessage={false} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/gif.gif');
  });

  it('renders GIF badge', () => {
    render(<GifMessage message={baseMessage} isOwnMessage={false} />);
    expect(screen.getByText('GIF')).toBeInTheDocument();
  });

  it('shows error when GIF data missing', () => {
    const noGifMsg = { ...baseMessage, metadata: {} };
    render(<GifMessage message={noGifMsg} isOwnMessage={false} />);
    expect(screen.getByText(/GIF data missing/i)).toBeInTheDocument();
  });

  it('applies className prop', () => {
    const { container } = render(
      <GifMessage message={baseMessage} isOwnMessage={false} className="custom-class" />,
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
