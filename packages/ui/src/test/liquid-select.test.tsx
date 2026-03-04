import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { LiquidSelect, type LiquidSelectOption } from '../components/liquid-select';

const options: LiquidSelectOption[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
];

describe('LiquidSelect', () => {
  it('renders the trigger button', () => {
    render(<LiquidSelect options={options} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('shows placeholder when no value', () => {
    render(<LiquidSelect options={options} placeholder="Pick one" />);
    expect(screen.getByText('Pick one')).toBeInTheDocument();
  });

  it('shows default placeholder when none provided', () => {
    render(<LiquidSelect options={options} />);
    expect(screen.getByText('Select…')).toBeInTheDocument();
  });

  it('shows selected value label', () => {
    render(<LiquidSelect options={options} value="banana" />);
    expect(screen.getByText('Banana')).toBeInTheDocument();
  });

  it('opens dropdown on click', async () => {
    const user = userEvent.setup();
    render(<LiquidSelect options={options} />);
    await user.click(screen.getByRole('combobox'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(3);
  });

  it('selects option on click', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<LiquidSelect options={options} onChange={onChange} />);
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByText('Cherry'));
    expect(onChange).toHaveBeenCalledWith('cherry');
  });

  it('closes dropdown after selection', async () => {
    const user = userEvent.setup();
    render(<LiquidSelect options={options} onChange={() => {}} />);
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByText('Apple'));
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  it('renders label when provided', () => {
    render(<LiquidSelect options={options} label="Fruit" />);
    expect(screen.getByText('Fruit')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is set', () => {
    render(<LiquidSelect options={options} disabled />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('sets aria-expanded correctly', async () => {
    const user = userEvent.setup();
    render(<LiquidSelect options={options} />);
    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('marks selected option with aria-selected', async () => {
    const user = userEvent.setup();
    render(<LiquidSelect options={options} value="banana" />);
    await user.click(screen.getByRole('combobox'));
    const opts = screen.getAllByRole('option');
    const bananaOpt = opts.find((o) => o.textContent?.includes('Banana'));
    expect(bananaOpt).toHaveAttribute('aria-selected', 'true');
  });

  it('does not select disabled option', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const opts: LiquidSelectOption[] = [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B', disabled: true },
    ];
    render(<LiquidSelect options={opts} onChange={onChange} />);
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByText('B'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('applies size sm', () => {
    render(<LiquidSelect options={options} size="sm" />);
    expect(screen.getByRole('combobox').className).toContain('h-8');
  });
});
