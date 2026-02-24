/** @module keyboard-shortcuts-modal tests */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { KeyboardShortcutsModal } from '../keyboard-shortcuts-modal';

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
    AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  };
});

vi.mock('@/lib/animation-presets', () => ({
  entranceVariants: { fadeUp: {} },
  springs: { gentle: {} },
}));

vi.mock('@heroicons/react/24/outline', () => ({
  XMarkIcon: () => <span data-testid="x-icon" />,
}));

describe('KeyboardShortcutsModal', () => {
  it('renders nothing by default', () => {
    const { container } = render(<KeyboardShortcutsModal />);
    expect(container.textContent).toBe('');
  });

  it('opens when ? key is pressed', () => {
    render(<KeyboardShortcutsModal />);
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }));
    });
    expect(screen.getByText('Keyboard Shortcuts')).toBeTruthy();
  });

  it('opens when Ctrl+/ is pressed', () => {
    render(<KeyboardShortcutsModal />);
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '/', ctrlKey: true }));
    });
    expect(screen.getByText('Keyboard Shortcuts')).toBeTruthy();
  });

  it('shows all shortcut categories', () => {
    render(<KeyboardShortcutsModal />);
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }));
    });
    expect(screen.getByText('Navigation')).toBeTruthy();
    expect(screen.getByText('Messaging')).toBeTruthy();
    expect(screen.getByText('Calls & Media')).toBeTruthy();
    expect(screen.getByText('General')).toBeTruthy();
  });

  it('shows specific shortcuts', () => {
    render(<KeyboardShortcutsModal />);
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }));
    });
    expect(screen.getByText('Open Quick Switcher')).toBeTruthy();
    expect(screen.getByText('Send message')).toBeTruthy();
    expect(screen.getByText('Toggle mute')).toBeTruthy();
  });

  it('closes when Escape is pressed', () => {
    render(<KeyboardShortcutsModal />);
    // Open
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }));
    });
    expect(screen.getByText('Keyboard Shortcuts')).toBeTruthy();
    // Close
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(screen.queryByText('Keyboard Shortcuts')).toBeNull();
  });

  it('toggles with ? key', () => {
    render(<KeyboardShortcutsModal />);
    // Open
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }));
    });
    expect(screen.getByText('Keyboard Shortcuts')).toBeTruthy();
    // Close
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }));
    });
    expect(screen.queryByText('Keyboard Shortcuts')).toBeNull();
  });
});
