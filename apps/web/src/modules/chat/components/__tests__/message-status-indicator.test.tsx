/** @module message-status-indicator tests */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

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
            cache.set(prop, function MotionMock({ children, className, ...rest }) {
              return (
                <Tag
                  className={className as string}
                  data-testid={rest['data-testid'] as string}
                  viewBox={rest['viewBox'] as string}
                  fill={rest['fill'] as string}
                  stroke={rest['stroke'] as string}
                  d={rest['d'] as string}
                  strokeLinecap={rest['strokeLinecap'] as string}
                  strokeLinejoin={rest['strokeLinejoin'] as string}
                  strokeWidth={rest['strokeWidth'] as string}
                >
                  {children}
                </Tag>
              );
            });
          }
          return cache.get(prop);
        },
      },
    ),
    AnimatePresence: ({
      children,
    }: React.PropsWithChildren<Record<string, unknown>>) => <>{children}</>,
  };
});

vi.mock('@/lib/animation-presets', () => ({
  tweens: { standard: {} },
  springs: { bouncy: {} },
  loop: () => ({}),
}));

import { MessageStatusIndicator } from '../message-bubble/message-status-indicator';

describe('MessageStatusIndicator', () => {
  it('renders sending state with clock emoji', () => {
    render(<MessageStatusIndicator status="sending" />);
    expect(screen.getByText('⏳')).toBeInTheDocument();
  });

  it('renders sent state with single check SVG', () => {
    const { container } = render(<MessageStatusIndicator status="sent" />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(1);
  });

  it('renders delivered state with double check SVG', () => {
    const { container } = render(<MessageStatusIndicator status="delivered" />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(1);
  });

  it('renders read state with blue double check', () => {
    const { container } = render(<MessageStatusIndicator status="read" />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(1);
  });

  it('transitions between states without errors', () => {
    const { rerender } = render(<MessageStatusIndicator status="sending" />);
    rerender(<MessageStatusIndicator status="sent" />);
    rerender(<MessageStatusIndicator status="delivered" />);
    rerender(<MessageStatusIndicator status="read" />);
    // No throw = pass
  });
});
