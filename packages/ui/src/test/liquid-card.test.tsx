import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LiquidCard } from '../components/liquid-card';

describe('LiquidCard', () => {
  it('renders children', () => {
    render(<LiquidCard>Card content</LiquidCard>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies glass variant by default', () => {
    const { container } = render(<LiquidCard>Glass</LiquidCard>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('backdrop-blur');
  });

  it('applies elevated variant', () => {
    const { container } = render(<LiquidCard variant="elevated">Elevated</LiquidCard>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('backdrop-blur-[24px]');
  });

  it('applies flat variant', () => {
    const { container } = render(<LiquidCard variant="flat">Flat</LiquidCard>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('bg-white/90');
  });

  it('renders header slot', () => {
    render(<LiquidCard header={<span>Header</span>}>Body</LiquidCard>);
    expect(screen.getByText('Header')).toBeInTheDocument();
  });

  it('renders footer slot', () => {
    render(<LiquidCard footer={<span>Footer</span>}>Body</LiquidCard>);
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });

  it('applies cursor-pointer when interactive', () => {
    const { container } = render(<LiquidCard interactive>Click me</LiquidCard>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('cursor-pointer');
  });

  it('removes padding when compact', () => {
    const { container } = render(<LiquidCard compact>Compact</LiquidCard>);
    // The body div should not have padding classes
    const bodyDiv = container.querySelector('div > div') as HTMLElement;
    expect(bodyDiv.className).not.toContain('px-5');
  });

  it('merges custom className', () => {
    const { container } = render(<LiquidCard className="my-card">Custom</LiquidCard>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('my-card');
  });
});
