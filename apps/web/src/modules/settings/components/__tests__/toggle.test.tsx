/**
 * @file Tests for Toggle component (appearance-settings)
 * @module settings/components/appearance-settings/toggle
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('motion/react', () => ({
  motion: {
    button: ({
      children,
      className,
      onClick,
      disabled,
      style,
    }: {
      children: React.ReactNode;
      className?: string;
      onClick?: () => void;
      disabled?: boolean;
      style?: React.CSSProperties;
    }) => (
      <button className={className} onClick={onClick} disabled={disabled} style={style}>
        {children}
      </button>
    ),
    div: ({ children, className }: { children?: React.ReactNode; className?: string }) => (
      <div className={className}>{children}</div>
    ),
  },
}));

vi.mock('@/lib/animation-presets', () => ({
  springs: { snappy: { type: 'spring', stiffness: 400, damping: 30 } },
}));

import { Toggle } from '../appearance-settings/toggle';

describe('Toggle', () => {
  const defaultProps = {
    enabled: false,
    onChange: vi.fn(),
    label: 'Dark Mode',
  };

  it('renders the label', () => {
    render(<Toggle {...defaultProps} />);
    expect(screen.getByText('Dark Mode')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<Toggle {...defaultProps} description="Enable dark theme" />);
    expect(screen.getByText('Enable dark theme')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    const { container } = render(<Toggle {...defaultProps} />);
    const desc = container.querySelector('.text-xs.text-gray-400');
    expect(desc).not.toBeInTheDocument();
  });

  it('calls onChange when clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Toggle {...defaultProps} onChange={onChange} />);
    await user.click(screen.getByRole('button'));
    expect(onChange).toHaveBeenCalledOnce();
  });

  it('applies enabled styles when enabled', () => {
    render(<Toggle {...defaultProps} enabled={true} />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-primary-500');
  });

  it('applies disabled styles when not enabled', () => {
    render(<Toggle {...defaultProps} enabled={false} />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-white/[0.08]');
  });

  it('applies glow effect when enabled', () => {
    render(<Toggle {...defaultProps} enabled={true} />);
    const button = screen.getByRole('button');
    expect(button.style.boxShadow).toContain('rgba(16, 185, 129, 0.4)');
  });

  it('does not apply glow when not enabled', () => {
    render(<Toggle {...defaultProps} enabled={false} />);
    const button = screen.getByRole('button');
    expect(button.style.boxShadow).toBeFalsy();
  });

  it('disables button when disabled prop is true', () => {
    render(<Toggle {...defaultProps} disabled={true} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders icon when provided', () => {
    render(<Toggle {...defaultProps} icon={<span data-testid="toggle-icon">🌙</span>} />);
    expect(screen.getByTestId('toggle-icon')).toBeInTheDocument();
  });

  it('does not render icon container when icon not provided', () => {
    const { container } = render(<Toggle {...defaultProps} />);
    // Only the label div and toggle button should exist
    const gapElements = container.querySelectorAll('.gap-3');
    expect(gapElements.length).toBe(1);
  });

  it('renders with opacity when disabled', () => {
    const { container } = render(<Toggle {...defaultProps} disabled={true} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('opacity-50');
  });
});
