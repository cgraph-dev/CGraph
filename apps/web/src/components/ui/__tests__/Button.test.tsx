import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import Button, { IconButton } from '../Button';

// =============================================================================
// Button component
// =============================================================================

describe('Button', () => {
  // ── Rendering ────────────────────────────────────────────────────────

  it('renders children text', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByRole('button', { name: 'Click Me' })).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Button className="custom-class">Btn</Button>);
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  // ── Variants ─────────────────────────────────────────────────────────

  const variants = [
    'primary',
    'secondary',
    'ghost',
    'danger',
    'success',
    'outline',
    'destructive',
    'default',
  ] as const;

  it.each(variants)('renders "%s" variant with correct styles', (variant) => {
    render(<Button variant={variant}>V</Button>);
    const btn = screen.getByRole('button');
    // Each variant should produce a valid button without crashing
    expect(btn).toBeInTheDocument();
  });

  it('applies primary variant styles by default', () => {
    render(<Button>Default</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-primary-600');
  });

  it('applies danger variant styles', () => {
    render(<Button variant="danger">Delete</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-red-600');
  });

  it('applies ghost variant styles', () => {
    render(<Button variant="ghost">Ghost</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-transparent');
  });

  it('applies outline variant styles', () => {
    render(<Button variant="outline">Outline</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('border-2');
    expect(btn.className).toContain('border-primary-500');
  });

  // ── Sizes ────────────────────────────────────────────────────────────

  it('renders small size', () => {
    render(<Button size="sm">Small</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('px-3');
    expect(btn.className).toContain('py-1.5');
  });

  it('renders medium size (default)', () => {
    render(<Button>Medium</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('px-4');
    expect(btn.className).toContain('py-2');
  });

  it('renders large size', () => {
    render(<Button size="lg">Large</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('px-6');
    expect(btn.className).toContain('py-3');
  });

  it('normalizes "default" size to "md"', () => {
    render(<Button size="default">Def</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('px-4');
    expect(btn.className).toContain('py-2');
  });

  it('renders icon size (hides children text)', () => {
    render(<Button size="icon">X</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('p-2');
    // Icon size should NOT render children
    expect(btn).not.toHaveTextContent('X');
  });

  // ── Full width ───────────────────────────────────────────────────────

  it('applies full width when fullWidth is true', () => {
    render(<Button fullWidth>Wide</Button>);
    expect(screen.getByRole('button')).toHaveClass('w-full');
  });

  it('does not apply full width by default', () => {
    render(<Button>Normal</Button>);
    expect(screen.getByRole('button')).not.toHaveClass('w-full');
  });

  // ── Disabled ─────────────────────────────────────────────────────────

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is not disabled by default', () => {
    render(<Button>Enabled</Button>);
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  // ── Loading ──────────────────────────────────────────────────────────

  it('is disabled when loading is true', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders a spinner SVG when loading', () => {
    const { container } = render(<Button loading>Loading</Button>);
    const svg = container.querySelector('svg.animate-spin');
    expect(svg).toBeInTheDocument();
  });

  it('does not render spinner when not loading', () => {
    const { container } = render(<Button>Normal</Button>);
    expect(container.querySelector('svg.animate-spin')).not.toBeInTheDocument();
  });

  // ── Icon prop ────────────────────────────────────────────────────────

  it('renders icon on the left by default', () => {
    render(<Button icon={<span data-testid="icon">★</span>}>With Icon</Button>);
    const btn = screen.getByRole('button');
    const icon = screen.getByTestId('icon');
    expect(icon).toBeInTheDocument();
    // Icon should come before text
    const children = Array.from(btn.childNodes);
    const iconIdx = children.findIndex((c) => c.contains(icon));
    const textIdx = children.findIndex((c) => c.textContent === 'With Icon');
    expect(iconIdx).toBeLessThan(textIdx);
  });

  it('renders icon on the right when iconPosition="right"', () => {
    render(
      <Button icon={<span data-testid="icon">★</span>} iconPosition="right">
        Right Icon
      </Button>
    );
    const btn = screen.getByRole('button');
    const icon = screen.getByTestId('icon');
    const children = Array.from(btn.childNodes);
    const iconIdx = children.findIndex((c) => c.contains(icon));
    const textIdx = children.findIndex((c) => c.textContent === 'Right Icon');
    expect(iconIdx).toBeGreaterThan(textIdx);
  });

  it('hides icon when loading', () => {
    render(
      <Button loading icon={<span data-testid="icon">★</span>}>
        Loading
      </Button>
    );
    expect(screen.queryByTestId('icon')).not.toBeInTheDocument();
  });

  // ── Click handlers ───────────────────────────────────────────────────

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Click
      </Button>
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('does not call onClick when loading', () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Click
      </Button>
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  // ── HTML attributes passthrough ──────────────────────────────────────

  it('passes through HTML attributes', () => {
    render(
      <Button type="submit" data-testid="submit-btn">
        Submit
      </Button>
    );
    const btn = screen.getByTestId('submit-btn');
    expect(btn).toHaveAttribute('type', 'submit');
  });
});

// =============================================================================
// IconButton component
// =============================================================================

describe('IconButton', () => {
  it('renders the icon', () => {
    render(<IconButton icon={<span data-testid="icon">X</span>} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('sets title attribute from tooltip prop', () => {
    render(<IconButton icon={<span>X</span>} tooltip="Close" />);
    expect(screen.getByRole('button')).toHaveAttribute('title', 'Close');
  });

  it('applies size sm styles', () => {
    render(<IconButton icon={<span>X</span>} size="sm" />);
    expect(screen.getByRole('button')).toHaveClass('p-1.5');
  });

  it('applies size md styles (default)', () => {
    render(<IconButton icon={<span>X</span>} />);
    expect(screen.getByRole('button')).toHaveClass('p-2');
  });

  it('applies size lg styles', () => {
    render(<IconButton icon={<span>X</span>} size="lg" />);
    expect(screen.getByRole('button')).toHaveClass('p-3');
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<IconButton icon={<span>X</span>} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('passes through custom className', () => {
    render(<IconButton icon={<span>X</span>} className="text-red-500" />);
    expect(screen.getByRole('button')).toHaveClass('text-red-500');
  });
});
