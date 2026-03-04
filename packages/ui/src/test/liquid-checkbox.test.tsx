import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { LiquidCheckbox } from '../components/liquid-checkbox';

describe('LiquidCheckbox', () => {
  it('renders a checkbox role element', () => {
    render(<LiquidCheckbox />);
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('sets aria-checked=false by default', () => {
    render(<LiquidCheckbox />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'false');
  });

  it('sets aria-checked=true when checked', () => {
    render(<LiquidCheckbox checked />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true');
  });

  it('sets aria-checked=mixed when indeterminate', () => {
    render(<LiquidCheckbox indeterminate />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'mixed');
  });

  it('calls onChange with true on click when unchecked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<LiquidCheckbox checked={false} onChange={onChange} />);
    await user.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('calls onChange with false on click when checked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<LiquidCheckbox checked onChange={onChange} />);
    await user.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('renders label when provided', () => {
    render(<LiquidCheckbox label="Accept terms" />);
    expect(screen.getByText('Accept terms')).toBeInTheDocument();
  });

  it('associates label with checkbox via htmlFor', () => {
    render(<LiquidCheckbox label="Agree" />);
    const label = screen.getByText('Agree');
    const cb = document.getElementById(label.getAttribute('for')!);
    expect(cb).toBe(screen.getByRole('checkbox'));
  });

  it('is disabled when disabled prop is set', () => {
    render(<LiquidCheckbox disabled />);
    expect(screen.getByRole('checkbox')).toBeDisabled();
  });

  it('does not call onChange when disabled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<LiquidCheckbox disabled onChange={onChange} />);
    await user.click(screen.getByRole('checkbox'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('renders blue background when checked', () => {
    render(<LiquidCheckbox checked />);
    expect(screen.getByRole('checkbox').className).toContain('bg-blue-500');
  });

  it('renders blue background when indeterminate', () => {
    render(<LiquidCheckbox indeterminate />);
    expect(screen.getByRole('checkbox').className).toContain('bg-blue-500');
  });

  it('forwards ref', () => {
    const ref = vi.fn();
    render(<LiquidCheckbox ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });
});
