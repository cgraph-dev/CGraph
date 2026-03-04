import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { LiquidButton } from '../components/liquid-button';

describe('LiquidButton', () => {
  it('renders children text', () => {
    render(<LiquidButton>Click me</LiquidButton>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('applies default glass variant', () => {
    render(<LiquidButton>Glass</LiquidButton>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('backdrop-blur');
  });

  it('applies red variant classes', () => {
    render(<LiquidButton variant="red">Red</LiquidButton>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-red-500');
  });

  it('applies blue variant classes', () => {
    render(<LiquidButton variant="blue">Blue</LiquidButton>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-blue-500');
  });

  it('applies neutral variant classes', () => {
    render(<LiquidButton variant="neutral">Neutral</LiquidButton>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-slate-500');
  });

  it('applies size sm', () => {
    render(<LiquidButton size="sm">Small</LiquidButton>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('h-8');
  });

  it('applies size lg', () => {
    render(<LiquidButton size="lg">Large</LiquidButton>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('h-12');
  });

  it('applies icon size', () => {
    render(<LiquidButton size="icon">🔥</LiquidButton>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('w-10');
  });

  it('fires onClick', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<LiquidButton onClick={onClick}>Click</LiquidButton>);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('is disabled when disabled prop is set', () => {
    render(<LiquidButton disabled>Nope</LiquidButton>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is disabled when isLoading is true', () => {
    render(<LiquidButton isLoading>Loading</LiquidButton>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows spinner when loading', () => {
    render(<LiquidButton isLoading>Loading</LiquidButton>);
    const svg = screen.getByRole('button').querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg?.classList.contains('animate-spin')).toBe(true);
  });

  it('renders iconLeft', () => {
    render(<LiquidButton iconLeft={<span data-testid="icon-left">←</span>}>Go</LiquidButton>);
    expect(screen.getByTestId('icon-left')).toBeInTheDocument();
  });

  it('renders iconRight', () => {
    render(<LiquidButton iconRight={<span data-testid="icon-right">→</span>}>Go</LiquidButton>);
    expect(screen.getByTestId('icon-right')).toBeInTheDocument();
  });

  it('merges custom className', () => {
    render(<LiquidButton className="my-custom">Custom</LiquidButton>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('my-custom');
  });

  it('applies ghost variant (no background)', () => {
    render(<LiquidButton variant="ghost">Ghost</LiquidButton>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-transparent');
  });

  it('applies outline variant', () => {
    render(<LiquidButton variant="outline">Outline</LiquidButton>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('border');
    expect(btn.className).toContain('bg-transparent');
  });
});
