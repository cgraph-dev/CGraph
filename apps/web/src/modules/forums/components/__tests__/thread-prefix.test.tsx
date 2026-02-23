/** @module thread-prefix tests */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ThreadPrefix from '../thread-prefix';

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
            cache.set(prop, function MotionMock({ children, className, style, ..._rest }) {
              return (
                <Tag className={className as string} style={style as React.CSSProperties}>
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

const mockPrefix = { name: 'SOLVED', color: '#22c55e' };

describe('ThreadPrefix', () => {
  it('returns null for null prefix', () => {
    const { container } = render(<ThreadPrefix prefix={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null for undefined prefix', () => {
    const { container } = render(<ThreadPrefix prefix={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the prefix name', () => {
    render(<ThreadPrefix prefix={mockPrefix} />);
    expect(screen.getByText('SOLVED')).toBeTruthy();
  });

  it('applies prefix color to styles', () => {
    render(<ThreadPrefix prefix={mockPrefix} />);
    const el = screen.getByText('SOLVED');
    // jsdom converts hex to rgb
    expect(el.style.color).toBe('rgb(34, 197, 94)');
    expect(el.style.backgroundColor).toBeTruthy();
  });

  it('uses md size classes by default', () => {
    render(<ThreadPrefix prefix={mockPrefix} />);
    const el = screen.getByText('SOLVED');
    expect(el.className).toContain('text-sm');
    expect(el.className).toContain('px-2.5');
  });

  it('applies sm size classes', () => {
    render(<ThreadPrefix prefix={mockPrefix} size="sm" />);
    const el = screen.getByText('SOLVED');
    expect(el.className).toContain('text-xs');
    expect(el.className).toContain('px-2');
  });

  it('applies lg size classes', () => {
    render(<ThreadPrefix prefix={mockPrefix} size="lg" />);
    const el = screen.getByText('SOLVED');
    expect(el.className).toContain('text-base');
    expect(el.className).toContain('px-3');
  });

  it('applies custom className', () => {
    render(<ThreadPrefix prefix={mockPrefix} className="extra" />);
    expect(screen.getByText('SOLVED').className).toContain('extra');
  });
});
