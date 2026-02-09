import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import Card, { CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '../Card';

// =============================================================================
// Card component
// =============================================================================

describe('Card', () => {
  // ── Basic rendering ──────────────────────────────────────────────────

  it('renders children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('renders as a div', () => {
    const { container } = render(<Card>C</Card>);
    expect(container.firstElementChild!.tagName).toBe('DIV');
  });

  it('applies base styles', () => {
    const { container } = render(<Card>C</Card>);
    const el = container.firstElementChild!;
    expect(el.className).toContain('rounded-lg');
    expect(el.className).toContain('bg-dark-800');
    expect(el.className).toContain('border-dark-700');
  });

  it('applies custom className', () => {
    const { container } = render(<Card className="my-custom">C</Card>);
    expect(container.firstElementChild!).toHaveClass('my-custom');
  });

  // ── Variants ─────────────────────────────────────────────────────────

  it('renders default variant without hover styles', () => {
    const { container } = render(<Card variant="default">D</Card>);
    const el = container.firstElementChild!;
    expect(el.className).not.toContain('cursor-pointer');
  });

  it('renders interactive variant with hover and cursor styles', () => {
    const { container } = render(<Card variant="interactive">I</Card>);
    const el = container.firstElementChild!;
    expect(el.className).toContain('cursor-pointer');
    expect(el.className).toContain('transition-all');
  });

  it('renders elevated variant with shadow', () => {
    const { container } = render(<Card variant="elevated">E</Card>);
    const el = container.firstElementChild!;
    expect(el.className).toContain('shadow-card');
  });

  // ── Padding ──────────────────────────────────────────────────────────

  it('applies no padding when padding="none"', () => {
    const { container } = render(<Card padding="none">N</Card>);
    const el = container.firstElementChild!;
    expect(el.className).not.toContain('p-3');
    expect(el.className).not.toContain('p-4');
    expect(el.className).not.toContain('p-6');
  });

  it('applies p-3 for sm padding', () => {
    const { container } = render(<Card padding="sm">S</Card>);
    expect(container.firstElementChild!).toHaveClass('p-3');
  });

  it('applies p-4 for md padding (default)', () => {
    const { container } = render(<Card>M</Card>);
    expect(container.firstElementChild!).toHaveClass('p-4');
  });

  it('applies p-6 for lg padding', () => {
    const { container } = render(<Card padding="lg">L</Card>);
    expect(container.firstElementChild!).toHaveClass('p-6');
  });

  // ── Animation ────────────────────────────────────────────────────────

  it('applies animation class when animate=true', () => {
    const { container } = render(<Card animate>A</Card>);
    expect(container.firstElementChild!).toHaveClass('animate-fade-in-up');
  });

  it('does not apply animation class by default', () => {
    const { container } = render(<Card>A</Card>);
    expect(container.firstElementChild!).not.toHaveClass('animate-fade-in-up');
  });
});

// =============================================================================
// Card sub-components
// =============================================================================

describe('CardHeader', () => {
  it('renders children', () => {
    render(<CardHeader>Header Text</CardHeader>);
    expect(screen.getByText('Header Text')).toBeInTheDocument();
  });

  it('has bottom border and spacing', () => {
    const { container } = render(<CardHeader>H</CardHeader>);
    const el = container.firstElementChild!;
    expect(el.className).toContain('border-b');
    expect(el.className).toContain('pb-3');
    expect(el.className).toContain('mb-3');
  });

  it('applies custom className', () => {
    const { container } = render(<CardHeader className="extra">H</CardHeader>);
    expect(container.firstElementChild!).toHaveClass('extra');
  });
});

describe('CardTitle', () => {
  it('renders as h3 by default', () => {
    render(<CardTitle>Title</CardTitle>);
    const el = screen.getByText('Title');
    expect(el.tagName).toBe('H3');
  });

  it('renders as custom heading tag', () => {
    render(<CardTitle as="h1">H1 Title</CardTitle>);
    expect(screen.getByText('H1 Title').tagName).toBe('H1');
  });

  it('renders as h2', () => {
    render(<CardTitle as="h2">H2</CardTitle>);
    expect(screen.getByText('H2').tagName).toBe('H2');
  });

  it('applies font-semibold and text-white', () => {
    render(<CardTitle>T</CardTitle>);
    const el = screen.getByText('T');
    expect(el).toHaveClass('font-semibold');
    expect(el).toHaveClass('text-white');
  });
});

describe('CardContent', () => {
  it('renders children', () => {
    render(<CardContent>Content here</CardContent>);
    expect(screen.getByText('Content here')).toBeInTheDocument();
  });

  it('applies text-gray-300 class', () => {
    const { container } = render(<CardContent>C</CardContent>);
    expect(container.firstElementChild!).toHaveClass('text-gray-300');
  });
});

describe('CardFooter', () => {
  it('renders children', () => {
    render(<CardFooter>Footer</CardFooter>);
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });

  it('has top border and spacing', () => {
    const { container } = render(<CardFooter>F</CardFooter>);
    const el = container.firstElementChild!;
    expect(el.className).toContain('border-t');
    expect(el.className).toContain('pt-3');
    expect(el.className).toContain('mt-3');
  });
});

describe('CardDescription', () => {
  it('renders children as a paragraph', () => {
    render(<CardDescription>Desc text</CardDescription>);
    const el = screen.getByText('Desc text');
    expect(el.tagName).toBe('P');
  });

  it('applies muted text styles', () => {
    render(<CardDescription>D</CardDescription>);
    const el = screen.getByText('D');
    expect(el).toHaveClass('text-sm');
    expect(el).toHaveClass('text-gray-400');
  });
});
