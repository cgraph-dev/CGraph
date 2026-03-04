import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { LiquidToggle } from '../components/liquid-toggle';

describe('LiquidToggle', () => {
  it('renders a switch role element', () => {
    render(<LiquidToggle />);
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('sets aria-checked=false by default', () => {
    render(<LiquidToggle />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  });

  it('sets aria-checked=true when checked', () => {
    render(<LiquidToggle checked />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onChange with toggled value on click', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<LiquidToggle checked={false} onChange={onChange} />);
    await user.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('calls onChange with false when unchecking', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<LiquidToggle checked onChange={onChange} />);
    await user.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('renders label when provided', () => {
    render(<LiquidToggle label="Dark mode" />);
    expect(screen.getByText('Dark mode')).toBeInTheDocument();
  });

  it('associates label with switch via htmlFor', () => {
    render(<LiquidToggle label="Notifications" />);
    const label = screen.getByText('Notifications');
    const sw = document.getElementById(label.getAttribute('for')!);
    expect(sw).toBe(screen.getByRole('switch'));
  });

  it('is disabled when disabled prop is set', () => {
    render(<LiquidToggle disabled />);
    expect(screen.getByRole('switch')).toBeDisabled();
  });

  it('does not call onChange when disabled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<LiquidToggle disabled onChange={onChange} />);
    await user.click(screen.getByRole('switch'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('applies sm size', () => {
    render(<LiquidToggle size="sm" />);
    expect(screen.getByRole('switch').className).toContain('h-5');
  });

  it('applies md size', () => {
    render(<LiquidToggle size="md" />);
    expect(screen.getByRole('switch').className).toContain('h-6');
  });

  it('forwards ref', () => {
    const ref = vi.fn();
    render(<LiquidToggle ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });
});
