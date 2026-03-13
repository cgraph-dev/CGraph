/**
 * Dialog Component Tests
 *
 * Tests for the Dialog, DialogContent, DialogHeader,
 * DialogTitle, DialogDescription, and DialogFooter components.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock motion/react so Dialog renders plain elements in jsdom
vi.mock('motion/react', () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>, ref: React.Ref<HTMLDivElement>) => {
      const { initial, animate, exit, transition, ...domProps } = props as Record<string, unknown>;
      return React.createElement('div', { ...domProps, ref }, children);
    }),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => React.createElement(React.Fragment, null, children),
}));

vi.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: () => true,
}));

vi.mock('@/lib/animation-presets', () => ({
  durationsSec: { fast: 0.15, normal: 0.25, slow: 0.4 },
}));

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../dialog';

describe('Dialog', () => {
  const onOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when open is false', () => {
    const { container } = render(
      <Dialog open={false} onOpenChange={onOpenChange}>
        <DialogContent>Hidden content</DialogContent>
      </Dialog>
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders children when open is true', () => {
    render(
      <Dialog open={true} onOpenChange={onOpenChange}>
        <div data-testid="dialog-child">Visible</div>
      </Dialog>
    );
    expect(screen.getByTestId('dialog-child')).toBeInTheDocument();
  });

  it('calls onOpenChange(false) when backdrop is clicked', () => {
    render(
      <Dialog open={true} onOpenChange={onOpenChange}>
        <div>Content</div>
      </Dialog>
    );

    // The backdrop is the first child with bg-black/50
    const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/60');
    if (backdrop) {
      fireEvent.click(backdrop);
    }
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('calls onOpenChange(false) on Escape key', () => {
    render(
      <Dialog open={true} onOpenChange={onOpenChange}>
        <div>Content</div>
      </Dialog>
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('does not react to non-Escape keys', () => {
    render(
      <Dialog open={true} onOpenChange={onOpenChange}>
        <div>Content</div>
      </Dialog>
    );

    fireEvent.keyDown(document, { key: 'Enter' });
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('sets body overflow to hidden when open', () => {
    render(
      <Dialog open={true} onOpenChange={onOpenChange}>
        <div>Content</div>
      </Dialog>
    );
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body overflow on unmount', () => {
    const { unmount } = render(
      <Dialog open={true} onOpenChange={onOpenChange}>
        <div>Content</div>
      </Dialog>
    );
    unmount();
    expect(document.body.style.overflow).toBe('');
  });
});

describe('DialogContent', () => {
  it('renders children', () => {
    render(
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent>
          <span data-testid="inner">Hello</span>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByTestId('inner')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent className="custom-class">Content</DialogContent>
      </Dialog>
    );
    const el = screen.getByText('Content');
    expect(el.className).toContain('custom-class');
  });

  it('stops click propagation (does not close dialog)', () => {
    const onOpenChange = vi.fn();
    render(
      <Dialog open={true} onOpenChange={onOpenChange}>
        <DialogContent>
          <button data-testid="inner-btn">Click me</button>
        </DialogContent>
      </Dialog>
    );

    fireEvent.click(screen.getByTestId('inner-btn'));
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});

describe('DialogHeader', () => {
  it('renders children', () => {
    render(
      <DialogHeader>
        <span>Header</span>
      </DialogHeader>
    );
    expect(screen.getByText('Header')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<DialogHeader className="my-header">Header</DialogHeader>);
    expect(container.firstChild).toHaveClass('my-header');
  });
});

describe('DialogTitle', () => {
  it('renders as h2', () => {
    render(<DialogTitle>My Title</DialogTitle>);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('My Title');
  });

  it('applies custom className', () => {
    render(<DialogTitle className="title-class">Title</DialogTitle>);
    expect(screen.getByText('Title').className).toContain('title-class');
  });
});

describe('DialogDescription', () => {
  it('renders a paragraph', () => {
    render(<DialogDescription>Some description</DialogDescription>);
    const p = screen.getByText('Some description');
    expect(p.tagName).toBe('P');
  });

  it('applies custom className', () => {
    render(<DialogDescription className="desc-class">Desc</DialogDescription>);
    expect(screen.getByText('Desc').className).toContain('desc-class');
  });
});

describe('DialogFooter', () => {
  it('renders children', () => {
    render(
      <DialogFooter>
        <button>OK</button>
        <button>Cancel</button>
      </DialogFooter>
    );
    expect(screen.getByText('OK')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <DialogFooter className="footer-class">
        <button>Action</button>
      </DialogFooter>
    );
    expect(container.firstChild).toHaveClass('footer-class');
  });
});
