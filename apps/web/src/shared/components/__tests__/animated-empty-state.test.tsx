/** @module animated-empty-state tests */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AnimatedEmptyState, AnimatedErrorState } from '../animated-empty-state';

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
                <Tag className={className as string} onClick={onClick as React.MouseEventHandler}>
                  {children}
                </Tag>
              );
            });
          }
          return cache.get(prop);
        },
      }
    ),
  };
});

vi.mock('@/lib/animation-presets/presets', () => ({
  springs: { default: {}, smooth: {} },
}));

describe('AnimatedEmptyState', () => {
  it('renders title', () => {
    render(<AnimatedEmptyState title="No messages" />);
    expect(screen.getByText('No messages')).toBeTruthy();
  });

  it('renders description when provided', () => {
    render(<AnimatedEmptyState title="Empty" description="Start a conversation" />);
    expect(screen.getByText('Start a conversation')).toBeTruthy();
  });

  it('renders action button and calls onClick', () => {
    const onClick = vi.fn();
    render(<AnimatedEmptyState title="Empty" action={{ label: 'Create', onClick }} />);
    fireEvent.click(screen.getByText('Create'));
    expect(onClick).toHaveBeenCalled();
  });

  it('renders custom icon', () => {
    render(<AnimatedEmptyState title="Empty" icon={<span data-testid="custom">!</span>} />);
    expect(screen.getByTestId('custom')).toBeTruthy();
  });

  it('renders default icon for search variant', () => {
    const { container } = render(<AnimatedEmptyState title="No results" variant="search" />);
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('applies className', () => {
    const { container } = render(<AnimatedEmptyState title="T" className="extra" />);
    expect((container.firstChild as HTMLElement).className).toContain('extra');
  });
});

describe('AnimatedErrorState', () => {
  it('renders default title and description', () => {
    render(<AnimatedErrorState />);
    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeTruthy();
  });

  it('renders custom title and description', () => {
    render(<AnimatedErrorState title="Oops" description="Custom error" />);
    expect(screen.getByText('Oops')).toBeTruthy();
    expect(screen.getByText('Custom error')).toBeTruthy();
  });

  it('renders retry button and calls onRetry', () => {
    const onRetry = vi.fn();
    render(<AnimatedErrorState onRetry={onRetry} />);
    fireEvent.click(screen.getByText('Try Again'));
    expect(onRetry).toHaveBeenCalled();
  });

  it('hides retry button when onRetry is not provided', () => {
    render(<AnimatedErrorState />);
    expect(screen.queryByText('Try Again')).toBeNull();
  });

  it('renders custom icon', () => {
    render(<AnimatedErrorState icon={<span data-testid="err-icon">E</span>} />);
    expect(screen.getByTestId('err-icon')).toBeTruthy();
  });
});
