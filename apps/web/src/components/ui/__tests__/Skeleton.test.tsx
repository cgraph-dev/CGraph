import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import Skeleton, { PostCardSkeleton, ForumCardSkeleton, CommentSkeleton } from '../Skeleton';

// =============================================================================
// Skeleton component
// =============================================================================

describe('Skeleton', () => {
  // ── Base rendering ───────────────────────────────────────────────────

  it('renders a div with pulse animation', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstElementChild!).toHaveClass('animate-pulse');
  });

  it('applies bg-dark-700 base style', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstElementChild!).toHaveClass('bg-dark-700');
  });

  it('applies custom className', () => {
    const { container } = render(<Skeleton className="mt-4" />);
    expect(container.firstElementChild!).toHaveClass('mt-4');
  });

  // ── Variants ─────────────────────────────────────────────────────────

  it('renders rectangular variant with rounded-lg', () => {
    const { container } = render(<Skeleton variant="rectangular" />);
    expect(container.firstElementChild!).toHaveClass('rounded-lg');
  });

  it('renders circular variant with rounded-full', () => {
    const { container } = render(<Skeleton variant="circular" />);
    expect(container.firstElementChild!).toHaveClass('rounded-full');
  });

  it('renders text variant with rounded (not rounded-lg)', () => {
    const { container } = render(<Skeleton variant="text" />);
    const el = container.firstElementChild!;
    expect(el.className).toContain('rounded');
    expect(el.className).not.toContain('rounded-lg');
  });

  it('defaults to rectangular variant', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstElementChild!).toHaveClass('rounded-lg');
  });

  // ── Dimensions ───────────────────────────────────────────────────────

  it('applies custom width and height via style', () => {
    const { container } = render(<Skeleton width={100} height={50} />);
    const el = container.firstElementChild! as HTMLElement;
    expect(el.style.width).toBe('100px');
    expect(el.style.height).toBe('50px');
  });

  it('applies string dimensions', () => {
    const { container } = render(<Skeleton width="80%" height="2rem" />);
    const el = container.firstElementChild! as HTMLElement;
    expect(el.style.width).toBe('80%');
    expect(el.style.height).toBe('2rem');
  });

  it('defaults width to 100% for rectangular', () => {
    const { container } = render(<Skeleton variant="rectangular" />);
    const el = container.firstElementChild! as HTMLElement;
    expect(el.style.width).toBe('100%');
  });

  // ── Multi-line text ──────────────────────────────────────────────────

  it('renders single line by default for text variant', () => {
    const { container } = render(<Skeleton variant="text" />);
    // Single line = single div, not a wrapper with children
    const el = container.firstElementChild!;
    expect(el.children).toHaveLength(0);
  });

  it('renders multiple lines when lines > 1', () => {
    const { container } = render(<Skeleton variant="text" lines={3} />);
    const wrapper = container.firstElementChild!;
    expect(wrapper.children).toHaveLength(3);
  });

  it('last line in multi-line is 75% width', () => {
    const { container } = render(<Skeleton variant="text" lines={3} />);
    const wrapper = container.firstElementChild!;
    const lastLine = wrapper.children[2] as HTMLElement;
    expect(lastLine.style.width).toBe('75%');
  });

  it('non-last lines in multi-line are 100% width', () => {
    const { container } = render(<Skeleton variant="text" lines={3} />);
    const wrapper = container.firstElementChild!;
    const firstLine = wrapper.children[0] as HTMLElement;
    expect(firstLine.style.width).toBe('100%');
  });

  it('multi-line wrapper has space-y-2 class', () => {
    const { container } = render(<Skeleton variant="text" lines={2} />);
    expect(container.firstElementChild!).toHaveClass('space-y-2');
  });
});

// =============================================================================
// Skeleton presets
// =============================================================================

describe('PostCardSkeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<PostCardSkeleton />);
    expect(container.firstElementChild!).toHaveClass('animate-pulse');
  });

  it('has card-like structure with border', () => {
    const { container } = render(<PostCardSkeleton />);
    const el = container.firstElementChild!;
    expect(el.className).toContain('bg-dark-800');
    expect(el.className).toContain('border');
    expect(el.className).toContain('rounded-lg');
  });
});

describe('ForumCardSkeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<ForumCardSkeleton />);
    expect(container.firstElementChild!).toHaveClass('animate-pulse');
  });

  it('has card-like structure', () => {
    const { container } = render(<ForumCardSkeleton />);
    const el = container.firstElementChild!;
    expect(el.className).toContain('bg-dark-800');
    expect(el.className).toContain('rounded-lg');
  });
});

describe('CommentSkeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<CommentSkeleton />);
    expect(container.firstElementChild!).toHaveClass('animate-pulse');
  });

  it('applies left margin based on depth', () => {
    const { container } = render(<CommentSkeleton depth={2} />);
    const el = container.firstElementChild! as HTMLElement;
    expect(el.style.marginLeft).toBe('48px'); // 2 * 24
  });

  it('applies no margin at depth 0 (default)', () => {
    const { container } = render(<CommentSkeleton />);
    const el = container.firstElementChild! as HTMLElement;
    expect(el.style.marginLeft).toBe('0px');
  });
});
