import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { LoadingSpinner } from '../feedback/LoadingSpinner';
import {
  LoadingOverlay,
  SkeletonText,
  SkeletonAvatar,
  SkeletonMessage,
  SkeletonConversation,
} from '../feedback/Loading';

describe('LoadingSpinner', () => {
  it('renders the spinner SVG', () => {
    const { container } = render(<LoadingSpinner />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('displays the CGraph brand text', () => {
    render(<LoadingSpinner />);
    expect(screen.getByText('CGraph')).toBeInTheDocument();
  });

  it('has fixed positioning for full-page overlay', () => {
    const { container } = render(<LoadingSpinner />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('fixed');
    expect(wrapper.className).toContain('inset-0');
  });
});

describe('LoadingOverlay', () => {
  it('renders without a message', () => {
    const { container } = render(<LoadingOverlay />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(container.querySelector('p')).toBeNull();
  });

  it('renders with a message', () => {
    render(<LoadingOverlay message="Loading data..." />);
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });
});

describe('SkeletonText', () => {
  it('renders a single skeleton line by default', () => {
    const { container } = render(<SkeletonText />);
    const lines = container.querySelectorAll('.animate-pulse');
    expect(lines).toHaveLength(1);
  });

  it('renders multiple skeleton lines', () => {
    const { container } = render(<SkeletonText lines={3} />);
    const lines = container.querySelectorAll('.animate-pulse');
    expect(lines).toHaveLength(3);
  });

  it('applies custom className', () => {
    const { container } = render(<SkeletonText className="my-class" />);
    expect(container.firstChild).toHaveClass('my-class');
  });

  it('makes the last line shorter when multiple lines', () => {
    const { container } = render(<SkeletonText lines={3} />);
    const lines = container.querySelectorAll('.animate-pulse');
    const lastLine = lines[lines.length - 1] as HTMLElement;
    expect(lastLine.style.width).toBe('70%');
  });
});

describe('SkeletonAvatar', () => {
  it('renders with default md size', () => {
    const { container } = render(<SkeletonAvatar />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('w-10');
    expect(el.className).toContain('h-10');
  });

  it('renders with sm size', () => {
    const { container } = render(<SkeletonAvatar size="sm" />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('w-8');
    expect(el.className).toContain('h-8');
  });

  it('renders with lg size', () => {
    const { container } = render(<SkeletonAvatar size="lg" />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('w-12');
    expect(el.className).toContain('h-12');
  });
});

describe('SkeletonMessage', () => {
  it('renders avatar and text placeholders', () => {
    const { container } = render(<SkeletonMessage />);
    // Should contain an avatar (rounded-full) and multiple pulse elements
    expect(container.querySelector('.rounded-full')).toBeInTheDocument();
    const pulseElements = container.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThanOrEqual(3);
  });
});

describe('SkeletonConversation', () => {
  it('renders avatar and text placeholders', () => {
    const { container } = render(<SkeletonConversation />);
    expect(container.querySelector('.rounded-full')).toBeInTheDocument();
    const pulseElements = container.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThanOrEqual(2);
  });
});
