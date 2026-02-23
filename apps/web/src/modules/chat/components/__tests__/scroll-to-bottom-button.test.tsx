/** @module scroll-to-bottom-button tests */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScrollToBottomButton } from '../scroll-to-bottom-button';

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
            const Tag = (
              typeof prop === 'string' ? prop : 'div'
            ) as keyof React.JSX.IntrinsicElements;
            cache.set(prop, function MotionMock({ children, className, onClick, ..._rest }) {
              return (
                <Tag
                  className={className as string}
                  onClick={onClick as React.MouseEventHandler}
                  aria-label={(_rest as Record<string, unknown>)['aria-label'] as string}
                >
                  {children}
                </Tag>
              );
            });
          }
          return cache.get(prop);
        },
      }
    ),
    AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  };
});

vi.mock('@/lib/animation-presets/presets', () => ({
  springs: { snappy: {}, bouncy: {} },
}));

vi.mock('@heroicons/react/24/solid', () => ({
  ChevronDownIcon: () => <span data-testid="chevron-icon" />,
}));

describe('ScrollToBottomButton', () => {
  it('renders nothing when not visible', () => {
    const { container } = render(<ScrollToBottomButton visible={false} onClick={vi.fn()} />);
    expect(container.querySelector('button')).toBeNull();
  });

  it('renders button when visible', () => {
    render(<ScrollToBottomButton visible={true} onClick={vi.fn()} />);
    expect(screen.getByLabelText('Scroll to latest messages')).toBeTruthy();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<ScrollToBottomButton visible={true} onClick={onClick} />);
    fireEvent.click(screen.getByLabelText('Scroll to latest messages'));
    expect(onClick).toHaveBeenCalled();
  });

  it('shows unread count badge', () => {
    render(<ScrollToBottomButton visible={true} onClick={vi.fn()} newCount={5} />);
    expect(screen.getByText('5')).toBeTruthy();
  });

  it('caps count at 99+', () => {
    render(<ScrollToBottomButton visible={true} onClick={vi.fn()} newCount={150} />);
    expect(screen.getByText('99+')).toBeTruthy();
  });

  it('hides badge when newCount is 0', () => {
    render(<ScrollToBottomButton visible={true} onClick={vi.fn()} newCount={0} />);
    expect(screen.queryByText('0')).toBeNull();
  });

  it('renders chevron icon', () => {
    render(<ScrollToBottomButton visible={true} onClick={vi.fn()} />);
    expect(screen.getByTestId('chevron-icon')).toBeTruthy();
  });
});
