/** @module save-bar tests */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SaveBar } from '../save-bar';

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
            cache.set(
              prop,
              function MotionMock({ children, className, onClick, disabled, ..._rest }) {
                return (
                  <Tag
                    className={className as string}
                    onClick={onClick as React.MouseEventHandler}
                    disabled={disabled as boolean}
                  >
                    {children}
                  </Tag>
                );
              }
            );
          }
          return cache.get(prop);
        },
      }
    ),
    AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  };
});

describe('SaveBar', () => {
  it('renders nothing when no changes', () => {
    const { container } = render(
      <SaveBar hasChanges={false} isSaving={false} onSave={vi.fn()} onReset={vi.fn()} />
    );
    expect(container.textContent).toBe('');
  });

  it('shows unsaved changes message', () => {
    render(<SaveBar hasChanges={true} isSaving={false} onSave={vi.fn()} onReset={vi.fn()} />);
    expect(screen.getByText('You have unsaved changes')).toBeTruthy();
  });

  it('shows Save Changes button', () => {
    render(<SaveBar hasChanges={true} isSaving={false} onSave={vi.fn()} onReset={vi.fn()} />);
    expect(screen.getByText('Save Changes')).toBeTruthy();
  });

  it('shows Saving... when isSaving', () => {
    render(<SaveBar hasChanges={true} isSaving={true} onSave={vi.fn()} onReset={vi.fn()} />);
    expect(screen.getByText('Saving...')).toBeTruthy();
  });

  it('calls onSave when Save clicked', () => {
    const onSave = vi.fn();
    render(<SaveBar hasChanges={true} isSaving={false} onSave={onSave} onReset={vi.fn()} />);
    fireEvent.click(screen.getByText('Save Changes'));
    expect(onSave).toHaveBeenCalled();
  });

  it('calls onReset when Reset clicked', () => {
    const onReset = vi.fn();
    render(<SaveBar hasChanges={true} isSaving={false} onSave={vi.fn()} onReset={onReset} />);
    fireEvent.click(screen.getByText('Reset'));
    expect(onReset).toHaveBeenCalled();
  });

  it('disables save button when isSaving', () => {
    render(<SaveBar hasChanges={true} isSaving={true} onSave={vi.fn()} onReset={vi.fn()} />);
    const btn = screen.getByText('Saving...').closest('button');
    expect(btn?.disabled).toBe(true);
  });
});
