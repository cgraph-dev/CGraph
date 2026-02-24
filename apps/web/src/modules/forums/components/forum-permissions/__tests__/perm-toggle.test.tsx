/** @module perm-toggle tests */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@heroicons/react/24/outline', () => ({
  CheckIcon: () => <span data-testid="check-icon" />,
  MinusIcon: () => <span data-testid="minus-icon" />,
  NoSymbolIcon: () => <span data-testid="deny-icon" />,
}));

import { PermToggle } from '../perm-toggle';

describe('PermToggle', () => {
  it('renders inherit state with minus icon', () => {
    render(<PermToggle value="inherit" onClick={vi.fn()} />);
    expect(screen.getByTestId('minus-icon')).toBeInTheDocument();
  });

  it('renders allow state with check icon', () => {
    render(<PermToggle value="allow" onClick={vi.fn()} />);
    expect(screen.getByTestId('check-icon')).toBeInTheDocument();
  });

  it('renders deny state with deny icon', () => {
    render(<PermToggle value="deny" onClick={vi.fn()} />);
    expect(screen.getByTestId('deny-icon')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<PermToggle value="inherit" onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('applies correct styling for allow state', () => {
    const { container } = render(<PermToggle value="allow" onClick={vi.fn()} />);
    const btn = container.querySelector('button');
    expect(btn?.className).toContain('bg-green');
  });

  it('applies correct styling for deny state', () => {
    const { container } = render(<PermToggle value="deny" onClick={vi.fn()} />);
    const btn = container.querySelector('button');
    expect(btn?.className).toContain('bg-red');
  });
});
