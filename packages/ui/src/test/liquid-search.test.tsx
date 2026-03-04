import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { LiquidSearch } from '../components/liquid-search';

describe('LiquidSearch', () => {
  it('renders a search input', () => {
    render(<LiquidSearch placeholder="Search..." />);
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  it('renders with placeholder', () => {
    render(<LiquidSearch placeholder="Find something" />);
    expect(screen.getByPlaceholderText('Find something')).toBeInTheDocument();
  });

  it('applies sm size classes', () => {
    render(<LiquidSearch inputSize="sm" placeholder="sm" />);
    expect(screen.getByRole('searchbox').className).toContain('h-8');
  });

  it('applies lg size classes', () => {
    render(<LiquidSearch inputSize="lg" placeholder="lg" />);
    expect(screen.getByRole('searchbox').className).toContain('h-12');
  });

  it('shows clear button when value is non-empty and onClear provided', () => {
    render(<LiquidSearch value="query" onClear={() => {}} />);
    expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
  });

  it('hides clear button when value is empty', () => {
    render(<LiquidSearch value="" onClear={() => {}} />);
    expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
  });

  it('calls onClear when clear button is clicked', async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(<LiquidSearch value="test" onClear={onClear} />);
    await user.click(screen.getByLabelText('Clear search'));
    expect(onClear).toHaveBeenCalledOnce();
  });

  it('does not show clear button without onClear prop', () => {
    render(<LiquidSearch value="test" />);
    expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
  });

  it('applies rounded-full class for pill shape', () => {
    render(<LiquidSearch placeholder="pill" />);
    expect(screen.getByRole('searchbox').className).toContain('rounded-full');
  });

  it('is disabled when disabled prop is set', () => {
    render(<LiquidSearch disabled placeholder="dis" />);
    expect(screen.getByRole('searchbox')).toBeDisabled();
  });

  it('forwards ref', () => {
    const ref = vi.fn();
    render(<LiquidSearch ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });
});
