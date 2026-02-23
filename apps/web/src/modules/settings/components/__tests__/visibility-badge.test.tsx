/** @module visibility-badge tests */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@heroicons/react/24/outline', () => ({
  EyeIcon: (props: Record<string, unknown>) => <svg data-testid="eye-icon" {...props} />,
  DevicePhoneMobileIcon: (props: Record<string, unknown>) => (
    <svg data-testid="device-icon" {...props} />
  ),
}));

import VisibilityBadge from '../visibility-badge';

describe('VisibilityBadge', () => {
  it('renders "Visible to others" for visible=others', () => {
    render(<VisibilityBadge visible="others" />);
    expect(screen.getByText('Visible to others')).toBeInTheDocument();
  });

  it('renders eye icon for visible=others', () => {
    render(<VisibilityBadge visible="others" />);
    expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
  });

  it('renders "Your device only" for visible=local', () => {
    render(<VisibilityBadge visible="local" />);
    expect(screen.getByText('Your device only')).toBeInTheDocument();
  });

  it('renders device icon for visible=local', () => {
    render(<VisibilityBadge visible="local" />);
    expect(screen.getByTestId('device-icon')).toBeInTheDocument();
  });

  it('does not show eye icon when visible=local', () => {
    render(<VisibilityBadge visible="local" />);
    expect(screen.queryByTestId('eye-icon')).not.toBeInTheDocument();
  });

  it('does not show device icon when visible=others', () => {
    render(<VisibilityBadge visible="others" />);
    expect(screen.queryByTestId('device-icon')).not.toBeInTheDocument();
  });

  it('applies custom className for others variant', () => {
    const { container } = render(<VisibilityBadge visible="others" className="my-class" />);
    expect(container.firstChild).toHaveClass('my-class');
  });

  it('applies custom className for local variant', () => {
    const { container } = render(<VisibilityBadge visible="local" className="custom-local" />);
    expect(container.firstChild).toHaveClass('custom-local');
  });

  it('has primary styling for others variant', () => {
    const { container } = render(<VisibilityBadge visible="others" />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('primary');
  });

  it('has gray styling for local variant', () => {
    const { container } = render(<VisibilityBadge visible="local" />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('gray');
  });
});
