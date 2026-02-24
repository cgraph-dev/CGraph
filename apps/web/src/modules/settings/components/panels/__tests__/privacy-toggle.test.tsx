/**
 * @file Tests for PrivacyToggle component
 * @module settings/components/panels/privacy-toggle
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PrivacyToggle } from '../privacy-toggle';

describe('PrivacyToggle', () => {
  const defaultProps = {
    label: 'Online Status',
    description: 'Show when you are online',
    checked: false,
    disabled: false,
    onToggle: vi.fn(),
  };

  it('renders the label', () => {
    render(<PrivacyToggle {...defaultProps} />);
    expect(screen.getByText('Online Status')).toBeInTheDocument();
  });

  it('renders the description', () => {
    render(<PrivacyToggle {...defaultProps} />);
    expect(screen.getByText('Show when you are online')).toBeInTheDocument();
  });

  it('calls onToggle when clicked', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<PrivacyToggle {...defaultProps} onToggle={onToggle} />);
    await user.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('applies checked styles when checked is true', () => {
    render(<PrivacyToggle {...defaultProps} checked={true} />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-primary-600');
  });

  it('applies unchecked styles when checked is false', () => {
    render(<PrivacyToggle {...defaultProps} checked={false} />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-dark-600');
  });

  it('disables button when disabled is true', () => {
    render(<PrivacyToggle {...defaultProps} disabled={true} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('applies opacity when disabled', () => {
    render(<PrivacyToggle {...defaultProps} disabled={true} />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('opacity-50');
  });

  it('does not call onToggle when disabled', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<PrivacyToggle {...defaultProps} onToggle={onToggle} disabled={true} />);
    await user.click(screen.getByRole('button'));
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('renders toggle knob', () => {
    const { container } = render(<PrivacyToggle {...defaultProps} />);
    const knob = container.querySelector('.rounded-full.bg-white');
    expect(knob).toBeInTheDocument();
  });

  it('moves knob position when checked', () => {
    const { container } = render(<PrivacyToggle {...defaultProps} checked={true} />);
    const knob = container.querySelector('.rounded-full.bg-white');
    expect(knob?.className).toContain('translate-x-5');
  });

  it('renders label as h3', () => {
    render(<PrivacyToggle {...defaultProps} />);
    const label = screen.getByText('Online Status');
    expect(label.tagName).toBe('H3');
  });
});
